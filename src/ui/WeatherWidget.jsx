import { LOCATION, WEATHERS } from '../weather/weather'
import Clock from './Clock'

// Line icons drawn on a 48×48 grid with currentColor, so they follow the widget's colours.
const Sun = () => (
  <g>
    <circle cx="24" cy="24" r="8" fill="#ffc75c" stroke="none" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4
      return <line key={i} x1={24 + Math.cos(a) * 12} y1={24 + Math.sin(a) * 12} x2={24 + Math.cos(a) * 16} y2={24 + Math.sin(a) * 16} stroke="#ffc75c" />
    })}
  </g>
)
const Moon = () => <path d="M30 10a14 14 0 1 0 8 25 12 12 0 0 1-8-25z" fill="#e6e1c8" stroke="none" />
const Cloud = ({ y = 0, fill = '#e9eef4' }) => (
  <path transform={`translate(0 ${y})`} d="M14 34h21a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-2 16z" fill={fill} stroke="none" />
)
const Rain = () => [17, 24, 31].map((x) => <line key={x} x1={x} y1="38" x2={x - 2} y2="44" stroke="#8fc3ff" />)
const Flakes = () => [17, 24, 31].map((x, i) => <circle key={x} cx={x - i % 2} cy={i % 2 ? 43 : 40} r="1.8" fill="#fff" stroke="none" />)
const Bolt = () => <path d="M25 33l-5 8h5l-3 7 8-10h-5l3-5z" fill="#ffd34d" stroke="none" />
const Wind = () => (
  <g stroke="#cfe0f2">
    <path d="M8 20h22a4 4 0 1 0-4-4" fill="none" />
    <path d="M8 28h30a4 4 0 1 1-4 4" fill="none" />
    <path d="M8 36h16" fill="none" />
  </g>
)
const Fog = () => [16, 23, 30, 37].map((y, i) => <line key={y} x1={8 + (i % 2) * 4} y1={y} x2={40 - (i % 2) * 4} y2={y} stroke="#d5dde6" />)

function WeatherIcon({ weather, isDay }) {
  const sky = isDay ? <Sun /> : <Moon />
  const parts = {
    clear: sky,
    cloudy: <><g transform="translate(6 -6) scale(0.8)">{sky}</g><Cloud /></>,
    breezy: <><g transform="translate(10 -6) scale(0.75)">{sky}</g><Wind /></>,
    windy: <Wind />,
    gale: <Wind />,
    rain: <><Cloud y={-4} fill="#c3ccd6" /><Rain /></>,
    storm: <><Cloud y={-4} fill="#9aa4b0" /><Bolt /></>,
    snow: <><Cloud y={-4} /><Flakes /></>,
    snowstorm: <><Cloud y={-4} fill="#d3dae2" /><Flakes /><Wind /></>,
    fog: <Fog />,
  }
  return (
    <svg className="weather-icon" viewBox="0 0 48 48" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      {parts[weather]}
    </svg>
  )
}

// Time and date (unless hidden in the display settings), then the current outdoor conditions from
// the live feed, always the real weather (even when the scene is forced to another preset).
// The arrow on the left opens the render settings panel beside the card.
export default function WeatherWidget({ live, error, expanded, onExpandedChange, showClock }) {
  return (
    <section className="weather-widget" aria-label={`Météo à ${LOCATION.name}`}>
      <div className="weather-body">
        <button
          className="expand-button"
          onClick={() => onExpandedChange(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Masquer les réglages du rendu' : 'Réglages du rendu'}
          title="Réglages du rendu"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>        </button>
        <div className="weather-info">
          <div className={`weather-top ${showClock ? 'with-clock' : ''}`}>
            {showClock && <Clock />}
            {live ? (
              <div className="weather-main">
                <WeatherIcon weather={live.weather} isDay={live.isDay} />
                <div>
                  <strong className="weather-temp">{live.temperature}°C</strong>
                  <span className="weather-label">{WEATHERS[live.weather].label}</span>
                </div>
              </div>
            ) : (
              <div className="weather-main">
                <div>
                  <strong className="weather-temp">--°</strong>
                  <span className="weather-label">{error ? 'Météo indisponible' : 'Chargement…'}</span>
                </div>
              </div>
            )}
          </div>
          {live && (
            <dl className="weather-details">
              <div><dt>Ressenti</dt><dd>{live.feelsLike}°</dd></div>
              <div><dt>Max / min</dt><dd>{live.high}° / {live.low}°</dd></div>
              <div><dt>Vent</dt><dd>{live.wind} km/h</dd></div>
              <div><dt>Humidité</dt><dd>{live.humidity} %</dd></div>
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
