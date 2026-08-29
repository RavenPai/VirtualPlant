import { useState } from 'react'
import { PlantStage } from '../components/PlantCanvas'
import ResourceBars from '../components/ResourceBars'
import { useGame } from '../game/GameContext'
import {
  classificationLabel,
  classifySeason,
  growthStage,
  plantState,
  seasonDay,
  stageLabel,
  timeOfDay,
  weatherKind,
  averageConsistency,
  dailyGrowthRate,
} from '../game/engine'
import { weatherLabel } from '../game/weather'

const STATUS_COPY = {
  thriving: 'Vibrant growth · 1.0×',
  stable: 'Steady cultivation',
  struggling: 'Growth stopped · HP decaying',
  critical: 'Needs habits now',
  dead: 'Season reset to the graveyard',
}

export default function Home() {
  const { state, setScreen, user, signOut, setNotifyMissions, emailMissions } = useGame()
  const [mailBusy, setMailBusy] = useState(false)
  const [mailNote, setMailNote] = useState('')
  const day = seasonDay(state.seasonStart)
  const stage = growthStage(day)
  const status = plantState(state.resources, state.hp)
  const cSeason = averageConsistency(state.dailySnapshots)
  const classification = day >= 76 ? classifySeason(cSeason || 60) : null
  const tod = timeOfDay()
  const kind = weatherKind(state.weather?.code ?? 0, state.weather?.tempC ?? 22)
  const growth = dailyGrowthRate(state.resources)

  async function sendMail() {
    setMailBusy(true)
    setMailNote('')
    const ok = await emailMissions()
    setMailNote(ok ? `Sent to ${user.email}` : 'Could not send yet. Resend + n8n still need a one-time setup.')
    setMailBusy(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
            Day {day}/90 · {stageLabel(stage)}
          </p>
          <h1 className="truncate font-display text-3xl text-white sm:text-4xl">{state.plantName}</h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
            {state.weather ? `${Math.round(state.weather.tempC)}° · ${weatherLabel(state.weather.code, state.weather.tempC)}` : 'Sky sync…'}
          </div>
          {user?.email && (
            <button type="button" className="text-[11px] text-white/70 underline-offset-2 hover:underline" onClick={() => signOut()}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(220px,1fr)_minmax(0,42%)] lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,24rem)] lg:grid-rows-1 lg:gap-6 lg:px-8 lg:pb-6 lg:pt-4">
        <section className="relative mx-4 mt-3 min-h-[220px] sm:mx-6 sm:min-h-0 lg:mx-0 lg:mt-0">
          <PlantStage
            className="absolute inset-0 h-full w-full"
            frame={{
              status,
              stage,
              growthAccumulated: state.growthAccumulated,
              classification,
              weatherKind: kind,
            }}
          />
        </section>

        <aside className="min-h-0 space-y-3 overflow-y-auto px-4 py-3 sm:px-6 lg:px-0 lg:py-0">
          <div className="rounded-2xl bg-white/15 px-3 py-2.5 text-sm text-white ring-1 ring-white/15">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold capitalize">{status}</span>
              <span className="tabular-nums">HP {Math.round(state.hp)}%</span>
            </div>
            <p className="mt-0.5 text-xs text-white/75">{STATUS_COPY[status]}</p>
          </div>

          <ResourceBars resources={state.resources} />

          <div className="grid grid-cols-2 gap-2 text-sm text-white">
            <div className="rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/10">
              <p className="text-xs text-white/70">Liebig growth</p>
              <div className="font-display text-xl">{growth.toFixed(1)}%/day</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/10">
              <p className="text-xs text-white/70">Consistency</p>
              <div className="font-display text-xl">{(cSeason || healthPreview(state)).toFixed(0)}%</div>
            </div>
          </div>

          {classification && (
            <p className="text-center text-sm text-lime-100">
              Late season path: {classificationLabel(classification)}
            </p>
          )}

          <button type="button" className="vp-btn" onClick={() => setScreen('today')}>
            Today’s 6-task deck
          </button>

          {user?.email && (
            <details className="rounded-2xl bg-white/15 px-3 py-2 text-sm text-white ring-1 ring-white/10">
              <summary className="cursor-pointer font-bold">
                Morning mission email
              </summary>
              <label className="mt-2 flex items-start gap-2 text-xs leading-snug text-white/85">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  checked={state.notifyMissions !== false}
                  onChange={(event) => setNotifyMissions(event.target.checked)}
                />
                <span>Email today’s healthy-life missions each morning (8:00 Myanmar time)</span>
              </label>
              <button type="button" className="vp-btn mt-2 !py-2.5 text-xs" disabled={mailBusy} onClick={sendMail}>
                {mailBusy ? 'Sending…' : 'Email me today’s missions now'}
              </button>
              {mailNote && <p className="mt-1.5 text-xs text-lime-100">{mailNote}</p>}
            </details>
          )}

          <button
            type="button"
            className="w-full rounded-xl py-2 text-center text-sm text-white/80 underline-offset-2 hover:underline"
            onClick={() => setScreen('guide')}
          >
            How the plant grows — user guide
          </button>
          <p className="text-center text-[11px] uppercase tracking-widest text-white/55">{tod} light</p>
          {user?.email && <p className="truncate text-center text-[11px] text-white/50">{user.email}</p>}
        </aside>
      </div>
    </div>
  )
}

function healthPreview(state) {
  return (state.resources.water + state.resources.sun + state.resources.fertilizer) / 3
}
