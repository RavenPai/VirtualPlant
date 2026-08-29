import { useEffect, useMemo, useState } from 'react'
import PlantCanvas from '../components/PlantCanvas'
import PlantStage from '../components/PlantStage'
import { useGame } from '../game/GameContext'
import { classificationLabel, growthStage, timeOfDay, weatherKind } from '../game/engine'

export default function History() {
  const { state, replay, setScreen, setReplay } = useGame()
  const record = replay || {
    plantName: state.plantName,
    snapshots: state.dailySnapshots,
    classification: null,
    cSeason: 0,
    habitsCompleted: state.habitsCompleted,
    quarter: { name: 'Current season' },
    reason: 'live',
  }
  const snaps = record.snapshots || []
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(Boolean(replay))

  useEffect(() => {
    if (!playing || snaps.length < 2) return undefined
    const id = setInterval(() => {
      setIndex((i) => {
        if (i >= snaps.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 15000 / Math.max(snaps.length, 1))
    return () => clearInterval(id)
  }, [playing, snaps.length])

  const frameSnap = snaps[index] || snaps[0]
  const frame = useMemo(() => {
    if (!frameSnap) {
      return {
        status: 'thriving',
        stage: 1,
        day: 1,
        growthAccumulated: 8,
        classification: record.classification,
        weatherKind: 'clear',
        timeOfDay: timeOfDay(),
        scenicBackdrop: true,
      }
    }
    return {
      status: frameSnap.status,
      stage: frameSnap.stage || growthStage(frameSnap.day || 1),
      day: frameSnap.day,
      hp: frameSnap.hp,
      resources: frameSnap.resources,
      growthAccumulated: frameSnap.growthAccumulated,
      classification: record.classification,
      weatherKind: weatherKind(frameSnap.weather?.code ?? 0, frameSnap.weather?.tempC ?? 22),
      weather: frameSnap.weather,
      timeOfDay: frameSnap.timeOfDay || timeOfDay(),
      scenicBackdrop: true,
    }
  }, [frameSnap, record.classification])

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:px-8">
      {replay && (
        <button
          type="button"
          className="min-h-11 self-start text-left text-sm text-white/80"
          onClick={() => {
            setReplay(null)
            setScreen('yard')
          }}
        >
          ← Back
        </button>
      )}
      <h1 className="font-display text-3xl sm:text-4xl">{record.plantName} history</h1>
      <p className="text-sm text-white/75">
        {record.quarter?.name} · {snaps.length} daily snapshots
        {record.classification ? ` · ${classificationLabel(record.classification)}` : ''}
      </p>

      <div className="mt-3 grid min-h-0 flex-1 grid-rows-[minmax(240px,1fr)_minmax(0,38%)] gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,20rem)] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col">
          <PlantStage className="min-h-[240px] w-full flex-1 sm:min-h-[280px]" frame={frame}>
            <PlantCanvas className="h-full w-full" frame={frame} />
          </PlantStage>
          <input
            className="mt-3"
            type="range"
            min="0"
            max={Math.max(snaps.length - 1, 0)}
            value={index}
            onChange={(e) => {
              setPlaying(false)
              setIndex(Number(e.target.value))
            }}
            aria-label="Season day"
          />
          <div className="mt-1 flex justify-between text-xs text-white/70">
            <span>{frameSnap ? `Day ${frameSnap.day}` : 'No frames yet'}</span>
            <span>{frameSnap ? `${Math.round(frameSnap.health || 0)}% health` : ''}</span>
          </div>
          <button type="button" className="vp-btn mt-3" onClick={() => { setIndex(0); setPlaying(true) }} disabled={snaps.length < 2}>
            Watch 15s time-lapse
          </button>
        </div>

        <div className="min-h-0 overflow-auto pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Milestones</p>
          {(state.milestones || []).length === 0 && <p className="mt-2 text-sm text-white/50">Weather and recovery events will log here.</p>}
          {(state.milestones || []).slice().reverse().map((m, i) => (
            <p key={`${m.date}-${i}`} className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10">
              {m.date}: {m.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
