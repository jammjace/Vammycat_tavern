# Art branch assets

`src/art/GardenArt.js` draws reusable, seeded canvas textures directly in Phaser.
Grass blades follow the root-anchored curved replacement-mask approach in
`/Users/chloe/campbreeze-grass/main.js`, with olive highlights and green shadows.
This is a Phaser adaptation, not the reference's original Pixi/WebGPU shaders.

The supplied `Campbreeze_files/main.js` draws props procedurally (including
`Dme` canopy boughs, `rdt` soft foliage shadows and `idt` layered wooden props).
The garden uses that layered drawing approach and muted wood/foliage palette
for its existing trees, benches, buildings and pond. No bundled third-party
runtime or external downloads are needed.

`cat/run-01.png` through `run-04.png` are transparent PNG cutouts made from
the respective `Downloads/cat/cat_01.jpeg` through `cat_04.jpeg` images with
the built-in imagegen tool. They are AI-processed cutouts, not pixel-identical
mechanical extractions. Original JPEGs remain untouched.

Prompt used for each respective frame:
“Extract this exact cat drawing onto a genuinely transparent PNG background.
Preserve the original pose, black outlines, white body and face, red ears and
tail, all interior white regions. Remove only exterior white background. Do
not redesign, redraw, add shadows or alter proportions. Output a tight bounding
box with small transparent padding around the entire cat including tail.
This is animation frame [1–4] of four; preserve the exact input silhouette.”

Movement loops frames 1–4 at 10 fps; idle, blocked movement, win and reset hold
frame 1. Horizontal movement mirrors the sprite. The collision radius remains
18 pixels. Shadow safety tests use the same polygons as the visible shadow
cores; soft outlines are decorative. F2 toggles shadow debugging.

Verification: `npm run build`; `node tests/art.cjs` with the dev server on
port 5175. The browser check uses the local Playwright installation also used
by the supplied grass study and writes `art-preview.png`.
