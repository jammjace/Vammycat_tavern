import { groundPoint } from './geometry.js';

// Tutorials use the same caster and collision footprints as Willowcross.
export function tutorialLevel({ id, name, start, goal, treePositions, pools = [] }) {
  return {
    id, name, width: 1280, height: 720, start, goal,
    burnRate: 1.2, startPhase: -5 / 6, cameraFollow: false,
    debugVisible: false, collisionDebug: false,
    objective: `${name.toUpperCase()}\nRETRIEVE YOUR FISH`,
    treePositions, buildingObjects: [], benchObjects: [],
    roads: [], entrances: [], platforms: [],
    waterZones: pools.map(pool => ({
      ...pool, groundX: groundPoint(pool.x, pool.y).x, groundY: groundPoint(pool.x, pool.y).y,
    })),
    shadowCasters: treePositions.map(tree => ({ ...tree, anchorY: .96 })),
    solidObstacles: treePositions.map(tree => ({
      type: 'TREE', x: tree.x, y: tree.y - 5, radius: 14, blocksMovement: true,
    })),
  };
}
