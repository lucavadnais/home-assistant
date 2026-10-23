import { useCallback, useMemo, useState } from 'react'
import Scene from './scene/Scene'
import Overlay from './ui/Overlay'
import { ROOMS } from './data/rooms'
import { currentSeason, seasonDate } from './scene/seasons'
import useLiveWeather from './weather/useLiveWeather'
import { isDaytime, minutesOf, sunPosition, sunTimes, useNow } from './weather/sun'
import { WEATHERS } from './weather/weather'
import useHomeAssistant from './ha/useHomeAssistant'

export default function App() {
  const [showNeighbors, setShowNeighbors] = useState(true)
  // 'auto' follows the calendar; otherwise one of SEASONS' ids
  const [seasonChoice, setSeasonChoice] = useState('auto')
  const now = useNow()
  const season = seasonChoice === 'auto' ? currentSeason(now) : seasonChoice
  // The sun follows the clock, on today's date or in the middle of a forced season
  const sunNow = seasonDate(season, now)
  // 'auto' follows sunrise/sunset; 'day' / 'night' force the ambiance
  const [modeChoice, setModeChoice] = useState('auto')
  const daytime = isDaytime(sunNow)
  const mode = modeChoice === 'auto' ? (daytime ? 'day' : 'night') : modeChoice
  // Forced day: a slider picks the time between that day's sunrise and sunset (null = now, or noon)
  const [dayMinutes, setDayMinutes] = useState(null)
  const sunDay = sunNow.toDateString()
  const daySpan = useMemo(() => sunTimes(sunNow), [sunDay])
  const clampToDay = (m) => Math.min(daySpan.set - 1, Math.max(daySpan.rise, m))
  const simMinutes = clampToDay(dayMinutes ?? (daytime ? minutesOf(sunNow) : 12 * 60))
  const sunDate = modeChoice === 'day'
    ? new Date(sunNow.getFullYear(), sunNow.getMonth(), sunNow.getDate(), 0, simMinutes)
    : sunNow
  const sun = sunPosition(sunDate)
  // 'auto' follows the live feed; otherwise one of WEATHERS' ids
  const [weatherChoice, setWeatherChoice] = useState('auto')
  const { live, error } = useLiveWeather()
  const weather = weatherChoice === 'auto' ? live?.weather ?? 'clear' : weatherChoice
  // Wind speed (km/h): measured in live mode, the preset's typical value otherwise
  const wind = weatherChoice === 'auto' && live ? live.wind : WEATHERS[weather].wind

  const ha = useHomeAssistant()
  // Every room mirrors its Home Assistant entity, so the model always shows the real state.
  // Until Home Assistant answers, or if the entity is missing, the room shows as offline.
  const rooms = useMemo(
    () =>
      ROOMS.map((r) => {
        const entity = ha.status === 'connected' ? ha.entities[r.entity] : null
        return { ...r, on: entity?.state === 'on', offline: !entity || entity.state === 'unavailable' }
      }),
    [ha.status, ha.entities],
  )

  const toggleRoom = useCallback(
    (id) => {
      const room = rooms.find((r) => r.id === id)
      if (!room.offline) ha.toggle(room.entity)
    },
    [rooms, ha],
  )

  // Only rooms Home Assistant reports as on are `on`, so this never targets an offline light.
  const allOff = useCallback(() => {
    ha.turnOff(rooms.filter((r) => r.on).map((r) => r.entity))
  }, [rooms, ha])

  return (
    <div className="app">
      <Scene
        rooms={rooms}
        onToggle={toggleRoom}
        mode={mode}
        sun={sun}
        hour={modeChoice === 'day' ? simMinutes / 60 : undefined}
        showNeighbors={showNeighbors}
        season={season}
        weather={weather}
        wind={wind}
      />
      <Overlay
        rooms={rooms}
        onToggle={toggleRoom}
        onAllOff={allOff}
        mode={mode}
        modeChoice={modeChoice}
        onModeChoiceChange={setModeChoice}
        daytime={daytime}
        daySpan={daySpan}
        dayMinutes={simMinutes}
        onDayMinutesChange={setDayMinutes}
        season={season}
        seasonChoice={seasonChoice}
        onSeasonChoiceChange={setSeasonChoice}
        weatherChoice={weatherChoice}
        onWeatherChoiceChange={setWeatherChoice}
        weather={weather}
        liveWeather={live}
        weatherError={error}
        haStatus={ha.status}
        showNeighbors={showNeighbors}
        onShowNeighborsChange={setShowNeighbors}
      />
    </div>
  )
}
