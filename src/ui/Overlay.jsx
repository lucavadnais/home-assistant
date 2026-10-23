import { SEASONS, SEASON_ORDER, currentSeason } from '../scene/seasons'
import { LOCATION } from '../weather/weather'
import ChipMenu from './ChipMenu'
import WeatherMenu from './WeatherMenu'

const HA_STATUS = {
  demo: 'Mode démo',
  connecting: 'Connexion…',
  connected: 'Connecté',
  disconnected: 'Reconnexion…',
  'auth-error': 'Jeton refusé',
  error: 'Injoignable',
}

const MODE_LABELS = { day: 'Jour', night: 'Nuit' }

// Minutes since midnight → "14 h 05"
const formatTime = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`

export default function Overlay({
  rooms, onToggle, onAllOff, mode, modeChoice, onModeChoiceChange, daytime,
  daySpan, dayMinutes, onDayMinutesChange,
  season, seasonChoice, onSeasonChoiceChange,
  weatherChoice, onWeatherChoiceChange, weather, liveWeather, weatherError,
  haStatus, showNeighbors, onShowNeighborsChange,
}) {
  const lit = rooms.filter((r) => r.on).length

  return (
    <>
      <header className="topbar">
        <div className="title">
          <h1>Ma maison</h1>
          <span>6538 · maison de fond de cour</span>
        </div>
        <div className={`chip ha-${haStatus}`}>
          <strong>Home Assistant</strong>
          <span>{HA_STATUS[haStatus]}</span>
        </div>
        <div className="chip">
          <strong>Lumières</strong>
          <span>{lit} / {rooms.length} allumées</span>
        </div>
        <button className="chip danger" onClick={onAllOff} disabled={lit === 0}>
          <strong>Tout éteindre</strong>
          <span>Maison</span>
        </button>
        <ChipMenu
          title={MODE_LABELS[mode]}
          subtitle={`Ambiance · ${modeChoice === 'auto' ? 'auto' : 'manuel'}`}
          value={modeChoice}
          onChange={onModeChoiceChange}
          options={[
            { value: 'auto', label: 'Selon le soleil', detail: `${MODE_LABELS[daytime ? 'day' : 'night']} en ce moment · ${LOCATION.name}` },
            { value: 'day', label: MODE_LABELS.day },
            { value: 'night', label: MODE_LABELS.night },
          ]}
        />
        <ChipMenu
          title={SEASONS[season].label}
          subtitle={`Saison · ${seasonChoice === 'auto' ? 'auto' : 'manuel'}`}
          value={seasonChoice}
          onChange={onSeasonChoiceChange}
          options={[
            { value: 'auto', label: 'Selon la date', detail: SEASONS[currentSeason()].label },
            ...SEASON_ORDER.map((id) => ({ value: id, label: SEASONS[id].label })),
          ]}
        />
        <WeatherMenu
          choice={weatherChoice}
          onChoiceChange={onWeatherChoiceChange}
          weather={weather}
          live={liveWeather}
          error={weatherError}
        />
        <button className="chip" onClick={() => onShowNeighborsChange(!showNeighbors)}>
          <strong>{showNeighbors ? 'Masquer' : 'Afficher'}</strong>
          <span>Autres bâtiments</span>
        </button>
      </header>

      <aside className="rooms">
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

      <p className="hint">Glisser pour tourner · molette pour zoomer · cliquer une fenêtre pour l'allumer</p>
    </>
  )
}
