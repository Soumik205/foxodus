// src/config/levels.js
export const LEVELS = [
  {
    key: 'level1',
    name: 'City Rooftops',
    cutsceneKey: 'level1',
    palette: { sky: 0x2b3a55, skyBottom: 0x0a0e14, mid: 0x1c2740, near: 0x11182b },
    worldWidth: 3000,
    playerStart: { x: 100, y: 400 },
    levelEndX: 2850,
    chickens: [
      { x: 400, y: 400 }, { x: 700, y: 380 }, { x: 1100, y: 400 },
      { x: 1500, y: 380 }, { x: 1900, y: 400 }, { x: 2300, y: 380 },
    ],
    enemies: [
      { type: 'zombie', x: 450, rangeStart: 420, rangeEnd: 600 },
      { type: 'zombie', x: 900, rangeStart: 850, rangeEnd: 1050 },
      { type: 'zombie', x: 1800, rangeStart: 1750, rangeEnd: 1950 },
      { type: 'zombie', x: 2450, rangeStart: 2420, rangeEnd: 2600 },
    ],
  },
];
