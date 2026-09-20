# VammyCat progression

The game now starts with `IntroScene`, then uses one `GameScene` for all three playable levels:

**Intro → One tree → Two trees + pond → Willowcross → existing fish reward.**

Click BEGIN or press Enter/Space at the intro. Movement, time controls, exposure, alpha-mask shadows, collisions and rendering remain shared. The tutorials use the same 1.2 burn rate as Willowcross; difficulty is adjusted through compact placement and sheltered stopping points.

## Level configuration

`src/levels/levels.js` defines progression order. `level1.js` and `level2.js` use a small `tutorialLevel()` helper that supplies empty scenery arrays and derives the existing caster/collider structures. `level3.js` contains the original full map, with only an `id` added. Shared ground projection and wind helpers moved unchanged to `geometry.js`.

All levels retain the existing `width`, `height`, `start`, `goal`, `treePositions`, `shadowCasters`, `solidObstacles`, `waterZones`, and other array structures. Optional settings are `startPhase`, `cameraFollow`, `objective`, `debugVisible`, and `collisionDebug`. Defaults retain the full map's existing behavior.

Tutorials are 1280 × 720 with a fixed overview, start at 07:00, and hide hitboxes/collapse the debug panel initially. Willowcross retains its 2400 × 1600 world, following camera, existing HUD copy, visible debug geometry, object placement, and effects.

## Transitions and reset

Collecting the first two fish freezes gameplay and displays LEVEL COMPLETE for 1.8 seconds before restarting the shared scene with the next configuration. Collecting the last fish opens the original animated `FishReward` presentation.

R resets the current level, including during the completion overlay. It cancels a pending advance, resets sun/exposure/fish/safety feedback, and clears player particles. Death retains the existing explicit R-to-retry behavior; it does not send the player to the intro or automatically advance.

Scene transitions create new players, systems, effects, cameras and HUD objects. Level-dependent grass, pool and shadow textures are removed on shutdown because Phaser's texture cache survives scene restarts. Shared source art and reusable textures remain cached. Input handlers, timers, debug DOM and heat-effect listeners are cleaned up. Pond rendering now accepts zero or more configured ponds instead of assuming index zero exists.

## Verification

```sh
npm install
npm run build
npm test
```

The Playwright suite uses installed Chrome and starts a local Vite server on port 5175 if one is not already running. Browser screenshots go into ignored `test-results/`. The suite checks intro startup, both tutorial routes using real player updates at 60 Hz, success transitions, restart cancellation, clean level state, water blocking, camera/canvas sizes, death priority, and the final reward. Fixture placements for terminal-state checks are separate from route tests: only the tutorial route checks establish traversability.

`tests/fixtures/willowcross.json` captures the original committed map configuration. A regression test compares every original field against Level 3.

The older art/UI scripts now use the installed Playwright dependency and deliberately load Level 3. With the dev server running on port 5175, run:

```sh
node tests/art.cjs
node tests/ui.cjs
```

Those scripts exercise existing art, shadow, collision and UI behavior. The full Willowcross route is preserved, not redesigned or claimed newly playtested end-to-end by these checks.

## Preserved-map issue discovered during verification

The original Willowcross spawn `(150, 900)` is outside the current projected alpha-mask shelter at 07:00 in all sampled sway positions (0–20 seconds, in 0.5-second steps). An idle cat therefore starts heating there. The original `tests/art.cjs` assertion that this spawn is sheltered is inconsistent with the current assets/configuration. The map and shadow algorithm are preserved as requested; this issue is not silently corrected by relocating the spawn, granting invulnerability, or changing exposure.

Both new tutorial spawns are sheltered. Progression tests capture Level 3's zeroed exposure at scene creation, before its existing sunlight behavior begins, and separately check restart state and terminal outcomes.

Verification performed on September 20, 2026:

- `npm run build`: passed, with Vite's existing large-bundle warning.
- `npm test`: 2 tests passed, including both tutorial routes, progression/reset checks, final victory, and exact original-map configuration comparison. No browser runtime errors were recorded.
- Tutorial route peak exposure was approximately 56% for Level 1 and 55% for Level 2, with shelter rests and the unchanged burn rate.
- `node tests/ui.cjs`: passed exposure, cooling, font, shader, clock and thermometer checks.
- `node tests/art.cjs`: passed the early cat/tree-layer checks, then failed its existing `Start sheltered` assertion for the preserved full-map spawn. Later assertions in that script were not reached. The assertion remains in place so the issue stays visible.
- Intro, both tutorial layouts, and the final fish reward were inspected in browser screenshots. The full-map route was not traversed end to end.

## File inventory

Created:

- `src/scenes/IntroScene.js`
- `src/levels/level2.js`, `level3.js`, `levels.js`, `tutorialLevel.js`, `geometry.js`
- `playwright.config.js`
- `tests/browser.cjs`, `levels.spec.cjs`, `progression.spec.cjs`, `fixtures/willowcross.json`
- `docs/PROGRESSION.md`

Modified:

- `src/main.js`, `src/scenes/GameScene.js`, `src/levels/level1.js`
- `src/art/GardenArt.js`, `src/entities/ShadowCaster.js` (shared-helper import only)
- `src/systems/SunSystem.js`, `ShadowSystem.js`, `DebugPanel.js`, `BurnThermometer.js`
- `tests/art.cjs`, `tests/ui.cjs`
- `package.json`, `package-lock.json`, `.gitignore`, `README.md`

No source images, player movement code, exposure formula, collision algorithm, painterly shader, wind implementation, or fish reward implementation were changed.
