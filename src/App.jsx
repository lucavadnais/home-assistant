import { useCallback, useEffect, useMemo, useState } from 'react'
import Scene from './scene/Scene'
import Overlay from './ui/Overlay'
import { HOUSE } from './houses'
import { DEFAULT_TYPES, homeDevices } from './ha/devices'
import { currentSeason, seasonDate } from './scene/seasons'
import useLiveWeather from './weather/useLiveWeather'
import { isDaytime, minutesOf, sunPosition, sunTimes, useNow } from './weather/sun'
import { WEATHERS } from './weather/weather'
import useHomeAssistant from './ha/useHomeAssistant'
import useCalendar from './ha/useCalendar'

// `?clean` in the URL hides every panel, leaving only the 3D scene (to screenshot the model)
const CLEAN = new URLSearchParams(window.location.search).has('clean')

// Display options are remembered in this browser (storage may be unavailable)
const stored = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
const store = (key, value) => {
  try { localStorage.setItem(key, String(value)) } catch { /* not persisted */ }
}

// Lite mode for weak GPUs (TV boxes): `?lite` / `?lite=0` in the URL wins, then the choice saved
// in this browser; off by default.
function initialLite() {
  const param = new URLSearchParams(window.location.search).get('lite')
  if (param !== null) return param !== '0' && param !== 'false'
  return stored('lite', 'false') === 'true'
}

export default function App() {
  const [showNeighbors, setShowNeighbors] = useState(() => stored('showNeighbors', 'true') === 'true')
  // Where the house sits on screen, as a fraction of its width: 0 = centred, negative = to the left
  const [viewShift, setViewShift] = useState(() => Number(stored('viewShift', 0)) || 0)
  useEffect(() => store('showNeighbors', showNeighbors), [showNeighbors])
  useEffect(() => store('viewShift', viewShift), [viewShift])
  const [lite, setLite] = useState(initialLite)
  useEffect(() => store('lite', lite), [lite])
  const [showClock, setShowClock] = useState(() => stored('showClock', 'true') === 'true')
  useEffect(() => store('showClock', showClock), [showClock])
  // Types of device shown ('light', 'switch:outlet', …, see ha/devices.js), ticked in the display settings
  const [shownTypes, setShownTypes] = useState(() => {
    try {
      const saved = JSON.parse(stored('shownDeviceTypes', 'null'))
      return Array.isArray(saved) ? saved : DEFAULT_TYPES
    } catch { return DEFAULT_TYPES }
  })
  useEffect(() => store('shownDeviceTypes', JSON.stringify(shownTypes)), [shownTypes])
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
  // The model's front faces the viewer (+z, south in the scene): turn the sun so it shines from
  // where it really does, given which way the house's real front faces.
  const realSun = sunPosition(sunDate)
  const sun = { ...realSun, azimuth: realSun.azimuth + 180 - HOUSE.frontAzimuth }
  // 'auto' follows the live feed; otherwise one of WEATHERS' ids
  const [weatherChoice, setWeatherChoice] = useState('auto')
  const { live, error } = useLiveWeather()
  const weather = weatherChoice === 'auto' ? live?.weather ?? 'clear' : weatherChoice
  // Wind speed (km/h): measured in live mode, the preset's typical value otherwise
  const wind = weatherChoice === 'auto' && live ? live.wind : WEATHERS[weather].wind

  const ha = useHomeAssistant()
  const calendar = useCalendar(ha)
  // Devices come straight from Home Assistant, so the model always shows the real state; only the
  // types ticked in the settings are kept (left out of the model, the list and "all off" alike).
  // While disconnected they stay listed but show as offline.
  const { devices, availableTypes } = useMemo(() => {
    const { devices: list, available } = homeDevices(ha.registry, ha.entities, ha.services, shownTypes, HOUSE.trees)
    return {
      devices: ha.status === 'connected' ? list : list.map((d) => ({ ...d, on: false, offline: true })),
      availableTypes: available,
    }
  }, [ha.status, ha.registry, ha.entities, ha.services, shownTypes])

  const toggleDevice = useCallback(
    (id) => {
      const device = devices.find((d) => d.id === id)
      if (!device.offline) ha.toggle(device.entity)
    },
    [devices, ha],
  )

  // The house's windows tied to rooms, each holding every device of its Home Assistant area.
  const windows = useMemo(
    () =>
      HOUSE.rooms.map((r) => {
        const inside = devices.filter((d) => d.area === r.area)
        return {
          ...r,
          id: r.id ?? r.area,
          // A tree, a speaker or a fan alone doesn't light the room: the glass only glows for the rest.
          on: inside.some((d) => d.on && d.glows && !d.tree),
          offline: inside.every((d) => d.offline),
          tree: inside.some((d) => d.tree && d.on),
        }
      }),
    [devices],
  )

  // Any device on → switch the whole window off; otherwise switch it all on, so they stay in sync.
  const toggleWindow = useCallback(
    (id) => {
      const area = windows.find((w) => w.id === id)?.area
      const inside = devices.filter((d) => d.area === area && !d.offline)
      const entities = inside.map((d) => d.entity)
      if (inside.some((d) => d.on)) ha.turnOff(entities)
      else ha.turnOn(entities)
    },
    [devices, windows, ha],
  )

  // Only devices Home Assistant reports as on are `on`, so this never targets an offline light.
  const allOff = useCallback(() => {
    ha.turnOff(devices.filter((d) => d.on).map((d) => d.entity))
  }, [devices, ha])

  return (
    <div className={lite ? 'app lite' : 'app'}>
      <Scene
        rooms={windows}
        onToggle={toggleWindow}
        mode={mode}
        sun={sun}
        hour={modeChoice === 'day' ? simMinutes / 60 : undefined}
        showNeighbors={showNeighbors}
        viewShift={viewShift}
        season={season}
        weather={weather}
        wind={wind}
        lite={lite}
        house={HOUSE}
      />
      {!CLEAN && <Overlay
        rooms={devices}
        onToggle={toggleDevice}
        onAllOff={allOff}
        mode={mode}
        modeChoice={modeChoice}
        onModeChoiceChange={setModeChoice}
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
        onHaRetry={ha.retry}
        calendarEvents={calendar.events}
        calendarStatus={calendar.status}
        calendarRefreshing={calendar.refreshing}
        onCalendarRefresh={calendar.refresh}
        showNeighbors={showNeighbors}
        onShowNeighborsChange={setShowNeighbors}
        viewShift={viewShift}
        onViewShiftChange={setViewShift}
        lite={lite}
        onLiteChange={setLite}
        showClock={showClock}
        onShowClockChange={setShowClock}
        availableTypes={availableTypes}
        shownTypes={shownTypes}
        onShownTypesChange={setShownTypes}
      />}
    </div>
  )
}
