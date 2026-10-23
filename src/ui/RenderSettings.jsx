import { SEASONS, SEASON_ORDER } from '../scene/seasons'
import { WEATHERS, WEATHER_ORDER } from '../weather/weather'

const MODE_LABELS = { day: 'Jour', night: 'Nuit' }

// Number of render settings forced by hand instead of following reality.
const manualCount = (...choices) => choices.filter((c) => c !== 'auto').length

// One setting: a title and a row of options; `value` (what is rendered now) is highlighted.
export function Group({ title, value, onChange, options }) {
  return (
    <fieldset className="render-group">
      <legend>{title}</legend>
      <div className="render-options">
        {options.map((o) => (
          <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

// Everything that changes how the scene is rendered (not the house itself): ambiance, season,
// weather. Picking an option forces it; the refresh button puts all three back on reality ('auto').
export default function RenderSettings({
  mode, modeChoice, onModeChoiceChange,
  season, seasonChoice, onSeasonChoiceChange,
  weather, weatherChoice, onWeatherChoiceChange,
}) {
  const manual = manualCount(modeChoice, seasonChoice, weatherChoice)
  const resetAll = () => {
    onModeChoiceChange('auto')
    onSeasonChoiceChange('auto')
    onWeatherChoiceChange('auto')
  }

  return (
    <div className="render-settings">
      <header className="render-summary">
        <strong>Rendu · {MODE_LABELS[mode]} · {SEASONS[season].label} · {WEATHERS[weather].label}</strong>
        <button
          className="render-refresh"
          onClick={resetAll}
          disabled={!manual}
          aria-label="Revenir au rendu actuel"
          title="Revenir au rendu actuel"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
          </svg>
        </button>
      </header>
      <Group
        title="Ambiance"
        value={mode}
        onChange={onModeChoiceChange}
        options={[
          { value: 'day', label: MODE_LABELS.day },
          { value: 'night', label: MODE_LABELS.night },
        ]}
      />
      <Group
        title="Saison"
        value={season}
        onChange={onSeasonChoiceChange}
        options={SEASON_ORDER.map((id) => ({ value: id, label: SEASONS[id].label }))}
      />
      <Group
        title="Météo"
        value={weather}
        onChange={onWeatherChoiceChange}
        options={WEATHER_ORDER.map((id) => ({ value: id, label: WEATHERS[id].label }))}
      />
    </div>
  )
}
