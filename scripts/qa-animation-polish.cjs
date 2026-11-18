/* Capture the everyday game flow at normal speed. The review player provides slow motion. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { chromium } = require('playwright')

const output = process.env.QA_OUTPUT || '/tmp/animation-polish-review'
const url = process.env.QA_URL || 'http://localhost:4180'
fs.mkdirSync(output, { recursive: true })

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
  const context = await browser.newContext({
    viewport: { width: 1194, height: 834 }, deviceScaleFactor: 2, hasTouch: true,
    recordVideo: { dir: output, size: { width: 1194, height: 834 } },
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(url + '/?preview=home')
    await page.getByRole('button', { name: /进入小屋/ }).click()
    await page.locator('.loading-layer').waitFor({ state: 'detached' })
    await page.waitForFunction(() => window.__ourLittleHomeGame?.scene.getScene('home-world')?.trio)
    const wait = (selector, target) => page.waitForFunction(
      ({ selector, target }) => {
        const scene = window.__ourLittleHomeGame.scene.getScene('home-world')
        if (selector === 'trio') return scene.trio.state.phase === target
        if (selector === 'pet') return scene.petDirector.phase === target
        return scene.companion.bed.state.phase(selector) === target
      }, { selector, target }, { timeout: 60000 },
    )
    const shot = name => page.screenshot({ path: output + '/' + name + '.png' })
    const pick = async (button, action) => {
      await page.getByRole('button', { name: button }).click()
      await page.getByRole('menuitem', { name: action }).click()
    }
    const human = action => pick(/与门都互动/, action)
    const pet = action => pick(/与 Lucky 互动/, action)
    const timeline = []
    const checkpoint = async name => timeline.push({
      name, time: await page.evaluate(() => performance.now() / 1000),
    })
    await checkpoint('独立上床与起床')
    await human(/马硕先睡/)
    await wait('mashuo', 'uncovering')
    await page.waitForFunction(() => {
      const bed = window.__ourLittleHomeGame.scene.getScene('home-world').companion.bed
      return bed.folds.mashuo >= .5
    })
    await shot('side-fold')
    await wait('mashuo', 'asleep')
    await wait('mendu', 'awake')
    await human(/门都先睡/)
    await wait('mendu', 'asleep')
    await wait('mashuo', 'asleep')
    await shot('two-asleep')
    await human(/马硕起床/)
    await wait('mashuo', 'awake')
    await wait('mendu', 'asleep')
    await shot('independent-wake')
    await human(/门都起床/)
    await wait('mendu', 'awake')

    await checkpoint('三人睡眠与起床')
    await human(/我们三个一起睡觉/)
    await wait('trio', 'JUMP')
    await shot('lucky-jump')
    await wait('trio', 'BURROW')
    await shot('lucky-burrow')
    await wait('trio', 'SLEEP')
    await page.waitForTimeout(1200)
    await shot('three-asleep')
    await human(/三个一起起床/)
    await wait('trio', 'IDLE')
    await wait('mashuo', 'awake')
    await wait('mendu', 'awake')
    await shot('three-awake')

    assert.deepEqual(errors, [])
    const video = page.video()
    await context.close()
    fs.writeFileSync(output + '/result.json', JSON.stringify({ timeline, video: await video.path(), errors }, null, 2))
    console.log('Independent sleep, both quilts, separate wake, three-person sleep and wake passed.', output)
  } finally {
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
