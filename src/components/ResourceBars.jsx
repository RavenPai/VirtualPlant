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
          <div key={key} className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-white/90">
              <span>{meta.icon} {meta.label}</span>
              <span>{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/25">
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
