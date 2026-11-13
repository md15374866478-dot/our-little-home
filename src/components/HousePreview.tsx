import { useEffect, useRef } from 'react'
import { outdoorPalette, type Environment } from '../game/environment'

const W = 320, H = 194
function paint(c: CanvasRenderingContext2D, env: Environment, t: number) {
  const p = outdoorPalette(env)
  const night = env.phase === 'night'
  const dusk = env.phase === 'dusk'
  const sky = night ? '#34465a' : dusk ? '#e5ad82' : env.phase === 'morning' ? '#f0d6ab' : '#b8d4c7'
  const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h) }
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`
  c.clearRect(0, 0, W, H)
  r(0, 0, W, 112, sky)
  if (night) {
    for (let i = 0; i < 30; i++) {
      const x = (i * 73 + 19) % W, y = (i * 37 + 11) % 85
      if ((i + Math.floor(t / 800)) % 5 !== 0) r(x, y, i % 4 ? 1 : 2, 1, '#f6e8c5')
    }
    r(248, 19, 13, 13, '#f5e7bb'); r(245, 18, 7, 12, sky)
  } else {
    r(248, 17, 20, 20, dusk ? '#f6d490' : '#f8e9b6')
    r(247, 21, 22, 12, dusk ? '#f7cb85' : '#f8e9b6')
  }
  const drift = Math.floor((t / 70) % 360)
  for (const [bx, by] of [[20, 25], [173, 39]]) {
    const x = (bx + drift) % 370 - 30
    r(x, by + 8, 38, 7, night ? '#71808a' : '#f6e9d1')
    r(x + 7, by + 4, 22, 12, night ? '#71808a' : '#f6e9d1')
  }
  r(0, 105, W, 89, hex(p.grass2))
  r(0, 120, W, 74, hex(p.grass))
  for (let i = 0; i < 95; i++) {
    const x = (i * 67 + 13) % 320, y = 124 + ((i * 43) % 67)
    r(x, y, 2, 2, i % 7 === 0 ? hex(p.flower) : '#a8b681')
  }
  // Curving path and fence.
  r(147, 151, 29, 43, '#d7c5a2'); r(143, 166, 37, 28, '#cbb996')
  for (let i = 0; i < 11; i++) r(148 + i * 3, 155 + (i * 7) % 35, 3, 2, '#b7a887')
  for (let x = 9; x < 311; x += 12) {
    if (x >= 137 && x <= 179) continue
    r(x, 151, 7, 25, '#9b754e'); r(x + 1, 149, 5, 3, '#d3ae7b')
  }
  r(9, 159, 128, 4, '#be966b'); r(179, 159, 131, 4, '#be966b')
  r(9, 170, 128, 4, '#be966b'); r(179, 170, 131, 4, '#be966b')
  // House silhouette, layered roof and timber walls.
  r(68, 71, 184, 83, '#684c3d')
  r(72, 77, 176, 77, '#f0ddb4')
  for (let x = 78; x < 250; x += 19) r(x, 99, 2, 54, '#dfc99f')
  r(59, 68, 202, 15, '#684b3e'); r(65, 54, 190, 19, '#8f624d')
  r(74, 43, 172, 13, '#a67555'); r(88, 34, 144, 10, '#b8845c')
  for (let x = 77; x < 246; x += 19) r(x, 61, 14, 4, '#c48d62')
  r(59, 83, 202, 4, '#6a4b3d')
  for (const x of [86, 198]) {
    r(x, 98, 39, 40, '#70513d')
    r(x + 4, 101, 31, 32, night || dusk ? '#f7cf7f' : '#9dc6bf')
    r(x + 18, 101, 4, 32, '#f3e0b6')
    r(x + 4, 115, 31, 4, '#f3e0b6')
    r(x - 3, 136, 45, 5, '#ad7a52')
  }
  r(143, 105, 34, 49, '#694b3b'); r(147, 109, 27, 45, '#a6764f')
  r(168, 132, 4, 4, '#f3d080')
  r(137, 153, 46, 8, '#a37c56'); r(142, 161, 36, 5, '#d6b082')
  // Tree and bench frame the path.
  r(29, 133, 9, 30, '#75543e')
  r(18, 119, 31, 24, hex(p.leaf))
  r(22, 106, 29, 28, hex(p.leaf))
  r(29, 99, 19, 26, hex(p.leaf))
  r(22, 133, 4, 4, '#b9bc78'); r(44, 117, 4, 4, '#b9bc78')
  r(266, 143, 34, 6, '#77543d'); r(267, 145, 32, 4, '#d1a374')
  r(270, 151, 3, 8, '#71503a'); r(294, 151, 3, 8, '#71503a')
  // Smoke rises softly from the chimney.
  r(204, 31, 16, 14, '#77513e')
  for (let i = 0; i < 3; i++) {
    const rise = Math.floor((t / 120 + i * 10) % 30)
    r(207 + i * 3 + Math.floor(rise / 8), 28 - rise, 5 + i * 2, 3, night ? '#9cabb0' : '#f7ead4')
  }
  if (env.weather === 'rainy') for (let i = 0; i < 45; i++) {
    const x = (i * 71 + Math.floor(t / 15)) % W
    const y = (i * 53 + Math.floor(t / 8)) % H
    r(x, y, 1, 4, '#dce9d8')
  }
  // Tiny foreground blossoms.
  for (const [x, y] of [[62, 174], [78, 183], [247, 177], [262, 186]]) {
    r(x, y, 5, 5, hex(p.flower)); r(x + 2, y + 2, 2, 2, '#f6dc90')
  }
}

export function HousePreview({ environment }: { environment: Environment }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = ref.current?.getContext('2d')
    if (!context) return
    let frame = 0
    let last = 0
    const draw = (time: number) => {
      if (time - last > 70) { paint(context, environment, time); last = time }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [environment])
  return <canvas ref={ref} width={W} height={H} className="house-preview" aria-label="随北京时间和季节变化的像素小屋庭院" role="img" />
}
