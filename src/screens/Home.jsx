import PlantCanvas from '../components/PlantCanvas'
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
  const { state, setScreen } = useGame()
  const day = seasonDay(state.seasonStart)
  const stage = growthStage(day)
  const status = plantState(state.resources, state.hp)
  const cSeason = averageConsistency(state.dailySnapshots)
  const classification = day >= 76 ? classifySeason(cSeason || 60) : null
  const tod = timeOfDay()
  const kind = weatherKind(state.weather?.code ?? 0, state.weather?.tempC ?? 22)
  const growth = dailyGrowthRate(state.resources)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between px-5 pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
            Day {day}/90 · {stageLabel(stage)}
          </p>
          <h1 className="font-display text-3xl text-white">{state.plantName}</h1>
        </div>
        <div className="rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
          {state.weather ? `${Math.round(state.weather.tempC)}° · ${weatherLabel(state.weather.code, state.weather.tempC)}` : 'Sky sync…'}
        </div>
      </header>

      <div className="relative mx-4 mt-3 flex-1 overflow-hidden rounded-[28px] bg-black/10 shadow-plant">
        <PlantCanvas
          className="h-full w-full"
          frame={{
            status,
            stage,
            growthAccumulated: state.growthAccumulated,
            classification,
            weatherKind: kind,
          }}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 right-3">
          <div className="rounded-2xl bg-[#14210f]/55 px-3 py-2 text-xs text-white backdrop-blur-md">
            <div className="flex justify-between">
              <span className="capitalize">{status}</span>
              <span>HP {Math.round(state.hp)}%</span>
            </div>
            <p className="mt-0.5 text-white/70">{STATUS_COPY[status]}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <ResourceBars resources={state.resources} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white">
          <div className="rounded-2xl bg-white/10 px-3 py-2.5">
            Liebig growth
            <div className="font-display text-lg">{growth.toFixed(1)}%/day</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5">
            Consistency
            <div className="font-display text-lg">{(cSeason || healthPreview(state)).toFixed(0)}%</div>
          </div>
        </div>
        {classification && (
          <p className="mt-2 text-center text-xs text-lime-100">
            Late season path: {classificationLabel(classification)}
          </p>
        )}
        <button type="button" className="vp-btn mt-3" onClick={() => setScreen('today')}>
          Today’s 6-task deck
        </button>
        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/50">{tod} light</p>
      </div>
    </div>
  )
}

function healthPreview(state) {
  return (state.resources.water + state.resources.sun + state.resources.fertilizer) / 3
}
