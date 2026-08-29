import { useEffect, useRef } from 'react'

function leaf(ctx, x, y, size, angle, color, alpha = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.38, size, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function fruit(ctx, x, y, r, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
}

function drawRain(ctx, w, h, t) {
  ctx.strokeStyle = 'rgba(210,230,255,0.45)'
  ctx.lineWidth = Math.max(1, w / 320)
  for (let i = 0; i < 42; i++) {
    const x = (i * 47 + t * 180) % w
    const y = (i * 73 + t * 420) % h
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 4, y + 14)
    ctx.stroke()
  }
}

export function PlantStage({ frame, className = '', children }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-3xl bg-black/20 ring-1 ring-white/20 ${className}`}>
      <PlantCanvas className="absolute inset-0 block h-full w-full" frame={frame} />
      {children}
    </div>
  )
}

export default function PlantCanvas({ frame, className }) {
  const ref = useRef(null)
  const frameRef = useRef(frame)
  frameRef.current = frame

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, width * dpr)
      canvas.height = Math.max(1, height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    function draw(ts) {
      const f = frameRef.current
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      if (w < 8 || h < 8) {
        raf = requestAnimationFrame(draw)
        return
      }
      ctx.clearRect(0, 0, w, h)

      const status = f.status
      const stage = f.stage
      const growth = Math.min(1, Math.max(0, (f.growthAccumulated || 8) / 100))
      const classification = f.classification
      const sway = reduceMotion ? 0 : Math.sin(ts / 900) * 0.025

      const padT = Math.max(10, h * 0.08)
      const padB = Math.max(16, h * 0.14)
      const padX = Math.max(10, w * 0.08)
      const soilY = h - padB
      const maxTreeH = Math.max(20, soilY - padT)
      const unit = Math.min(w - padX * 2, maxTreeH)

      ctx.fillStyle = 'rgba(28, 22, 12, 0.28)'
      ctx.fillRect(0, soilY + 2, w, h - soilY)

      ctx.fillStyle = status === 'dead' || status === 'critical' ? '#5a4630' : '#6b4a2a'
      ctx.beginPath()
      ctx.ellipse(w / 2, soilY + unit * 0.02, Math.min(w * 0.34, unit * 0.42), Math.max(8, unit * 0.055), 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = status === 'critical' || status === 'dead' ? '#7a5a32' : '#3e6b32'
      ctx.beginPath()
      ctx.ellipse(w / 2, soilY - unit * 0.01, Math.min(w * 0.24, unit * 0.3), Math.max(6, unit * 0.035), 0, 0, Math.PI * 2)
      ctx.fill()

      const baseX = w / 2
      const heightMul = stage === 1 ? 0.36 : stage === 2 ? 0.56 : stage === 3 ? 0.74 : 0.9
      const classMul = classification === 'stunted' ? 0.7 : classification === 'standard' ? 0.88 : 1
      const treeH = maxTreeH * heightMul * (0.62 + growth * 0.38) * classMul * (status === 'dead' ? 0.75 : 1)
      const trunkTop = soilY - treeH
      const trunkW = Math.max(4, unit * (0.03 + stage * 0.012) * classMul)
      const leafSize = Math.max(4, unit * 0.032)
      const canopy = Math.min(w / 2 - padX - leafSize, treeH * 0.5, unit * (0.16 + stage * 0.07)) * (0.78 + growth * 0.22)

      ctx.save()
      ctx.translate(baseX, soilY)
      ctx.rotate(sway)
      ctx.translate(-baseX, -soilY)

      const trunkGrad = ctx.createLinearGradient(baseX, soilY, baseX, trunkTop)
      trunkGrad.addColorStop(0, status === 'dead' ? '#6b5340' : '#6a4024')
      trunkGrad.addColorStop(1, status === 'dead' ? '#8a7358' : '#8a5a32')
      ctx.fillStyle = trunkGrad
      ctx.beginPath()
      ctx.moveTo(baseX - trunkW / 2, soilY)
      ctx.quadraticCurveTo(baseX + sway * unit * 0.25, (soilY + trunkTop) / 2, baseX - trunkW / 3, trunkTop)
      ctx.lineTo(baseX + trunkW / 3, trunkTop)
      ctx.quadraticCurveTo(baseX - sway * unit * 0.25, (soilY + trunkTop) / 2, baseX + trunkW / 2, soilY)
      ctx.closePath()
      ctx.fill()

      if (status !== 'dead' && stage >= 2) {
        ctx.strokeStyle = '#6a4024'
        ctx.lineWidth = Math.max(2, trunkW * 0.35)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(baseX, trunkTop + treeH * 0.35)
        ctx.quadraticCurveTo(baseX - canopy * 0.7, trunkTop + treeH * 0.2, baseX - canopy * 0.85, trunkTop + treeH * 0.1)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(baseX, trunkTop + treeH * 0.42)
        ctx.quadraticCurveTo(baseX + canopy * 0.65, trunkTop + treeH * 0.25, baseX + canopy * 0.82, trunkTop + treeH * 0.14)
        ctx.stroke()
      }

      const leafCount = status === 'dead' ? 2 : stage === 1 ? 6 : stage === 2 ? 16 : stage === 3 ? 28 : 38
      const density = classification === 'stunted' ? 0.45 : classification === 'standard' ? 0.75 : 1
      const n = Math.round(leafCount * density)
      const wilt = status === 'struggling' ? 0.35 : status === 'critical' ? 0.7 : 0
      const greens = status === 'critical' || status === 'dead'
        ? ['#8a7a48', '#6e6238', '#9a8a55']
        : status === 'struggling'
          ? ['#b7b04a', '#7d9a45', '#c4c25a']
          : ['#3f8a3a', '#67b54a', '#2f6d2c', '#8fd15c']

      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + sway
        const rx = Math.cos(a) * canopy * (0.85 + (i % 5) * 0.08)
        const ry = Math.sin(a * 1.3) * canopy * 0.55 - unit * 0.02
        const x = baseX + rx
        const y = trunkTop + leafSize + ry + wilt * unit * 0.04
        leaf(ctx, x, y, leafSize + (i % 4) * (unit * 0.004) + stage * (unit * 0.002), a * 0.4 + wilt, greens[i % greens.length], status === 'dead' ? 0.35 : 0.92)
      }

      if (stage === 4 && classification === 'grand' && status !== 'dead' && status !== 'critical') {
        const fruitR = Math.max(3, unit * 0.018)
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          fruit(ctx, baseX + Math.cos(a) * canopy * 0.45, trunkTop + canopy * 0.28 + Math.sin(a) * canopy * 0.28, fruitR, i % 2 ? '#e85d4c' : '#f2c14e')
        }
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + 0.3
          leaf(ctx, baseX + Math.cos(a) * canopy * 0.38, trunkTop + Math.sin(a) * canopy * 0.22, leafSize * 0.7, a, '#f4a6c3', 0.9)
        }
      }

      if (stage === 1) {
        ctx.fillStyle = '#7dcf5c'
        ctx.beginPath()
        ctx.ellipse(baseX - unit * 0.04, soilY - unit * 0.07, unit * 0.022, unit * 0.045, -0.5, 0, Math.PI * 2)
        ctx.ellipse(baseX + unit * 0.04, soilY - unit * 0.07, unit * 0.022, unit * 0.045, 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      if (f.weatherKind === 'rain') drawRain(ctx, w, h, ts / 1000)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
