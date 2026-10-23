import { useEffect, useState } from 'react'
import { LOCATION, fetchCurrentWeather } from './weather'

const REFRESH_MS = 15 * 60 * 1000 // Open-Meteo updates current conditions every 15 min

// Current conditions for LOCATION, refreshed periodically. `live` is null until the first answer.
export default function useLiveWeather() {
  const [live, setLive] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = () =>
      fetchCurrentWeather(LOCATION, controller.signal)
        .then((data) => { setLive(data); setError(null) })
        .catch((e) => { if (e.name !== 'AbortError') setError(e) })

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => { clearInterval(id); controller.abort() }
  }, [])

  return { live, error }
}
