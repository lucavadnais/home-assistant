import { useCallback, useEffect, useRef, useState } from 'react'
import {
  callService,
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  subscribeEntities,
} from 'home-assistant-js-websocket'

// Connection settings come from .env.local (see .env.example). Without them the app runs in demo mode.
const HA_URL = import.meta.env.VITE_HA_URL
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN
export const HA_ENABLED = Boolean(HA_URL && HA_TOKEN)

// status: 'demo' | 'connecting' | 'connected' | 'disconnected' | 'auth-error' | 'error'
export default function useHomeAssistant() {
  const [status, setStatus] = useState(HA_ENABLED ? 'connecting' : 'demo')
  const [entities, setEntities] = useState({})
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
  }, [])

  // homeassistant.* services work for any domain (light, switch, …), so Tuya plugs and bulbs alike.
  const toggle = useCallback((entityId) => {
    if (connection.current) callService(connection.current, 'homeassistant', 'toggle', undefined, { entity_id: entityId })
  }, [])

  const turnOff = useCallback((entityIds) => {
    if (connection.current && entityIds.length)
      callService(connection.current, 'homeassistant', 'turn_off', undefined, { entity_id: entityIds })
  }, [])

  return { status, entities, toggle, turnOff }
}
