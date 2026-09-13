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
