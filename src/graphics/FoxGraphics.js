// Draws a flat fox silhouette from overlapping shapes and caches 3 frames
// (idle, run, jump) as textures via generateTexture. No image files.
const BODY_COLOR = 0xe8622c;
const BELLY_COLOR = 0xfff4e6;
const W = 48;
const H = 40;

function drawBase(g) {
  g.clear();
  // tail
  g.fillStyle(BODY_COLOR, 1);
  g.fillEllipse(8, 26, 22, 10);
  // body
  g.fillEllipse(26, 24, 28, 18);
  // belly
  g.fillStyle(BELLY_COLOR, 1);
  g.fillEllipse(28, 28, 16, 10);
  // head
  g.fillStyle(BODY_COLOR, 1);
  g.fillCircle(40, 14, 10);
  // ears
  g.fillTriangle(32, 8, 38, -2, 40, 10);
  g.fillTriangle(42, 8, 48, -2, 46, 10);
}

export function generateFoxTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  drawBase(g);
  g.fillStyle(BODY_COLOR, 1);
  g.fillRect(14, 34, 6, 8); // back leg planted
  g.fillRect(34, 34, 6, 8); // front leg planted
  g.generateTexture('fox-idle', W, H);

  g.clear();
  drawBase(g);
  g.fillStyle(BODY_COLOR, 1);
  g.fillRect(10, 30, 6, 10); // back leg forward-raised
  g.fillRect(36, 36, 6, 6); // front leg back
  g.generateTexture('fox-run', W, H);

  g.clear();
  drawBase(g);
  g.fillStyle(BODY_COLOR, 1);
  g.fillRect(14, 30, 6, 6); // legs tucked
  g.fillRect(34, 30, 6, 6);
  g.generateTexture('fox-jump', W, H);

  g.destroy();
}

export const FOX_TEXTURE_SIZE = { width: W, height: H };
