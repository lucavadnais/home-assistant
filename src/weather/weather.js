// Weather presets rendered by the scene, and the live feed from Open-Meteo (free, no API key).

export const LOCATION = { name: 'Montréal', latitude: 45.5019, longitude: -73.5674 }

// sky: daytime gradient [top, horizon] (null = use the season's sky)
// sun: multiplier on the directional light; clouds: how many drift behind the model
// precipitation: 'rain' | 'storm' | 'snow' | 'snowstorm' | null
// wind: typical wind speed (km/h) for the preset when picked by hand; live mode uses the measured one
export const WEATHERS = {
  clear: { label: 'Dégagé', sky: null, sun: 1, clouds: 3, cloudColor: '#ffffff', precipitation: null, wind: 8 },
  cloudy: { label: 'Nuageux', sky: ['#8fa3b8', '#d5dbe1'], sun: 0.55, clouds: 9, cloudColor: '#e9edf1', precipitation: null, wind: 12 },
  breezy: { label: 'Brise', sky: null, sun: 0.95, clouds: 5, cloudColor: '#ffffff', precipitation: null, wind: 28 },
  windy: { label: 'Venteux', sky: ['#7f9ab5', '#d0dbe5'], sun: 0.85, clouds: 7, cloudColor: '#f2f4f6', precipitation: null, wind: 50 },
  gale: { label: 'Vents violents', sky: ['#6f8399', '#c3ccd5'], sun: 0.6, clouds: 9, cloudColor: '#d9dee3', precipitation: null, wind: 85 },
  rain: { label: 'Pluie', sky: ['#6d7b8a', '#b8c0c8'], sun: 0.4, clouds: 9, cloudColor: '#9aa3ad', precipitation: 'rain', wind: 18 },
  storm: { label: 'Orage', sky: ['#4a5361', '#8e97a2'], sun: 0.3, clouds: 9, cloudColor: '#6f7783', precipitation: 'storm', lightning: true, wind: 55 },
  snow: { label: 'Neige', sky: ['#a9b6c4', '#e3e8ed'], sun: 0.5, clouds: 7, cloudColor: '#eef1f4', precipitation: 'snow', wind: 12 },
  snowstorm: { label: 'Tempête de neige', sky: ['#8d99a6', '#d3d9df'], sun: 0.35, clouds: 9, cloudColor: '#c9d0d7', precipitation: 'snowstorm', fog: true, wind: 65 },
  fog: { label: 'Brouillard', sky: ['#b9c2cb', '#dfe3e7'], sun: 0.45, clouds: 0, cloudColor: '#ffffff', precipitation: null, fog: true, wind: 4 },
}

export const WEATHER_ORDER = ['clear', 'cloudy', 'breezy', 'windy', 'gale', 'rain', 'storm', 'snow', 'snowstorm', 'fog']

// Wind felt by the scene: sustained speed, or the gusts when they dominate (km/h).
export function effectiveWind(speed, gusts) {
  return Math.max(speed, gusts * 0.75)
}

// Wind speed (km/h) → 0..1 strength that drives every wind effect (calm under 5, maxed at 90).
export function windStrength(kmh) {
  return Math.min(1, Math.max(0, (kmh - 5) / 85))
}

// WMO weather interpretation codes → our presets. WMO has no wind codes, so dry weather
// is promoted to a wind preset from the measured wind (km/h).
export function codeToWeather(code, wind = 0) {
  if (code <= 3) {
    if (wind >= 70) return 'gale'
    if (wind >= 40) return 'windy'
    if (wind >= 25) return 'breezy'
  }
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code === 75 || code === 86) return 'snowstorm' // heavy snow / heavy snow showers
  if ((code >= 71 && code <= 77) || code === 85) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain' // drizzle 51-57, rain 61-67, showers 80-82
}

export async function fetchCurrentWeather({ latitude, longitude }, signal) {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_gusts_10m' +
    '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto'
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const { current, daily } = await res.json()
  const wind = Math.round(effectiveWind(current.wind_speed_10m, current.wind_gusts_10m))
  return {
    weather: codeToWeather(current.weather_code, wind),
    wind,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    high: Math.round(daily.temperature_2m_max[0]),
    low: Math.round(daily.temperature_2m_min[0]),
    isDay: current.is_day === 1,
  }
}
