// Capture the actual Phaser Text canvases, without changing font, resolution,
// strokes, spacing, padding or colors. Run against the local Vite server.
const { chromium, expect } = require('@playwright/test');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const entries = {}, metrics = {};
  const save = async (group, variants = false) => {
    const data = await page.evaluate(async ({ group, variants }) => {
      const { textCacheKey, fontMetricsKey } = await import('/src/art/textCacheKey.js');
      const scene = game.scene.getScene(group === 'intro' ? 'IntroScene' : 'GameScene');
      game.loop.stop();
      const out = [];
      const capture = object => {
        if (!object.text || !object.canvas || !object.style) return;
        // Bypass any runtime cache so regeneration always uses the font itself.
        const prototype = Object.getPrototypeOf(Object.getPrototypeOf(object));
        if (prototype.updateText) prototype.updateText.call(object);
        out.push({ key: textCacheKey(object), width: object.width, height: object.height,
          fontKey: fontMetricsKey(object.style), metrics: object.getTextMetrics(), png: object.canvas.toDataURL() });
      };
      const visit = object => { capture(object); if (object.list) object.list.forEach(visit); };
      scene.children.list.forEach(visit);
      if (variants) {
        for (const text of ['SAFE — IN SHADOW', 'SCALDING!']) for (const color of ['#dfffd7', '#ffb3b3']) {
          scene.safeText.setText(text).setColor(color); capture(scene.safeText);
        }
        scene.overlayText.setText('ALAS!\nTHOU HATH PERISHED\nWITH THE SUN.'); capture(scene.overlayText);
        scene.overlaySubText.setText('Press R to play again'); capture(scene.overlaySubText);
        scene.overlayText.setText('LEVEL COMPLETE\nFISH RETRIEVED!'); capture(scene.overlayText);
        const { levels } = await import('/src/levels/levels.js');
        for (const level of levels.slice(1)) {
          scene.overlaySubText.setText(`Next: ${level.name}`); capture(scene.overlaySubText);
        }
      }
      return out;
    }, { group, variants });
    for (const item of data) {
      const id = createHash('sha256').update(item.key).digest('hex').slice(0, 16);
      metrics[item.fontKey] = item.metrics;
      if (!entries[id]) {
        const { png, ...entry } = item;
        entries[id] = { ...entry, id, groups: [] };
        writeFileSync(`public/assets/ui/${id}.png`, Buffer.from(png.split(',')[1], 'base64'));
      }
      if (!entries[id].groups.includes(group)) entries[id].groups.push(group);
    }
    console.log(`Captured ${group}: ${data.length} labels`);
  };
  try {
    mkdirSync('public/assets/ui', { recursive: true });
    await page.goto('http://127.0.0.1:5173');
    await expect.poll(() => page.evaluate(() => window.game?.scene.isActive('IntroScene')), { timeout: 180000 }).toBe(true);
    await save('intro');
    await page.evaluate(() => { game.scene.getScene('IntroScene').scene.start('GameScene', { levelIndex: 0 }); game.loop.start(game.loop.callback); });
    for (let i = 0; i < 3; i++) {
      await expect.poll(() => page.evaluate(index => {
        const s = game.scene.getScene('GameScene');
        return s?.sys.isActive() && s.levelIndex === index && s.debugPanel?.element.isConnected;
      }, i), { timeout: 180000 }).toBe(true);
      await save(`level-${i}`, true);
      if (i < 2) await page.evaluate(index => {
        game.scene.getScene('GameScene').scene.restart({ levelIndex: index }); game.loop.start(game.loop.callback);
      }, i + 1);
    }
    const fontHash = createHash('sha256').update(readFileSync('public/assets/fonts/real-chalk.otf')).digest('hex');
    writeFileSync('src/art/ui-text-cache.json', JSON.stringify({ fontHash, metrics, entries: Object.values(entries) }, null, 2) + '\n');
    console.log(`Saved ${Object.keys(entries).length} unique lossless labels.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
