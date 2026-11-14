const isLight = (id) => id.startsWith('light.')
const isSocket = (id, states) => id.startsWith('switch.') && states[id].attributes.device_class === 'outlet'

// Lights and sockets Home Assistant knows about, with the area each sits in (its own, else its device's).
// A device that has a light keeps only that light, so a bulb with a built-in socket shows once.
// Devices not put in any area are left out.
export function controllableDevices(registry, states, trees) {
  if (!registry) return []
  const deviceArea = Object.fromEntries(registry.devices.map((d) => [d.id, d.area_id]))
  const entries = registry.entities.filter((e) => !e.disabled_by && !e.hidden_by && states[e.entity_id])
  const withLight = new Set(entries.filter((e) => isLight(e.entity_id) && e.device_id).map((e) => e.device_id))

  return entries
    .filter((e) => isLight(e.entity_id) || (isSocket(e.entity_id, states) && !withLight.has(e.device_id)))
    .map((e) => {
      const s = states[e.entity_id]
      return {
        id: e.entity_id,
        entity: e.entity_id,
        name: s.attributes.friendly_name ?? e.entity_id,
        area: e.area_id ?? deviceArea[e.device_id] ?? null,
        on: s.state === 'on',
        offline: s.state === 'unavailable',
        tree: trees.includes(e.entity_id),
      }
    })
    .filter((d) => d.area)
    .sort((a, b) => a.name.localeCompare(b.name))
}
