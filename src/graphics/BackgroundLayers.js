import Phaser from 'phaser';

// Generates 3 gradient-filled rectangle textures (sky/mid/near) sized to the viewport,
// for a level's palette. Called once per level load with that level's palette colors.
export function generateParallaxTextures(scene, key, palette) {
  const { width, height } = scene.scale;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  drawGradientLayer(g, width, height, palette.sky, palette.skyBottom ?? palette.sky);
  g.generateTexture(`${key}-sky`, width, height);

  g.clear();
  drawSilhouetteLayer(g, width, height, palette.mid);
  g.generateTexture(`${key}-mid`, width, height);

  g.clear();
  drawSilhouetteLayer(g, width, height, palette.near, 0.9);
  g.generateTexture(`${key}-near`, width, height);

  g.destroy();
}

function drawGradientLayer(g, width, height, colorTop, colorBottom) {
  const steps = 20;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(colorTop),
      Phaser.Display.Color.ValueToColor(colorBottom),
      steps,
      i,
    );
    g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
    g.fillRect(0, (height / steps) * i, width, height / steps + 1);
  }
}

function drawSilhouetteLayer(g, width, height, color, alpha = 0.75) {
  g.fillStyle(color, alpha);
  // simple jagged skyline silhouette, deterministic (no Math.random in shipped code path per
  // repeatability across restarts — uses a fixed pattern instead)
  const blockCount = 12;
  const blockWidth = width / blockCount;
  for (let i = 0; i < blockCount; i += 1) {
    const blockHeight = height * (0.2 + 0.15 * ((i * 37) % 5) / 5);
    g.fillRect(i * blockWidth, height - blockHeight, blockWidth - 4, blockHeight);
  }
}
