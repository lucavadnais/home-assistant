import { LOCATION, WEATHERS, WEATHER_ORDER } from '../weather/weather'
import ChipMenu from './ChipMenu'

// Chip showing the rendered weather; opens a menu to follow the live feed or force a preset.
export default function WeatherMenu({ choice, onChoiceChange, weather, live, error }) {
  const temperature = live ? `${live.temperature}°C · ` : ''
  const source = choice === 'auto' ? (error ? 'auto · hors ligne' : `auto · ${LOCATION.name}`) : 'manuel'
  const liveDetail = live
    ? `${WEATHERS[live.weather].label}, ${live.temperature}°C · vent ${live.wind} km/h`
    : error ? 'indisponible' : 'chargement…'

  return (
    <ChipMenu
      title={`${temperature}${WEATHERS[weather].label}`}
      subtitle={`Météo · ${source}`}
      value={choice}
      onChange={onChoiceChange}
      options={[
        { value: 'auto', label: 'Temps réel', detail: liveDetail },
        ...WEATHER_ORDER.map((id) => ({ value: id, label: WEATHERS[id].label })),
      ]}
    />
  )
}
