import { useEffect, useRef } from 'react'
import { sceneWeather } from '../game/plantScene'

function mulberry(seed) {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function teardrop(ctx, x, y, scale, angle) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(scale, scale)
  ctx.beginPath()
  ctx.moveTo(0, 7)
  ctx.bezierCurveTo(5.2, 3.2, 4.6, -3.4, 0, -8)
  ctx.bezierCurveTo(-4.6, -3.4, -5.2, 3.2, 0, 7)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export default function WeatherFx({ frame }) {
  const ref = useRef(null)
  const frameRef = useRef(frame)
  frameRef.current = frame

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const drops = Array.from({ length: 26 }, (_, i) => ({
      x: mulberry(i * 17 + 3),
      y: mulberry(i * 41 + 9),
      s: 0.55 + mulberry(i * 8 + 2) * 1.15,
      spd: 0.42 + mulberry(i * 23 + 5) * 0.5,
      trail: mulberry(i * 5 + 1) > 0.45,
    }))
    const flakes = Array.from({ length: 38 }, (_, i) => ({
      x: mulberry(i * 19 + 4),
      y: mulberry(i * 31 + 6),
      r: 1.6 + mulberry(i * 11 + 8) * 5.4,
      spd: 0.12 + mulberry(i * 13 + 2) * 0.22,
      drift: (mulberry(i * 7 + 4) - 0.5) * 18,
    }))

    function draw(ts) {
      const f = frameRef.current || {}
      const sky = sceneWeather(f.weatherKind)
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, w, h)
      const t = ts / 1000
      const ground = h * 0.82

      if (sky === 'rain') {
        ctx.fillStyle = 'rgba(42, 68, 86, 0.42)'
        ctx.fillRect(0, 0, w, ground)
        drops.forEach((d, i) => {
          const fall = ((d.y + t * d.spd) % 1.18) - 0.08
          const x = (d.x * w - fall * 46 + w) % w
          const y = fall * (ground + 24)
          if (y > ground) return
          if (d.trail) {
            ctx.strokeStyle = 'rgba(132, 216, 243, 0.35)'
            ctx.lineWidth = 1
            ctx.setLineDash([2, 3])
            ctx.beginPath()
            ctx.moveTo(x + 7, y - 16)
            ctx.lineTo(x + 16, y - 34)
            ctx.stroke()
            ctx.setLineDash([])
          }
          ctx.fillStyle = i % 3 === 0 ? '#9ee4f7' : '#84D8F3'
          teardrop(ctx, x, y, d.s, 0.52)
        })
      }

      if (sky === 'snow') {
        flakes.forEach((flake) => {
          const fall = ((flake.y + t * flake.spd) % 1.2) - 0.08
          const x = (flake.x * w + Math.sin(t * 0.7 + flake.x * 8) * flake.drift + w) % w
          const y = fall * (h + 16)
          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          ctx.beginPath()
          ctx.ellipse(x, y, flake.r * 0.72, flake.r, 0.15, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[1] block h-full w-full bg-transparent" />
}
