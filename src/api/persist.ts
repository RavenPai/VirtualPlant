import { HABIT_MAP } from '../game/habits'
import { ensureSession, getSupabase } from './supabase'

function num(n: unknown) {
  return Number(n)
}

export async function persistState(state) {
  const supabase = getSupabase()
  const user = await ensureSession()
  if (!supabase || !user || !state.onboardingComplete) return

  await supabase.from('profiles').upsert({
    id: user.id,
    plant_name: state.plantName,
    anchors: state.anchors,
    location: state.location,
    behavior: state.behavior,
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

export function habitMeta(habitId: string) {
  return HABIT_MAP[habitId]
}
