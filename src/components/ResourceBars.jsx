const META = {
  water: { label: 'Water', color: 'from-sky-400 to-cyan-600', icon: '💧' },
  sun: { label: 'Sun', color: 'from-amber-300 to-orange-500', icon: '☀️' },
  fertilizer: { label: 'Fertilizer', color: 'from-lime-400 to-emerald-700', icon: '🌿' },
}

export default function ResourceBars({ resources }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(META).map(([key, meta]) => {
        const value = Math.round(resources[key])
        return (
          <div key={key} className="rounded-2xl bg-white/15 p-2.5 ring-1 ring-white/10 backdrop-blur-md">
            <div className="mb-1.5 flex items-center justify-between gap-1 text-[11px] font-semibold text-white">
              <span className="truncate">
                {meta.icon} {meta.label}
              </span>
              <span className="tabular-nums">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full bg-gradient-to-r ${meta.color}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
