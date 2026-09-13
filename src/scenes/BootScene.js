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
