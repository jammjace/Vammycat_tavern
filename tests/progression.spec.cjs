const { test, expect } = require('@playwright/test');

const ready = async (page, index) => {
  await expect.poll(() => page.evaluate(index => {
    const s = window.game?.scene.getScene('GameScene');
    return s?.sys.isActive() && s.levelIndex === index && s.debugPanel?.element.isConnected;
  }, index)).toBe(true);
};

// Simulate key states in the real scene at 60 Hz. No teleporting along routes,
// altered exposure, forced safety, or disabled collisions. Rendering is stopped
// while advancing deterministic game updates, then resumed for transitions.
async function walk(page, route) {
  return page.evaluate(route => {
    const s = game.scene.getScene('GameScene');
    game.loop.stop();
    let clock = s.time.now;
    const results = [];
    const tick = () => { clock += 1000 / 60; s.time.now = clock; s.update(clock, 1000 / 60); };
    const release = () => { for (const key of Object.values(s.wasd)) key.isDown = false; };
    for (const { x, y, phase, rest = 0 } of route) {
      if (phase !== undefined) s.sunSystem.setTargetPhase(phase);
      let frames = 0, peak = s.exposureSystem.currentExposure;
      while (Math.hypot(x - s.player.sprite.x, y - s.player.sprite.y) > 6 && s.state === 'PLAYING' && frames++ < 300) {
        const dx = x - s.player.sprite.x, dy = y - s.player.sprite.y;
        s.wasd.left.isDown = dx < -3; s.wasd.right.isDown = dx > 3;
        s.wasd.up.isDown = dy < -3; s.wasd.down.isDown = dy > 3;
        tick(); peak = Math.max(peak, s.exposureSystem.currentExposure);
      }
      release();
      for (let i = 0; i < rest * 60 && s.state === 'PLAYING'; i++) { tick(); peak = Math.max(peak, s.exposureSystem.currentExposure); }
      results.push({ target: [x, y], position: s.player.getPosition(), state: s.state, peak, safe: s.isInShadow, frames });
      if (s.state !== 'PLAYING') break;
    }
    return results;
  }, route);
}

test('intro, playable tutorial routes, clean transitions and final reward', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect.poll(() => page.evaluate(() => window.game?.scene.isActive('IntroScene'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('intro.png') });
  await page.locator('canvas').click({ position: { x: 640, y: 572 } });
  await ready(page, 0);

  const inspect = () => page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    return {
      id: s.level.id, index: s.levelIndex, state: s.state, trees: s.level.treePositions.length,
      water: s.level.waterZones.length, houses: s.level.buildingObjects.length, benches: s.level.benchObjects.length,
      safe: s.isInShadow, exposure: s.exposureSystem.currentExposure, clock: s.sunSystem.uiText.text,
      target: s.sunSystem.targetPhase, fish: s.fishBody.visible, heat: s.thermometer.heat,
      width: s.shadowSystem.texture.width, height: s.shadowSystem.texture.height,
      groundWidth: s.textures.get(s.art.groundKey).source[0].width,
      bounds: { width: s.cameras.main.getBounds().width, height: s.cameras.main.getBounds().height },
      panels: document.querySelectorAll('.debug-panel').length, cameras: s.cameras.cameras.length,
      zoom: s.cameras.main.zoom, uiZoom: s.uiCamera.zoom,
    };
  });
  const fresh = async index => {
    const s = await inspect();
    expect(s).toMatchObject({ index, state: 'PLAYING', clock: '07:00',
      target: -5 / 6, fish: true, panels: 1, cameras: 3, zoom: 1, uiZoom: 1 });
    // The unchanged Willowcross spawn is not sheltered at every sway phase.
    // Its zeroed entry/reset state is checked synchronously below instead.
    if (index < 2) expect(s).toMatchObject({ safe: true, exposure: 0, heat: 0 });
    expect(s.bounds).toEqual({ width: s.width, height: s.height });
    expect(s.groundWidth).toBe(s.width);
    return s;
  };
  expect(await fresh(0)).toMatchObject({ trees: 1, water: 0, houses: 0, benches: 0, width: 1280, height: 720 });
  await page.screenshot({ path: testInfo.outputPath('one-tree.png') });

  // Actual keyboard input and restart stay in the current level.
  await page.keyboard.press('H');
  expect((await inspect()).target).toBeCloseTo(-5 / 6 + .05);
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await fresh(0);

  const firstRoute = [
    { x: 580, y: 400, rest: 2 },
    { x: 580, y: 400, phase: 5 / 6, rest: 2 },
    { x: 630, y: 418 }, { x: 680, y: 400, rest: 2 }, { x: 890, y: 500 },
  ];
  const first = await walk(page, firstRoute);
  console.log('Level 1 route', first);
  expect(first.at(-1).state).toBe('LEVEL_COMPLETE');
  expect(Math.max(...first.map(step => step.peak))).toBeLessThan(.85);

  // Restart during the success overlay stays on this level.
  await page.evaluate(() => game.loop.start(game.loop.callback));
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await fresh(0);
  await page.waitForTimeout(2000);
  expect((await inspect()).index).toBe(0);
  expect((await walk(page, firstRoute)).at(-1).state).toBe('LEVEL_COMPLETE');
  await page.evaluate(() => game.loop.start(game.loop.callback));
  await page.getByRole('button', { name: 'Next Level', exact: true }).click();
  await ready(page, 1);
  expect(await fresh(1)).toMatchObject({ trees: 2, water: 1, houses: 0, benches: 0, width: 1280, height: 720 });
  await page.screenshot({ path: testInfo.outputPath('two-trees.png') });
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await fresh(1);

  expect(await page.evaluate(() => {
    const s = game.scene.getScene('GameScene'), w = s.level.waterZones[0];
    return s.getPositionBlocker(w.x, w.y, s.player.radius);
  })).toBe('water');
  const second = await walk(page, [
    { x: 350, y: 385, rest: 2 },
    { x: 350, y: 385, phase: 5 / 6, rest: 2 },
    { x: 400, y: 403 }, { x: 450, y: 385, rest: 2 },
    { x: 650, y: 510 }, { x: 790, y: 400, rest: 2 },
    { x: 840, y: 418 }, { x: 890, y: 400, rest: 2 }, { x: 1090, y: 510 },
  ]);
  console.log('Level 2 route', second);
  expect(second.at(-1).state).toBe('LEVEL_COMPLETE');
  expect(Math.max(...second.map(step => step.peak))).toBeLessThan(.9);
  await page.evaluate(() => {
    game.scene.getScene('GameScene').events.once('create', s => {
      window.levelEntry = { exposure: s.exposureSystem.currentExposure, heat: s.thermometer.heat,
        phase: s.sunSystem.sunPhase, target: s.sunSystem.targetPhase, sparks: s.player.sparkles.length,
        position: s.player.getPosition(), fish: s.fishBody.visible, state: s.state };
      game.loop.stop();
    });
    game.loop.start(game.loop.callback);
  });
  await page.getByRole('button', { name: 'Next Level', exact: true }).click();
  await ready(page, 2);
  expect(await page.evaluate(() => window.levelEntry)).toEqual({ exposure: 0, heat: 0,
    phase: -5 / 6, target: -5 / 6, sparks: 0, position: { x: 150, y: 900 }, fish: true, state: 'PLAYING' });
  expect(await fresh(2)).toMatchObject({ trees: 4, water: 1, houses: 4, benches: 2, width: 2400, height: 1600 });
  await page.screenshot({ path: testInfo.outputPath('willowcross.png') });

  // Fixture placement below tests terminal states, not final-map playability.
  const death = await page.evaluate(() => {
    const s = game.scene.getScene('GameScene'); game.loop.stop();
    s.player.setPosition(s.level.goal.x, s.level.goal.y);
    s.exposureSystem.currentExposure = .9999;
    s.sunSystem.sunPhase = s.sunSystem.targetPhase = 0;
    s.shadowSystem.lastPhase = undefined;
    s.update(s.time.now, 50);
    return { state: s.state, reward: s.reward.active, fish: s.fishBody.visible };
  });
  expect(death).toEqual({ state: 'DEAD', reward: false, fish: true });
  const armRestart = async () => page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    s.restartButton.addEventListener('click', () => {
      window.restartState = { index: s.levelIndex, exposure: s.exposureSystem.currentExposure,
        heat: s.thermometer.heat, phase: s.sunSystem.sunPhase, state: s.state, fish: s.fishBody.visible };
      game.loop.stop();
    }, { once: true });
    game.loop.start(game.loop.callback);
  });
  await armRestart();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  expect(await page.evaluate(() => window.restartState)).toEqual({ index: 2, exposure: 0, heat: 0,
    phase: -5 / 6, state: 'PLAYING', fish: true });
  await fresh(2);
  const victory = await page.evaluate(() => {
    const s = game.scene.getScene('GameScene'); game.loop.stop();
    s.player.setPosition(s.level.goal.x, s.level.goal.y);
    s.exposureSystem.reset();
    s.checkFishPickup(); s.reward.update(1.5); s.update(s.time.now, 50);
    return { state: s.state, reward: s.reward.active, fish: s.fishBody.visible, exposure: s.exposureSystem.currentExposure };
  });
  expect(victory).toEqual({ state: 'WON', reward: true, fish: false, exposure: 0 });
  await page.evaluate(() => game.loop.start(game.loop.callback));
  await page.screenshot({ path: testInfo.outputPath('final-victory.png') });
  await armRestart();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await fresh(2);
  expect(errors).toEqual([]);
});
