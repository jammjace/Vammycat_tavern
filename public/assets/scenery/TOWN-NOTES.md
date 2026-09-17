# Willowcross town update

The level now has a main street, a perpendicular lane, a paved fountain square,
four buildings with front paths, an avenue of trees, and two planted groves.

Controls: scroll changes time; Shift + scroll (or Ctrl + scroll) zooms the map.
The open debug panel also provides zoom buttons and a 45–160% slider. F2 opens
or collapses the panel. Hitboxes start visible; the panel can toggle them,
shadow projection bounds, and the painterly shader independently.

Red outlines show actual solid geometry, not geometry expanded by the player's
radius. Trees use a 14-pixel trunk circle; roots are walkable. Cyan outlines
show water, gold outlines show the cat and fish, and the outer outline shows
the movement boundary. Player collision still uses its 18-pixel radius.

Tree sprites and projected silhouettes share the same trunk-ground anchor
(90% of source image height). Contact shade connects the canopy silhouette to
the roots, and an alpha-clipped overlay darkens the lower bark/root artwork.
Contact shade and projected alpha both count as shelter. All four houses have
their own projected silhouette and contact shade.

`src/art/CampbreezePipeline.js` ports the supplied grass study's
`shaders/painterly.wgsl` to a Phaser GLSL post-processing pipeline: Sobel
orientation, four-sector variance smoothing, noise wobble, soft posterization,
and paper/fiber grain. Parameters are adapted for outlined sprites (65% blend,
1.35 saturation, 2.5-pixel kernel). It processes the entire world, including
trees, buildings, cat, benches, water, grass, lighting and shadows. A separate
UI camera keeps the HUD unfiltered and independent of map zoom. The effect
requires WebGL; the scene remains playable without it in Canvas fallback.

No new generated assets were needed for this update. Source assets remain
unchanged; bark shading is a runtime canvas mask.

Verification: `npm run build` and `node tests/art.cjs` with port 5175 running.
Browser checks cover time/zoom wheel input, fixed UI zoom, initial shelter,
trunk collision versus walkable roots, house shelter, and visible shader
on/off differences. `town-preview.png` captures the layout at 55% zoom.
