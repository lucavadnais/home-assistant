import { useEffect, useState } from 'react'
import CalendarWidget from './CalendarWidget'
import DisplaySettings from './DisplaySettings'
import RenderSettings from './RenderSettings'
import StatusCard from './StatusCard'
import WeatherWidget from './WeatherWidget'

const HA_STATUS = {
  demo: 'Mode démo',
  connecting: 'Connexion…',
  connected: 'Connecté',
  disconnected: 'Reconnexion…',
  'auth-error': 'Jeton refusé',
  error: 'Hors ligne',
}

// Same breakpoint as the phone layout in styles.css
const PHONE = '(max-width: 700px)'

// Whether the media `query` matches, kept up to date as the window changes.
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// Minutes since midnight → "14 h 05"
const formatTime = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`

export default function Overlay({
  rooms, onToggle, onAllOff, mode, modeChoice, onModeChoiceChange,
  daySpan, dayMinutes, onDayMinutesChange,
  season, seasonChoice, onSeasonChoiceChange,
  weatherChoice, onWeatherChoiceChange, weather, liveWeather, weatherError,
  haStatus, onHaRetry, showNeighbors, onShowNeighborsChange, viewShift, onViewShiftChange,
  lite, onLiteChange, showClock, onShowClockChange, availableTypes, shownTypes, onShownTypesChange,
  calendarEvents, calendarStatus, calendarRefreshing, onCalendarRefresh,
}) {
  const lit = rooms.filter((r) => r.on).length
  // Render settings panel, opened by the arrow on the weather card
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Device list folded or not; remembered in this browser (storage may be unavailable)
  const [roomsOpen, setRoomsOpenState] = useState(() => {
    try { return localStorage.getItem('roomsOpen') !== 'false' } catch { return true }
  })
  const setRoomsOpen = (open) => {
    setRoomsOpenState(open)
    try { localStorage.setItem('roomsOpen', String(open)) } catch { /* not persisted */ }
  }

  // TV / computer: agenda top-left, gear bottom-left, clock and weather atop the right column.
  // Phone: gear and the clock and weather card share the top row; the agenda goes at the bottom, above the devices.
  const phone = useMediaQuery(PHONE)

  const agenda = calendarStatus !== 'idle' && (
    <CalendarWidget
      events={calendarEvents}
      status={calendarStatus}
      refreshing={calendarRefreshing}
      onRefresh={onCalendarRefresh}
    />
  )
  const gear = (
    <DisplaySettings
      showNeighbors={showNeighbors}
      onShowNeighborsChange={onShowNeighborsChange}
      viewShift={viewShift}
      onViewShiftChange={onViewShiftChange}
      lite={lite}
      onLiteChange={onLiteChange}
      showClock={showClock}
      onShowClockChange={onShowClockChange}
      availableTypes={availableTypes}
      shownTypes={shownTypes}
      onShownTypesChange={onShownTypesChange}
    />
  )
  // The render settings flyout is positioned against the weather card, wherever it sits.
  const weatherCard = (
    <div className="weather-slot">
      <WeatherWidget
        live={liveWeather}
        error={weatherError}
        expanded={settingsOpen}
        onExpandedChange={setSettingsOpen}
        showClock={showClock}
      />
      {settingsOpen && (
        <div className="render-flyout">
          <RenderSettings
            mode={mode}
            modeChoice={modeChoice}
            onModeChoiceChange={onModeChoiceChange}
            season={season}
            seasonChoice={seasonChoice}
            onSeasonChoiceChange={onSeasonChoiceChange}
            weather={weather}
            weatherChoice={weatherChoice}
            onWeatherChoiceChange={onWeatherChoiceChange}
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      {phone ? (
        <header className="topbar">
          {gear}
          {weatherCard}
        </header>
      ) : (
        <>
          {agenda && <div className="agenda-corner">{agenda}</div>}
          <div className="gear-corner">{gear}</div>
        </>
      )}

      <aside className="sidebar">
        {phone ? agenda : weatherCard}
        <button
          className="chip rooms-toggle"
          onClick={() => setRoomsOpen(!roomsOpen)}
          aria-expanded={roomsOpen}
        >
          <span
            className={`status-dot status-${haStatus}`}
            role="status"
            aria-label={`Home Assistant : ${HA_STATUS[haStatus]}`}
            title={`Home Assistant : ${HA_STATUS[haStatus]}`}
          />
          <strong>Appareils</strong>
          <span>{lit} / {rooms.length} allumée{lit > 1 ? 's' : ''}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="rooms" hidden={!roomsOpen}>
          <StatusCard status={haStatus} onRetry={onHaRetry} />
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room ${room.on ? 'on' : ''} ${room.offline ? 'offline' : ''}`}
              onClick={() => onToggle(room.id)}
            >
              <span className="dot" />
              <span className="name">{room.name}</span>
              <span className="state">{room.offline ? 'Hors ligne' : room.on ? 'Allumé' : 'Éteint'}</span>
            </button>
          ))}
        </div>
        <button className="chip danger all-off" onClick={onAllOff} disabled={lit === 0}>
          <strong>Tout éteindre</strong>
        </button>
      </aside>

      {modeChoice === 'day' && (
        <label className="time-slider">
          <span>{formatTime(daySpan.rise)}</span>
          <input
            type="range"
            min={daySpan.rise}
            max={daySpan.set - 1}
            value={dayMinutes}
            onChange={(e) => onDayMinutesChange(Number(e.target.value))}
          />
          <span>{formatTime(daySpan.set)}</span>
          <strong>{formatTime(dayMinutes)}</strong>
        </label>
      )}
    </>
  )
}
