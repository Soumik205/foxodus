import Phaser from 'phaser';
import { generateFoxTextures } from '../graphics/FoxGraphics.js';
import { generateParallaxTextures } from '../graphics/BackgroundLayers.js';
import InputController from '../systems/InputController.js';
import Fox from '../entities/Fox.js';
import { generateChickenTexture } from '../graphics/ChickenGraphics.js';
import { generateZombieTexture } from '../graphics/EnemyGraphics.js';
import ObjectPool from '../systems/ObjectPool.js';
import Chicken from '../entities/Chicken.js';
import ZombiePatrol from '../entities/ZombiePatrol.js';

const TEST_PALETTE = { sky: 0x2b3a55, skyBottom: 0x0a0e14, mid: 0x1c2740, near: 0x11182b };

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  create() {
    generateFoxTextures(this);
    generateParallaxTextures(this, 'l1', TEST_PALETTE);
    generateChickenTexture(this);
    generateZombieTexture(this);

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

    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);
    this.cameras.main.startFollow(this.fox, true, 0.1, 0.1);
  }

  update(time, delta) {
    if (this.fox.health.isDead) {
      this.scene.start('LevelScene'); // Task 4 replaces this with GameOverScene
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
  }
}
