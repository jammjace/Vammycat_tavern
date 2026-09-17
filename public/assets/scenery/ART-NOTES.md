# Scenery update

`tree.png` and `house.png` were created with the built-in imagegen tool using
the supplied September 17 screenshot as a design and camera-angle reference.
Both have transparent backgrounds, no baked ground shadows, and are used as
both visible scenery and the source silhouettes for dynamic shadows.

The 2400 × 1500 garden uses an elevated three-quarter 2D view with camera
follow and ground-Y depth sorting. The clock begins at 07:00; scrolling moves
between 06:29 and 17:31. Solar elevation controls projection length and the
sun's east-to-west movement reverses its direction after noon. Shadow safety
uses inverse projection into each sprite's alpha mask, including canopy gaps.
Overlapping shadows are composited as a union. F2 displays projection bounds.

The larger scene increases the cat to 110 × 66, trees to roughly 300 × 350,
and the house to 540 × 440. Sun exposure now allows about 4.5 seconds between
shelters. The cat's four-frame loop and idle pose remain unchanged.

## Generation prompts

## tree

Create a single isolated tree game sprite on genuinely transparent background. Reference image supplies design and elevated three-quarter / near-top-down isometric viewing angle. Match its hand drawn storybook cartoon style, warm dark brown ink outlines, flat cel shaded olive/moss greens, muted brown timber, restrained texture; compatible with a white black outlined red-eared cartoon vampire cat. Copy the reference tree design: broad irregular scalloped olive canopy, distinct layered clusters of leaves with dark green patches and little gaps, thick gnarled branching trunk and flared roots. Whole tree, roots bottom center. No ground plane, no cast shadow, no people, no UI, no text. Tight framing, 4% transparent padding. This is a usable individual game asset, not a scene.

## house

Create a single isolated house game sprite on genuinely transparent background. Reference image supplies design and elevated three-quarter / near-top-down isometric viewing angle. Match its hand drawn storybook cartoon style, warm dark brown ink outlines, flat cel shaded olive/moss greens, muted brown timber, restrained texture; compatible with a white black outlined red-eared cartoon vampire cat. Copy the reference house design as one complete smaller cottage: massive steep gray-green individual shingle roof, visible front and right timber walls, thick brown log corner posts, warm small windows, wood door and short stone step. Whole house, complete roof, no cropping. No ground plane, no cast shadow, no people, no UI, no text. Tight framing, 4% transparent padding. This is a usable individual game asset, not a scene.
