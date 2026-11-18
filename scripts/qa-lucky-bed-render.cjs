/* Run against `npm run dev -- --port 4180`. Inspect rendered Phaser states and retain the actual game recording. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

const url = process.env.QA_URL || 'http://localhost:4180'
const output = process.env.QA_OUTPUT || '/tmp/lucky-bed-render'
const layout = { width: 1194, height: 834 }
fs.mkdirSync(output, { recursive: true })

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  try {
    const context = await browser.newContext({
      viewport: layout, deviceScaleFactor: 2, hasTouch: true,
      recordVideo: { dir: output, size: layout },
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('requestfailed', request => errors.push(request.url() + ' ' + request.failure()?.errorText))
    await page.goto(url + '/?preview=home')
    await page.getByRole('button', { name: /进入小屋/ }).tap()
    await page.locator('.loading-layer').waitFor({ state: 'detached' })
    await page.waitForFunction(() => window.__ourLittleHomeGame?.scene.getScene('home-world')?.trio)

    const atlasIssues = await page.evaluate(() => {
      const game = window.__ourLittleHomeGame
      const scene = game.scene.getScene('home-world')
      window.bedFrames = []
      window.bedDiagnostics = []
      const required = {
        lucky: [0, 1, 2, 3, 4, 5, 6, 7, 12, ...Array.from({ length: 16 }, (_, i) => 16 + i)],
        'lucky-jump': Array.from({ length: 8 }, (_, i) => i),
        'lucky-performance': [18, 19, 21, 22, 23, 26, 28, 29, 30, 48, 49, 50, 51],
      }
      const canvas = document.createElement('canvas')
      const pixels = canvas.getContext('2d', { willReadFrequently: true })
      const issues = []
      for (const [key, frames] of Object.entries(required)) {
        if (!scene.textures.exists(key)) { issues.push('Missing ' + key); continue }
        const texture = scene.textures.get(key), source = texture.getSourceImage()
        canvas.width = source.width
        canvas.height = source.height
        pixels.drawImage(source, 0, 0)
        for (const index of frames) {
          if (!texture.has(String(index))) { issues.push('Missing ' + key + ':' + index); continue }
          const { cutX, cutY, cutWidth, cutHeight } = texture.get(index)
          if (cutWidth !== 40 || cutHeight !== 40 || cutX + cutWidth > source.width || cutY + cutHeight > source.height) {
            issues.push('Invalid cut ' + key + ':' + index)
            continue
          }
          const data = pixels.getImageData(cutX, cutY, 40, 40).data
          let fur = 0, transparent = 0
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) transparent++
            if (data[i + 3] > 200 && data[i] > 190 && data[i + 1] > 155 && data[i + 2] > 130) fur++
          }
          if (fur < 70 || transparent < 100) issues.push('Invalid Lucky artwork ' + key + ':' + index)
        }
      }

      const quiltPixels = (name, index) => {
        if (!scene.textures.exists(name)) { issues.push('Missing ' + name); return null }
        const texture = scene.textures.get(name)
        if (!texture.has(String(index))) { issues.push('Missing ' + name + ':' + index); return null }
        const source = texture.getSourceImage(), frame = texture.get(index)
        canvas.width = source.width
        canvas.height = source.height
        pixels.drawImage(source, 0, 0)
        return pixels.getImageData(frame.cutX, frame.cutY, 102, 74).data
      }
      const quiltBase = quiltPixels('fold-center', 0)
      for (let index = 0; quiltBase && index < 32; index++) {
        const fold = quiltPixels('fold-travel', index)
        if (!fold) continue
        for (let i = 0; i < fold.length; i += 4) {
          // A traveling fold can shade the original weave, without shifting it.
          const alphaChanged = quiltBase[i+3] !== fold[i+3]
          const maxChange = Math.max(
            Math.abs(quiltBase[i] - fold[i]),
            Math.abs(quiltBase[i+1] - fold[i+1]),
            Math.abs(quiltBase[i+2] - fold[i+2]),
          )
          if (alphaChanged || (quiltBase[i+3] > 0 && maxChange > 26)) {
            issues.push('Traveling fold changes the original weave or silhouette at frame ' + index)
            break
          }
        }
      }

      game.events.on('postrender', () => {
        const trio = scene.trio
        if (!trio.active) return
        const dog = scene.lucky.sprite, quilt = scene.companion.bed.quilt.center
        const phase = trio.state.phase, key = dog.texture.key, frame = Number(dog.frame.name)
        window.bedFrames.push({ phase, key, frame, x: dog.x, y: dog.y, tuck: trio.tuck, quilt: quilt.visible ? quilt.texture.key : null })
        if (['JUMP','LAND','WALK_BED','BURROW','SLEEP','LUCKY_WAKE'].includes(phase)) {
          const wrongMask = trio.burrowed ? dog.mask !== trio.bodyGeometry : !!dog.mask
          if (!required[key]?.includes(frame) || !dog.visible || dog.alpha !== 1 || wrongMask) {
            window.bedDiagnostics.push({ phase, key, frame, visible: dog.visible, alpha: dog.alpha })
          }
          if (trio.above.visible && (trio.above.texture.key !== key || Number(trio.above.frame.name) !== frame)) {
            window.bedDiagnostics.push({ phase, key, frame, badExposedFrame: true })
          }
          if (scene.children.exists(trio.frontMask) || scene.children.exists(trio.headMask) || scene.children.exists(trio.bodyMask)) {
            window.bedDiagnostics.push({ phase, maskOnDisplayList: true })
          }
        }
      })
      return issues
    })
    assert.deepEqual(atlasIssues, [])

    const choose = async name => {
      await page.getByRole('button', { name: /与门都互动/ }).tap()
      await page.getByRole('menuitem', { name }).tap()
    }
    await choose(/我们三个一起睡觉/)
    await page.locator('.game-help').filter({ hasText: '我们三个都睡着了' }).waitFor({ timeout: 60000 })
    await page.screenshot({ path: path.join(output,'three-asleep.png') })
    await choose(/三个一起起床/)
    await page.locator('.game-help').filter({ hasText: '都起床啦' }).waitFor({ timeout: 30000 })
    const { frames, diagnostics, restored } = await page.evaluate(() => {
      const scene = window.__ourLittleHomeGame.scene.getScene('home-world')
      return {
        frames: window.bedFrames, diagnostics: window.bedDiagnostics,
        restored: !scene.trio.above.visible && !scene.trio.head.visible
          && !scene.companion.bed.quilt.centerVisible && !scene.lucky.noGroundCollision
          && scene.companion.bed.state.phase('mashuo') === 'awake' && scene.companion.bed.state.phase('mendu') === 'awake',
      }
    })
    assert.deepEqual(errors, [])
    assert.deepEqual(diagnostics, [])
    assert.ok(restored, 'Temporary visual and collision state must be released')
    assert.deepEqual([...new Set(frames.map(row => row.phase))], [
      'PEOPLE_ENTER', 'LUCKY_APPROACH', 'JUMP', 'LAND', 'WALK_BED', 'BURROW', 'SLEEP', 'LUCKY_WAKE', 'PEOPLE_WAKE',
    ])
    for (const [phase, key, expected] of [
      ['LUCKY_APPROACH','lucky-jump',[0,1,2]], ['JUMP','lucky-jump',[3,4,5]],
      ['LAND','lucky-jump',[6,7]],
      ['BURROW','lucky-performance',[21,22,23,48]], ['SLEEP','lucky-performance',[49]],
      ['LUCKY_WAKE','lucky-jump',[3,4,5,6,7]],
    ]) {
      const used = new Set(frames.filter(row => row.phase === phase && row.key === key).map(row => row.frame))
      for (const index of expected) {
        if (phase === 'SLEEP') assert.ok(used.has(49) || used.has(50), 'Use a sleeping pose')
        else assert.ok(used.has(index), phase + ' never rendered ' + key + ':' + index)
      }
    }
    const walk = new Set(frames.filter(row => row.phase==='WALK_BED' && row.key==='lucky').map(row => row.frame))
    assert.ok([4,5,6,7].filter(frame=>walk.has(frame)).length >= 2, 'Lucky should cycle through leftward walking poses')
    assert.ok([0,1,2,3].some(frame=>walk.has(frame)), 'Lucky should face down while moving towards the quilt edge')
    assert.ok(walk.has(12), 'Lucky should turn towards the pillows before burrowing')
    const tuck = frames.filter(row=>row.phase === 'BURROW').map(row=>row.tuck)
    assert.ok(tuck.some(progress=>progress>0 && progress<.4) && tuck.some(progress=>progress>.55 && progress<1))
    assert.equal(tuck.at(-1),1)
    assert.ok(tuck.every((progress,i)=>i===0 || progress>=tuck[i-1]))
    const recording = page.video()
    await context.close()
    fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({ video: await recording.path(), samples: frames.length, phases: [...new Set(frames.map(row=>row.phase))] }, null, 2))
    console.log('Lucky bed atlas, rendered frames, progressive clipping and cleanup PASS (' + frames.length + ' rendered samples)')
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
