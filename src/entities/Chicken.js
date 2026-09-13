// src/entities/Chicken.js
import Phaser from 'phaser';
import { HEALTH } from '../config/constants.js';

export default class Chicken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'chicken-wing-up');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.healAmount = HEALTH.CHICKEN_HEAL;
    this._bobTween = null;
  }

  onSpawn() {
    this.body.setAllowGravity(false);
    this._startY = this.y;
    this.play('chicken-fly');
    if (this._bobTween) this._bobTween.stop();
    this._bobTween = this.scene.tweens.add({
      targets: this,
      y: this._startY - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onDespawn() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    this.anims.stop();
  }
}
