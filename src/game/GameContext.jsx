import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  completeTask,
  loadState,
  saveState,
  simulateTick,
  freshSeason,
} from './engine'
import { detectLocation, fetchWeather } from './weather'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, setState] = useState(() => loadState())
  const [screen, setScreen] = useState(state.onboardingComplete ? 'home' : 'onboarding')
  const [replay, setReplay] = useState(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => simulateTick(s))
    }, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadWeather() {
      try {
        const loc = state.location || (await detectLocation())
        const weather = await fetchWeather(loc.lat, loc.lon)
        if (cancelled) return
        setState((s) => simulateTick({ ...s, location: loc, weather }))
      } catch {
        if (cancelled) return
        setState((s) =>
          simulateTick({
            ...s,
            weather: s.weather || {
              tempC: 27,
              cloudCover: 35,
              code: 1,
              isDay: true,
              precipitation: 0,
              fetchedAt: Date.now(),
            },
          }),
        )
      }
    }
    loadWeather()
    const id = setInterval(loadWeather, 30 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [state.location?.lat, state.location?.lon])

  const finishOnboarding = useCallback((plantName, anchors) => {
    const next = simulateTick({
      ...freshSeason(),
      onboardingComplete: true,
      plantName,
      anchors,
    })
    setState(next)
    setScreen('home')
  }, [])

  const doTask = useCallback((habitId) => {
    setState((s) => simulateTick(completeTask(s, habitId)))
  }, [])

  const setBehavior = useCallback((behavior) => {
    setState((s) => simulateTick({ ...s, behavior: { ...s.behavior, ...behavior } }))
  }, [])

  const openReplay = useCallback((record) => {
    setReplay(record)
    setScreen('replay')
  }, [])

  const value = useMemo(
    () => ({ state, screen, setScreen, finishOnboarding, doTask, setBehavior, replay, openReplay, setReplay }),
    [state, screen, finishOnboarding, doTask, setBehavior, replay, openReplay],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
