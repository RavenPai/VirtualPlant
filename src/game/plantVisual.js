import { clamp, healthOf, SEASON_DAYS } from './engine'

/** Matches blender/build_virtual_plant.py */
export const PLANT_PALETTE = {
  leafHealthy: '#52B788',
  leafDry: '#E9C46A',
  fruitRipe: '#F4A261',
  fruitDead: '#6C757D',
  barkDark: '#4A2E1A',
  barkLight: '#7A5230',
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const u = clamp(t, 0, 1)
  const r = Math.round(ar + (br - ar) * u)
  const g = Math.round(ag + (bg - ag) * u)
  const bl = Math.round(ab + (bb - ab) * u)
  return `rgb(${r},${g},${bl})`
}

/** Axis A: 0 sprout → 1 full fruited tree (Blender frames 1–100). */
export function growthAxis(frame) {
  if (typeof frame.growth01 === 'number') return clamp(frame.growth01, 0, 1)
  const day = frame.day
  if (day) {
    const fromDay = (day - 1) / Math.max(1, SEASON_DAYS - 1)
    const fromAcc = (frame.growthAccumulated || 0) / 100
    return clamp(fromDay * 0.72 + fromAcc * 0.28, 0, 1)
  }
  const stage = frame.stage || 1
  return [0, 0.12, 0.38, 0.72, 1][stage] ?? 0.2
}

/**
 * Axis B: 0 healthy Soft Sage / Apricot → 1 Dry Wheat / Pewter (frames 101–150).
 * Recovery is the same mix sliding back toward 0 (frames 151–200).
 */
export function neglectAxis(frame) {
  if (typeof frame.neglect01 === 'number') return clamp(frame.neglect01, 0, 1)
  if (frame.resources && typeof frame.hp === 'number') {
    const h = healthOf(frame.resources, frame.hp)
    return clamp(1 - h / 100, 0, 1)
  }
  const status = frame.status
  if (status === 'dead') return 1
  if (status === 'critical') return 0.88
  if (status === 'struggling') return 0.62
  if (status === 'stable') return 0.22
  return 0
}

/** Blender timeline index (1–200) for PNG sequence / video scrub. */
export function blenderScrubFrame(growth01, neglect01) {
  const g = clamp(growth01, 0, 1)
  const n = clamp(neglect01, 0, 1)
  if (g < 0.995) return Math.max(1, Math.round(1 + g * 99))
  return Math.round(100 + n * 50)
}
