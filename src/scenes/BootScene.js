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
