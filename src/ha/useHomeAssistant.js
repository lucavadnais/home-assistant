import { useCallback, useEffect, useRef, useState } from 'react'
import {
  callService,
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  subscribeEntities,
} from 'home-assistant-js-websocket'

// Connection settings come from .env.local (see .env.example). Without them the app runs in demo mode.
export const HA_URL = import.meta.env.VITE_HA_URL
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN
export const HA_ENABLED = Boolean(HA_URL && HA_TOKEN)

// status: 'demo' | 'connecting' | 'connected' | 'disconnected' | 'auth-error' | 'error'
// Once connected the library reconnects by itself; a failed first connection waits for `retry()`.
export default function useHomeAssistant() {
  const [status, setStatus] = useState(HA_ENABLED ? 'connecting' : 'demo')
  const [entities, setEntities] = useState({})
  const [attempt, setAttempt] = useState(0)
  const connection = useRef(null)

  useEffect(() => {
    if (!HA_ENABLED) return
    let cancelled = false
    let unsubscribe

    createConnection({ auth: createLongLivedTokenAuth(HA_URL, HA_TOKEN) })
      .then((conn) => {
        if (cancelled) return conn.close()
        connection.current = conn
        setStatus('connected')
        // The library reconnects on its own; mirror that in the status.
        conn.addEventListener('disconnected', () => setStatus('disconnected'))
        conn.addEventListener('ready', () => setStatus('connected'))
        unsubscribe = subscribeEntities(conn, setEntities)
      })
      .catch((err) => setStatus(err === ERR_INVALID_AUTH ? 'auth-error' : 'error'))

    return () => {
      cancelled = true
      unsubscribe?.()
      connection.current?.close()
      connection.current = null
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('connecting')
    setAttempt((a) => a + 1)
  }, [])

  // homeassistant.* services work for any domain (light, switch, …), so Tuya plugs and bulbs alike.
  const toggle = useCallback((entityId) => {
    if (connection.current) callService(connection.current, 'homeassistant', 'toggle', undefined, { entity_id: entityId })
  }, [])

  const turnOff = useCallback((entityIds) => {
    if (connection.current && entityIds.length)
      callService(connection.current, 'homeassistant', 'turn_off', undefined, { entity_id: entityIds })
  }, [])

  // Events of the next `days` days, keyed by calendar entity: { 'calendar.x': { events: [...] } }
  // Home Assistant answers from its local copy of Google Calendar, synced every ~15 min;
  // `sync` asks it to pull from Google first.
  const getEvents = useCallback(async (entityIds, days, sync = false) => {
    if (!connection.current) return null
    if (sync) await callService(connection.current, 'homeassistant', 'update_entity', undefined, { entity_id: entityIds })
    const { response } = await callService(
      connection.current, 'calendar', 'get_events', { duration: { days } }, { entity_id: entityIds }, true,
    )
    return response
  }, [])

  return { status, entities, toggle, turnOff, retry, getEvents }
}
