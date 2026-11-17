// Device types come from Home Assistant itself: a type is an entity domain, split by device class
// when it has one ('light', 'switch:outlet', 'media_player:speaker', …). Only domains whose
// services can switch them on and off are kept, so new kinds of device show up on their own.

// Shown until the settings say otherwise: what the UI always showed.
export const DEFAULT_TYPES = ['light', 'switch:outlet']

// Shown as Home Assistant names it: domain, then device class ('switch · outlet').
export const typeLabel = (type) => type.replace(':', ' · ').replaceAll('_', ' ')

// Types that make the window glow while on (a speaker or a fan doesn't light the room).
const GLOWING_DOMAINS = ['light', 'switch', 'input_boolean']

// Domains that are switches in Home Assistant's eyes but not devices in a room.
const NOT_DEVICES = ['automation', 'script', 'scene']

// States that mean "not on" (a media player is on while idle or playing).
const OFF_STATES = ['off', 'standby', 'unavailable', 'unknown']

const domainOf = (entityId) => entityId.split('.')[0]
const typeOf = (entityId, state) => {
  const cls = state.attributes.device_class
  return cls ? `${domainOf(entityId)}:${cls}` : domainOf(entityId)
}

// When one Home Assistant device has entities of several shown types, it appears once, as the
// best of them: a light first (a bulb with a built-in socket shows as its light), then a socket,
// then anything else, generic switches last (often a side option of another device).
const rank = (type) => (type === 'light' ? 0 : type === 'switch:outlet' ? 1 : domainOf(type) === 'switch' ? 3 : 2)

// Every switchable entity Home Assistant has in an area (its own, else its device's).
// Settings / diagnostic entities are left out. `available` lists the types found, for the settings;
// `devices` keeps the `shown` types, one entity per Home Assistant device.
export function homeDevices(registry, states, services, shown, trees) {
  if (!registry || !services) return { devices: [], available: [] }
  const switchable = (domain) =>
    !NOT_DEVICES.includes(domain) && services[domain]?.turn_on && services[domain]?.turn_off
  const deviceArea = Object.fromEntries(registry.devices.map((d) => [d.id, d.area_id]))
  const entries = registry.entities
    .filter((e) => !e.disabled_by && !e.hidden_by && !e.entity_category && states[e.entity_id])
    .filter((e) => switchable(domainOf(e.entity_id)))
    .map((e) => ({
      entry: e,
      type: typeOf(e.entity_id, states[e.entity_id]),
      area: e.area_id ?? deviceArea[e.device_id] ?? null,
    }))
    .filter((x) => x.area)

  const available = [...new Set(entries.map((x) => x.type))]
    .sort((a, b) => rank(a) - rank(b) || typeLabel(a).localeCompare(typeLabel(b)))

  // For each Home Assistant device, the best shown type it has
  const visible = entries.filter((x) => shown.includes(x.type))
  const best = {}
  for (const x of visible) {
    const id = x.entry.device_id
    if (id && (best[id] === undefined || rank(x.type) < rank(best[id]))) best[id] = x.type
  }

  const devices = visible
    .filter((x) => !x.entry.device_id || best[x.entry.device_id] === x.type)
    .map(({ entry: e, type, area }) => {
      const s = states[e.entity_id]
      return {
        id: e.entity_id,
        entity: e.entity_id,
        type,
        name: s.attributes.friendly_name ?? e.entity_id,
        area,
        on: !OFF_STATES.includes(s.state),
        offline: s.state === 'unavailable',
        glows: GLOWING_DOMAINS.includes(domainOf(type)),
        tree: trees.includes(e.entity_id),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { devices, available }
}
