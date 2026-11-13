import { useEffect, useState } from 'react'
import { HousePreview } from './components/HousePreview'
import { GameScreen } from './components/GameScreen'
import { getEnvironment, phaseNames, seasonNames, weatherNames } from './game/environment'

export default function App() {
  const [environment, setEnvironment] = useState(getEnvironment)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setEnvironment(getEnvironment()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  if (entered) return <GameScreen onLeave={() => setEntered(false)} />
  return <main className="landing">
    <div className="landing-grain" />
    <header className="site-header">
      <div className="brand-mark"><span className="brand-icon">⌂</span><span>OUR LITTLE HOME</span></div>
      <div className="header-note"><span className="live-dot" /> 一座正在呼吸的小世界</div>
    </header>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow"><span>✦</span> A PLACE TO COME BACK TO <span>✦</span></div>
        <h1 id="hero-title">Our Little<br /><em>Home</em><span className="title-star">✳</span></h1>
        <p className="subtitle">A little world, just for us.</p>
        <p className="intro">推开院门，沿着石子路慢慢走。<br />这里有一盏灯、一棵树，和属于我们的日常。</p>
        <button className="enter-button" onClick={() => setEntered(true)}><span className="button-icon">⌂</span>进入小屋<span className="button-arrow">↗</span></button>
        <div className="control-hint"><span className="keycap">W</span><span className="keycap">A</span><span className="keycap">S</span><span className="keycap">D</span><span className="hint-text">或方向键漫步 · 手机可触控</span></div>
      </div>
      <div className="preview-column">
        <div className="preview-header"><span>✳&nbsp; THE LITTLE HOUSE</span><span>01 / OUR WORLD</span></div>
        <div className="preview-frame"><HousePreview environment={environment} /><span className="frame-corner corner-tl" /><span className="frame-corner corner-tr" /><span className="frame-corner corner-bl" /><span className="frame-corner corner-br" /></div>
        <div className="preview-caption"><span><i className="status-dot" /> 北京时间 · {phaseNames[environment.phase]}</span><span>{seasonNames[environment.season]} / {weatherNames[environment.weather]}</span></div>
      </div>
    </section>
    <footer className="landing-footer"><span>✿ &nbsp; 每一段散步，都从这里开始。</span><span>MADE FOR THE LITTLE MOMENTS <span className="footer-sun">✳</span></span></footer>
  </main>
}
