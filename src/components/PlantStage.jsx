import { plantBackgroundSrc } from '../game/plantScene'
import WeatherFx from './WeatherFx'

export default function PlantStage({ frame, className, children }) {
  const src = plantBackgroundSrc(frame)
  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <img
        key={src}
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-bottom"
      />
      <WeatherFx frame={frame} />
      <div className="relative z-[2] h-full w-full">{children}</div>
    </div>
  )
}
