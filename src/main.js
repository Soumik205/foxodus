import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import LevelScene from './scenes/LevelScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WinScene from './scenes/WinScene.js';
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
  scene: [BootScene, TitleScene, LevelScene, UIScene, GameOverScene, WinScene],
};

new Phaser.Game(config);
