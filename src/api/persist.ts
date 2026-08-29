import { HABIT_MAP } from '../game/habits'
import { getCurrentUser, getSupabase } from './supabase'

function num(n) {
  return Number(n)
}

function mapSnapshot(row) {
  return {
    day: row.day,
    date: row.snapshot_date,
    health: num(row.health),
    hp: num(row.hp),
    resources: row.resources,
    status: row.plant_status,
    stage: row.stage,
    growthAccumulated: num(row.growth_accumulated),
    weather: row.weather,
    timeOfDay: row.time_of_day,
  }
}

function mapArchive(row) {
  return {
    id: row.id,
    reason: row.reason,
    plantName: row.plant_name,
    quarter: { id: row.quarter_id, name: row.quarter_name },
    year: row.year,
    classification: row.classification,
    cSeason: num(row.c_season),
    habitsCompleted: row.habits_completed,
    snapshots: row.snapshots || [],
    endedAt: new Date(row.ended_at).getTime(),
    seasonStart: new Date(row.season_start).getTime(),
  }
}

export async function persistState(state) {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  if (!supabase || !user || !state.onboardingComplete) return

  await supabase.from('profiles').upsert({
    id: user.id,
    plant_name: state.plantName,
    anchors: state.anchors,
    location: state.location,
    behavior: state.behavior,
    email: user.email || null,
    notify_missions: state.notifyMissions !== false,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  })

  const { data: existing } = await supabase
    .from('seasons')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const seasonRow = {
    user_id: user.id,
    season_start: new Date(state.seasonStart).toISOString(),
    water: state.resources.water,
    sun: state.resources.sun,
    fertilizer: state.resources.fertilizer,
    hp: state.hp,
    growth_accumulated: state.growthAccumulated,
    habits_completed: state.habitsCompleted || 0,
    last_tick: new Date(state.lastTick).toISOString(),
    deck: state.deck,
    deck_date: state.deckDate,
    weather: state.weather,
    status: 'active',
    updated_at: new Date().toISOString(),
  }

  let seasonId = existing?.id
  if (seasonId) {
    await supabase.from('seasons').update(seasonRow).eq('id', seasonId)
  } else {
    const { data } = await supabase.from('seasons').insert(seasonRow).select('id').single()
    seasonId = data?.id
  }

  if (seasonId && state.dailySnapshots?.length) {
    const rows = state.dailySnapshots.map((s) => ({
      season_id: seasonId,
      user_id: user.id,
      day: s.day,
      snapshot_date: s.date,
      health: s.health,
      hp: s.hp,
      resources: s.resources,
      plant_status: s.status,
      stage: s.stage,
      growth_accumulated: s.growthAccumulated,
      weather: s.weather,
      time_of_day: s.timeOfDay,
    }))
    await supabase.from('daily_snapshots').upsert(rows, { onConflict: 'season_id,snapshot_date' })
  }
}

export async function loadCloudState() {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  if (!supabase || !user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile?.onboarding_complete) return null

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const { data: snapRows } = season
    ? await supabase.from('daily_snapshots').select('*').eq('season_id', season.id).order('snapshot_date')
    : { data: [] }

  const { data: archives } = await supabase.from('archived_trees').select('*').eq('user_id', user.id)

  const extras = {
    onboardingComplete: true,
    plantName: profile.plant_name,
    anchors: profile.anchors || [],
    location: profile.location,
    behavior: profile.behavior || { bedtimeScreenMins: 20, sleepHours: 7.5 },
    notifyMissions: profile.notify_missions !== false,
    dailySnapshots: (snapRows || []).map(mapSnapshot),
    yard: (archives || []).filter((r) => r.kind === 'yard').map(mapArchive),
    graveyard: (archives || []).filter((r) => r.kind === 'graveyard').map(mapArchive),
    milestones: [],
  }

  if (!season) return extras
  return seasonFromRow(season, extras)
}

export function seasonFromRow(row, extras) {
  return {
    ...extras,
    seasonStart: new Date(row.season_start).getTime(),
    resources: {
      water: num(row.water),
      sun: num(row.sun),
      fertilizer: num(row.fertilizer),
    },
    hp: num(row.hp),
    lastTick: new Date(row.last_tick).getTime(),
    growthAccumulated: num(row.growth_accumulated),
    habitsCompleted: row.habits_completed,
    deck: row.deck || [],
    deckDate: row.deck_date || '',
    weather: row.weather,
  }
}

export function habitMeta(habitId) {
  return HABIT_MAP[habitId]
}
