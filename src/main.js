import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import LevelScene from './scenes/LevelScene.js';
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
  scene: [BootScene, LevelScene],
};

new Phaser.Game(config);
