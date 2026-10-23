import { useEffect, useState } from 'react'
import { LOCATION } from './weather'

const REFRESH_MS = 60 * 1000

// Sun position at `date`, in degrees: `elevation` above the horizon and `azimuth` clockwise
// from north. Low-precision solar formulas (good to ~0.1°, plenty to call sunrise/sunset within
// a minute or two).
export function sunPosition(date, { latitude, longitude } = LOCATION) {
  const rad = Math.PI / 180
  const d = date.getTime() / 86400000 - 10957.5 // days since J2000 (2000-01-01 12:00 UTC)
  const g = (357.529 + 0.98560028 * d) * rad // mean anomaly
  const q = 280.459 + 0.98564736 * d // mean longitude
  const lambda = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * rad // obliquity
  const dec = Math.asin(Math.sin(e) * Math.sin(lambda))
  const ra = Math.atan2(Math.cos(e) * Math.sin(lambda), Math.cos(lambda))
  const gmst = 18.697374558 + 24.06570982441908 * d // sidereal time, hours
  const hourAngle = (gmst * 15 + longitude) * rad - ra
  const lat = latitude * rad
  const elevation = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle))
  const azimuth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat))
  return { elevation: elevation / rad, azimuth: azimuth / rad + 180 }
}

// Sun's upper limb on the horizon, refraction included.
const HORIZON = -0.833

// Day from sunrise to sunset.
export const isDaytime = (date, location = LOCATION) => sunPosition(date, location).elevation > HORIZON

// Sunrise and sunset of `date`'s local day, in minutes since midnight.
export function sunTimes(date, location = LOCATION) {
  const at = (minutes) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes)
  let rise = 6 * 60
  let set = 18 * 60
  let prev = isDaytime(at(0), location)
  for (let m = 1; m < 24 * 60; m++) {
    const up = isDaytime(at(m), location)
    if (up && !prev) rise = m
    if (!up && prev) set = m
    prev = up
  }
  return { rise, set }
}

export const minutesOf = (date) => date.getHours() * 60 + date.getMinutes()

// Current time, refreshed every minute.
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), REFRESH_MS)
    return () => clearInterval(id)
  }, [])
  return now
}
