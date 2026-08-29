import { HABIT_MAP } from '../game/habits'
import { useGame } from '../game/GameContext'

const SLOT = {
  anchor: { label: 'Anchor', cls: 'bg-amber-200 text-amber-950' },
  weather: { label: 'Weather', cls: 'bg-sky-200 text-sky-950' },
  ai: { label: 'AI priority', cls: 'bg-violet-200 text-violet-950' },
}

export default function Today() {
  const { state, doTask, setBehavior } = useGame()
  const doneCount = state.deck.filter((c) => c.done).length

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:px-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Daily deck</p>
      <h1 className="font-display text-3xl sm:text-4xl">Six tasks · {doneCount}/6</h1>
      <p className="mt-1 text-sm text-white/75">2 anchors, 2 weather-adaptive, 2 deficit priorities.</p>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-h-0 space-y-2 overflow-auto pb-2 pr-1">
          {state.deck.map((card) => {
            const habit = HABIT_MAP[card.habitId]
            if (!habit) return null
            return (
              <button
                key={card.habitId}
                type="button"
                disabled={card.done}
                onClick={() => doTask(card.habitId)}
                className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left ring-1 ring-white/10 ${
                  card.done ? 'bg-white/10 opacity-60' : 'bg-white/15 hover:bg-white/20 active:scale-[0.99]'
                }`}
              >
                <span className="min-w-0">
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${SLOT[card.slot].cls}`}>
                    {SLOT[card.slot].label}
                  </span>
                  <span className="mt-1 block text-sm font-bold sm:text-base">{habit.name}</span>
                  <span className="text-xs text-white/70">
                    {habit.resource} · {habit.tier} · +{habit.gain}%
                  </span>
                </span>
                <span className="shrink-0 text-lg">{card.done ? '✓' : '＋'}</span>
              </button>
            )
          })}
        </div>

        <div className="mb-3 shrink-0 rounded-2xl bg-black/25 p-4 text-sm ring-1 ring-white/10 lg:mb-3">
          <p className="mb-2 font-semibold">Sleep & doomscroll signals</p>
          <label className="flex items-center justify-between gap-3 py-2">
            <span>Bedtime screen (min)</span>
            <input
              type="number"
              min="0"
              max="180"
              className="w-20 rounded-lg bg-white/15 px-2 py-2 text-right"
              value={state.behavior.bedtimeScreenMins}
              onChange={(e) => setBehavior({ bedtimeScreenMins: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 py-2">
            <span>Sleep hours</span>
            <input
              type="number"
              min="0"
              max="14"
              step="0.5"
              className="w-20 rounded-lg bg-white/15 px-2 py-2 text-right"
              value={state.behavior.sleepHours}
              onChange={(e) => setBehavior({ sleepHours: Number(e.target.value) })}
            />
          </label>
          {state.behavior.bedtimeScreenMins > 45 && (
            <p className="mt-1 text-amber-200">Fertilizer decay ×1.4 from late-night scrolling.</p>
          )}
        </div>
      </div>
    </div>
  )
}
