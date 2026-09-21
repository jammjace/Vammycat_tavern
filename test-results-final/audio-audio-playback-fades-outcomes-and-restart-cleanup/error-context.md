# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audio.spec.cjs >> audio playback, fades, outcomes and restart cleanup
- Location: tests\audio.spec.cjs:3:1

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "burning": true,
    "lost": true,
    "moving": true,
    "state": "LEVEL_COMPLETE",
-   "stopped": true,
+   "stopped": false,
    "ticking": true,
    "won": true,
  }
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "Restart" [ref=e5] [cursor=pointer]
  - complementary [ref=e6]:
    - group [ref=e7]:
      - generic "Town debug · F2" [ref=e8] [cursor=pointer]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('audio playback, fades, outcomes and restart cleanup', async ({ page }) => {
  4  |   const errors = [];
  5  |   page.on('pageerror', e => errors.push(e.message));
  6  |   await page.goto('/');
  7  |   await page.getByRole('button', { name: 'Skip intro' }).click();
  8  |   await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  9  |   await page.keyboard.press('Enter');
  10 |   await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible();
  11 |   await expect.poll(() => page.evaluate(() => game.sound.locked)).toBe(false);
  12 |   const result = await page.evaluate(() => {
  13 |     game.loop.stop();
  14 |     const s = game.scene.getScene('GameScene'), a = s.audio;
  15 |     a.update(.2, true, true, true);
  16 |     const ticking = a.sounds.tick.isPlaying && a.sounds.tick.volume > 0;
  17 |     const moving = a.sounds.run.isPlaying && a.sounds.run.volume > 0;
  18 |     const burning = a.sounds.burn.isPlaying && a.sounds.burn.volume > 0;
  19 |     a.update(1, false, false);
  20 |     const stopped = !a.sounds.run.isPlaying && !a.sounds.burn.isPlaying && !a.sounds.tick.isPlaying;
  21 |     a.windWait = 0;
  22 |     a.update(.1, false, false);
  23 |     a.update(2, false, false);
  24 |     const fadeIn = a.sounds.wind.volume;
  25 |     a.update(3, false, false);
  26 |     const peak = a.sounds.wind.volume;
  27 |     a.update(14, false, false);
  28 |     const fadeOut = a.sounds.wind.volume;
  29 |     a.finish(false);
  30 |     const lost = a.sounds.lose.isPlaying && !a.sounds.wind.isPlaying;
  31 |     a.reset();
  32 |     s.player.setPosition(s.level.goal.x, s.level.goal.y);
  33 |     s.checkFishPickup();
  34 |     return { moving, burning, ticking, stopped, fadeIn, peak, fadeOut, lost,
  35 |       won: a.sounds.win.isPlaying, state: s.state, duration: a.sounds.wind.duration };
  36 |   });
> 37 |   expect(result).toMatchObject({ moving: true, burning: true, ticking: true, stopped: true, lost: true, won: true, state: 'LEVEL_COMPLETE' });
     |                  ^ Error: expect(received).toMatchObject(expected)
  38 |   expect(result.duration).toBeCloseTo(20, 0);
  39 |   expect(result.fadeIn).toBeLessThan(result.peak);
  40 |   expect(result.fadeOut).toBeLessThan(result.fadeIn);
  41 |   await expect(page.getByRole('button', { name: 'Next Level' })).toBeVisible();
  42 |   await page.getByRole('button', { name: 'Restart', exact: true }).click();
  43 |   expect(await page.evaluate(() => {
  44 |     const s = game.scene.getScene('GameScene');
  45 |     return { state: s.state, playing: Object.values(s.audio.sounds).some(sound => sound.isPlaying),
  46 |       click: game.sound.getAll('sfx-click').some(sound => sound.isPlaying) };
  47 |   })).toEqual({ state: 'PLAYING', playing: false, click: true });
  48 |   await expect(page.getByRole('button', { name: 'Next Level' })).toBeHidden();
  49 |   expect(errors).toEqual([]);
  50 | });
  51 | 
```