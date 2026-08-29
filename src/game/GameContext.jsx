import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { notifyHabitComplete } from '../api/n8n'
import { hasPython, hasSupabase } from '../api/env'
import { loadCloudState, persistState } from '../api/persist'
import { predictTasks } from '../api/python'
import {
  getCurrentUser,
  getSupabase,
  signInWithPassword,
  signOut as supabaseSignOut,
  signUpWithPassword,
} from '../api/supabase'
import { HABIT_MAP } from './habits'
import {
  clearSavedState,
  completeTask,
  createInitialState,
  loadState,
  localDateKey,
  saveState,
  simulateTick,
  freshSeason,
  timeOfDay,
} from './engine'
import { detectLocation, fetchWeather } from './weather'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!hasSupabase)
  const [state, setState] = useState(() => (hasSupabase ? createInitialState() : loadState()))
  const [screen, setScreen] = useState(() => {
    if (hasSupabase) return 'auth'
    return loadState().onboardingComplete ? 'home' : 'onboarding'
  })
  const [replay, setReplay] = useState(null)

  const applyUser = useCallback(async (nextUser) => {
    setUser(nextUser)
    if (!nextUser) {
      setState(createInitialState())
      setScreen('auth')
      return
    }
    const cloud = await loadCloudState()
    if (cloud) {
      const next = simulateTick(cloud)
      setState(next)
      saveState(next, nextUser.id)
      setScreen('home')
      return
    }
    const local = loadState(nextUser.id)
    if (local.onboardingComplete) {
      setState(local)
      setScreen('home')
      return
    }
    setState(createInitialState())
    setScreen('onboarding')
  }, [])

  useEffect(() => {
    if (!hasSupabase) return undefined
    const supabase = getSupabase()
    let cancelled = false

    getCurrentUser().then(async (current) => {
      if (cancelled) return
      await applyUser(current)
      if (!cancelled) setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      const next = session?.user && !session.user.is_anonymous ? session.user : null
      await applyUser(next)
      setAuthReady(true)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [applyUser])

  useEffect(() => {
    if (!authReady) return
    if (hasSupabase && !user) return
    saveState(state, user?.id)
    if (!state.onboardingComplete) return
    const id = setTimeout(() => {
      persistState(state)
    }, 800)
    return () => clearTimeout(id)
  }, [state, authReady, user])

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => simulateTick(s))
    }, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (hasSupabase && !user) return undefined
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
              isDay: !['night', 'dusk'].includes(timeOfDay()),
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
  }, [state.location?.lat, state.location?.lon, user])

  useEffect(() => {
    if (!hasPython || !state.onboardingComplete) return
    const today = localDateKey()
    const signature = [
      today,
      state.behavior?.bedtimeScreenMins,
      state.behavior?.sleepHours,
      (state.anchors || []).join(','),
      state.weather?.code,
    ].join('|')
    if (state.deckSource === 'python' && state.mlSig === signature) return
    if (state.deckDate === today && state.deck?.some((card) => card.done)) return
    let cancelled = false
    predictTasks({
      resources: state.resources,
      weather: state.weather,
      behavior: state.behavior,
      anchors: state.anchors,
    }).then((result) => {
      if (cancelled || !result?.deck?.length) return
      setState((s) => {
        const day = localDateKey()
        if (s.deckDate === day && s.deck?.some((card) => card.done)) return s
        return { ...s, deck: result.deck, deckDate: day, deckSource: 'python', mlSig: signature }
      })
    })
    return () => {
      cancelled = true
    }
  }, [
    state.onboardingComplete,
    state.deckDate,
    state.deckSource,
    state.mlSig,
    state.behavior?.bedtimeScreenMins,
    state.behavior?.sleepHours,
    state.anchors,
    state.weather?.code,
  ])

  const signIn = useCallback(async (email, password) => {
    return signInWithPassword(email, password)
  }, [])

  const signUp = useCallback(async (email, password) => {
    return signUpWithPassword(email, password)
  }, [])

  const signOut = useCallback(async () => {
    if (user?.id) clearSavedState(user.id)
    await supabaseSignOut()
    setUser(null)
    setState(createInitialState())
    setScreen('auth')
  }, [user])

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

  const doTask = useCallback(
    (habitId) => {
      setState((s) => {
        const next = simulateTick(completeTask(s, habitId))
        const habit = HABIT_MAP[habitId]
        notifyHabitComplete({
          habitId,
          state: {
            resources: next.resources,
            hp: next.hp,
            lastTick: next.lastTick,
            growthAccumulated: next.growthAccumulated,
            seasonStart: next.seasonStart,
          },
          log: habit
            ? {
                habit_id: habitId,
                resource: habit.resource,
                gain: habit.gain,
                user_id: user?.id,
              }
            : { habit_id: habitId, user_id: user?.id },
        })
        return next
      })
    },
    [user],
  )

  const setBehavior = useCallback((behavior) => {
    setState((s) => simulateTick({ ...s, behavior: { ...s.behavior, ...behavior } }))
  }, [])

  const openReplay = useCallback((record) => {
    setReplay(record)
    setScreen('replay')
  }, [])

  const value = useMemo(
    () => ({
      state,
      screen,
      setScreen,
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      finishOnboarding,
      doTask,
      setBehavior,
      replay,
      openReplay,
      setReplay,
    }),
    [
      state,
      screen,
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      finishOnboarding,
      doTask,
      setBehavior,
      replay,
      openReplay,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
