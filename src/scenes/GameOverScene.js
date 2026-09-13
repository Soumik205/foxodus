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
