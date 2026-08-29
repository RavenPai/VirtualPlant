import { useGame } from '../game/GameContext'
import { QUARTERS, classificationLabel } from '../game/engine'
import PlantCanvas from '../components/PlantCanvas'

export default function Yard() {
  const { state, openReplay, setScreen } = useGame()
  const year = new Date().getFullYear()
  const living = (state.yard || []).filter((t) => t.year === year)

  return (
    <div className="flex h-full flex-col px-4 pt-5 text-white">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">{year} annual yard</p>
      <h1 className="font-display text-3xl">Four seasons</h1>
      <p className="mt-1 text-sm text-white/70">Up to four retired trees. Tap one for its 90-day replay.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {QUARTERS.map((q) => {
          const tree = living.find((t) => t.quarter.id === q.id)
          return (
            <button
              key={q.id}
              type="button"
              disabled={!tree}
              onClick={() => tree && openReplay(tree)}
              className="overflow-hidden rounded-3xl bg-white/10 text-left disabled:opacity-50"
            >
              <div className="h-36">
                {tree ? (
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
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl opacity-40">🌱</div>
                )}
              </div>
              <div className="px-3 py-2">
                <div className="text-xs text-white/60">{q.id} · {q.name}</div>
                <div className="text-sm font-bold">{tree ? tree.plantName : 'Empty plot'}</div>
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

      <button type="button" className="mt-4 text-sm text-white/70 underline" onClick={() => setScreen('graveyard')}>
        Garden graveyard ({state.graveyard?.length || 0})
      </button>
    </div>
  )
}
