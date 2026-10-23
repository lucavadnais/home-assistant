import { useState } from 'react'

const MAX_EVENTS = 6

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const dayFormat = new Intl.DateTimeFormat('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })

// "Aujourd'hui", "Demain", then "mer. 29 oct."
function dayLabel(date, now) {
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000)
  if (days <= 0) return 'Aujourd’hui'
  if (days === 1) return 'Demain'
  return dayFormat.format(date)
}

// "8 h 15"
const timeLabel = (d) => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`

// Card of the Google calendars (through Home Assistant): the ongoing event, then the next ones
// grouped by day, unfolded by the button at the bottom (remembered in this browser).
// The round arrow beside the header reloads the events right away.
export default function CalendarWidget({ events, status, refreshing, onRefresh }) {
  const [open, setOpenState] = useState(() => {
    try { return localStorage.getItem('agendaOpen') === 'true' } catch { return false }
  })
  const setOpen = (value) => {
    setOpenState(value)
    try { localStorage.setItem('agendaOpen', String(value)) } catch { /* not persisted */ }
  }

  const now = new Date()
  const current = events.filter((e) => e.start <= now && e.end > now)
  const upcoming = events.filter((e) => e.start > now).slice(0, MAX_EVENTS)
  const days = []
  for (const e of upcoming) {
    const label = dayLabel(e.start, now)
    if (days.at(-1)?.label !== label) days.push({ label, events: [] })
    days.at(-1).events.push(e)
  }

  // Shown in the card when nothing is ongoing
  const idle =
    status === 'error' ? 'Agenda indisponible'
    : status !== 'ready' ? 'Chargement…'
    : 'Rien en cours'

  return (
    <section className="agenda" aria-label="Agenda">
      <div className="agenda-header">
        <span>{current.length ? 'En cours' : 'Agenda'}</span>
        <button
          className={`agenda-refresh ${refreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Rafraîchir l’agenda"
          title="Rafraîchir"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v5h-5" />
          </svg>
        </button>
      </div>
      {current.length ? current.map((e) => (
        <div key={e.id} className="agenda-now" style={{ '--cal': e.calendar.color }}>
          <strong className="agenda-now-title">{e.summary}</strong>
          <span className="agenda-now-time">
            {e.allDay ? 'Toute la journée' : `${timeLabel(e.start)} – ${timeLabel(e.end)}`}
          </span>
          {e.location && <span className="agenda-now-location">{e.location}</span>}
          {!e.allDay && (
            <div className="agenda-now-progress">
              <div style={{ width: `${(100 * (now - e.start)) / (e.end - e.start)}%` }} />
            </div>
          )}
        </div>
      )) : (
        <p className="agenda-idle">{idle}</p>
      )}
      {open && days.length > 0 && (
        <div className="agenda-days">
          {days.map((day) => (
            <div key={day.label} className="agenda-day">
              <h3>{day.label}</h3>
              <ul>
                {day.events.map((e) => (
                  <li key={e.id} style={{ '--cal': e.calendar.color }} title={e.location}>
                    <span className="agenda-time">{e.allDay ? 'Journée' : timeLabel(e.start)}</span>
                    <span className="agenda-summary">{e.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <button className="agenda-more" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span>{open ? 'Masquer' : `${upcoming.length} événement${upcoming.length > 1 ? 's' : ''} à venir`}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </section>
  )
}
