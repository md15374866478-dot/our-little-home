import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import type { MapKind } from '../game/maps'
import { touchInput, type Direction } from '../game/input'

function TouchButton({ direction, label }: { direction: Direction; label: string }) {
  const names: Record<Direction, string> = { up: '上', down: '下', left: '左', right: '右' }
  return <button className={`pad-button pad-${direction}`} aria-label={`向${names[direction]}移动`}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchInput.press(direction) }}
    onPointerUp={() => touchInput.release(direction)}
    onPointerCancel={() => touchInput.release(direction)}
    onLostPointerCapture={() => touchInput.release(direction)}>{label}</button>
}

export function GameScreen({ onLeave }: { onLeave: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const [location, setLocation] = useState<MapKind>('yard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let game: Phaser.Game | undefined
    let active = true
    let loadingTimer: number | undefined
    const started = Date.now()
    import('../game/createGame').then(({ createGame }) => {
      if (!active || !host.current) return
      game = createGame(host.current, setLocation, () => {
        loadingTimer = window.setTimeout(() => { if (active) setLoading(false) }, Math.max(0, 650 - (Date.now() - started)))
      })
    }).catch(() => { if (active) { setError(true); setLoading(false) } })
    const clear = () => touchInput.clear()
    window.addEventListener('blur', clear)
    return () => {
      active = false
      window.removeEventListener('blur', clear)
      window.clearTimeout(loadingTimer)
      touchInput.clear()
      game?.destroy(true)
    }
  }, [])
  return <main className="game-page">
    <div className="game-shell">
      <div ref={host} className="game-canvas" />
      <div className="game-hud">
        <div className="location-badge"><span className="badge-sparkle">✦</span><span>OUR LITTLE HOME</span><strong>{location === 'yard' ? '庭院' : '小屋'}</strong></div>
        <button className="hud-button" onClick={onLeave}>← 返回首页</button>
      </div>
      {(loading || error) && <div className="loading-layer"><span className="loading-house">⌂</span><span>{error ? '小世界暂时没能打开，请刷新页面重试。' : '正在打开小世界…'}</span>{!error && <span className="loading-dots" />}</div>}
      <div className="game-help">{location === 'yard' ? '沿石子路走向小屋门口' : '走到南侧房门回到庭院'}<span> · WASD / 方向键移动</span></div>
      <div className="touch-pad" aria-label="触控方向键">
        <TouchButton direction="up" label="↑" />
        <TouchButton direction="left" label="←" />
        <TouchButton direction="down" label="↓" />
        <TouchButton direction="right" label="→" />
      </div>
    </div>
  </main>
}
