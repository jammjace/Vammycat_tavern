const { test, expect } = require('@playwright/test');

test('bite hides fish on frame two, delays reward, and resets cleanly', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  await page.evaluate(() => game.scene.getScene('IntroScene').scene.start('GameScene', { levelIndex: 2 }));
  await expect.poll(() => page.evaluate(() => game.scene.getScene('GameScene')?.reward !== undefined)).toBe(true);
  const inspect = () => page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    return { frame: s.biteSprite.texture.key, fish: s.fishBody.visible, reward: s.reward.active,
      height: s.biteSprite.displayHeight, catHeight: s.player.sprite.displayHeight };
  });
  await page.evaluate(() => {
    game.loop.stop();
    const s = game.scene.getScene('GameScene');
    s.player.setPosition(s.fishGoal.x, s.fishGoal.y);
    s.checkFishPickup();
  });
  expect(await inspect()).toMatchObject({ frame: 'bite-open', fish: true, reward: false, height: 85.8, catHeight: 85.8 });
  await page.evaluate(() => game.scene.getScene('GameScene').updateBite(.45));
  expect(await inspect()).toMatchObject({ frame: 'bite-closed', fish: false, reward: false });
  await page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    s.updateBite(.8);
    s.reward.update(1.5);
    game.loop.start(game.loop.callback);
  });
  expect(await inspect()).toMatchObject({ frame: 'bite-closed', fish: false, reward: true });
  await page.screenshot({ path: testInfo.outputPath('bite-win.png') });
  await page.keyboard.press('r');
  expect(await page.evaluate(() => {
    const s = game.scene.getScene('GameScene');
    return { state: s.state, cat: s.player.sprite.visible, bite: s.biteSprite.visible, fish: s.fishBody.visible, reward: s.reward.active };
  })).toEqual({ state: 'PLAYING', cat: true, bite: false, fish: true, reward: false });
  expect(errors).toEqual([]);
});
