import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import type { MapKind } from '../game/maps'
import { touchInput, type Direction } from '../game/input'
import type { HomeScene } from '../game/HomeScene'
import type { CompanionStatus } from '../game/CompanionController'
import type { InteractionAction } from '../game/behavior'

const actions: { id: InteractionAction; label: string; icon: string }[] = [
  { id: 'talk', label: '对话', icon: '✦' },
  { id: 'follow', label: '跟随我', icon: '➜' },
  { id: 'hand', label: '牵手', icon: '♡' },
  { id: 'hug', label: '拥抱', icon: '♥' },
  { id: 'sit', label: '一起坐下', icon: '▤' },
  { id: 'sleep', label: '一起睡觉', icon: '☾' },
  { id: 'free', label: '自由活动', icon: '✿' },
]
const stateNames: Record<CompanionStatus['state'], string> = {
  IDLE: '等一会儿', WANDER: '散步中', READING: '读书中', SITTING: '坐着休息', RESTING: '休息中',
  FOLLOWING: '跟随中', HOLDING_HANDS: '牵手中', HUGGING: '拥抱中', SLEEPING: '睡觉中',
  TALKING: '聊天中', TRANSITIONING: '正在靠近',
}

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
  const sceneRef = useRef<HomeScene | null>(null)
  const [location, setLocation] = useState<MapKind>('yard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState<CompanionStatus>({ state: 'IDLE', intent: 'free' })
  const [message, setMessage] = useState('')
  useEffect(() => {
    let game: Phaser.Game | undefined
    let active = true
    let loadingTimer: number | undefined
    const started = Date.now()
    import('../game/createGame').then(({ createGame }) => {
      if (!active || !host.current) return
      game = createGame(host.current, setLocation, scene => {
        sceneRef.current = scene
        loadingTimer = window.setTimeout(() => { if (active) setLoading(false) }, Math.max(0, 650 - (Date.now() - started)))
      }, setStatus, setMessage, () => {
        setMenuOpen(true)
        sceneRef.current?.setInteractionMenuOpen(true)
      })
      if (import.meta.env.DEV) Object.assign(window, { __ourLittleHomeGame: game })
    }).catch(() => { if (active) { setError(true); setLoading(false) } })
    const clear = () => touchInput.clear()
    window.addEventListener('blur', clear)
    return () => {
      active = false
      window.removeEventListener('blur', clear)
      window.clearTimeout(loadingTimer)
      touchInput.clear()
      sceneRef.current = null
      game?.destroy(true)
      if (import.meta.env.DEV) Reflect.deleteProperty(window, '__ourLittleHomeGame')
    }
  }, [])
  const toggleMenu = () => {
    const next = !menuOpen
    setMenuOpen(next)
    sceneRef.current?.setInteractionMenuOpen(next)
  }
  const chooseAction = (action: InteractionAction) => {
    setMenuOpen(false)
    sceneRef.current?.setInteractionMenuOpen(false)
    void sceneRef.current?.requestInteraction(action)
  }
  return <main className="game-page">
    <div className="game-shell">
      <div ref={host} className="game-canvas" />
      <div className="game-hud">
        <div className="location-badge"><span className="badge-sparkle">✦</span><span>OUR LITTLE HOME</span><strong>{location === 'yard' ? '庭院' : '小屋'}</strong></div>
        <button className="hud-button" onClick={onLeave}>← 返回首页</button>
      </div>
      {(loading || error) && <div className="loading-layer"><span className="loading-house">⌂</span><span>{error ? '小世界暂时没能打开，请刷新页面重试。' : '正在打开小世界…'}</span>{!error && <span className="loading-dots" />}</div>}
      <div className="npc-indicator">门都 · {stateNames[status.state]}</div>
      <div className="game-help">{message || (location === 'yard' ? '沿石子路走向小屋门口' : '走到南侧房门回到庭院')}<span>{message ? '' : ' · WASD / 方向键移动'}</span></div>
      <button className="interact-launch" aria-expanded={menuOpen} aria-controls="interaction-menu" onClick={toggleMenu}>✦ <span>与门都互动</span></button>
      {menuOpen && <div className="interaction-menu" id="interaction-menu" role="menu" aria-label="与门都互动">
        <div className="interaction-title"><span>✦ 与门都一起</span><button onClick={toggleMenu} aria-label="关闭互动菜单">×</button></div>
        <div className="interaction-options">{actions.map(action => <button key={action.id} role="menuitem" onClick={() => chooseAction(action.id)}><span>{action.icon}</span>{action.label}</button>)}</div>
      </div>}
      <div className="touch-pad" aria-label="触控方向键">
        <TouchButton direction="up" label="↑" />
        <TouchButton direction="left" label="←" />
        <TouchButton direction="down" label="↓" />
        <TouchButton direction="right" label="→" />
      </div>
    </div>
  </main>
}
