const { test, expect } = require('@playwright/test');

test('loading feedback, scoped assets, cached art and moving alpha shadows', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(r.url()));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/src/main.js', async route => { await gate; await route.continue(); });
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('#loading')).toBeVisible();
  release();
  await expect(page.locator('#loading')).toBeHidden();
  expect(requests.some(url => url.includes('/scenery/'))).toBe(false);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.game?.scene.getScene('GameScene')?.art?.groundKey)).toBeTruthy();
  await expect(page.locator('#loading')).toBeHidden();
  expect(requests.filter(url => url.includes('/scenery/')).map(url => url.split('/').pop())).toEqual(['tree-2-layers.png']);
  await page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    window.staticResources = { ground: s.textures.get(s.art.groundKey), alpha: s.shadowCasters[0].layers[1].alpha,
      source: s.shadowCasters[0].layers[1].source, seed: s.art.seed,
      reads: __startup.entries.filter(e => e.name === 'shadow-source-readback').length };
  });
  await page.keyboard.press('r');
  await page.evaluate(() => game.scene.getScene('GameScene').scene.restart({ levelIndex: 0 }));
  await expect.poll(() => page.evaluate(() => __startup.entries.filter(e => e.name.startsWith('GameScene:0:') && e.name.endsWith(':first-frame')).length)).toBe(2);
  const result = await page.evaluate(() => {
    const s = game.scene.getScene('GameScene'), old = window.staticResources, caster = s.shadowCasters[0];
    const time = s.time.now;
    caster.setShadowDirection(-.5);
    const wood = JSON.stringify(caster.layers[0].matrix), foliage = JSON.stringify(caster.layers[1].matrix);
    s.time.now += 600;
    caster.setShadowDirection(-.5); s.art.update(s.sunSystem);
    const result = { ground: old.ground === s.textures.get(s.art.groundKey), alpha: old.alpha === caster.layers[1].alpha,
      source: old.source === caster.layers[1].source, seed: old.seed === s.art.seed,
      reads: __startup.entries.filter(e => e.name === 'shadow-source-readback').length === old.reads,
      woodStill: wood === JSON.stringify(caster.layers[0].matrix), foliageMoves: foliage !== JSON.stringify(caster.layers[1].matrix),
      synchronized: Math.abs(s.art.props[0].sprite.rotation - caster.foliageAngle) < 1e-10,
      safe: caster.contains({ x: caster.x, y: caster.y }), shader: s.paintPipeline.paintEnabled,
      misses: __startup.entries.filter(e => e.name === 'text-cache-miss').map(e => e.detail.text) };
    s.time.now = time;
    return result;
  });
  expect(result).toEqual({ ground: true, alpha: true, source: true, seed: true, reads: true,
    woodStill: true, foliageMoves: true, synchronized: true, safe: true, shader: true, misses: [] });
  await page.keyboard.press('F2');
  await expect(page.locator('.debug-panel')).toBeVisible();
  expect(errors).toEqual([]);
});
