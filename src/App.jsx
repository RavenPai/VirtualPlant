import { GameProvider, useGame } from './game/GameContext'
import {
  plantState,
  seasonDay,
  timeOfDay,
  weatherKind,
} from './game/engine'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Today from './screens/Today'
import Yard from './screens/Yard'
import Graveyard from './screens/Graveyard'
import History from './screens/History'
import BottomNav from './components/BottomNav'

const SKY = {
  morning: 'from-[#9ad0ff] via-[#c8e6a0] to-[#6f9b4a]',
  afternoon: 'from-[#6ec1ff] via-[#87c26a] to-[#4d7a32]',
  dusk: 'from-[#f0a36b] via-[#c46b4a] to-[#3d4a28]',
  night: 'from-[#1b2a4a] via-[#24361c] to-[#0e160c]',
}

function Shell() {
  const { state, screen, setScreen } = useGame()
  const tod = timeOfDay()
  const status = plantState(state.resources, state.hp)
  const raining = weatherKind(state.weather?.code ?? 0, state.weather?.tempC ?? 22) === 'rain'
  const day = seasonDay(state.seasonStart)

  if (!state.onboardingComplete || screen === 'onboarding') {
    return (
      <Phone>
        <Onboarding />
      </Phone>
    )
  }

  const body = {
    home: <Home />,
    today: <Today />,
    yard: <Yard />,
    graveyard: <Graveyard />,
    history: <History />,
    replay: <History />,
  }[screen] || <Home />

  return (
    <Phone>
      <div className={`flex h-full flex-col bg-gradient-to-b ${SKY[tod]} ${raining ? 'brightness-90' : ''}`}>
        {status === 'critical' && (
          <div className="bg-amber-500 px-4 py-2 text-center text-xs font-bold text-amber-950">
            Critical — HP {Math.round(state.hp)}%. Complete habits before the season is lost.
          </div>
        )}
        <div className="min-h-0 flex-1">{body}</div>
        {screen !== 'replay' && screen !== 'graveyard' && (
          <BottomNav screen={screen === 'replay' ? 'history' : screen} setScreen={setScreen} />
        )}
        <p className="sr-only">Season day {day}</p>
      </div>
    </Phone>
  )
}

function Phone({ children }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0c1209] p-3">
      <div className="relative h-[min(844px,100dvh)] w-full max-w-[390px] overflow-hidden rounded-[32px] border border-white/10 shadow-plant">
        {children}
      </div>
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
