import { plantBackgroundSrc } from '../game/plantScene'
import WeatherFx from './WeatherFx'

export default function PlantStage({ frame, className, children }) {
  const src = plantBackgroundSrc(frame)
  return (
    <div className={`relative isolate min-h-0 overflow-hidden rounded-3xl bg-black/20 ring-1 ring-white/20 ${className || ''}`}>
      <img
        key={src}
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-bottom"
      />
      <WeatherFx frame={frame} />
      <div className="absolute inset-0 z-[2]">{children}</div>
    </div>
  )
}
