const { test, expect } = require('@playwright/test');

test('audio playback, fades, outcomes and restart cleanup', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => game.sound.locked)).toBe(false);
  const result = await page.evaluate(() => {
    game.loop.stop();
    const s = game.scene.getScene('GameScene'), a = s.audio;
    a.update(.2, true, true, true);
    const ticking = a.sounds.tick.isPlaying && a.sounds.tick.volume > 0;
    const moving = a.sounds.run.isPlaying && a.sounds.run.volume > 0;
    const burning = a.sounds.burn.isPlaying && a.sounds.burn.volume > 0;
    a.update(1, false, false);
    const stopped = !a.sounds.run.isPlaying && !a.sounds.burn.isPlaying && !a.sounds.tick.isPlaying;
    a.windWait = 0;
    a.update(.1, false, false);
    a.update(2, false, false);
    const fadeIn = a.sounds.wind.volume;
    a.update(3, false, false);
    const peak = a.sounds.wind.volume;
    a.update(14, false, false);
    const fadeOut = a.sounds.wind.volume;
    a.finish(false);
    const lost = a.sounds.lose.isPlaying && !a.sounds.wind.isPlaying;
    a.reset();
    s.player.setPosition(s.level.goal.x, s.level.goal.y);
    s.checkFishPickup();
    return { moving, burning, ticking, stopped, fadeIn, peak, fadeOut, lost,
      won: a.sounds.win.isPlaying, state: s.state, duration: a.sounds.wind.duration };
  });
  expect(result).toMatchObject({ moving: true, burning: true, ticking: true, stopped: true, lost: true, won: true, state: 'LEVEL_COMPLETE' });
  expect(result.duration).toBeCloseTo(20, 0);
  expect(result.fadeIn).toBeLessThan(result.peak);
  expect(result.fadeOut).toBeLessThan(result.fadeIn);
  await expect(page.getByRole('button', { name: 'Next Level' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  expect(await page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    return { state: s.state, playing: Object.values(s.audio.sounds).some(sound => sound.isPlaying),
      click: game.sound.getAll('sfx-click').some(sound => sound.isPlaying) };
  })).toEqual({ state: 'PLAYING', playing: false, click: true });
  await expect(page.getByRole('button', { name: 'Next Level' })).toBeHidden();
  expect(errors).toEqual([]);
});
