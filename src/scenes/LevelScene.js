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

  preload() {
    const config = LEVELS[this.levelIndex];
    // If this file doesn't exist, Phaser's loader simply won't add the texture key to the
    // TextureManager — no crash, no error listener needed. create() below falls back to the
    // procedural sky texture via this.textures.exists() when that's the case.
    this.load.image(`${config.key}-bg`, `/backgrounds/${config.key}.jpg`);
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

    // Use the AI-generated background image if it loaded in preload(); otherwise fall back to
    // the procedural gradient sky texture generated above — same fallback pattern as CutsceneManager.
    const skyTextureKey = this.textures.exists(`${config.key}-bg`) ? `${config.key}-bg` : `${config.key}-sky`;
    this.skyLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, skyTextureKey).setOrigin(0).setScrollFactor(0);
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
    // Unlike the procedural textures above, the background image texture may not exist at all
    // if the file was missing at preload() time, so it needs a guard.
    if (this.textures.exists(`${this.config.key}-bg`)) this.textures.remove(`${this.config.key}-bg`);
  }
}
