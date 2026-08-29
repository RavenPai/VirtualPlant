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
    <div className="flex h-full flex-col px-4 pt-5 text-white">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Daily deck</p>
      <h1 className="font-display text-3xl">Six tasks · {doneCount}/6</h1>
      <p className="mt-1 text-sm text-white/70">2 anchors, 2 weather-adaptive, 2 deficit priorities.</p>

      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pb-3">
        {state.deck.map((card) => {
          const habit = HABIT_MAP[card.habitId]
          if (!habit) return null
          return (
            <button
              key={card.habitId}
              type="button"
              disabled={card.done}
              onClick={() => doTask(card.habitId)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${
                card.done ? 'bg-white/10 opacity-55' : 'bg-white/15 active:scale-[0.99]'
              }`}
            >
              <span>
                <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${SLOT[card.slot].cls}`}>
                  {SLOT[card.slot].label}
                </span>
                <span className="mt-1 block text-sm font-bold">{habit.name}</span>
                <span className="text-xs text-white/70">
                  {habit.resource} · {habit.tier} · +{habit.gain}%
                </span>
              </span>
              <span className="text-lg">{card.done ? '✓' : '＋'}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-3 rounded-2xl bg-black/20 p-3 text-xs">
        <p className="mb-2 font-semibold">Sleep & doomscroll signals</p>
        <label className="flex items-center justify-between py-1">
          Bedtime screen (min)
          <input
            type="number"
            min="0"
            max="180"
            className="w-16 rounded-lg bg-white/10 px-2 py-1 text-right"
            value={state.behavior.bedtimeScreenMins}
            onChange={(e) => setBehavior({ bedtimeScreenMins: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between py-1">
          Sleep hours
          <input
            type="number"
            min="0"
            max="14"
            step="0.5"
            className="w-16 rounded-lg bg-white/10 px-2 py-1 text-right"
            value={state.behavior.sleepHours}
            onChange={(e) => setBehavior({ sleepHours: Number(e.target.value) })}
          />
        </label>
        {state.behavior.bedtimeScreenMins > 45 && (
          <p className="mt-1 text-amber-200">Fertilizer decay ×1.4 from late-night scrolling.</p>
        )}
      </div>
    </div>
  )
}
