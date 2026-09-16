const treePositions = [
  { x: 200, y: 500, radius: 54 },
  { x: 250, y: 165, radius: 46 },
  { x: 350, y: 400, radius: 42 },
  { x: 470, y: 300, radius: 44 },
  { x: 805, y: 350, radius: 46 },
  { x: 900, y: 180, radius: 52 },
  { x: 980, y: 220, radius: 44 },
  { x: 1070, y: 300, radius: 46 },
  { x: 1140, y: 420, radius: 42 },
];

const treeTrunkObstacles = treePositions.map((tree) => ({
  type: 'TREE',
  x: tree.x,
  y: tree.y + tree.radius * 0.9,
  radius: tree.radius * 0.42,
  blocksMovement: true,
}));

const benchObjects = [
  {
    x: 520,
    y: 300,
    width: 180,
    height: 22,
    supports: [
      { x: 465, y: 325, width: 18, height: 36 },
      { x: 575, y: 325, width: 18, height: 36 },
    ],
    shadow: { x: 520, y: 316, width: 180, height: 54 },
  },
  {
    x: 900,
    y: 430,
    width: 180,
    height: 18,
    supports: [
      { x: 845, y: 452, width: 18, height: 34 },
      { x: 955, y: 452, width: 18, height: 34 },
    ],
    shadow: { x: 900, y: 445, width: 180, height: 48 },
  },
];

const benchShadowCasters = benchObjects.map((bench) => ({
  ...bench.shadow,
  visible: false,
}));

const buildingObjects = [
  { x: 1025, y: 520, width: 190, height: 60, roofWidth: 220, roofHeight: 18 },
];

const pondHut = {
  x: 640,
  y: 420,
  width: 72,
  height: 44,
  roofWidth: 96,
  roofHeight: 20,
};

export const level1 = {
  name: 'Boston Public Garden',
  width: 1280,
  height: 720,
  start: { x: 120, y: 600 },
  goal: { type: 'fish', x: 1110, y: 360 },
  treePositions,
  benchObjects,
  buildingObjects,
  pondHut,
  shadowCasters: [
    { x: 200, y: 545, width: 36, height: 60 },
    { x: 250, y: 215, width: 36, height: 54 },
    { x: 350, y: 445, width: 34, height: 58 },
    { x: 470, y: 345, width: 34, height: 58 },
    { x: 805, y: 395, width: 36, height: 60 },
    { x: 900, y: 225, width: 38, height: 58 },
    { x: 980, y: 265, width: 34, height: 58 },
    { x: 1070, y: 345, width: 36, height: 60 },
    { x: 1140, y: 465, width: 34, height: 58 },
    ...benchShadowCasters,
    pondHut,
  ],
  solidObstacles: [
    ...treeTrunkObstacles,
    ...benchObjects.flatMap((bench) => [
      { type: 'BENCH', x: bench.x, y: bench.y, width: bench.width, height: bench.height, blocksMovement: true },
      ...bench.supports.map((support) => ({ type: 'BENCH', ...support, blocksMovement: true })),
    ]),
    ...buildingObjects.map((building) => ({ type: 'BUILDING', ...building, blocksMovement: true })),
    { type: 'BUILDING', ...pondHut, blocksMovement: true },
  ],
  waterZones: [
    { x: 640, y: 495, width: 260, height: 210, blocksMovement: true },
  ],
  platforms: [
    { x: 545, y: 505, width: 110, height: 54, isWalkablePlatform: true },
    { x: 620, y: 520, width: 110, height: 54, isWalkablePlatform: true },
    { x: 700, y: 520, width: 110, height: 54, isWalkablePlatform: true },
    { x: 755, y: 520, width: 90, height: 54, isWalkablePlatform: true },
  ],
};
