import { GameProvider, useGame } from './game/GameContext'
import { hasSupabase } from './api/env'
import {
  plantState,
  seasonDay,
  timeOfDay,
  weatherKind,
} from './game/engine'
import Onboarding from './screens/Onboarding'
import Auth from './screens/Auth'
import Home from './screens/Home'
import Today from './screens/Today'
import Yard from './screens/Yard'
import Graveyard from './screens/Graveyard'
import History from './screens/History'
import Guide from './screens/Guide'
import BottomNav from './components/BottomNav'

const SKY = {
  morning: 'from-[#9ad0ff] via-[#c8e6a0] to-[#6f9b4a]',
  afternoon: 'from-[#6ec1ff] via-[#87c26a] to-[#4d7a32]',
  dusk: 'from-[#f0a36b] via-[#c46b4a] to-[#3d4a28]',
  night: 'from-[#1b2a4a] via-[#24361c] to-[#0e160c]',
}

function Shell() {
  const { state, screen, setScreen, user, authReady } = useGame()
  const tod = timeOfDay()
  const status = plantState(state.resources, state.hp)
  const raining = weatherKind(state.weather?.code ?? 0, state.weather?.tempC ?? 22) === 'rain'
  const day = seasonDay(state.seasonStart)

  if (!authReady) {
    return (
      <AppFrame>
        <div className="flex h-dvh items-center justify-center bg-[#1a2a14] px-6 text-center text-sm text-white/70">
          Restoring your garden…
        </div>
      </AppFrame>
    )
  }

  if (hasSupabase && !user) {
    return (
      <AppFrame>
        <Auth />
      </AppFrame>
    )
  }

  if (!state.onboardingComplete || screen === 'onboarding') {
    return (
      <AppFrame>
        <Onboarding />
      </AppFrame>
    )
  }

  const body = {
    home: <Home />,
    today: <Today />,
    yard: <Yard />,
    graveyard: <Graveyard />,
    history: <History />,
    replay: <History />,
    guide: <Guide />,
  }[screen] || <Home />

  const hideNav = screen === 'replay'

  return (
    <AppFrame>
      <div className={`flex h-dvh max-h-dvh flex-col bg-gradient-to-b ${SKY[tod]} ${raining ? 'brightness-95' : ''} lg:flex-row`}>
        {!hideNav && <BottomNav screen={screen === 'replay' ? 'history' : screen} setScreen={setScreen} />}
        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:order-2">
          {status === 'critical' && (
            <div className="shrink-0 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950">
              Critical — HP {Math.round(state.hp)}%. Complete habits before the season is lost.
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
        </div>
        <p className="sr-only">Season day {day}</p>
      </div>
    </AppFrame>
  )
}

function AppFrame({ children }) {
  return (
    <div className="min-h-dvh w-full bg-[#0c1209] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px]">{children}</div>
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  )
}
