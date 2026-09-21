# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: progression.spec.cjs >> intro, playable tutorial routes, clean transitions and final reward
- Location: tests\progression.spec.cjs:39:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Object {
    "exposure": 0,
-   "fish": false,
-   "reward": true,
+   "fish": true,
+   "reward": false,
    "state": "WON",
  }
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "Restart" [active] [ref=e5] [cursor=pointer]
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
  127 |     });
  128 |     game.loop.start(game.loop.callback);
  129 |   });
  130 |   await page.getByRole('button', { name: 'Next Level', exact: true }).click();
  131 |   await ready(page, 2);
  132 |   expect(await page.evaluate(() => window.levelEntry)).toEqual({ exposure: 0, heat: 0,
  133 |     phase: -5 / 6, target: -5 / 6, sparks: 0, position: { x: 95, y: 900 }, fish: true, state: 'PLAYING' });
  134 |   expect(await fresh(2)).toMatchObject({ trees: 4, water: 1, houses: 4, benches: 2, width: 2400, height: 1600 });
  135 |   await page.evaluate(() => game.loop.start(game.loop.callback));
  136 |   await expect(page.locator('#loading')).toBeHidden();
  137 |   await page.screenshot({ path: testInfo.outputPath('willowcross.png') });
  138 |   await page.evaluate(() => game.loop.stop());
  139 | 
  140 |   // Use the loaded source-image alpha masks and production inverse projection.
  141 |   // Both wind frequencies repeat after 20*pi seconds; sample the whole cycle
  142 |   // and an 8px neighborhood, not just the logical point at one lucky phase.
  143 |   expect(await page.evaluate(() => {
  144 |     const s = game.scene.getScene('GameScene'), start = s.level.start;
  145 |     const caster = s.shadowCasters[0], previousTime = s.time.now;
  146 |     let sheltered = true, clear = true;
  147 |     for (let t = 0; t <= 20000 * Math.PI; t += 20) {
  148 |       s.time.now = t;
  149 |       caster.setShadowDirection(s.sunSystem.sunPhase);
  150 |       for (let dx = -8; dx <= 8; dx += 2) for (let dy = -8; dy <= 8; dy += 2) {
  151 |         const point = { x: start.x + dx, y: start.y + dy };
  152 |         sheltered &&= caster.contains(point) && s.shadowSystem.isPointInAnyShadow(point);
  153 |         clear &&= !s.isPositionBlocked(point.x, point.y, s.player.radius);
  154 |       }
  155 |     }
  156 |     s.time.now = previousTime;
  157 |     caster.setShadowDirection(s.sunSystem.sunPhase);
  158 |     return { sheltered, clear, texture: caster.texture, x: caster.x, y: caster.y,
  159 |       inBounds: start.x - 8 >= 40 && start.x + 8 <= s.level.width - 40 };
  160 |   })).toEqual({ sheltered: true, clear: true, texture: 'tree-1', x: 450, y: 700, inBounds: true });
  161 | 
  162 |   const stationary = async () => {
  163 |     const result = await page.evaluate(() => {
  164 |       const s = game.scene.getScene('GameScene'); game.loop.stop();
  165 |       let safe = true, peak = 0;
  166 |       for (let i = 0; i < 600; i++) {
  167 |         s.time.now += 1000 / 60;
  168 |         s.update(s.time.now, 1000 / 60);
  169 |         safe &&= s.isInShadow;
  170 |         peak = Math.max(peak, s.exposureSystem.currentExposure);
  171 |       }
  172 |       return { safe, peak, state: s.state, position: s.player.getPosition(),
  173 |         clock: s.sunSystem.uiText.text, hud: s.safeText.text, heat: s.thermometer.heat };
  174 |     });
  175 |     expect(result).toMatchObject({ safe: true, peak: 0, state: 'PLAYING',
  176 |       position: { x: 95, y: 900 }, clock: '07:00', heat: 0 });
  177 |     expect(result.hud).toContain('IN SHADOW');
  178 |   };
  179 |   await stationary();
  180 |   // Move normally out of shelter; collisions and exposure remain enabled.
  181 |   const exit = await walk(page, [{ x: 180, y: 900 }]);
  182 |   expect(exit.at(-1)).toMatchObject({ state: 'PLAYING', safe: false });
  183 |   expect(exit.at(-1).position.x).toBeGreaterThan(170);
  184 |   expect(exit.at(-1).peak).toBeGreaterThan(0);
  185 |   expect(await page.evaluate(() => {
  186 |     const s = game.scene.getScene('GameScene'), tree = s.level.solidObstacles[0];
  187 |     s.player.setPosition(tree.x - tree.radius - s.player.radius - 1, tree.y);
  188 |     s.player.update({ left: {}, right: { isDown: true }, up: {}, down: {} }, 1 / 60);
  189 |     return { x: s.player.getPosition().x, blocker: s.lastMovementDebug.blockedBy };
  190 |   })).toEqual({ x: 417, blocker: 'TREE' });
  191 |   await page.getByRole('button', { name: 'Restart', exact: true }).click();
  192 |   await fresh(2);
  193 |   await stationary();
  194 | 
  195 |   // Fixture placement below tests terminal states, not final-map playability.
  196 |   const death = await page.evaluate(() => {
  197 |     const s = game.scene.getScene('GameScene'); game.loop.stop();
  198 |     s.player.setPosition(s.level.goal.x, s.level.goal.y);
  199 |     s.exposureSystem.currentExposure = .9999;
  200 |     s.sunSystem.sunPhase = s.sunSystem.targetPhase = 0;
  201 |     s.shadowSystem.lastPhase = undefined;
  202 |     s.update(s.time.now, 50);
  203 |     return { state: s.state, reward: s.reward.active, fish: s.fishBody.visible };
  204 |   });
  205 |   expect(death).toEqual({ state: 'DEAD', reward: false, fish: true });
  206 |   const armRestart = async () => page.evaluate(() => {
  207 |     const s = game.scene.getScene('GameScene');
  208 |     s.restartButton.addEventListener('click', () => {
  209 |       window.restartState = { index: s.levelIndex, exposure: s.exposureSystem.currentExposure,
  210 |         heat: s.thermometer.heat, phase: s.sunSystem.sunPhase, state: s.state, fish: s.fishBody.visible };
  211 |       game.loop.stop();
  212 |     }, { once: true });
  213 |     game.loop.start(game.loop.callback);
  214 |   });
  215 |   await armRestart();
  216 |   await page.getByRole('button', { name: 'Restart', exact: true }).click();
  217 |   expect(await page.evaluate(() => window.restartState)).toEqual({ index: 2, exposure: 0, heat: 0,
  218 |     phase: -5 / 6, state: 'PLAYING', fish: true });
  219 |   await fresh(2);
  220 |   const victory = await page.evaluate(() => {
  221 |     const s = game.scene.getScene('GameScene'); game.loop.stop();
  222 |     s.player.setPosition(s.level.goal.x, s.level.goal.y);
  223 |     s.exposureSystem.reset();
  224 |     s.checkFishPickup(); s.reward.update(1.5); s.update(s.time.now, 50);
  225 |     return { state: s.state, reward: s.reward.active, fish: s.fishBody.visible, exposure: s.exposureSystem.currentExposure };
  226 |   });
> 227 |   expect(victory).toEqual({ state: 'WON', reward: true, fish: false, exposure: 0 });
      |                   ^ Error: expect(received).toEqual(expected) // deep equality
  228 |   await page.evaluate(() => game.loop.start(game.loop.callback));
  229 |   await page.screenshot({ path: testInfo.outputPath('final-victory.png') });
  230 |   await armRestart();
  231 |   await page.getByRole('button', { name: 'Restart', exact: true }).click();
  232 |   await fresh(2);
  233 |   expect(errors).toEqual([]);
  234 | });
  235 | 
```