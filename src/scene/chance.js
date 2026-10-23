// Deterministic randomness for the simulated neighbourhood: the same id and time slot always
// give the same answer, so schedules need no stored state.

// String → 32-bit seed.
export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

// Seed → float in [0, 1).
export function random(seed) {
  let t = (seed + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const between = (r, a, b) => a + r * (b - a)

// Hours since midnight, with minutes.
export const hourOf = (date) => date.getHours() + date.getMinutes() / 60
