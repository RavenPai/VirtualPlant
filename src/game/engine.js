import { HABITS, HABIT_MAP } from './habits'

export const SEASON_DAYS = 90
export const STORAGE_KEY = 'virtual-plant-beta-v1'

export const BASE_DECAY = {
  water: 0.4,
  sun: 0.5,
  fertilizer: 0.3,
}

export const QUARTERS = [
  { id: 'Q1', name: 'Spring' },
  { id: 'Q2', name: 'Summer' },
  { id: 'Q3', name: 'Autumn' },
  { id: 'Q4', name: 'Winter' },
]

export function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n))
}

export function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function seasonDay(seasonStart, now = Date.now()) {
  const start = new Date(seasonStart)
  start.setHours(0, 0, 0, 0)
  const current = new Date(now)
  current.setHours(0, 0, 0, 0)
  return clamp(Math.floor((current - start) / 86400000) + 1, 1, SEASON_DAYS)
}

export function growthStage(day) {
  if (day <= 15) return 1
  if (day <= 45) return 2
  if (day <= 75) return 3
  return 4
}

export function stageLabel(stage) {
  return ['', 'Seedling & Sprout', 'Sapling', 'Maturing Tree', 'Capped Seasonal Outcome'][stage]
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

export function weatherKind(code, tempC) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return 'rain'
  if (tempC >= 30) return 'hot'
  if ([1, 2, 3, 45, 48].includes(code)) return 'cloud'
  return 'clear'
}

export function modifiers(weather, behavior) {
  const tempC = weather?.tempC ?? 22
  const cloud = weather?.cloudCover ?? 30
  const mTemp = tempC >= 32 ? 1.35 : tempC >= 28 ? 1.2 : tempC <= 4 ? 0.85 : 1
  const mCloud = cloud >= 75 ? 1.3 : cloud <= 20 ? 0.9 : 1
  const bedtime = behavior?.bedtimeScreenMins ?? 0
  const sleepHours = behavior?.sleepHours ?? 7
  const mScreen = bedtime > 45 ? 1.4 : 1
  const mSleep = sleepHours < 6 ? 1.25 : sleepHours < 7 ? 1.1 : 1
  return { mTemp, mCloud, mScreen, mSleep }
}

export function applyDecay(state, now = Date.now()) {
  const hours = Math.max(0, (now - state.lastTick) / 3600000)
  if (hours <= 0) return state
  const { mTemp, mCloud, mScreen, mSleep } = modifiers(state.weather, state.behavior)
  const next = {
    ...state,
    resources: { ...state.resources },
    lastTick: now,
  }
  next.resources.water = clamp(next.resources.water - BASE_DECAY.water * mTemp * (hours / 24) * 100)
  next.resources.sun = clamp(next.resources.sun - BASE_DECAY.sun * mCloud * (hours / 24) * 100)
  next.resources.fertilizer = clamp(
    next.resources.fertilizer - BASE_DECAY.fertilizer * mScreen * mSleep * (hours / 24) * 100,
  )
  return applyHealth(next, hours)
}

export function dailyGrowthRate(resources) {
  const { water: W, sun: S, fertilizer: F } = resources
  return ((W + S + F) / 3) * (Math.min(W, S, F) / 100)
}

export function healthOf(resources, hp) {
  return (resources.water + resources.sun + resources.fertilizer) / 3 * (hp / 100)
}

export function plantState(resources, hp) {
  if (hp <= 0) return 'dead'
  if (hp < 30) return 'critical'
  if (resources.water <= 0 || resources.sun <= 0 || resources.fertilizer <= 0) return 'struggling'
  if (resources.water > 50 && resources.sun > 50 && resources.fertilizer > 50) return 'thriving'
  return 'stable'
}

function applyHealth(state, hours) {
  const status = plantState(state.resources, state.hp)
  let hp = state.hp
  const growth = dailyGrowthRate(state.resources)
  let accumulated = state.growthAccumulated
  if (status === 'struggling' || status === 'critical') {
    hp = clamp(hp - 18 * (hours / 24))
  } else if (status === 'thriving') {
    hp = clamp(hp + 4 * (hours / 24))
    accumulated = clamp(accumulated + growth * (hours / 24))
  } else {
    accumulated = clamp(accumulated + growth * (hours / 24) * 0.7)
  }
  return { ...state, hp, growthAccumulated: accumulated }
}

export function classifySeason(cSeason) {
  if (cSeason >= 80) return 'grand'
  if (cSeason >= 50) return 'standard'
  return 'stunted'
}

export function classificationLabel(kind) {
  return {
    grand: 'Grand Blooming Tree',
    standard: 'Standard Tree',
    stunted: 'Stunted Tree',
  }[kind]
}

export function currentQuarter(date = new Date()) {
  return QUARTERS[Math.floor(date.getMonth() / 3)]
}

export function snapshotVector(state, now = Date.now()) {
  const day = seasonDay(state.seasonStart, now)
  const resources = state.resources
  return {
    day,
    date: localDateKey(new Date(now)),
    health: healthOf(resources, state.hp),
    hp: state.hp,
    resources: { ...resources },
    status: plantState(resources, state.hp),
    stage: growthStage(day),
    growthAccumulated: state.growthAccumulated,
    weather: state.weather ? { ...state.weather } : null,
    timeOfDay: timeOfDay(new Date(now)),
  }
}

function pickUnique(pool, used, count) {
  const chosen = []
  for (const habit of pool) {
    if (chosen.length >= count) break
    if (used.has(habit.id)) continue
    chosen.push(habit)
    used.add(habit.id)
  }
  return chosen
}

export function weatherTasks(weather) {
  const kind = weatherKind(weather?.code ?? 0, weather?.tempC ?? 22)
  const byWeather = HABITS.filter((h) => h.weather === kind)
  const fallback = HABITS.filter((h) => h.source.includes('Weather') || h.id === 'stretch' || h.id === 'herbal-tea')
  return [...byWeather, ...fallback]
}

export function aiPriorityTasks(resources) {
  const order = Object.entries(resources).sort((a, b) => a[1] - b[1]).map(([k]) => k)
  const ranked = []
  for (const resource of order) {
    ranked.push(
      ...HABITS.filter((h) => h.resource === resource).sort((a, b) => b.gain - a.gain),
    )
  }
  return ranked
}

export function buildDeck(state) {
  const used = new Set()
  const anchors = state.anchors.map((id) => HABIT_MAP[id]).filter(Boolean)
  anchors.forEach((h) => used.add(h.id))
  const weather = pickUnique(weatherTasks(state.weather), used, 2)
  const deficitOrder = Object.entries(state.resources)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key)
  const ai = []
  for (const resource of deficitOrder) {
    if (ai.length >= 2) break
    ai.push(
      ...pickUnique(
        HABITS.filter((h) => h.resource === resource).sort((a, b) => b.gain - a.gain),
        used,
        1,
      ),
    )
  }
  if (ai.length < 2) ai.push(...pickUnique(aiPriorityTasks(state.resources), used, 2 - ai.length))
  const cards = [
    ...anchors.map((h) => ({ habitId: h.id, slot: 'anchor', done: false })),
    ...weather.map((h) => ({ habitId: h.id, slot: 'weather', done: false })),
    ...ai.map((h) => ({ habitId: h.id, slot: 'ai', done: false })),
  ]
  return cards.slice(0, 6)
}

export function ensureDeck(state, now = Date.now()) {
  const today = localDateKey(new Date(now))
  if (state.deckDate === today && state.deck?.length === 6) return state
  const snapshots = upsertSnapshot(state.dailySnapshots, snapshotVector(state, now))
  return {
    ...state,
    deckDate: today,
    deck: buildDeck(state),
    dailySnapshots: snapshots,
  }
}

function upsertSnapshot(list, snap) {
  const next = [...(list || [])]
  const i = next.findIndex((s) => s.date === snap.date)
  if (i >= 0) next[i] = snap
  else next.push(snap)
  return next.slice(-90)
}

export function completeTask(state, habitId, now = Date.now()) {
  const habit = HABIT_MAP[habitId]
  if (!habit) return state
  const deck = state.deck.map((card) =>
    card.habitId === habitId ? { ...card, done: true } : card,
  )
  const resources = {
    ...state.resources,
    [habit.resource]: clamp(state.resources[habit.resource] + habit.gain),
  }
  const wasLow = plantState(state.resources, state.hp) !== 'thriving'
  const nowHealthy = plantState(resources, state.hp) === 'thriving' || plantState(resources, state.hp) === 'stable'
  const milestones = [...(state.milestones || [])]
  if (wasLow && nowHealthy) {
    milestones.push({
      date: localDateKey(new Date(now)),
      text: `High effort restored ${state.plantName} from wilting.`,
    })
  }
  return {
    ...state,
    deck,
    resources,
    habitsCompleted: (state.habitsCompleted || 0) + 1,
    milestones: milestones.slice(-24),
    lastTick: now,
  }
}

export function averageConsistency(snapshots) {
  if (!snapshots?.length) return 0
  const sum = snapshots.reduce((acc, s) => acc + (s.health || 0), 0)
  return sum / Math.max(snapshots.length, 1)
}

export function retireSeason(state, reason, now = Date.now()) {
  const snaps = upsertSnapshot(state.dailySnapshots, snapshotVector(state, now))
  const cSeason = averageConsistency(snaps)
  const record = {
    id: `${reason}-${now}`,
    reason,
    plantName: state.plantName,
    quarter: currentQuarter(new Date(state.seasonStart)),
    year: new Date(state.seasonStart).getFullYear(),
    classification: reason === 'dead' ? 'stunted' : classifySeason(cSeason),
    cSeason,
    habitsCompleted: state.habitsCompleted || 0,
    snapshots: snaps,
    endedAt: now,
    seasonStart: state.seasonStart,
  }
  const yard = reason === 'complete' ? [...(state.yard || []), record].slice(-12) : state.yard || []
  const graveyard = reason === 'dead' ? [...(state.graveyard || []), record].slice(-12) : state.graveyard || []
  return {
    ...freshSeason(state, now),
    yard,
    graveyard,
    plantName: state.plantName,
    anchors: state.anchors,
    location: state.location,
    weather: state.weather,
    behavior: state.behavior,
    onboardingComplete: true,
  }
}

export function maybeAdvanceSeason(state, now = Date.now()) {
  if (state.hp <= 0) return retireSeason(state, 'dead', now)
  const start = new Date(state.seasonStart)
  start.setHours(0, 0, 0, 0)
  if (now - start.getTime() >= SEASON_DAYS * 86400000) {
    return retireSeason(state, 'complete', now)
  }
  return state
}

export function freshSeason(base = {}, now = Date.now()) {
  return {
    onboardingComplete: Boolean(base.onboardingComplete),
    plantName: base.plantName || 'Sprout',
    anchors: base.anchors || [],
    location: base.location || null,
    weather: base.weather || null,
    behavior: base.behavior || { bedtimeScreenMins: 20, sleepHours: 7.5 },
    seasonStart: now,
    resources: { water: 72, sun: 68, fertilizer: 70 },
    hp: 100,
    lastTick: now,
    growthAccumulated: 8,
    habitsCompleted: 0,
    deck: [],
    deckDate: '',
    dailySnapshots: [],
    milestones: [],
    yard: base.yard || [],
    graveyard: base.graveyard || [],
  }
}

export function createInitialState() {
  return {
    ...freshSeason(),
    onboardingComplete: false,
    plantName: '',
    anchors: [],
  }
}

export function alignWeatherDeck(state) {
  if (!state.weather || !state.deck?.length) return state
  const kept = state.deck.filter((card) => card.slot !== 'weather' || card.done)
  const used = new Set(kept.map((card) => card.habitId))
  const replacements = pickUnique(weatherTasks(state.weather), used, 2)
  let i = 0
  const deck = state.deck.map((card) => {
    if (card.slot !== 'weather' || card.done) return card
    const next = replacements[i++]
    return next ? { habitId: next.id, slot: 'weather', done: false } : card
  })
  return { ...state, deck }
}

export function simulateTick(state, now = Date.now()) {
  let next = applyDecay(state, now)
  next = ensureDeck(next, now)
  next = alignWeatherDeck(next)
  next = maybeAdvanceSeason(next, now)
  if (next.hp > 0 && next.seasonStart === state.seasonStart) {
    next = ensureDeck(next, now)
    next = alignWeatherDeck(next)
  }
  return next
}

export function storageKeyFor(userId) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY
}

export function loadState(userId) {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId))
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    return simulateTick({ ...createInitialState(), ...parsed }, Date.now())
  } catch {
    return createInitialState()
  }
}

export function saveState(state, userId) {
  localStorage.setItem(storageKeyFor(userId), JSON.stringify(state))
}

export function clearSavedState(userId) {
  localStorage.removeItem(storageKeyFor(userId))
}
