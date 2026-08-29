import { useState } from 'react'
import { HABIT_MAP, ANCHOR_CANDIDATES } from '../game/habits'
import { useGame } from '../game/GameContext'

export default function Onboarding() {
  const { finishOnboarding, user, signOut } = useGame()
  const [name, setName] = useState('Sprout')
  const [anchors, setAnchors] = useState([])
  const [step, setStep] = useState(0)

  function toggle(id) {
    setAnchors((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id)
      if (curr.length >= 2) return [curr[1], id]
      return [...curr, id]
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,#3f6b32,#1a2a14_58%)] px-5 py-8 sm:items-center sm:px-8">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col sm:max-w-xl sm:rounded-3xl sm:border sm:border-white/15 sm:bg-black/25 sm:p-8 sm:shadow-plant">
        {step === 0 && (
          <div className="flex flex-1 flex-col justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-lime-200/80">90-day season</p>
              <h1 className="mt-3 font-display text-4xl leading-tight">Grow a tree from the life you live.</h1>
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
                Water, sun, and fertilizer decay every hour. Your habits replenish them. After 90 days, the tree
                retires to your Annual Yard.
              </p>
              {user?.email && (
                <p className="mt-3 text-xs text-white/55">
                  Signed in as {user.email}.{' '}
                  <button type="button" className="underline" onClick={() => signOut()}>
                    Use a different account
                  </button>
                </p>
              )}
            </div>
            <button type="button" className="vp-btn" onClick={() => setStep(1)}>
              Begin cultivation
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <h2 className="font-display text-3xl">Name your plant</h2>
            <input
              className="vp-input mt-6 text-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              aria-label="Plant name"
            />
            <button type="button" className="vp-btn mt-auto" onClick={() => setStep(2)} disabled={!name.trim()}>
              Choose anchors
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex min-h-0 flex-1 flex-col">
            <h2 className="font-display text-3xl">Two anchor habits</h2>
            <p className="mt-2 text-sm text-white/70">These stay in your daily 6-task deck every midnight.</p>
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {ANCHOR_CANDIDATES.map((id) => {
                const habit = HABIT_MAP[id]
                const on = anchors.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`flex min-h-14 w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${
                      on ? 'bg-lime-300 text-moss-900' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-bold">{habit.name}</span>
                      <span className="text-xs opacity-70">{habit.resource} · +{habit.gain}%</span>
                    </span>
                    <span>{on ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="vp-btn mt-4"
              disabled={anchors.length !== 2}
              onClick={() => finishOnboarding(name.trim(), anchors)}
            >
              Plant the season
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
