export default function BottomNav({ screen, setScreen }) {
  const items = [
    { id: 'home', label: 'Plant', icon: '🌳' },
    { id: 'today', label: 'Deck', icon: '✅' },
    { id: 'guide', label: 'Guide', icon: '📖' },
    { id: 'yard', label: 'Yard', icon: '🏡' },
    { id: 'history', label: 'Replay', icon: '🎞️' },
  ]
  return (
    <nav
      aria-label="Main"
      className="order-2 grid shrink-0 grid-cols-5 gap-1 border-t border-white/15 bg-[#1b2a16]/95 px-1 pt-1.5 backdrop-blur-xl pb-[max(0.4rem,env(safe-area-inset-bottom))] lg:order-1 lg:flex lg:h-full lg:w-52 lg:flex-col lg:gap-1.5 lg:border-r lg:border-t-0 lg:px-3 lg:pb-6 lg:pt-[max(1.25rem,env(safe-area-inset-top))]"
    >
      <p className="mb-4 hidden px-2 font-display text-xl text-white lg:block">Virtual Plant</p>
      {items.map((item) => {
        const active = screen === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => setScreen(item.id)}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-bold sm:text-xs lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm ${
              active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-lg leading-none lg:text-xl" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
