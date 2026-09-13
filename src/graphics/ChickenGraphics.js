// src/graphics/ChickenGraphics.js
// Procedural chicken silhouette with a 2-frame wing-flap animation, combined with Chicken.js's
// vertical bob tween, so the pickup reads as hovering/flying in place rather than static.
const W = 40;
const H = 26;

function drawBody(g) {
  g.fillStyle(0xfef6e4, 1);
  g.fillEllipse(20, 16, 20, 16); // body
  g.fillCircle(28, 8, 7); // head
  g.fillStyle(0xd94f4f, 1);
  g.fillTriangle(32, 6, 38, 8, 32, 10); // wattle
  g.fillStyle(0xe8622c, 1);
  g.fillTriangle(32, 4, 36, 0, 34, 6); // comb
}

export function generateChickenTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  g.clear();
  drawBody(g);
  g.fillStyle(0xf6e2c4, 1);
  g.fillTriangle(14, 12, 2, 3, 10, 20); // wing raised
  g.generateTexture('chicken-wing-up', W, H);

  g.clear();
  drawBody(g);
  g.fillStyle(0xf6e2c4, 1);
  g.fillTriangle(14, 18, 2, 25, 10, 10); // wing lowered
  g.generateTexture('chicken-wing-down', W, H);

  g.destroy();

  if (!scene.anims.exists('chicken-fly')) {
    scene.anims.create({
      key: 'chicken-fly',
      frames: [{ key: 'chicken-wing-up' }, { key: 'chicken-wing-down' }],
      frameRate: 6,
      repeat: -1,
    });
  }
}
