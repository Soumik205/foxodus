export default class HealthSystem {
  constructor(max, opts = {}) {
    this.max = max;
    this.current = max;
    this.drainPerSec = opts.drainPerSec ?? 0;
    this.isDead = false;
  }

  tick(deltaMs) {
    if (this.isDead) return;
    this._apply(-this.drainPerSec * (deltaMs / 1000));
  }

  pickupHeal(amount) {
    if (this.isDead) return;
    this._apply(amount);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this._apply(-amount);
  }

  _apply(delta) {
    this.current = Math.max(0, Math.min(this.max, this.current + delta));
    if (this.current <= 0) {
      this.current = 0;
      this.isDead = true;
    }
  }
}
