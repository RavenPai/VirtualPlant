import { useGame } from '../game/GameContext'
import { classificationLabel } from '../game/engine'

export default function Graveyard() {
  const { state, setScreen, openReplay } = useGame()
  const rows = state.graveyard || []

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:px-8">
      <button type="button" className="min-h-11 self-start text-left text-sm text-white/80" onClick={() => setScreen('yard')}>
        ← Annual Yard
      </button>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Garden Graveyard</h1>
      <p className="mt-1 text-sm text-white/75">Seasons that reached HP 0. A new seedling starts automatically.</p>
      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pb-4">
        {rows.length === 0 && <p className="text-sm text-white/50">No losses this year.</p>}
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => openReplay(row)}
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/15"
          >
            <div className="font-bold">{row.plantName}</div>
            <div className="text-xs text-white/70">
              {row.quarter.name} {row.year} · {classificationLabel(row.classification)} · {row.cSeason.toFixed(0)}%
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
