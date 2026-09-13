// src/entities/Enemy.js
import Phaser from 'phaser';
import { HEALTH } from '../config/constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.contactDamage = HEALTH.ENEMY_DAMAGE;
  }
}
