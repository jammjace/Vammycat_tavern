const { test, expect } = require('@playwright/test');

test('comic plays five panels with a centered gliding cat, then hands off to Begin', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
  await expect(page.locator('#loading')).toBeHidden();
  await page.waitForTimeout(650);
  const first = await page.evaluate(() => {
    const s = game.scene.getScene('ComicScene');
    return { x: s.cat.x, y: s.artwork.y, alpha: s.stars[0].alpha };
  });
  await page.waitForTimeout(350);
  const later = await page.evaluate(() => {
    const s = game.scene.getScene('ComicScene');
    return { x: s.cat.x, y: s.artwork.y, alpha: s.stars[0].alpha };
  });
  expect(later.x).toBeGreaterThan(first.x);
  expect(later.y).toBeLessThan(first.y);
  expect(later.alpha).not.toBe(first.alpha);
  await expect.poll(() => page.evaluate(() => game.scene.getScene('ComicScene').cat?.x),
    { intervals: [50] }).toBe(640);
  const stopped = await page.evaluate(() => {
    const s = game.scene.getScene('ComicScene');
    return { x: s.cat.x, y: s.cat.y, panY: s.artwork.y };
  });
  expect(stopped.x).toBeCloseTo(640);
  await page.waitForTimeout(250);
  const panned = await page.evaluate(() => {
    const s = game.scene.getScene('ComicScene');
    return { x: s.cat.x, y: s.cat.y, panY: s.artwork.y };
  });
  expect(panned.x).toBeCloseTo(640);
  expect(panned.y).toBeLessThan(stopped.y);
  expect(panned.y - stopped.y).toBeCloseTo(panned.panY - stopped.panY);
  await page.screenshot({ path: testInfo.outputPath('flying-cat.png') });
  const panels = [71, 72, 74, 75, 76];
  for (let index = 1; index < panels.length; index++) {
    await expect.poll(() => page.evaluate(() => game.scene.getScene('ComicScene').panelIndex)).toBe(index);
    expect(await page.evaluate(() => {
      const s = game.scene.getScene('ComicScene');
      return { cat: s.cat, stars: s.stars.length, texture: s.artwork.texture.key };
    })).toEqual({ cat: null, stars: 0, texture: `comic-${panels[index]}` });
  }
  await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => game.scene.getScene('GameScene')?.state)).toBe('PLAYING');
  await page.keyboard.press('r');
  expect(await page.evaluate(() => game.scene.isActive('ComicScene'))).toBe(false);
  expect(errors).toEqual([]);
});

test('Escape skips the comic and removes its controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
});
