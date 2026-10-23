// Seasonal look of the plot. `sky` is the daytime sky gradient [top, horizon],
// `tree` the foliage of the street tree (null = bare), `fallenLeaves` the leaves on the lawn,
// `hydrangea` the bush by the 6538 gate (null leaves / blooms = none).

// Street tree in front of the brick duplex.
export const STREET_TREE = [-8.2, 11.6]
export const SNOW = '#eef2f6'

export const SEASONS = {
  printemps: {
    label: 'Printemps',
    sky: ['#6fb4ec', '#d8edf9'],
    lawn: '#6aa84f',
    courtyard: '#72a94c',
    bed: '#6b5240',
    plant: '#5fa040',
    tree: { colors: ['#8cc66b', '#f2b8cf', '#9bd17a'], density: 1 },
    hydrangea: { leaves: '#5fa040', blooms: null },
  },
  ete: {
    label: 'Été',
    sky: ['#4f9fe6', '#cfe8fa'],
    lawn: '#55803f',
    courtyard: '#5f9440',
    bed: '#6b5240',
    plant: '#4c7f37',
    tree: { colors: ['#4f8f3a', '#5c9c44', '#467f33'], density: 1 },
    hydrangea: { leaves: '#3f7a32', blooms: '#e3eec0' },
  },
  automne: {
    label: 'Automne',
    sky: ['#6f9fd0', '#e6e4dc'],
    lawn: '#7a7a3c',
    courtyard: '#867838',
    bed: '#6e4a2c',
    plant: '#c0702a',
    tree: { colors: ['#d2691e', '#e0a030', '#b8401a', '#c85a28'], density: 0.55 },
    hydrangea: { leaves: '#5e7032', blooms: '#c9a0a0' },
    fallenLeaves: ['#d2691e', '#e0a030', '#a0401a', '#c85a28', '#8a5a2a'],
  },
  hiver: {
    label: 'Hiver',
    sky: ['#9fb6cc', '#e8edf2'],
    lawn: SNOW,
    courtyard: SNOW,
    bed: '#dfe5ec',
    plant: SNOW,
    snow: true,
    tree: null,
    hydrangea: { leaves: null, blooms: '#9a8268' },
  },
}

export const SEASON_ORDER = ['printemps', 'ete', 'automne', 'hiver']

// Middle of each season [month (0-based), day]: the date whose sun stands for a forced season.
const MID_SEASON = { hiver: [1, 4], printemps: [4, 5], ete: [7, 6], automne: [10, 6] }

// Date the sun is computed for: today in the current season, otherwise the middle of the forced
// season at the same clock time, so sunrise/sunset and the sun's height match that season.
export function seasonDate(id, now = new Date()) {
  if (id === currentSeason(now)) return now
  const [month, day] = MID_SEASON[id]
  return new Date(now.getFullYear(), month, day, now.getHours(), now.getMinutes())
}

// Astronomical seasons for the northern hemisphere (equinox / solstice dates).
export function currentSeason(date = new Date()) {
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  if (md >= 1221 || md < 320) return 'hiver'
  if (md < 621) return 'printemps'
  if (md < 922) return 'ete'
  return 'automne'
}
