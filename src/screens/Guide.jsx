import { useState } from 'react'
import { PlantStage } from '../components/PlantCanvas'

const TABS = [
  { id: 'use', label: 'How to use' },
  { id: 'grow', label: 'Growth' },
  { id: 'live', label: 'Lifestyle' },
]

const STEPS = [
  { title: 'Create an account', body: 'Sign up so your season is saved in the cloud. Log in on any device to pick up the same plant.' },
  { title: 'Name it and pick two anchors', body: 'Your two anchor habits stay in every daily deck. Choose ones you can actually keep for 90 days.' },
  { title: 'Clear the six-task deck', body: 'Each day you get 2 anchors, 2 weather-aware tasks, and 2 AI picks. Completing one feeds Water, Sun, or Fertilizer.' },
  { title: 'Watch the bars, not just the tree', body: 'Resources decay every hour. If any bar hits 0, the plant struggles and HP drops. Keep all three above 50% to thrive.' },
  { title: 'Log sleep and screens', body: 'On Today, set bedtime screen minutes and sleep hours. Late scrolling and short sleep make Fertilizer decay faster, and the AI deck leans into rest habits.' },
  { title: 'Get the morning mission email', body: 'Keep “email me today’s missions” on to receive the six healthy-life tasks at 8:00 Myanmar time. You can also tap Email me today’s missions now from the plant screen.' },
  { title: 'Finish the season', body: 'After 90 days the tree retires to your Yard (or Graveyard if HP hits 0). Consistency decides Grand, Standard, or Stunted form.' },
]

const STAGES = [
  { stage: 1, days: 'Days 1–15', growth: 12, title: 'Seedling & sprout', body: 'Two first leaves, a short stem. This is the habit-building window: hydration, a walk, and a sleep routine matter more than intensity.' },
  { stage: 2, days: 'Days 16–45', growth: 40, title: 'Sapling', body: 'A trunk and first branches. Daily decks compound. Miss too many days and the canopy thins even if the calendar moves on.' },
  { stage: 3, days: 'Days 46–75', growth: 70, title: 'Maturing tree', body: 'Fuller crown. Weather tasks adapt (rain, heat, sun). Liebig growth is limited by your lowest resource — one neglected bar caps the whole tree.' },
  { stage: 4, days: 'Days 76–90', growth: 92, title: 'Season cap', body: 'Shape locks toward the outcome. Average daily health decides the final form. This is the last stretch to protect HP and consistency.' },
]

const FINALS = [
  { kind: 'grand', title: 'Grand blooming tree', rule: 'Average consistency ≥ 80%', body: 'Fruit and blossom. You kept Water, Sun, and Fertilizer high across the season — sleep, movement, and food/mind habits stayed in range.' },
  { kind: 'standard', title: 'Standard tree', rule: 'Consistency 50–79%', body: 'A solid canopy. The season was uneven but not collapsed. Room to grow next quarter.' },
  { kind: 'stunted', title: 'Stunted tree', rule: 'Consistency under 50%', body: 'Smaller trunk and sparse leaves. The plant survived, but too many empty bars or skipped decks limited growth.' },
]

const LINKS = [
  {
    resource: 'Water',
    icon: '💧',
    life: 'Hydration, caffeine cutoff, less alcohol at night',
    plant: 'Keeps stems juicy. Heat and long days drink this bar faster.',
    cls: 'from-sky-400/30 to-cyan-700/20',
  },
  {
    resource: 'Sun',
    icon: '☀️',
    life: 'Walks, steps, stretching, outdoor time, screen breaks',
    plant: 'Builds the canopy. Cloud cover and indoor days starve Sun.',
    cls: 'from-amber-300/30 to-orange-700/20',
  },
  {
    resource: 'Fertilizer',
    icon: '🌿',
    life: 'Sleep 7+, digital curfew, no doomscroll, real food, calm',
    plant: 'Feeds roots and HP. Bedtime scrolling over 45 min and sleep under 7h accelerate decay.',
    cls: 'from-lime-400/30 to-emerald-800/20',
  },
]

function MiniPlant({ stage, growth, classification = null, status = 'thriving' }) {
  return (
    <PlantStage
      className="h-44 w-full sm:h-52"
      frame={{
        status,
        stage,
        growthAccumulated: growth,
        classification,
        weatherKind: 'clear',
      }}
    />
  )
}

export default function Guide() {
  const [tab, setTab] = useState('use')

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:px-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Handbook</p>
      <h1 className="font-display text-3xl sm:text-4xl">User guide</h1>
      <p className="mt-1 text-sm text-white/75">How the 90-day plant mirrors the life you actually live.</p>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-black/25 p-1 ring-1 ring-white/10">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-11 rounded-xl text-xs font-bold sm:text-sm ${tab === item.id ? 'bg-white/20 text-white' : 'text-white/65 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto pb-4">
        {tab === 'use' && (
          <div className="grid gap-3 lg:grid-cols-2">
            {STEPS.map((step, i) => (
              <article key={step.title} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime-200/80">Step {i + 1}</p>
                <h2 className="mt-1 text-sm font-bold sm:text-base">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{step.body}</p>
              </article>
            ))}
          </div>
        )}
        {tab === 'grow' && (
          <>
            <p className="text-sm leading-relaxed text-white/75">
              Growth is calendar + care. The stage advances with day of the 90-day season. Height and leaves also follow
              accumulated growth from thriving days. Neglect never freezes the clock — it just makes a thinner tree.
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {STAGES.map((item) => (
                <article key={item.stage} className="overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <MiniPlant stage={item.stage} growth={item.growth} classification={item.stage === 4 ? 'standard' : null} />
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime-200/80">{item.days}</p>
                    <h2 className="text-sm font-bold sm:text-base">{item.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
            <h2 className="pt-1 font-display text-xl">Final forms</h2>
            <p className="text-sm text-white/70">Day 90 outcome from average daily health (consistency).</p>
            <div className="grid gap-3 lg:grid-cols-3">
              {FINALS.map((item) => (
                <article key={item.kind} className="overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <MiniPlant stage={4} growth={item.kind === 'stunted' ? 35 : item.kind === 'standard' ? 70 : 95} classification={item.kind} />
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime-200/80">{item.rule}</p>
                    <h3 className="text-sm font-bold sm:text-base">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {tab === 'live' && (
          <>
            <p className="text-sm leading-relaxed text-white/75">
              The plant is a metaphor for Liebig’s law: growth is limited by the scarcest nutrient. In this app that
              nutrient is the lifestyle pillar you skip.
            </p>
            <div className="rounded-2xl bg-black/25 px-4 py-4 ring-1 ring-white/10">
              <p className="text-center text-[10px] uppercase tracking-widest text-white/50">You live</p>
              <p className="text-center text-sm font-bold">Sleep · Move · Hydrate · Eat · Unplug</p>
              <p className="my-2 text-center text-lg text-lime-200">↓</p>
              <p className="text-center text-[10px] uppercase tracking-widest text-white/50">The plant receives</p>
              <p className="text-center text-sm font-bold">Fertilizer · Sun · Water</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
            {LINKS.map((item) => (
              <article key={item.resource} className={`rounded-2xl bg-gradient-to-br ${item.cls} px-4 py-3 ring-1 ring-white/10`}>
                <h3 className="text-sm font-bold sm:text-base">
                  {item.icon} {item.resource}
                </h3>
                <p className="mt-1 text-sm text-white/90">
                  <span className="font-bold">In life: </span>
                  {item.life}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  <span className="font-bold">In the garden: </span>
                  {item.plant}
                </p>
              </article>
            ))}
            </div>
            <article className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <h3 className="text-sm font-bold sm:text-base">Why the AI deck changes</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Task order is scored from your lowest bar plus sleep/doomscroll evidence: high bedtime screen time and
                short sleep raise digital-curfew and rest habits. Completing a task is the moment a real-world choice
                becomes plant food.
              </p>
            </article>
          </>
        )}
      </div>
    </div>
  )
}
