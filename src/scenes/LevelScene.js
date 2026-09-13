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
