import { useGame } from '../game/GameContext'
import { QUARTERS, classificationLabel } from '../game/engine'
import PlantCanvas from '../components/PlantCanvas'
import PlantStage from '../components/PlantStage'

export default function Yard() {
  const { state, openReplay, setScreen } = useGame()
  const year = new Date().getFullYear()
  const living = (state.yard || []).filter((t) => t.year === year)

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:px-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">{year} annual yard</p>
      <h1 className="font-display text-3xl sm:text-4xl">Four seasons</h1>
      <p className="mt-1 text-sm text-white/75">Up to four retired trees. Tap one for its 90-day replay.</p>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-auto pb-4 lg:grid-cols-4">
        {QUARTERS.map((q) => {
          const tree = living.find((t) => t.quarter.id === q.id)
          return (
            <button
              key={q.id}
              type="button"
              disabled={!tree}
              onClick={() => tree && openReplay(tree)}
              className="flex flex-col overflow-hidden rounded-3xl bg-white/10 text-left ring-1 ring-white/15 disabled:opacity-50"
            >
              {tree ? (
                <PlantStage
                  className="h-40 w-full sm:h-48 lg:h-56"
                  frame={{
                    weatherKind: q.id === 'Q4' ? 'snow' : q.id === 'Q3' ? 'rain' : 'clear',
                    timeOfDay: q.id === 'Q4' ? 'night' : 'afternoon',
                  }}
                >
                  <PlantCanvas
                    className="h-full w-full"
                    frame={{
                      status: 'thriving',
                      stage: 4,
                      day: 90,
                      growthAccumulated: 90,
                      growth01: 1,
                      neglect01: tree.classification === 'stunted' ? 0.55 : tree.classification === 'standard' ? 0.2 : 0,
                      classification: tree.classification,
                      scenicBackdrop: true,
                    }}
                  />
                </PlantStage>
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-black/20 text-sm text-white/55 sm:h-48 lg:h-56">
                  Empty plot
                </div>
              )}
              <div className="px-3 py-2">
                <div className="text-xs text-white/60">{q.id} · {q.name}</div>
                <div className="text-sm font-bold">{tree ? tree.plantName : 'Waiting'}</div>
                {tree && (
                  <div className="text-[11px] text-lime-100">
                    {classificationLabel(tree.classification)} · {tree.cSeason.toFixed(0)}%
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button type="button" className="mb-3 min-h-11 text-left text-sm text-white/80 underline" onClick={() => setScreen('graveyard')}>
        Garden graveyard ({state.graveyard?.length || 0})
      </button>
    </div>
  )
}
