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
