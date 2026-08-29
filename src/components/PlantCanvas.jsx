import { useEffect, useRef } from 'react'
import { growthAxis, mixHex, neglectAxis, PLANT_PALETTE } from '../game/plantVisual'

function mulberry(seed) {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function ovateLeaf(ctx, x, y, len, angle, color, wilt, shade) {
  const w = len * 0.38
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle + wilt * 0.45)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(w, len * 0.18, w * 1.05, len * 0.55, 0, len)
  ctx.bezierCurveTo(-w * 1.05, len * 0.55, -w, len * 0.18, 0, 0)
  ctx.fillStyle = shade
  ctx.fill()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.88
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(20,40,18,0.18)'
  ctx.lineWidth = Math.max(0.6, len * 0.04)
  ctx.beginPath()
  ctx.moveTo(0, len * 0.08)
  ctx.quadraticCurveTo(w * 0.08, len * 0.5, 0, len * 0.92)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.beginPath()
  ctx.ellipse(-w * 0.22, len * 0.32, w * 0.18, len * 0.16, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function fruit(ctx, x, y, r, color, shrivel) {
  const s = r * (1 - shrivel * 0.28)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, 1 - shrivel * 0.12)
  const g = ctx.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, 0, s)
  g.addColorStop(0, 'rgba(255,255,255,0.45)')
  g.addColorStop(0.35, color)
  g.addColorStop(1, 'rgba(40,28,22,0.45)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(90,60,30,0.55)'
  ctx.fillRect(-0.8, -s - 3, 1.6, 4)
  ctx.restore()
}

function drawRain(ctx, w, h, t) {
  ctx.strokeStyle = 'rgba(210,230,255,0.4)'
  ctx.lineWidth = 1.1
  for (let i = 0; i < 42; i++) {
    const x = (i * 47 + t * 180) % w
    const y = (i * 73 + t * 420) % h
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 4, y + 14)
    ctx.stroke()
  }
}

function canopyLeaves(growth, neglect) {
  const sage = mixHex(PLANT_PALETTE.leafHealthy, PLANT_PALETTE.leafDry, neglect)
  const sageBack = mixHex(sage, '#2d5a3a', 0.35)
  const count = Math.round(4 + growth * 52)
  const leaves = []
  for (let i = 0; i < count; i++) {
    const u = mulberry(i * 97 + 11)
    const v = mulberry(i * 53 + 29)
    const ring = mulberry(i * 17 + 4)
    leaves.push({
      u,
      v,
      ring,
      len: 11 + u * 10 + growth * 6,
      ang: (v - 0.5) * 2.4,
      back: ring < 0.4,
    })
  }
  return { sage, sageBack, leaves }
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
      const f = frameRef.current || {}
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, w, h)

      const growth = growthAxis(f)
      const neglect = neglectAxis(f)
      const classification = f.classification
      const classMul = classification === 'stunted' ? 0.62 : classification === 'standard' ? 0.85 : 1
      const sway = Math.sin(ts / 900) * 0.028
      const soilY = h * 0.86
      const baseX = w / 2
      const dead = f.status === 'dead'
      const wilt = neglect * 0.7

      const treeH = h * (0.16 + growth * 0.62) * (dead ? 0.72 : classMul)
      const trunkTop = soilY - treeH
      const trunkW = 5 + growth * 14 * classMul

      ctx.fillStyle = 'rgba(18, 22, 14, 0.28)'
      ctx.beginPath()
      ctx.ellipse(baseX, soilY + 10, 42 + growth * 28, 9, 0, 0, Math.PI * 2)
      ctx.fill()

      const soil = ctx.createRadialGradient(baseX, soilY, 4, baseX, soilY, 70)
      soil.addColorStop(0, neglect > 0.6 ? '#6a5330' : '#5c3a22')
      soil.addColorStop(1, 'rgba(60,40,24,0)')
      ctx.fillStyle = soil
      ctx.beginPath()
      ctx.ellipse(baseX, soilY + 4, 48, 11, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = neglect > 0.55 ? '#8a6a38' : '#3f6b32'
      ctx.beginPath()
      ctx.ellipse(baseX, soilY + 1, 22 + growth * 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.translate(baseX, soilY)
      ctx.rotate(sway)
      ctx.translate(-baseX, -soilY)

      const bark = ctx.createLinearGradient(baseX - trunkW, soilY, baseX + trunkW, trunkTop)
      bark.addColorStop(0, PLANT_PALETTE.barkDark)
      bark.addColorStop(0.5, PLANT_PALETTE.barkLight)
      bark.addColorStop(1, mixHex(PLANT_PALETTE.barkLight, '#c4a574', 0.15))
      ctx.fillStyle = bark
      ctx.beginPath()
      ctx.moveTo(baseX - trunkW * 0.55, soilY)
      ctx.quadraticCurveTo(baseX + sway * 40, (soilY + trunkTop) / 2, baseX - trunkW * 0.28, trunkTop)
      ctx.lineTo(baseX + trunkW * 0.28, trunkTop)
      ctx.quadraticCurveTo(baseX - sway * 40, (soilY + trunkTop) / 2, baseX + trunkW * 0.55, soilY)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = 'rgba(30,16,8,0.28)'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const x = baseX - trunkW * 0.2 + i * 2.2
        ctx.beginPath()
        ctx.moveTo(x, soilY - 4)
        ctx.quadraticCurveTo(x + 1.5, (soilY + trunkTop) / 2, x - 1, trunkTop + 8)
        ctx.stroke()
      }

      const branchAlpha = Math.max(0, (growth - 0.22) / 0.35)
      if (branchAlpha > 0.02 && !dead) {
        ctx.globalAlpha = Math.min(1, branchAlpha)
        ctx.strokeStyle = PLANT_PALETTE.barkDark
        ctx.lineCap = 'round'
        const arms = [
          [-1, 0.38, 0.22],
          [1, 0.42, 0.24],
          [-1, 0.62, 0.18],
          [1, 0.68, 0.17],
          [0.15, 0.82, 0.14],
        ]
        arms.forEach(([side, along, reach], i) => {
          ctx.lineWidth = 2.2 + growth * 2 - i * 0.25
          const y0 = soilY - treeH * along
          ctx.beginPath()
          ctx.moveTo(baseX, y0)
          ctx.quadraticCurveTo(
            baseX + side * 18,
            y0 - 16,
            baseX + side * (28 + growth * 36) * reach * 4,
            y0 - 22 - growth * 18,
          )
          ctx.stroke()
        })
        ctx.globalAlpha = 1
      }

      const { sage, sageBack, leaves } = canopyLeaves(growth, neglect)
      const canopyY = trunkTop + 8
      const spread = 16 + growth * 48
      const canopyOn = growth > 0.08

      if (canopyOn) {
        leaves.forEach((leaf, i) => {
          if (growth < 0.28 && i > 3) return
          if (growth < 0.55 && i > 18) return
          const ox = (leaf.u - 0.5) * spread * 2
          const oy = (leaf.v - 0.5) * spread * 0.9 + leaf.ring * 8
          ovateLeaf(
            ctx,
            baseX + ox,
            canopyY + oy + wilt * 10,
            leaf.len,
            leaf.ang + wilt * 0.3,
            leaf.back ? sageBack : sage,
            wilt,
            leaf.back ? 'rgba(30,50,28,0.35)' : 'rgba(20,40,18,0.12)',
          )
        })
      }

      if (growth < 0.22) {
        ovateLeaf(ctx, baseX - 16, soilY - 22 - growth * 20, 16, -0.7, sage, wilt * 0.2, 'rgba(20,40,18,0.12)')
        ovateLeaf(ctx, baseX + 16, soilY - 22 - growth * 20, 16, 0.7, sage, wilt * 0.2, 'rgba(20,40,18,0.12)')
      }

      const fruitT = Math.max(0, (growth - 0.82) / 0.18)
      if (fruitT > 0 && f.status !== 'dead') {
        const ripe = mixHex(PLANT_PALETTE.fruitRipe, PLANT_PALETTE.fruitDead, neglect)
        const spots = [
          [-0.42, 0.22],
          [0.4, 0.18],
          [-0.18, 0.02],
          [0.22, -0.06],
          [0.02, 0.28],
          [-0.32, -0.12],
          [0.48, 0.08],
          [-0.08, 0.38],
        ]
        spots.forEach(([dx, dy], i) => {
          if (i / spots.length > fruitT) return
          fruit(ctx, baseX + dx * spread * 1.4, canopyY + dy * spread + wilt * 6, 6 + growth, ripe, neglect)
        })
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
