// src/entities/ZombiePatrol.js
import Enemy from './Enemy.js';

const PATROL_SPEED = 60;

export default class ZombiePatrol extends Enemy {
  constructor(scene) {
    super(scene, 0, 0, 'zombie');
  }

  onSpawn({ rangeStart, rangeEnd }) {
    this.body.setAllowGravity(true);
    this._rangeStart = rangeStart;
    this._rangeEnd = rangeEnd;
    this._direction = 1;
    this.body.setVelocityX(PATROL_SPEED);
  }

  onDespawn() {
    this.body.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (this._direction > 0 && this.x >= this._rangeEnd) {
      this._direction = -1;
      this.body.setVelocityX(-PATROL_SPEED);
      this.setFlipX(true);
    } else if (this._direction < 0 && this.x <= this._rangeStart) {
      this._direction = 1;
      this.body.setVelocityX(PATROL_SPEED);
      this.setFlipX(false);
    }
  }
}
