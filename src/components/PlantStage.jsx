import { plantBackgroundSrc } from '../game/plantScene'

export default function PlantStage({ frame, className, children }) {
  const src = plantBackgroundSrc(frame)
  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <img
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom"
      />
      <div className="relative z-[1] h-full w-full">{children}</div>
    </div>
  )
}
