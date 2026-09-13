// src/scenes/WinScene.js
import Phaser from 'phaser';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, 'Home.', {
      fontFamily: 'monospace', fontSize: '32px', color: '#8fe86c',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, 'The fox made it back to the forest.', {
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
