import Phaser from 'phaser';
import { PHYSICS, HEALTH } from '../config/constants.js';
import HealthSystem from '../systems/HealthSystem.js';
import audioManager from '../systems/AudioManager.js';

export default class Fox extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fox-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(30, 30).setOffset(10, 8);

    this.health = new HealthSystem(HEALTH.MAX, { drainPerSec: HEALTH.DRAIN_PER_SEC });
    this.isInvulnerable = false;
    this._invulnTimerMs = 0;

    this._dashTimerMs = 0;
    this._dashCooldownMs = 0;
    this._isDashing = false;
    this._facing = 1;
  }

  get dashCooldownRatio() {
    return Phaser.Math.Clamp(1 - this._dashCooldownMs / PHYSICS.DASH_COOLDOWN_MS, 0, 1);
  }

  handleInput(inputState, deltaMs) {
    this.health.tick(deltaMs);

    if (this._invulnTimerMs > 0) {
      this._invulnTimerMs -= deltaMs;
      if (this._invulnTimerMs <= 0) this.isInvulnerable = false;
    }
    if (this._dashCooldownMs > 0) this._dashCooldownMs -= deltaMs;

    if (this._isDashing) {
      this._dashTimerMs -= deltaMs;
      if (this._dashTimerMs <= 0) {
        this._isDashing = false;
        this.body.setVelocityX(0);
      }
      return; // no directional control mid-dash
    }

    if (inputState.dashPressed && this._dashCooldownMs <= 0) {
      this._startDash();
      return;
    }

    let vx = 0;
    if (inputState.left) { vx = -PHYSICS.MOVE_SPEED; this._facing = -1; }
    if (inputState.right) { vx = PHYSICS.MOVE_SPEED; this._facing = 1; }
    this.body.setVelocityX(vx);
    this.setFlipX(this._facing < 0);

    if (inputState.jumpPressed && this.body.blocked.down) {
      this.body.setVelocityY(PHYSICS.JUMP_VELOCITY);
      audioManager.playJump();
    }

    if (!this.body.blocked.down) {
      this.setTexture('fox-jump');
    } else if (vx !== 0) {
      this.setTexture('fox-run');
    } else {
      this.setTexture('fox-idle');
    }
  }

  takeHit(damage) {
    if (this.isInvulnerable) return;
    this.health.takeDamage(damage);
    this.isInvulnerable = true;
    this._invulnTimerMs = HEALTH.POST_HIT_INVULN_MS;
    this._playHitFeedback();
    audioManager.playHit();
  }

  _playHitFeedback() {
    this.setTint(0xff4444);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 90,
      yoyo: true,
      repeat: Math.max(1, Math.round(HEALTH.POST_HIT_INVULN_MS / 180) - 1),
      onComplete: () => {
        this.clearTint();
        this.setAlpha(1);
      },
    });
  }

  pickupChicken(healAmount) {
    this.health.pickupHeal(healAmount);
  }

  _startDash() {
    this._isDashing = true;
    this._dashTimerMs = PHYSICS.DASH_DURATION_MS;
    this._dashCooldownMs = PHYSICS.DASH_COOLDOWN_MS;
    this.isInvulnerable = true;
    this._invulnTimerMs = Math.max(this._invulnTimerMs, PHYSICS.DASH_IFRAME_MS);
    this.body.setVelocityX(PHYSICS.DASH_SPEED * this._facing);
    audioManager.playDash();
  }
}
