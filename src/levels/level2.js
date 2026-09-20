import { tutorialLevel } from './tutorialLevel.js';

// The pool interrupts the direct line between roots, leaving room south of it.
export const level2 = tutorialLevel({
  id: 'two-trees', name: 'Level 2 · Beside the pond',
  start: { x: 165, y: 505 }, goal: { x: 1090, y: 510 },
  treePositions: [
    { x: 400, y: 370, width: 390, height: 320, texture: 'tree-2' },
    { x: 840, y: 385, width: 390, height: 330, texture: 'tree-2' },
  ],
  pools: [{ x: 620, y: 410, width: 200, height: 150 }],
});
