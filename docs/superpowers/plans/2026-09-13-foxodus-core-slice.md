# Foxodus Core Slice Implementation Plan (Milestones 1–4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable vertical slice — title/lore screen, Fox movement (run/jump/dash), the
chicken health/hunger loop, one enemy type, and a fully completable Level 1 — running via
`npm run dev`, with the cutscene system wired in (using procedural fallbacks; real video drops
in later without code changes).

**Architecture:** Phaser 3 scenes (`Boot → Title → Level → Win/GameOver`, `UI` running parallel)
driven by a data config object per level. All visuals are procedural (Canvas/Graphics drawn
once, cached via `generateTexture`). Physics via Phaser Arcade Physics. Plain JavaScript, no
TypeScript.

**Tech Stack:** Phaser 3 (latest 3.8x), Vite 5, Vitest (pure-logic unit tests only — see Testing
Approach below), npm.

**Spec:** `docs/superpowers/specs/2026-09-13-foxodus-design.md` (this plan implements README
§8–9 Milestones 1–4, plus spec §2–3's audio/cutscene architecture at the stub/hook level —
full AudioManager synthesis content and all 5 level configs are Plan B).

## Global Constraints

- No hand-drawn/external art assets — everything procedural (README §5).
- No TypeScript; plain `.js` per the existing folder structure (decisions.md).
- Object pooling required for anything spawned/destroyed repeatedly (README §10).
- No allocation inside `update()` loops — predefine reusable vars/vectors (README §10).
- Explicit scene-shutdown cleanup: input listeners, `time.removeAllEvents()`,
  `tweens.killAll()`, unused textures removed (README §10).
- No `eval`/`Function()`/`innerHTML` with dynamic strings anywhere (README §11).
- Exactly one action button (dash) — no second action/combo input (README §3, §14).
- Health/hunger, chicken pickups, and score are ONE mechanic, not three (README §4).
- Every cutscene slot must have a procedural fallback — missing video never blocks play
  (design spec §3).

**Testing approach for this plan (deliberate deviation from strict step-level TDD):** This is a
time-boxed, feel-driven 2D platformer. Automated unit tests (Vitest, no DOM/canvas) apply to
**pure logic only**: health/hunger math, input-to-action mapping, save-data schema validation.
Phaser rendering, physics feel, and scene flow are verified by **explicit manual checks against
`npm run dev`** — each such step lists exactly what to look at and what "correct" looks like, so
verification is concrete rather than vague, even though it isn't automated. This matches the
user's own requested workflow (visual check after every milestone).

---

## File Structure

```
/foxodus
  package.json
  vite.config.js
  index.html
  /public
    favicon.svg
  /src
    main.js
    /scenes
      BootScene.js       # loads nothing external; generates all textures; -> TitleScene
      TitleScene.js       # lore scroll text + start button + intro cutscene slot
      LevelScene.js        # generic, config-driven; owns Fox, enemies, chickens, camera
      UIScene.js           # HUD: health bar, dash cooldown pip; runs parallel to LevelScene
      GameOverScene.js      # health hit 0 -> restart same level instantly
      WinScene.js           # level 1 complete -> "more levels coming" placeholder (Plan B wires real win)
    /entities
      Fox.js               # player controller: movement, jump, dash, health, i-frames
      Chicken.js            # pickup: idle bob animation, overlap -> heal + destroy(pooled)
      Enemy.js               # base class: patrol movement + contact damage, pooled
      ZombiePatrol.js        # concrete Enemy: back-and-forth ground patrol
    /systems
      InputController.js    # abstracts keyboard (arrows/WASD/space/shift) into one action interface
      ObjectPool.js          # generic pool wrapper over Phaser.GameObjects.Group
      SaveManager.js         # localStorage wrapper, try/catch + schema validation (used by SaveManager tests; wired minimally now, expanded in Plan B)
      CutsceneManager.js     # DOM <video> overlay with procedural-fallback slots
      HealthSystem.js        # pure logic: drain-over-time + pickup heal + damage math (no Phaser deps, unit tested)
    /graphics
      FoxGraphics.js         # procedural fox silhouette -> generateTexture, run/jump/dash frames
      EnemyGraphics.js        # procedural zombie-patrol silhouette -> generateTexture
      ChickenGraphics.js      # procedural chicken silhouette -> generateTexture
      BackgroundLayers.js     # procedural parallax gradient layers -> generateTexture
    /config
      constants.js            # physics/health/dash tuning values
      levels.js                # level config array; only level 1 populated this plan
  /tests
    HealthSystem.test.js
    InputController.test.js
    SaveManager.test.js
```

**Interfaces at a glance** (exact names later tasks depend on):
- `InputController.getState()` → `{ left: bool, right: bool, jump: bool, jumpPressed: bool, dash: bool, dashPressed: bool }` (`*Pressed` = true only on the frame the key/tap went down, for edge-triggered actions like jump/dash).
- `HealthSystem` — pure class: `new HealthSystem(maxHealth)`, `.tick(deltaMs)`, `.pickupHeal(amount)`, `.takeDamage(amount)`, `.current`, `.isDead`.
- `Fox` (extends `Phaser.Physics.Arcade.Sprite`) — `.health` (a `HealthSystem` instance), `.isInvulnerable`, methods `.handleInput(inputState, deltaMs)`.
- `ObjectPool` — `new ObjectPool(scene, classType, initialSize)`, `.spawn(x, y, ...args)`, `.despawn(instance)`.
- `Enemy` base — `.contactDamage`, `.update(time, delta)` patrol logic; `ZombiePatrol extends Enemy`.
- `Chicken` — `.healAmount`, overlap callback signature `(fox, chicken) => void`.
- `CutsceneManager.play(slotKey, onComplete)` — checks `/videos/<slotKey>.mp4` existence, plays DOM overlay if present, else calls `onComplete` immediately (fallback is the caller's responsibility — TitleScene/LevelScene render their own fallback visuals, `CutsceneManager` only knows video-or-not).
- `SaveManager.load()` → validated object or `null`; `SaveManager.save(obj)` → bool success.
- `levels.js` exports `LEVELS` array; each entry: `{ key, name, palette: {sky, mid, near}, musicKey, chickens: [{x,y}], enemies: [{type, x, y, range}], playerStart: {x,y}, levelEndX, cutsceneKey }`.

---

## Task 1: Project Scaffold & Boot

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `public/favicon.svg`
- Create: `src/main.js`, `src/scenes/BootScene.js`, `src/config/constants.js`
- Test: manual only (no logic to unit test yet)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a running Vite+Phaser app; `constants.js` exports the tuning object every later task
  reads from (see Step 3 for exact shape).

- [ ] **Step 1: Init package.json and install dependencies**

```bash
npm init -y
npm install phaser@^3.80.1
npm install -D vite@^5.4.0 vitest@^2.1.0
```

Edit `package.json` scripts block to:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Create index.html with CSP meta tag (README §11 requirement)**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self'; img-src 'self' data:;" />
    <title>Foxodus</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      html, body { margin: 0; padding: 0; background: #0a0e14; overflow: hidden; height: 100%; }
      #game-container { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Create a minimal `public/favicon.svg` (a plain vector fox-head triangle, procedural in spirit):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <polygon points="16,4 28,28 4,28" fill="#e8622c"/>
  <polygon points="16,14 22,28 10,28" fill="#fff4e6"/>
</svg>
```

- [ ] **Step 3: Create constants.js with initial tuning values**

```javascript
// src/config/constants.js
export const PHYSICS = {
  GRAVITY_Y: 1400,
  MOVE_SPEED: 220,
  JUMP_VELOCITY: -520,
  DASH_SPEED: 650,
  DASH_DURATION_MS: 220,
  DASH_COOLDOWN_MS: 900,
  DASH_IFRAME_MS: 250,
};

export const HEALTH = {
  MAX: 100,
  DRAIN_PER_SEC: 1.2,
  CHICKEN_HEAL: 18,
  ENEMY_DAMAGE: 30,
  POST_HIT_INVULN_MS: 800,
};

export const SCREEN = {
  WIDTH: 960,
  HEIGHT: 540,
};
```

- [ ] **Step 4: Create BootScene and main.js**

```javascript
// src/scenes/BootScene.js
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('TitleScene');
  }
}
```

```javascript
// src/main.js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import { SCREEN } from './config/constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: SCREEN.WIDTH,
  height: SCREEN.HEIGHT,
  backgroundColor: '#0a0e14',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
};

new Phaser.Game(config);
```

Note: `TitleScene` doesn't exist yet — for this task only, temporarily change
`this.scene.start('TitleScene')` to a placeholder scene, OR just add a trivial inline scene here
that prints "Foxodus booted" via a Phaser Text object so this task is independently verifiable.
Use this minimal placeholder:

```javascript
// src/scenes/BootScene.js (Task 1 version — TitleScene wiring happens in Task 4)
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Foxodus — booted', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#e8622c',
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
Expected: browser opens to a dark page with orange "Foxodus — booted" text centered on screen,
no errors in the browser console.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html public/favicon.svg src/
git commit -m "Scaffold Vite + Phaser project skeleton"
```

(Create `vite.config.js` as an empty default export if Vite's scaffolding didn't add one:
`export default {};`)

---

## Task 2: Core Movement, Fox Graphics, Camera & Parallax

**Files:**
- Create: `src/graphics/FoxGraphics.js`, `src/graphics/BackgroundLayers.js`
- Create: `src/systems/InputController.js`, `src/systems/HealthSystem.js`
- Create: `src/entities/Fox.js`
- Create: `src/scenes/LevelScene.js` (minimal: just ground + Fox + camera + parallax for this task; enemies/chickens arrive in Task 3)
- Modify: `src/scenes/BootScene.js` (generate shared textures, then start LevelScene directly for this task's manual test)
- Test: `tests/HealthSystem.test.js`, `tests/InputController.test.js`

**Interfaces:**
- Consumes: `PHYSICS`, `HEALTH`, `SCREEN` from `constants.js` (Task 1).
- Produces: `InputController.getState()` shape (see File Structure section) — Task 3's Enemy/
  Chicken don't need input, but Task 4's scenes wire `InputController` the same way. `HealthSystem`
  class shape — Task 3 wires it into `Fox.health` for real damage/heal calls.

- [ ] **Step 1: Write HealthSystem unit tests (pure logic, no Phaser)**

```javascript
// tests/HealthSystem.test.js
import { describe, it, expect } from 'vitest';
import HealthSystem from '../src/systems/HealthSystem.js';

describe('HealthSystem', () => {
  it('starts at max health', () => {
    const hs = new HealthSystem(100);
    expect(hs.current).toBe(100);
    expect(hs.isDead).toBe(false);
  });

  it('drains over time proportionally to deltaMs and drainPerSec', () => {
    const hs = new HealthSystem(100, { drainPerSec: 10 });
    hs.tick(500); // 0.5s
    expect(hs.current).toBeCloseTo(95, 5);
  });

  it('clamps drain at zero and marks dead', () => {
    const hs = new HealthSystem(10, { drainPerSec: 100 });
    hs.tick(1000);
    expect(hs.current).toBe(0);
    expect(hs.isDead).toBe(true);
  });

  it('pickupHeal increases health but never above max', () => {
    const hs = new HealthSystem(100, { drainPerSec: 0 });
    hs.tick(0);
    hs.current = 90;
    hs.pickupHeal(30);
    expect(hs.current).toBe(100);
  });

  it('takeDamage reduces health and can kill', () => {
    const hs = new HealthSystem(100, { drainPerSec: 0 });
    hs.takeDamage(40);
    expect(hs.current).toBe(60);
    hs.takeDamage(70);
    expect(hs.current).toBe(0);
    expect(hs.isDead).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/systems/HealthSystem.js'`

- [ ] **Step 3: Implement HealthSystem**

```javascript
// src/systems/HealthSystem.js
export default class HealthSystem {
  constructor(max, opts = {}) {
    this.max = max;
    this.current = max;
    this.drainPerSec = opts.drainPerSec ?? 0;
    this.isDead = false;
  }

  tick(deltaMs) {
    if (this.isDead) return;
    this._apply(-this.drainPerSec * (deltaMs / 1000));
  }

  pickupHeal(amount) {
    if (this.isDead) return;
    this._apply(amount);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this._apply(-amount);
  }

  _apply(delta) {
    this.current = Math.max(0, Math.min(this.max, this.current + delta));
    if (this.current <= 0) {
      this.current = 0;
      this.isDead = true;
    }
  }
}
```

- [ ] **Step 4: Run tests, verify HealthSystem tests pass**

Run: `npm test`
Expected: 5 passing tests in `HealthSystem.test.js`.

- [ ] **Step 5: Write InputController unit tests**

`InputController` needs a fake keyboard object for testing without a real DOM/Phaser instance.
It's designed to accept a minimal `keys` object with boolean `.isDown` properties (matching
Phaser's `Key` shape) so it's testable in isolation and later driven by real Phaser key objects.

```javascript
// tests/InputController.test.js
import { describe, it, expect } from 'vitest';
import InputController from '../src/systems/InputController.js';

function makeKeys(overrides = {}) {
  return {
    left: { isDown: false, ...overrides.left },
    right: { isDown: false, ...overrides.right },
    jump: { isDown: false, ...overrides.jump },
    dash: { isDown: false, ...overrides.dash },
    ...overrides,
  };
}

describe('InputController', () => {
  it('reports left/right movement from key state', () => {
    const ic = new InputController();
    ic._keys = makeKeys({ left: { isDown: true } });
    let state = ic.getState();
    expect(state.left).toBe(true);
    expect(state.right).toBe(false);
  });

  it('reports jumpPressed only on the rising edge', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic._keys.jump.isDown = true;
    let state = ic.getState();
    expect(state.jump).toBe(true);
    expect(state.jumpPressed).toBe(true);

    state = ic.getState(); // still held, same key object
    expect(state.jumpPressed).toBe(false);

    ic._keys.jump.isDown = false;
    state = ic.getState();
    ic._keys.jump.isDown = true;
    state = ic.getState();
    expect(state.jumpPressed).toBe(true);
  });

  it('reports dashPressed only on the rising edge, independent of jump', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic._keys.dash.isDown = true;
    let state = ic.getState();
    expect(state.dashPressed).toBe(true);
    state = ic.getState();
    expect(state.dashPressed).toBe(false);
  });

  it('touch overrides can force a direction/action true for one getState call', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic.setTouchState({ left: true, dash: true });
    const state = ic.getState();
    expect(state.left).toBe(true);
    expect(state.dashPressed).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests, verify they fail**

Run: `npm test`
Expected: FAIL — `InputController.js` doesn't exist.

- [ ] **Step 7: Implement InputController**

```javascript
// src/systems/InputController.js
// Abstracts keyboard + touch into one action interface. Real Phaser key binding happens in
// bindKeyboard(scene); tests inject a fake `_keys` object directly (see tests/InputController.test.js).
export default class InputController {
  constructor() {
    this._keys = null;
    this._touch = { left: false, right: false, jump: false, dash: false };
    this._prevJumpDown = false;
    this._prevDashDown = false;
  }

  bindKeyboard(scene) {
    const kc = scene.input.keyboard.addKeys({
      left: 'LEFT,A',
      right: 'RIGHT,D',
      jump: 'SPACE,UP,W',
      dash: 'SHIFT',
    });
    this._keys = kc;
  }

  // Mobile touch overlay calls this each frame with the currently-held buttons.
  setTouchState(partial) {
    Object.assign(this._touch, partial);
  }

  clearTouchState() {
    this._touch.left = false;
    this._touch.right = false;
    this._touch.jump = false;
    this._touch.dash = false;
  }

  getState() {
    const k = this._keys;
    const left = !!(k?.left?.isDown) || this._touch.left;
    const right = !!(k?.right?.isDown) || this._touch.right;
    const jumpDown = !!(k?.jump?.isDown) || this._touch.jump;
    const dashDown = !!(k?.dash?.isDown) || this._touch.dash;

    const jumpPressed = jumpDown && !this._prevJumpDown;
    const dashPressed = dashDown && !this._prevDashDown;

    this._prevJumpDown = jumpDown;
    this._prevDashDown = dashDown;

    // One-shot touch triggers (jump/dash buttons) consume themselves so a held setTouchState
    // call from a previous frame doesn't re-trigger; the touch overlay (Task 7) calls
    // clearTouchState() after reading, per-frame.
    return { left, right, jump: jumpDown, jumpPressed, dash: dashDown, dashPressed };
  }
}
```

- [ ] **Step 8: Run tests, verify all pass**

Run: `npm test`
Expected: all `InputController.test.js` + `HealthSystem.test.js` tests pass (9 total).

- [ ] **Step 9: Implement FoxGraphics (procedural silhouette → texture)**

```javascript
// src/graphics/FoxGraphics.js
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
```

- [ ] **Step 10: Implement BackgroundLayers (procedural parallax gradients → texture)**

```javascript
// src/graphics/BackgroundLayers.js
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
```

Add `import Phaser from 'phaser';` at the top of `BackgroundLayers.js` (needed for
`Phaser.Display.Color`).

- [ ] **Step 11: Implement Fox entity**

```javascript
// src/entities/Fox.js
import Phaser from 'phaser';
import { PHYSICS, HEALTH } from '../config/constants.js';
import HealthSystem from '../systems/HealthSystem.js';

export default class Fox extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fox-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(30, 30).setOffset(10, 8);

    this.health = new HealthSystem(HEALTH.MAX, { drainPerSec: HEALTH.DRAIN_PER_SEC });
    this.isInvulnerable = false;
    this._invulnTimerMs = 0;

    this._dashTimerMs = 0;
    this._dashCooldownMs = 0;
    this._isDashing = false;
    this._facing = 1;
  }

  get dashCooldownRatio() {
    return Phaser.Math.Clamp(1 - this._dashCooldownMs / PHYSICS.DASH_COOLDOWN_MS, 0, 1);
  }

  handleInput(inputState, deltaMs) {
    this.health.tick(deltaMs);

    if (this._invulnTimerMs > 0) {
      this._invulnTimerMs -= deltaMs;
      if (this._invulnTimerMs <= 0) this.isInvulnerable = false;
    }
    if (this._dashCooldownMs > 0) this._dashCooldownMs -= deltaMs;

    if (this._isDashing) {
      this._dashTimerMs -= deltaMs;
      if (this._dashTimerMs <= 0) {
        this._isDashing = false;
        this.body.setVelocityX(0);
      }
      return; // no directional control mid-dash
    }

    if (inputState.dashPressed && this._dashCooldownMs <= 0) {
      this._startDash();
      return;
    }

    let vx = 0;
    if (inputState.left) { vx = -PHYSICS.MOVE_SPEED; this._facing = -1; }
    if (inputState.right) { vx = PHYSICS.MOVE_SPEED; this._facing = 1; }
    this.body.setVelocityX(vx);
    this.setFlipX(this._facing < 0);

    if (inputState.jumpPressed && this.body.blocked.down) {
      this.body.setVelocityY(PHYSICS.JUMP_VELOCITY);
    }

    if (!this.body.blocked.down) {
      this.setTexture('fox-jump');
    } else if (vx !== 0) {
      this.setTexture('fox-run');
    } else {
      this.setTexture('fox-idle');
    }
  }

  takeHit(damage) {
    if (this.isInvulnerable) return;
    this.health.takeDamage(damage);
    this.isInvulnerable = true;
    this._invulnTimerMs = HEALTH.POST_HIT_INVULN_MS;
  }

  pickupChicken(healAmount) {
    this.health.pickupHeal(healAmount);
  }

  _startDash() {
    this._isDashing = true;
    this._dashTimerMs = PHYSICS.DASH_DURATION_MS;
    this._dashCooldownMs = PHYSICS.DASH_COOLDOWN_MS;
    this.isInvulnerable = true;
    this._invulnTimerMs = PHYSICS.DASH_IFRAME_MS;
    this.body.setVelocityX(PHYSICS.DASH_SPEED * this._facing);
  }
}
```

- [ ] **Step 12: Implement minimal LevelScene for this task (ground + Fox + camera + parallax)**

```javascript
// src/scenes/LevelScene.js
import Phaser from 'phaser';
import { generateFoxTextures } from '../graphics/FoxGraphics.js';
import { generateParallaxTextures } from '../graphics/BackgroundLayers.js';
import InputController from '../systems/InputController.js';
import Fox from '../entities/Fox.js';

const TEST_PALETTE = { sky: 0x2b3a55, skyBottom: 0x0a0e14, mid: 0x1c2740, near: 0x11182b };

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  create() {
    generateFoxTextures(this);
    generateParallaxTextures(this, 'l1', TEST_PALETTE);

    const worldWidth = 3000;
    this.physics.world.setBounds(0, 0, worldWidth, this.scale.height);

    this.skyLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'l1-sky').setOrigin(0).setScrollFactor(0);
    this.midLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'l1-mid').setOrigin(0).setScrollFactor(0.3);
    this.nearLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'l1-near').setOrigin(0).setScrollFactor(0.6);

    const ground = this.add.rectangle(worldWidth / 2, this.scale.height - 20, worldWidth, 40, 0x1a1f2b);
    this.physics.add.existing(ground, true);

    this.input_ = new InputController();
    this.input_.bindKeyboard(this);

    this.fox = new Fox(this, 100, this.scale.height - 100);
    this.physics.add.collider(this.fox, ground);

    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);
    this.cameras.main.startFollow(this.fox, true, 0.1, 0.1);
  }

  update(time, delta) {
    const inputState = this.input_.getState();
    this.fox.handleInput(inputState, delta);

    this.midLayer.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.nearLayer.tilePositionX = this.cameras.main.scrollX * 0.6;
  }

  shutdown() {
    this.input_ = null;
    this.time.removeAllEvents();
    this.tweens.killAll();
  }
}
```

- [ ] **Step 13: Wire BootScene to start LevelScene directly for manual testing**

```javascript
// src/scenes/BootScene.js (temporary wiring for Task 2 verification — Task 4 rewires to TitleScene)
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('LevelScene');
  }
}
```

```javascript
// src/main.js — add LevelScene to the scene array
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import LevelScene from './scenes/LevelScene.js';
import { SCREEN } from './config/constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: SCREEN.WIDTH,
  height: SCREEN.HEIGHT,
  backgroundColor: '#0a0e14',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1400 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, LevelScene],
};

new Phaser.Game(config);
```

(Note: gravity now lives in the Phaser config directly, using `PHYSICS.GRAVITY_Y` — import it:
`import { SCREEN, PHYSICS } from './config/constants.js';` and use
`arcade: { gravity: { y: PHYSICS.GRAVITY_Y }, debug: false }`.)

- [ ] **Step 14: Manual verification**

Run: `npm run dev`
Expected, checked in browser:
1. A fox silhouette (orange body, cream belly, triangular ears) stands on a dark ground strip.
2. Arrow keys / A-D move it left/right; sprite visibly flips to face direction; a background
   layer visibly parallax-scrolls slower than the ground as you move (3 distinct scroll speeds).
3. Space/Up/W jumps with a visible gravity arc, lands back on the ground.
4. Shift triggers a fast horizontal burst (dash) with a brief cooldown before it can be used
   again — moving the fox rapidly confirms it can't be spammed every frame.
5. No errors in the browser console.

- [ ] **Step 15: Commit**

```bash
git add src/ tests/
git commit -m "Add Fox movement, procedural graphics, camera follow, and parallax background"
```

---

## Task 3: Chicken Health Loop + First Enemy

**Files:**
- Create: `src/graphics/ChickenGraphics.js`, `src/graphics/EnemyGraphics.js`
- Create: `src/entities/Chicken.js`, `src/entities/Enemy.js`, `src/entities/ZombiePatrol.js`
- Create: `src/systems/ObjectPool.js`
- Modify: `src/scenes/LevelScene.js` (spawn chickens + a zombie patrol, wire overlaps/collisions)
- Test: manual (pooling/collision behavior needs Phaser's physics world; no new pure logic beyond what Task 2 already covers)

**Interfaces:**
- Consumes: `Fox.pickupChicken(healAmount)`, `Fox.takeHit(damage)` (Task 2), `HEALTH` constants
  (Task 1).
- Produces: `ObjectPool` class used again in Plan B for particles; `Enemy` base class other
  enemy types (Turret, stretch goal) extend later.

- [ ] **Step 1: Implement ObjectPool**

```javascript
// src/systems/ObjectPool.js
// Thin wrapper over Phaser.GameObjects.Group that pre-allocates `initialSize` instances of
// classType and reuses them via spawn/despawn instead of new/destroy per README §10.
export default class ObjectPool {
  constructor(scene, classType, initialSize, createArgs = []) {
    this.scene = scene;
    this.classType = classType;
    this.group = scene.add.group({ classType, runChildUpdate: false });

    for (let i = 0; i < initialSize; i += 1) {
      const instance = new classType(scene, ...createArgs);
      instance.setActive(false).setVisible(false);
      if (instance.body) scene.physics.world.disable(instance);
      this.group.add(instance, false);
    }
  }

  spawn(x, y, ...spawnArgs) {
    let instance = this.group.getFirstDead(false);
    if (!instance) {
      instance = new this.classType(this.scene);
      this.group.add(instance, false);
    }
    instance.setActive(true).setVisible(true);
    instance.setPosition(x, y);
    if (instance.body) this.scene.physics.world.enable(instance);
    if (typeof instance.onSpawn === 'function') instance.onSpawn(...spawnArgs);
    return instance;
  }

  despawn(instance) {
    instance.setActive(false).setVisible(false);
    if (instance.body) {
      instance.body.setVelocity(0, 0);
      this.scene.physics.world.disable(instance);
    }
  }

  getChildren() {
    return this.group.getChildren();
  }
}
```

- [ ] **Step 2: Implement ChickenGraphics and EnemyGraphics**

```javascript
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
```

```javascript
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
```

- [ ] **Step 3: Implement Chicken entity**

```javascript
// src/entities/Chicken.js
import Phaser from 'phaser';
import { HEALTH } from '../config/constants.js';

export default class Chicken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'chicken');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.healAmount = HEALTH.CHICKEN_HEAL;
    this._bobTween = null;
  }

  onSpawn() {
    this.body.setAllowGravity(false);
    this._startY = this.y;
    if (this._bobTween) this._bobTween.stop();
    this._bobTween = this.scene.tweens.add({
      targets: this,
      y: this._startY - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onDespawn() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
  }
}
```

- [ ] **Step 4: Implement Enemy base class and ZombiePatrol**

```javascript
// src/entities/Enemy.js
import Phaser from 'phaser';
import { HEALTH } from '../config/constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.contactDamage = HEALTH.ENEMY_DAMAGE;
  }
}
```

```javascript
// src/entities/ZombiePatrol.js
import Enemy from './Enemy.js';

const PATROL_SPEED = 60;

export default class ZombiePatrol extends Enemy {
  constructor(scene) {
    super(scene, 0, 0, 'zombie');
  }

  onSpawn({ rangeStart, rangeEnd }) {
    this.body.setAllowGravity(true);
    this._rangeStart = rangeStart;
    this._rangeEnd = rangeEnd;
    this._direction = 1;
    this.body.setVelocityX(PATROL_SPEED);
  }

  onDespawn() {
    this.body.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (this._direction > 0 && this.x >= this._rangeEnd) {
      this._direction = -1;
      this.body.setVelocityX(-PATROL_SPEED);
      this.setFlipX(true);
    } else if (this._direction < 0 && this.x <= this._rangeStart) {
      this._direction = 1;
      this.body.setVelocityX(PATROL_SPEED);
      this.setFlipX(false);
    }
  }
}
```

- [ ] **Step 5: Wire chickens + zombie patrol into LevelScene**

Modify `src/scenes/LevelScene.js` — add imports, generate textures, create pools, spawn a
handful of test entities, and add overlap/collision handlers:

```javascript
// Add to imports at top of LevelScene.js
import { generateChickenTexture } from '../graphics/ChickenGraphics.js';
import { generateZombieTexture } from '../graphics/EnemyGraphics.js';
import ObjectPool from '../systems/ObjectPool.js';
import Chicken from '../entities/Chicken.js';
import ZombiePatrol from '../entities/ZombiePatrol.js';
```

```javascript
// Add inside create(), after generating fox/parallax textures:
generateChickenTexture(this);
generateZombieTexture(this);

this.chickenPool = new ObjectPool(this, Chicken, 6);
this.enemyPool = new ObjectPool(this, ZombiePatrol, 3);

const TEST_CHICKEN_SPOTS = [[400, 400], [700, 380], [1100, 400], [1500, 380]];
TEST_CHICKEN_SPOTS.forEach(([x, y]) => this.chickenPool.spawn(x, y));

const TEST_ENEMY_SPOTS = [{ x: 900, rangeStart: 850, rangeEnd: 1050 }];
TEST_ENEMY_SPOTS.forEach(({ x, rangeStart, rangeEnd }) => {
  const enemy = this.enemyPool.spawn(x, this.scale.height - 90, { rangeStart, rangeEnd });
  this.physics.add.collider(enemy, ground);
});

this.physics.add.overlap(this.fox, this.chickenPool.getChildren(), (fox, chicken) => {
  fox.pickupChicken(chicken.healAmount);
  chicken.onDespawn();
  this.chickenPool.despawn(chicken);
});

this.physics.add.overlap(this.fox, this.enemyPool.getChildren(), (fox, enemy) => {
  if (!fox.isInvulnerable) fox.takeHit(enemy.contactDamage);
});
```

Note: `ground` must be declared with `const ground = ...` (already present from Task 2) before
these blocks reference it — reorder if needed so `ground` exists first, then chickens/enemies,
then the fox/collider setup, since colliders need `ground` already created.

- [ ] **Step 6: Add death check to LevelScene.update()**

```javascript
// Add at top of update(time, delta) in LevelScene.js, before input handling:
if (this.fox.health.isDead) {
  this.scene.start('LevelScene'); // Task 4 replaces this with GameOverScene
  return;
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`
Expected, checked in browser:
1. 4 chicken silhouettes are visible along the level, gently bobbing up and down.
2. Walking the fox into a chicken makes it disappear and visibly restores health (health isn't
   directly visible yet without UI — Task 4 adds the HUD; for this task, confirm via a temporary
   `console.log(this.fox.health.current)` in `update()` that the number increases on pickup,
   then remove the console.log before committing).
3. A zombie enemy silhouette patrols back and forth between two points without walking off a
   ledge or freezing.
4. Touching the zombie while not dashing costs a large chunk of health (again check via the
   temporary console.log); touching it immediately after a dash (still invulnerable) costs
   nothing.
5. Letting health passively drain to 0 (or taking enough hits) restarts the scene with no
   console errors.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "Add chicken pickups, object pooling, and zombie patrol enemy with contact damage"
```

---

## Task 4: Level 1 End-to-End, Lore Intro, HUD, and Cutscene System

**Files:**
- Create: `src/scenes/TitleScene.js`, `src/scenes/UIScene.js`, `src/scenes/GameOverScene.js`, `src/scenes/WinScene.js`
- Create: `src/systems/CutsceneManager.js`
- Create: `src/config/levels.js`
- Modify: `src/scenes/LevelScene.js` (read from `levels.js` config instead of hardcoded test data; level-end trigger; remove temporary console.log debug lines from Task 3)
- Modify: `src/scenes/BootScene.js`, `src/main.js` (register all new scenes; boot to TitleScene)
- Test: manual (scene flow, DOM overlay behavior)

**Interfaces:**
- Consumes: `Fox`, `ObjectPool`, `Chicken`, `ZombiePatrol`, `InputController` (Tasks 2–3);
  `LEVELS` config shape (this task, consumed by `LevelScene`).
- Produces: `CutsceneManager.play(slotKey, onComplete)` (used again in Plan B for the remaining
  4 level-intro slots + win slot — no code changes needed there, just additional `play()`
  calls with different `slotKey`s). `LEVELS[0]` is the only populated entry; Plan B appends
  `LEVELS[1..4]`.

- [ ] **Step 1: Implement CutsceneManager**

```javascript
// src/systems/CutsceneManager.js
// Plays a DOM <video> overlay above the Phaser canvas for a given slot if that slot's file
// exists; otherwise calls onComplete immediately so the caller can render its own fallback.
// The overlay is fully created and torn down per-call — no persistent DOM node during gameplay.
export default class CutsceneManager {
  constructor(containerId = 'game-container') {
    this.containerId = containerId;
  }

  play(slotKey, onComplete) {
    const src = `/videos/${slotKey}.mp4`;
    const probe = document.createElement('video');
    probe.preload = 'metadata';

    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onFound);
      probe.removeEventListener('error', onMissing);
      probe.src = '';
    };

    const onFound = () => {
      cleanup();
      this._playOverlay(src, onComplete);
    };

    const onMissing = () => {
      cleanup();
      onComplete();
    };

    probe.addEventListener('loadedmetadata', onFound, { once: true });
    probe.addEventListener('error', onMissing, { once: true });
    probe.src = src;
  }

  _playOverlay(src, onComplete) {
    const container = document.getElementById(this.containerId);
    const overlay = document.createElement('video');
    overlay.src = src;
    overlay.muted = true;
    overlay.playsInline = true;
    overlay.autoplay = true;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.objectFit = 'cover';
    overlay.style.zIndex = '10';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip ▶';
    skipBtn.style.position = 'absolute';
    skipBtn.style.bottom = '16px';
    skipBtn.style.right = '16px';
    skipBtn.style.zIndex = '11';
    skipBtn.style.padding = '8px 14px';
    skipBtn.style.cursor = 'pointer';

    const finish = () => {
      overlay.pause();
      overlay.removeAttribute('src');
      overlay.load();
      overlay.remove();
      skipBtn.remove();
      onComplete();
    };

    overlay.addEventListener('ended', finish, { once: true });
    overlay.addEventListener('error', finish, { once: true });
    skipBtn.addEventListener('click', finish, { once: true });

    container.appendChild(overlay);
    container.appendChild(skipBtn);
    overlay.play().catch(finish);
  }
}
```

- [ ] **Step 2: Implement levels.js config**

```javascript
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
      { type: 'zombie', x: 900, rangeStart: 850, rangeEnd: 1050 },
      { type: 'zombie', x: 1800, rangeStart: 1750, rangeEnd: 1950 },
    ],
  },
];
```

- [ ] **Step 3: Rewrite LevelScene to be config-driven**

Replace the hardcoded test spawn data in `LevelScene.js` with config reads. Full updated file:

```javascript
// src/scenes/LevelScene.js
import Phaser from 'phaser';
import { generateFoxTextures } from '../graphics/FoxGraphics.js';
import { generateParallaxTextures } from '../graphics/BackgroundLayers.js';
import { generateChickenTexture } from '../graphics/ChickenGraphics.js';
import { generateZombieTexture } from '../graphics/EnemyGraphics.js';
import InputController from '../systems/InputController.js';
import ObjectPool from '../systems/ObjectPool.js';
import Fox from '../entities/Fox.js';
import Chicken from '../entities/Chicken.js';
import ZombiePatrol from '../entities/ZombiePatrol.js';
import { LEVELS } from '../config/levels.js';

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
  }

  create() {
    // Phaser never auto-invokes a method named shutdown() — it must be bound to the scene's
    // 'shutdown' event explicitly, or it silently never runs (verified against
    // node_modules/phaser/src/scene/SceneManager.js: only init/preload/create/update are
    // framework-invoked by name). This wiring is required for the cleanup below to fire at all.
    this.events.once('shutdown', this.shutdown, this);

    const config = LEVELS[this.levelIndex];
    this.config = config;

    // Character textures are identical across every level/restart — generate once, keep cached.
    // Per-level parallax textures ARE removed in shutdown() below, so always regenerate them.
    if (!this.textures.exists('fox-idle')) generateFoxTextures(this);
    if (!this.textures.exists('chicken-wing-up')) generateChickenTexture(this);
    if (!this.textures.exists('zombie')) generateZombieTexture(this);
    generateParallaxTextures(this, config.key, config.palette);

    this.physics.world.setBounds(0, 0, config.worldWidth, this.scale.height);

    this.skyLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, `${config.key}-sky`).setOrigin(0).setScrollFactor(0);
    this.midLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, `${config.key}-mid`).setOrigin(0).setScrollFactor(0.3);
    this.nearLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, `${config.key}-near`).setOrigin(0).setScrollFactor(0.6);

    const ground = this.add.rectangle(config.worldWidth / 2, this.scale.height - 20, config.worldWidth, 40, 0x1a1f2b);
    this.physics.add.existing(ground, true);

    this.input_ = new InputController();
    this.input_.bindKeyboard(this);

    this.fox = new Fox(this, config.playerStart.x, config.playerStart.y);
    this.physics.add.collider(this.fox, ground);

    this.chickenPool = new ObjectPool(this, Chicken, config.chickens.length);
    config.chickens.forEach(({ x, y }) => this.chickenPool.spawn(x, y));

    this.enemyPool = new ObjectPool(this, ZombiePatrol, config.enemies.length);
    config.enemies.forEach(({ x, rangeStart, rangeEnd }) => {
      const enemy = this.enemyPool.spawn(x, this.scale.height - 90, { rangeStart, rangeEnd });
      this.physics.add.collider(enemy, ground);
    });

    this.physics.add.overlap(this.fox, this.chickenPool.getChildren(), (fox, chicken) => {
      fox.pickupChicken(chicken.healAmount);
      chicken.onDespawn();
      this.chickenPool.despawn(chicken);
    });

    this.physics.add.overlap(this.fox, this.enemyPool.getChildren(), (fox, enemy) => {
      if (!fox.isInvulnerable) fox.takeHit(enemy.contactDamage);
    });

    this.cameras.main.setBounds(0, 0, config.worldWidth, this.scale.height);
    this.cameras.main.startFollow(this.fox, true, 0.1, 0.1);

    this.scene.launch('UIScene', { levelScene: this });

    this._levelEnded = false;
  }

  update(time, delta) {
    if (this._levelEnded) return;

    if (this.fox.health.isDead) {
      this._levelEnded = true;
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { levelIndex: this.levelIndex });
      return;
    }

    if (this.fox.x >= this.config.levelEndX) {
      this._levelEnded = true;
      this.scene.stop('UIScene');
      this.scene.start('WinScene');
      return;
    }

    const inputState = this.input_.getState();
    this.fox.handleInput(inputState, delta);

    this.midLayer.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.nearLayer.tilePositionX = this.cameras.main.scrollX * 0.6;
  }

  shutdown() {
    this.input_ = null;
    this.time.removeAllEvents();
    this.tweens.killAll();
    // Per-level parallax textures won't be reused if a different level's config loads next
    // (README §10) — character textures (fox/chicken/zombie) are intentionally NOT removed
    // here since every level reuses the same actor art (guarded by textures.exists() in create()).
    this.textures.remove(`${this.config.key}-sky`);
    this.textures.remove(`${this.config.key}-mid`);
    this.textures.remove(`${this.config.key}-near`);
  }
}
```

- [ ] **Step 4: Implement UIScene (HUD: health bar + dash cooldown pip)**

```javascript
// src/scenes/UIScene.js
import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.levelScene = data.levelScene;
  }

  create() {
    this.events.once('shutdown', this.shutdown, this); // see LevelScene.create() for why this is required

    this.healthBarBg = this.add.rectangle(20, 20, 200, 18, 0x1a1f2b).setOrigin(0, 0.5);
    this.healthBarFill = this.add.rectangle(22, 20, 196, 14, 0xe8622c).setOrigin(0, 0.5);
    this.dashPip = this.add.circle(20, 46, 8, 0x4fa8e8).setOrigin(0.5);
  }

  update() {
    const fox = this.levelScene.fox;
    if (!fox) return;
    const ratio = fox.health.current / fox.health.max;
    this.healthBarFill.width = 196 * ratio;

    const dashReady = fox.dashCooldownRatio >= 1;
    this.dashPip.setFillStyle(dashReady ? 0x4fa8e8 : 0x2a3550);
  }

  shutdown() {
    this.time.removeAllEvents();
    this.tweens.killAll();
  }
}
```

- [ ] **Step 5: Implement TitleScene (lore scroll + start button + intro cutscene slot)**

```javascript
// src/scenes/TitleScene.js
import Phaser from 'phaser';
import CutsceneManager from '../systems/CutsceneManager.js';

const LORE_TEXT = [
  '2079. Artificial intelligence took over.',
  'The cities became silent. The people became something else —',
  'slow, mindless, wandering shells patrolled by machines',
  'that used to protect them.',
  '',
  'Somewhere outside the last farm fence, one fox and a handful',
  'of chickens are the only living things left with anywhere to run to.',
  '',
  'He doesn’t want to save the world.',
  'He just wants to get back to the forest —',
  'and he’s not above stealing a chicken or twelve on the way.',
].join('\n');

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.events.once('shutdown', this.shutdown, this); // see LevelScene.create() for why this is required

    this.cutsceneManager = new CutsceneManager();
    this._showFallback();
    this.cutsceneManager.play('intro', () => {}); // if a real clip exists it overlays on top; fallback text underneath either way
  }

  _showFallback() {
    this.cameras.main.setBackgroundColor('#0a0e14');
    this.add.text(this.scale.width / 2, 60, 'FOXODUS', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#e8622c',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2, LORE_TEXT, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8dfce',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0.5);

    const startBtn = this.add.text(this.scale.width / 2, this.scale.height - 60, '[ Start ]', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#4fa8e8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.once('pointerdown', () => {
      this.scene.start('LevelScene', { levelIndex: 0 });
    });
  }

  shutdown() {
    this.time.removeAllEvents();
    this.tweens.killAll();
  }
}
```

- [ ] **Step 6: Implement GameOverScene and WinScene**

```javascript
// src/scenes/GameOverScene.js
import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'You ran out of steam...', {
      fontFamily: 'monospace', fontSize: '28px', color: '#e8622c',
    }).setOrigin(0.5);

    const retry = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, '[ Retry ]', {
      fontFamily: 'monospace', fontSize: '20px', color: '#4fa8e8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.once('pointerdown', () => {
      this.scene.start('LevelScene', { levelIndex: this.levelIndex });
    });
  }
}
```

```javascript
// src/scenes/WinScene.js
import Phaser from 'phaser';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, 'Level Complete!', {
      fontFamily: 'monospace', fontSize: '32px', color: '#8fe86c',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, '(More levels coming in Plan B)', {
      fontFamily: 'monospace', fontSize: '16px', color: '#e8dfce',
    }).setOrigin(0.5);

    const restart = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, '[ Back to Title ]', {
      fontFamily: 'monospace', fontSize: '18px', color: '#4fa8e8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.once('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }
}
```

- [ ] **Step 7: Wire everything in main.js and BootScene**

```javascript
// src/scenes/BootScene.js (final)
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('TitleScene');
  }
}
```

```javascript
// src/main.js (final for this plan)
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import LevelScene from './scenes/LevelScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WinScene from './scenes/WinScene.js';
import { SCREEN, PHYSICS } from './config/constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: SCREEN.WIDTH,
  height: SCREEN.HEIGHT,
  backgroundColor: '#0a0e14',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYSICS.GRAVITY_Y }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, LevelScene, UIScene, GameOverScene, WinScene],
};

new Phaser.Game(config);
```

- [ ] **Step 8: Remove temporary debug console.log from Task 3 if not already removed**

Search `src/scenes/LevelScene.js` for any leftover `console.log` from Task 3's manual
verification step and delete it.

- [ ] **Step 9: Manual verification (full slice playthrough)**

Run: `npm run dev`
Expected, checked in browser:
1. Game boots directly to the title screen: "FOXODUS" heading, full lore paragraph readable,
   "[ Start ]" button visible. No video plays (no file at `/videos/intro.mp4` yet) — this
   confirms the fallback path works.
2. Clicking Start loads Level 1: fox spawns, HUD health bar (top-left) and a dash-cooldown dot
   are visible and update live — health bar visibly drains over time and jumps up on chicken
   pickup; the dash dot dims right after dashing and relights after the cooldown.
3. Running the fox to the far right edge of the level (past all chickens/enemies) triggers the
   "Level Complete!" screen; clicking "[ Back to Title ]" returns to the title screen.
4. Deliberately dying (stand in a zombie repeatedly, or wait out the health drain) triggers
   "You ran out of steam..." with a working "[ Retry ]" that restarts Level 1 fresh (health
   full again).
5. No errors in the browser console across the whole loop (title → play → win/lose → retry).

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "Wire Level 1 end-to-end: title/lore screen, HUD, cutscene fallback system, win/game-over flow"
```

Then update `CLAUDE.md`'s Status section: check off Milestones 1–4, and note in `decisions.md`
if any tuning constants were adjusted during manual playtesting.

---

## Plan Self-Review Notes

- **Spec coverage:** README §4 (movement/dash/health), §5 (procedural visuals, parallax),
  §8 (folder structure, data-driven levels), §9 Milestones 1–4, §10 (pooling, no per-frame
  alloc, scene cleanup, CSP-adjacent hygiene), §11 (CSP meta tag, no eval/innerHTML) are all
  covered by name in tasks above. Design spec §3 (cutscene fallback contract) is covered by
  Task 4 Step 1. Design spec §2 (full AudioManager synthesis) and README §9 Milestones 5–8 are
  explicitly out of scope for this plan — deferred to Plan B, called out in the Goal section.
- **Placeholder scan:** no TBD/TODO; every step has runnable code or a concrete, specific
  manual-check description.
- **Type consistency:** `InputController.getState()` shape used identically in `Fox.handleInput`
  and tests. `HealthSystem` constructor/method names match between Task 2's implementation and
  Task 4's `UIScene` reads (`fox.health.current`, `.max`). `ObjectPool.spawn(x, y, ...args)`
  signature matches both `Chicken` (no extra args, `onSpawn()`) and `ZombiePatrol`
  (`onSpawn({rangeStart, rangeEnd})`) call sites in Task 4's `LevelScene`.
