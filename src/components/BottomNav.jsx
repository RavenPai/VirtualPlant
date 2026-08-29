export default function BottomNav({ screen, setScreen }) {
  const items = [
    { id: 'home', label: 'Plant', icon: '🌳' },
    { id: 'today', label: 'Deck', icon: '✅' },
    { id: 'yard', label: 'Yard', icon: '🏡' },
    { id: 'history', label: 'Replay', icon: '🎞️' },
  ]
  return (
    <nav className="grid grid-cols-4 border-t border-white/10 bg-[#1b2a16]/90 px-2 py-2 backdrop-blur-xl">
      {items.map((item) => {
        const active = screen === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setScreen(item.id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] ${
              active ? 'bg-white/15 text-white' : 'text-white/60'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
