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
  ctx.lineWidth = 1.2
  for (let i = 0; i < 42; i++) {
    const x = ((i * 47 + t * 180) % w)
    const y = ((i * 73 + t * 420) % h)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 4, y + 14)
    ctx.stroke()
  }
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

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    function draw(ts) {
      const f = frameRef.current
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, w, h)

      const status = f.status
      const stage = f.stage
      const growth = (f.growthAccumulated || 8) / 100
      const classification = f.classification
      const sway = Math.sin(ts / 900) * 0.03
      const soilY = h * 0.82

      ctx.fillStyle = status === 'dead' || status === 'critical' ? '#5a4630' : '#6b4a2a'
      ctx.beginPath()
      ctx.ellipse(w / 2, soilY + 8, w * 0.28, 16, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = status === 'critical' || status === 'dead' ? '#7a5a32' : '#3e6b32'
      ctx.beginPath()
      ctx.ellipse(w / 2, soilY + 2, w * 0.2, 10, 0, 0, Math.PI * 2)
      ctx.fill()

      const baseX = w / 2
      const heightMul = stage === 1 ? 0.28 : stage === 2 ? 0.48 : stage === 3 ? 0.68 : 0.82
      const classMul = classification === 'stunted' ? 0.62 : classification === 'standard' ? 0.85 : 1
      const treeH = h * heightMul * (0.55 + growth * 0.55) * (status === 'dead' ? 0.7 : classMul)
      const trunkTop = soilY - treeH
      const trunkW = 6 + stage * 3.2 * classMul

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
      ctx.quadraticCurveTo(baseX + sway * 80, (soilY + trunkTop) / 2, baseX - trunkW / 3, trunkTop)
      ctx.lineTo(baseX + trunkW / 3, trunkTop)
      ctx.quadraticCurveTo(baseX - sway * 80, (soilY + trunkTop) / 2, baseX + trunkW / 2, soilY)
      ctx.closePath()
      ctx.fill()

      if (status !== 'dead' && stage >= 2) {
        ctx.strokeStyle = '#6a4024'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(baseX, trunkTop + treeH * 0.35)
        ctx.quadraticCurveTo(baseX - 40, trunkTop + treeH * 0.2, baseX - 52, trunkTop + treeH * 0.08)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(baseX, trunkTop + treeH * 0.42)
        ctx.quadraticCurveTo(baseX + 36, trunkTop + treeH * 0.25, baseX + 50, trunkTop + treeH * 0.12)
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
        const spread = (18 + stage * 14) * (0.7 + growth)
        const rx = Math.cos(a) * spread * (0.85 + (i % 5) * 0.08)
        const ry = Math.sin(a * 1.3) * spread * 0.55 - 8
        const x = baseX + rx
        const y = trunkTop + 10 + ry + wilt * 12
        leaf(ctx, x, y, 7 + (i % 4) + stage, a * 0.4 + wilt, greens[i % greens.length], status === 'dead' ? 0.35 : 0.92)
      }

      if (stage === 4 && classification === 'grand' && status !== 'dead' && status !== 'critical') {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          const x = baseX + Math.cos(a) * 28
          const y = trunkTop + 18 + Math.sin(a) * 16
          fruit(ctx, x, y, 5, i % 2 ? '#e85d4c' : '#f2c14e')
        }
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + 0.3
          leaf(ctx, baseX + Math.cos(a) * 22, trunkTop + Math.sin(a) * 12, 5, a, '#f4a6c3', 0.9)
        }
      }

      if (stage === 1) {
        ctx.fillStyle = '#7dcf5c'
        ctx.beginPath()
        ctx.ellipse(baseX - 8, soilY - 18, 5, 11, -0.5, 0, Math.PI * 2)
        ctx.ellipse(baseX + 8, soilY - 18, 5, 11, 0.5, 0, Math.PI * 2)
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

  return <canvas ref={ref} className={className} />
}
