// src/graphics/ChickenGraphics.js
export function generateChickenTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xfef6e4, 1);
  g.fillEllipse(12, 14, 20, 16); // body
  g.fillCircle(20, 6, 7); // head
  g.fillStyle(0xd94f4f, 1);
  g.fillTriangle(24, 4, 30, 6, 24, 8); // beak/comb-ish wattle
  g.fillStyle(0xe8622c, 1);
  g.fillTriangle(24, 2, 28, -2, 26, 4); // comb
  g.generateTexture('chicken', 32, 24);
  g.destroy();
}
