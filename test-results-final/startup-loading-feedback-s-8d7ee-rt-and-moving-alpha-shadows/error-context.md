# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: startup.spec.cjs >> loading feedback, scoped assets, cached art and moving alpha shadows
- Location: tests\startup.spec.cjs:3:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

@@ -1,10 +1,12 @@
  Object {
    "alpha": true,
    "foliageMoves": true,
    "ground": true,
-   "misses": Array [],
+   "misses": Array [
+     "GET TO THE FISH",
+   ],
    "reads": true,
    "safe": true,
    "seed": true,
    "shader": true,
    "source": true,
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
  3  | test('loading feedback, scoped assets, cached art and moving alpha shadows', async ({ page }) => {
  4  |   const errors = [], requests = [];
  5  |   page.on('pageerror', e => errors.push(e.message));
  6  |   page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  7  |   page.on('request', r => requests.push(r.url()));
  8  |   let release;
  9  |   const gate = new Promise(resolve => { release = resolve; });
  10 |   await page.route('**/src/main.js', async route => { await gate; await route.continue(); });
  11 |   await page.goto('/', { waitUntil: 'commit' });
  12 |   await expect(page.locator('#loading')).toBeVisible();
  13 |   release();
  14 |   await expect(page.locator('#loading')).toBeHidden();
  15 |   expect(requests.some(url => url.includes('/scenery/'))).toBe(false);
  16 |   await page.getByRole('button', { name: 'Skip intro' }).click();
  17 |   await expect.poll(() => page.evaluate(() => window.game?.scene.isActive('IntroScene'))).toBe(true);
  18 |   await page.keyboard.press('Enter');
  19 |   await expect.poll(() => page.evaluate(() => window.game?.scene.getScene('GameScene')?.art?.groundKey)).toBeTruthy();
  20 |   await expect(page.locator('#loading')).toBeHidden();
  21 |   expect(requests.filter(url => url.includes('/scenery/')).map(url => url.split('/').pop())).toEqual(['tree-2-layers.png']);
  22 |   await page.evaluate(() => {
  23 |     const s = game.scene.getScene('GameScene');
  24 |     window.staticResources = { ground: s.textures.get(s.art.groundKey), alpha: s.shadowCasters[0].layers[1].alpha,
  25 |       source: s.shadowCasters[0].layers[1].source, seed: s.art.seed,
  26 |       reads: __startup.entries.filter(e => e.name === 'shadow-source-readback').length };
  27 |   });
  28 |   await page.keyboard.press('r');
  29 |   await page.evaluate(() => game.scene.getScene('GameScene').scene.restart({ levelIndex: 0 }));
  30 |   await expect.poll(() => page.evaluate(() => __startup.entries.filter(e => e.name.startsWith('GameScene:0:') && e.name.endsWith(':first-frame')).length)).toBe(2);
  31 |   const result = await page.evaluate(() => {
  32 |     const s = game.scene.getScene('GameScene'), old = window.staticResources, caster = s.shadowCasters[0];
  33 |     const time = s.time.now;
  34 |     caster.setShadowDirection(-.5);
  35 |     const wood = JSON.stringify(caster.layers[0].matrix), foliage = JSON.stringify(caster.layers[1].matrix);
  36 |     s.time.now += 600;
  37 |     caster.setShadowDirection(-.5); s.art.update(s.sunSystem);
  38 |     const result = { ground: old.ground === s.textures.get(s.art.groundKey), alpha: old.alpha === caster.layers[1].alpha,
  39 |       source: old.source === caster.layers[1].source, seed: old.seed === s.art.seed,
  40 |       reads: __startup.entries.filter(e => e.name === 'shadow-source-readback').length === old.reads,
  41 |       woodStill: wood === JSON.stringify(caster.layers[0].matrix), foliageMoves: foliage !== JSON.stringify(caster.layers[1].matrix),
  42 |       synchronized: Math.abs(s.art.props[0].sprite.rotation - caster.foliageAngle) < 1e-10,
  43 |       safe: caster.contains({ x: caster.x, y: caster.y }), shader: s.paintPipeline.paintEnabled,
  44 |       misses: __startup.entries.filter(e => e.name === 'text-cache-miss').map(e => e.detail.text) };
  45 |     s.time.now = time;
  46 |     return result;
  47 |   });
> 48 |   expect(result).toEqual({ ground: true, alpha: true, source: true, seed: true, reads: true,
     |                  ^ Error: expect(received).toEqual(expected) // deep equality
  49 |     woodStill: true, foliageMoves: true, synchronized: true, safe: true, shader: true, misses: [] });
  50 |   await page.keyboard.press('F2');
  51 |   await expect(page.locator('.debug-panel')).toBeVisible();
  52 |   expect(errors).toEqual([]);
  53 | });
  54 | 
```