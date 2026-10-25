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

// Pill at the top right of a task: where it stands
const badgeLabel = (e) => (e.done ? 'Terminée' : e.overdue ? 'En retard' : 'À faire')

// When it happens, under the title
function whenLabel(e, now) {
  if (e.task) return e.overdue ? `Prévue le ${dayFormat.format(e.due)}` : e.done ? 'Prévue aujourd’hui' : 'À faire aujourd’hui'
  if (!e.allDay) return `${timeLabel(e.start)} – ${timeLabel(e.end)}`
  const lastDay = new Date(e.end - 1)
  return startOfDay(lastDay) > startOfDay(now) ? `Jusqu’au ${dayFormat.format(lastDay)}` : 'Toute la journée'
}

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
const ClockIcon = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
const PinIcon = () => <Icon><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icon>
const TaskIcon = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></Icon>

// Full sheet of an ongoing event or a task due today: everything is written out, since on a TV
// nothing can be hovered or clicked to see more.
function NowCard({ event: e, now }) {
  return (
    <article className={`agenda-now ${e.done ? 'done' : ''}`} style={{ '--cal': e.calendar.color }}>
      <div className="agenda-now-top">
        <span className="agenda-now-cal">{e.task ? 'Tâche' : 'Événement'}</span>
        {e.task && <span className={`agenda-now-badge ${e.overdue ? 'overdue' : ''}`}>{badgeLabel(e)}</span>}
      </div>
      <strong className="agenda-now-title">{e.summary}</strong>
      <div className="agenda-now-meta">
        <span className={e.overdue ? 'overdue' : ''}>{e.task ? <TaskIcon /> : <ClockIcon />}{whenLabel(e, now)}</span>
        {e.location && <span className="agenda-now-location"><PinIcon />{e.location}</span>}
      </div>
      {e.description && <p className="agenda-now-desc">{e.description}</p>}
    </article>
  )
}

// Card of the Google calendars and tasks (through Home Assistant): the ongoing events and today's tasks,
// then the next ones grouped by day, unfolded by the button at the bottom (remembered in this browser).
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
  // Done tasks go last, after what still needs attention
  const current = events.filter((e) => e.start <= now && e.end > now).sort((a, b) => !!a.done - !!b.done)
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
      {current.length ? (
        <div className="agenda-now-list">
          {current.map((e) => <NowCard key={e.id} event={e} now={now} />)}
        </div>
      ) : (
        <p className="agenda-idle">{idle}</p>
      )}
      {open && days.length > 0 && (
        <div className="agenda-days">
          {days.map((day) => (
            <div key={day.label} className="agenda-day">
              <h3>{day.label}</h3>
              <ul>
                {day.events.map((e) => (
                  <li key={e.id} className={e.done ? 'done' : ''} style={{ '--cal': e.calendar.color }} title={e.location}>
                    <span className="agenda-time">{e.task ? 'Tâche' : e.allDay ? 'Journée' : timeLabel(e.start)}</span>
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
