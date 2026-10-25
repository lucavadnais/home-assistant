import { useCallback, useEffect, useRef, useState } from 'react'
import { AGENDA_DAYS, CALENDARS, TASK_LISTS } from '../data/calendars'

const REFRESH_MS = 5 * 60 * 1000

// All-day events come as a bare date ('2026-10-31'): read it as local midnight, not UTC.
const parseDate = (s) => {
  if (s.length > 10) return new Date(s)
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Google descriptions may be HTML (links, line breaks): keep the text and its line breaks only.
function plainText(html) {
  if (!html) return ''
  const withBreaks = html.replace(/<br\s*\/?>|<\/(p|div|li)>/gi, '\n')
  const text = new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// Google Tasks with a due date, shaped like events: a task due on a day spans that whole day,
// an overdue one is moved to today. Done tasks stay on their day (`done`, shown struck through),
// except past ones. Tasks without a due date or past the agenda are left out.
function tasksAsEvents(response, now) {
  const today = addDays(now, 0)
  const limit = addDays(today, AGENDA_DAYS)
  return TASK_LISTS.flatMap((list) =>
    (response?.[list.entity]?.items ?? []).flatMap((t) => {
      if (!t.due) return []
      const due = parseDate(t.due)
      const allDay = t.due.length <= 10
      const done = t.status === 'completed'
      if (due >= limit || (done && due < today)) return []
      const overdue = !done && due < (allDay ? today : now)
      const wholeDay = allDay || overdue || done
      const start = overdue ? today : done ? addDays(due, 0) : due
      return [{
        id: `${list.entity}|${t.uid}`,
        summary: t.summary,
        description: plainText(t.description),
        due,
        start,
        end: wholeDay ? addDays(start, 1) : due,
        allDay: wholeDay,
        overdue,
        done,
        calendar: list,
        task: true,
      }]
    }),
  )
}

// Upcoming events of every calendar in CALENDARS and due tasks of TASK_LISTS, merged and sorted by start.
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
  // A todo entity's state is its count of tasks left, so it changes whenever a task is added or done.
  const signature = [...CALENDARS, ...TASK_LISTS].map((c) => ha.entities[c.entity]?.last_changed).join()

  useEffect(() => {
    if (!connected) return setStatus('idle')
    let cancelled = false

    const load = () => {
      setRefreshing(true)
      const sync = syncNext.current
      syncNext.current = false
      // A missing task list must not take the calendars down with it
      const tasks = TASK_LISTS.length
        ? ha.getTasks(TASK_LISTS.map((l) => l.entity), sync).catch(() => null)
        : null
      return Promise.all([ha.getEvents(CALENDARS.map((c) => c.entity), AGENDA_DAYS, sync), tasks])
        .then(([response, taskResponse]) => {
          if (cancelled || !response) return
          const calendarEvents = CALENDARS.flatMap((cal) =>
            (response[cal.entity]?.events ?? []).map((e) => ({
              id: `${cal.entity}|${e.start}|${e.summary}`,
              summary: e.summary,
              location: e.location,
              description: plainText(e.description),
              start: parseDate(e.start),
              end: parseDate(e.end),
              allDay: e.start.length <= 10,
              calendar: cal,
            })),
          )
          const merged = [...calendarEvents, ...tasksAsEvents(taskResponse, new Date())]
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
  }, [connected, signature, attempt, ha.getEvents, ha.getTasks])

  const refresh = useCallback(() => {
    syncNext.current = true
    setAttempt((a) => a + 1)
  }, [])

  return { events, status, refreshing, refresh }
}
