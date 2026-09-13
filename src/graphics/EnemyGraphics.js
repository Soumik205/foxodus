// src/graphics/EnemyGraphics.js
export function generateZombieTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x4a5240, 1);
  g.fillEllipse(20, 30, 24, 20); // torso
  g.fillCircle(20, 10, 11); // head
  g.fillStyle(0x8a1f1f, 1);
  g.fillCircle(16, 8, 2); // eye glow
  g.fillCircle(24, 8, 2);
  g.fillStyle(0x4a5240, 1);
  g.fillRect(6, 22, 10, 22); // left arm hanging
  g.fillRect(24, 22, 10, 22); // right arm hanging
  g.generateTexture('zombie', 40, 46);
  g.destroy();
}
