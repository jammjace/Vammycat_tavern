import { tutorialLevel } from './tutorialLevel.js';

// Approach sheltered roots in the morning, then swing the shadow east.
export const level1 = tutorialLevel({
  id: 'one-tree', name: 'Level 1 ? One tree',
  start: { x: 370, y: 525 }, goal: { x: 890, y: 500 },
  treePositions: [
    { x: 630, y: 385, width: 400, height: 330, texture: 'tree-2' },
  ],
});
