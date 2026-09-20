# Current progression

VammyCat now opens with an intro, followed by two compact tutorial levels and the original Willowcross map as Level 3. See [the progression guide](docs/PROGRESSION.md) for architecture, controls, reset behavior and testing.

Run `npm run dev`, `npm run build`, or `npm test` (requires installed Chrome).

The original development notes below describe the earlier MVP and contain historical layouts and controls.

---

VammyCat

VammyCat is a browser-based 2D top-down puzzle game built with Phaser 3 + WebGL + Vite.

The player is a vampire cat trying to retrieve its fish. The cat cannot stay in direct sunlight for long, so the main mechanic is manipulating the sun to change the shadows cast by objects in the environment.

The current repo is an MVP / technical prototype. The core gameplay loop works. The visuals are still placeholder geometry.

Core game idea

You play as a vampire cat.

The cat starts on the left side of the map.

The fish objective is on the right side.

The level is inspired by a simplified Boston Public Garden layout.

The whole puzzle fits on one screen.

The player moves through shadows to avoid sunlight.

The player can manipulate the sun horizontally across the sky.

Moving the sun changes the direction and length of shadows.

Small gaps of sunlight can be crossed briefly.

Remaining in sunlight for too long causes the cat to be scalded and die.

The intended feel is a simple top-down environmental puzzle, not combat or platforming.

Controls

Player

W — move up

A — move left

S — move down

D — move right

Sun

U / H — move the sun

Mouse wheel — move the sun continuously

Other

R — restart after death or winning

D — debug mode, depending on current implementation

Current gameplay loop

The cat starts in a safe shadow on the left side.

The player moves through the garden.

The player adjusts the sun to reposition shadows.

Standing in shadow is safe.

Standing in sunlight increases the exposure meter.

Returning to shadow gradually reduces exposure.

If exposure reaches the maximum, the cat dies.

The level resets after death.

Reaching the fish triggers the win condition.

Press R to play again.

The game uses separate states such as:

PLAYING

DEAD

WON

Sun and shadow behavior

The sun is represented by a continuous value:

sunPhase ∈ [-1, 1]

Conceptually:

-1 = sunrise / sun from the left
 0 = noon
+1 = sunset / sun from the right

Shadow behavior:

shadows point away from the sun

shadows are longer near sunrise/sunset

shadows are shorter near noon

multiple shadows can overlap

overlapping shadows still count as safe

shadows are visual/safety regions only

shadows do not physically block movement

The MVP uses simplified 2D polygon geometry rather than realistic lighting.

Exposure system

The cat can survive a short amount of sunlight.

Current intended behavior:

if isInShadow:
    exposure decreases
else:
    exposure increases

Exposure is cumulative.

Example:

cat spends 0.6 s in sunlight

reaches shadow

exposure starts recovering

if the cat enters sunlight again before fully recovering, exposure resumes from the remaining amount

Important architecture rule:

The same isInShadow value should drive both the HUD and the exposure calculation.

This avoids cases where the UI says SAFE — IN SHADOW while the exposure meter still rises.

Level layout

High-level structure:

LEFT / START
    ↓
dense trees / safe starting shadow
    ↓
path
    ↓
central pond
    ↓
leaves / lily-pad platforms
    ↓
small hut / shelter in pond
    ↓
right-side garden / structures
    ↓
FISH

The pond is the major central obstacle.

Pond rules

plain water is blocked

leaves/lily pads are walkable

designated platforms override water blocking

the player should be able to step from land → leaf → leaf → hut area → opposite side

platforms do not automatically protect the cat from sunlight

shadows still determine safety

The central hut exists mainly to create a safer shadow/rest point during the pond crossing.

Current placeholder objects

The prototype uses simple Phaser geometry.

Typical meanings:

purple circle — player / cat

yellow/orange marker — fish objective

green circles — tree canopies

brown trunks — trees

brown structures — benches / garden structures

blue area — pond

green oval shapes — lily pads / leaves

brown central structure — pond hut

dark translucent polygons — shadows

The final game should replace these with proper art later.

Obstacle logic

Solid environmental objects should block movement.

Examples:

tree trunks

benches

buildings / pavilion

solid hedges

pond water

Walkable:

paved paths

open grass

lily pads / leaves

other designated pond platforms

Important design rule:

visible object
↔ collision behavior
↔ shadow behavior

If an object is meant to be a solid obstacle, its visible placeholder, collider, and shadow caster should correspond reasonably.

There should be no invisible/orphan colliders sitting over empty ground.

Fish objective

The fish is the level goal.

Expected behavior:

appears on the right side

visually obvious

centered in its destination/glow marker

uses one shared position for:

fish rendering

goal marker

goal trigger

touching the fish triggers the win state

movement stops after winning

sunlight cannot kill the player after winning

R restarts the level

Visual direction

The intended visual direction is:

top-down garden

central pond

pathways

trees around the edges

flower/garden areas

benches / small structures

cat starting on the left

fish on the right

readable bright sunlight versus dark shadow regions

A polished mockup was used during development as a visual/layout reference only, not something to reproduce exactly.

Tech stack

JavaScript

Phaser 3

WebGL renderer

Vite

HTML/CSS where needed

Run locally with:

npm install
npm run dev

Production build:

npm run build

Project structure

The repo is organized roughly as:

src/
  main.js

  scenes/
    GameScene.js

  entities/
    Player.js
    ShadowCaster.js

  systems/
    SunSystem.js
    ShadowSystem.js
    ExposureSystem.js

  levels/
    level1.js

The exact current files may differ slightly, but the intent is to keep systems modular.

Main system responsibilities

Player.js

Responsible for:

WASD movement

player position

collision footprint

movement resolution

Movement should avoid corner trapping.

A useful approach is resolving X and Y independently:

try X movement
accept/reject X

try Y movement
accept/reject Y

This allows the player to slide along walls rather than becoming stuck.

SunSystem.js

Responsible for:

sunPhase

keyboard + scroll input

clamping sun position

shadow direction / length inputs

sun HUD value

ShadowCaster.js

Represents objects that cast shadows.

Typical properties:

position
width/radius
height
shadowStrength
castsShadow

ShadowSystem.js

Responsible for:

generating shadow polygons

updating them when the sun moves

rendering shadows

checking whether the player is inside at least one shadow

Important:

the same polygon geometry should be used for both rendering and safety checks

shadow checks should use current frame geometry

shadows should remain non-physical

ExposureSystem.js

Responsible for:

current exposure

burn rate

recovery rate

death threshold

Exposure should only update when the game state is PLAYING.

level1.js

Should contain level-specific configuration such as:

player spawn

fish position

trees

benches

pond

platforms

hut

buildings

obstacle geometry

shadow-caster configuration

Prefer keeping coordinates and object definitions here instead of hardcoding them across GameScene.js.

Important bugs already encountered

These were major issues during MVP development and are worth checking if they reappear.

1. Safe HUD but exposure still rising

Symptom:

SAFE — IN SHADOW

while the exposure bar continued rising.

Likely causes included:

multiple sources of truth for isInShadow

HUD and exposure system using different values

incorrect update order

stale shadow state

Correct frame order should conceptually be:

1. update sun
2. update shadow polygons
3. determine isInShadow
4. update exposure
5. check death
6. update HUD

2. Invisible collision zones

At one stage, debug mode showed collision rectangles over empty grass.

This caused the player to become stuck in places with no visible obstacle.

Rule:

Every solid collider should correspond to an intended visible object.

3. Pond platforms treated as obstacles

Leaves/lily pads were initially blocking movement instead of being walkable.

Correct behavior:

plain water = blocked
platform footprint = walkable

Platform handling must override water blocking within the platform footprint.

4. Detached hut roof

The hut roof and body were initially rendered using separate coordinates.

They should be derived from one shared hut definition:

hut.x
hut.y
hut.width
hut.height
hut.roofHeight

This keeps the roof aligned with the body.

5. Duplicate fish visuals

The fish and its destination marker were previously offset, making them look like two separate yellow objects.

Both should use the same goal center coordinates.

Debugging

Debug mode has been useful for validating:

player collider

obstacle colliders

water regions

platform regions

shadow polygons

fish goal radius

Useful runtime values to inspect:

player x/y
gameState

sunPhase
shadowDirection
shadowLengthMultiplier

isInShadow
number of shadows containing player

exposure
burnRate
recoveryRate

movement blocked
blockedBy
onPlatform

distanceToFish
fishCollected

When testing exposure, this should never occur:

isInShadow = true
exposureDelta > 0

Current MVP status

The MVP is mostly settled.

Implemented:

Phaser/Vite setup

top-down movement

controllable sun

dynamic shadows

shadow safety checking

sunlight exposure

recovery

death/reset flow

obstacle logic

pond

walkable pond platforms

central pond hut

fish objective

win condition

debug mode

easy shadow-heavy route for testing

The current goal is no longer to add lots of mechanics.

The next phase should be cleanup, art replacement, and puzzle tuning.

Recommended next steps

1. Replace placeholder visuals

Start replacing geometry with actual assets:

cat sprite

trees

benches

pond

lily pads

hut

pavilion/buildings

fish

Keep collision and shadow data independent from sprite art.

2. Improve map readability

Move toward the reference style:

clearer garden paths

flower beds

cleaner pond edge

more coherent structures

consistent object scale

3. Tune the real puzzle

Once visuals are stable:

reduce unnecessary shadow coverage

intentionally position shadow casters

design a clear sequence of sun adjustments

make the route understandable but not trivial

The current map is intentionally forgiving because it was built as an MVP/testing level.

4. Polish feedback later

Possible later additions:

cat burn animation

shadow-entry feedback

sun movement animation

fish pickup animation

sound

title/menu screen

story context

These are not needed for the current MVP.

Design principles to keep

Core mechanic first.

Keep systems modular.

Do not couple visuals to collision.

Do not couple shadows to physical collision.

Use one source of truth for gameplay state.

Every collider should correspond to something visible.

Use forgiving collision footprints.

Keep the puzzle readable.

Build and test after each small change.

Quick handoff

If you are opening the repo for the first time:

Run:

npm install
npm run dev

Test:

WASD = move
U/H or scroll = move sun
R = restart
D = debug

Confirm:

spawn starts safely in shadow

exposure rises only in sunlight

exposure recovers in shadow

pond water blocks movement

lily pads are walkable

shadows move with the sun

fish can be reached

fish triggers the win state

restart works

If something feels wrong, turn on debug mode and check:

collider alignment

shadow polygon alignment

isInShadow

exposure value

platform/water overlap

The repo should currently be treated as a working gameplay prototype, not final art or final level design.