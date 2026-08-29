import { useGame } from '../game/GameContext'
import { classificationLabel } from '../game/engine'

export default function Graveyard() {
  const { state, setScreen, openReplay } = useGame()
  const rows = state.graveyard || []

  return (
    <div className="flex h-full flex-col px-4 pt-5 text-white">
      <button type="button" className="text-left text-sm text-white/70" onClick={() => setScreen('yard')}>
        ← Annual Yard
      </button>
      <h1 className="mt-2 font-display text-3xl">Garden Graveyard</h1>
      <p className="mt-1 text-sm text-white/70">Seasons that reached HP 0. A new seedling starts automatically.</p>
      <div className="mt-4 space-y-2 overflow-auto">
        {rows.length === 0 && <p className="text-sm text-white/50">No losses this year.</p>}
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => openReplay(row)}
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-left"
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
