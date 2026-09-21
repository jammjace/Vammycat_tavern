# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bite.spec.cjs >> bite hides fish on frame two, delays reward, and resets cleanly
- Location: tests\bite.spec.cjs:3:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 5
+ Received  + 5

  Object {
-   "bite": false,
-   "cat": true,
-   "fish": true,
-   "reward": false,
-   "state": "PLAYING",
+   "bite": true,
+   "cat": false,
+   "fish": false,
+   "reward": true,
+   "state": "WON",
  }
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "Restart" [ref=e5] [cursor=pointer]
  - complementary [ref=e6]:
    - group [ref=e7]:
      - generic "Town debug · F2" [ref=e8] [cursor=pointer]
      - generic [ref=e9]:
        - checkbox "Hitboxes" [checked] [ref=e10]
        - text: Hitboxes
      - generic [ref=e11]:
        - checkbox "Shadow projection bounds" [ref=e12]
        - text: Shadow projection bounds
      - generic [ref=e13]:
        - checkbox "Campbreeze painterly" [checked] [ref=e14]
        - text: Campbreeze painterly
      - generic [ref=e15]:
        - text: Zoom
        - slider "Map zoom" [ref=e16]: "1"
      - generic [ref=e17]:
        - button "−" [ref=e18] [cursor=pointer]
        - button "Reset" [ref=e19] [cursor=pointer]
        - button "+" [ref=e20] [cursor=pointer]
      - generic [ref=e21]: "Shift + scroll: zoom · Scroll: timeRed: solid · Cyan: water · Gold: cat / fishTree circles cover trunks only; roots are walkable."
      - status [ref=e22]: 100% · 10 solid objects
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('bite hides fish on frame two, delays reward, and resets cleanly', async ({ page }, testInfo) => {
  4  |   const errors = [];
  5  |   page.on('pageerror', e => errors.push(e.message));
  6  |   await page.goto('/');
  7  |   await page.getByRole('button', { name: 'Skip intro' }).click();
  8  |   await expect.poll(() => page.evaluate(() => game.scene.isActive('IntroScene'))).toBe(true);
  9  |   await page.evaluate(() => game.scene.getScene('IntroScene').scene.start('GameScene', { levelIndex: 2 }));
  10 |   await expect.poll(() => page.evaluate(() => game.scene.getScene('GameScene')?.reward !== undefined)).toBe(true);
  11 |   const inspect = () => page.evaluate(() => {
  12 |     const s = game.scene.getScene('GameScene');
  13 |     return { frame: s.biteSprite.texture.key, fish: s.fishBody.visible, reward: s.reward.active,
  14 |       height: s.biteSprite.displayHeight, catHeight: s.player.sprite.displayHeight };
  15 |   });
  16 |   await page.evaluate(() => {
  17 |     game.loop.stop();
  18 |     const s = game.scene.getScene('GameScene');
  19 |     s.player.setPosition(s.fishGoal.x, s.fishGoal.y);
  20 |     s.checkFishPickup();
  21 |   });
  22 |   expect(await inspect()).toMatchObject({ frame: 'bite-open', fish: true, reward: false, height: 85.8, catHeight: 85.8 });
  23 |   await page.evaluate(() => game.scene.getScene('GameScene').updateBite(.45));
  24 |   expect(await inspect()).toMatchObject({ frame: 'bite-closed', fish: false, reward: false });
  25 |   await page.evaluate(() => {
  26 |     const s = game.scene.getScene('GameScene');
  27 |     s.updateBite(.8);
  28 |     s.reward.update(1.5);
  29 |     game.loop.start(game.loop.callback);
  30 |   });
  31 |   expect(await inspect()).toMatchObject({ frame: 'bite-closed', fish: false, reward: true });
  32 |   await page.screenshot({ path: testInfo.outputPath('bite-win.png') });
  33 |   await page.keyboard.press('r');
  34 |   expect(await page.evaluate(() => {
  35 |     const s = game.scene.getScene('GameScene');
  36 |     return { state: s.state, cat: s.player.sprite.visible, bite: s.biteSprite.visible, fish: s.fishBody.visible, reward: s.reward.active };
> 37 |   })).toEqual({ state: 'PLAYING', cat: true, bite: false, fish: true, reward: false });
     |       ^ Error: expect(received).toEqual(expected) // deep equality
  38 |   expect(errors).toEqual([]);
  39 | });
  40 | 
```