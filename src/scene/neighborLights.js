import { useEffect, useState } from 'react'
import { between, hash, hourOf, random } from './chance'

// Simulated life in the neighbouring units: each window turns on and off at random, but only
// while its household is up and home. Everything is derived from the clock + a per-id seed, so
// there is no state to keep and the same minute always gives the same answer.
//
// Window ids are "<unit>:<room>"; the unit decides the household's daily routine.

const REFRESH_MS = 30 * 1000

// A household's day in hours (bed may pass midnight, e.g. 24.5 = 00:30). Weekdays only differ
// in whether people leave for work; on weekends everyone stays home and sleeps in.
function routine(unit, weekend) {
  const r = (k) => random(hash(`${unit}:${k}`))
  return {
    wake: between(r('wake'), 5.75, 7.5) + (weekend ? 1.5 : 0),
    leave: weekend || r('remote') < 0.3 ? null : between(r('leave'), 7.5, 9),
    back: between(r('back'), 16, 18.5),
    bed: between(r('bed'), 21.5, 24.75) + (weekend ? 0.5 : 0),
  }
}

// Chance that a given window of a household is lit at `hour`: 0 while asleep or out,
// low in daylight, highest in the evening, thinning out as people go to bed.
function chance(day, hour) {
  // Fold early-morning hours onto the previous evening so a 00:30 bedtime still counts.
  const h = hour < 4 ? hour + 24 : hour
  if (h < day.wake || h >= day.bed) return 0
  if (day.leave !== null && h >= day.leave && h < day.back) return 0
  if (h < day.wake + 1.5) return 0.55 // morning rush
  if (h >= day.bed - 1) return 0.25 // winding down, one or two rooms left
  if (h >= 17) return 0.7 // evening
  return 0.12 // home during the day: lights rarely needed
}

// Whether window `id` is lit at `date`: each window re-rolls on its own rhythm (6–25 min),
// so rooms switch on and off one at a time instead of all together.
export function isLit(id, date, hourOverride) {
  const unit = id.split(':')[0]
  const day = routine(unit, date.getDay() === 0 || date.getDay() === 6)
  const hour = hourOverride ?? hourOf(date)
  const p = chance(day, hour)
  if (p === 0) return false
  const seed = hash(id)
  const slot = between(random(seed), 6, 25)
  const minutes = date.getTime() / 60000 + random(seed + 1) * slot
  return random(seed + Math.floor(minutes / slot)) < p
}

// Returns lit(id) for the current time, or for `hourOverride` (the day slider) when given.
// In night mode during daylight hours (the user forced night), it plays the evening at 20:00
// so the street isn't dead.
export function useNeighborLights(mode, hourOverride) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const hour = now.getHours()
  const override = hourOverride ?? (mode === 'night' && hour >= 7 && hour < 17 ? 20 + now.getMinutes() / 60 : undefined)
  return (id) => isLit(id, now, override)
}
