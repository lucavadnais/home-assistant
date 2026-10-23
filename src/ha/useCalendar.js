import { useCallback, useEffect, useRef, useState } from 'react'
import { AGENDA_DAYS, CALENDARS } from '../data/calendars'

const REFRESH_MS = 5 * 60 * 1000

// All-day events come as a bare date ('2026-10-31'): read it as local midnight, not UTC.
const parseDate = (s) => {
  if (s.length > 10) return new Date(s)
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Upcoming events of every calendar in CALENDARS, merged and sorted by start.
// status: 'idle' (Home Assistant not connected) | 'loading' | 'ready' | 'error'
// `refreshing` is true while a request is in flight; `refresh()` reloads right away.
export default function useCalendar(ha) {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('idle')
  const [refreshing, setRefreshing] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // Set by refresh(): the next load first syncs Home Assistant with Google
  const syncNext = useRef(false)
  const connected = ha.status === 'connected'
  // A calendar entity changes state when one of its events starts or ends: refresh then too.
  const signature = CALENDARS.map((c) => ha.entities[c.entity]?.last_changed).join()

  useEffect(() => {
    if (!connected) return setStatus('idle')
    let cancelled = false

    const load = () => {
      setRefreshing(true)
      const sync = syncNext.current
      syncNext.current = false
      return ha.getEvents(CALENDARS.map((c) => c.entity), AGENDA_DAYS, sync)
        .then((response) => {
          if (cancelled || !response) return
          const merged = CALENDARS.flatMap((cal) =>
            (response[cal.entity]?.events ?? []).map((e) => ({
              id: `${cal.entity}|${e.start}|${e.summary}`,
              summary: e.summary,
              location: e.location,
              start: parseDate(e.start),
              end: parseDate(e.end),
              allDay: e.start.length <= 10,
              calendar: cal,
            })),
          )
          setEvents(merged.sort((a, b) => a.start - b.start))
          setStatus('ready')
        })
        .catch(() => !cancelled && setStatus('error'))
        .finally(() => !cancelled && setRefreshing(false))
    }

    setStatus((s) => (s === 'ready' ? s : 'loading'))
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
      setRefreshing(false)
    }
  }, [connected, signature, attempt, ha.getEvents])

  const refresh = useCallback(() => {
    syncNext.current = true
    setAttempt((a) => a + 1)
  }, [])

  return { events, status, refreshing, refresh }
}
