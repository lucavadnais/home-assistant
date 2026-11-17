#!/usr/bin/env node
// Lists the Home Assistant areas (rooms), one per line: id<TAB>name. Reads VITE_HA_URL and
// VITE_HA_TOKEN from .env.local. Used by the /build-house Claude Code command to tie windows to
// rooms. Exits with 2 when Home Assistant isn't configured or can't be reached.
//
//   node scripts/ha-areas.mjs

import { readFileSync, existsSync } from 'node:fs'

const env = existsSync('.env.local')
  ? Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')]),
  )
  : {}
const { VITE_HA_URL: url, VITE_HA_TOKEN: token } = env

if (!url || !token) {
  console.log('Home Assistant not configured: no VITE_HA_URL / VITE_HA_TOKEN in .env.local.')
  process.exit(2)
}

// The template endpoint is plain REST, so no WebSocket is needed in Node.
try {
  const res = await fetch(`${url.replace(/\/$/, '')}/api/template`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ template: '{% for a in areas() %}{{ a }}\t{{ area_name(a) }}\n{% endfor %}' }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    console.log(`Home Assistant answered ${res.status}${res.status === 401 ? ' (token refused)' : ''}.`)
    process.exit(2)
  }
  process.stdout.write(await res.text())
} catch (err) {
  console.log(`Home Assistant unreachable at ${url}: ${err.message}`)
  process.exit(2)
}
