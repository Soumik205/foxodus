// src/systems/ObjectPool.js
// Thin wrapper over Phaser.GameObjects.Group that pre-allocates `initialSize` instances of
// classType and reuses them via spawn/despawn instead of new/destroy per README §10.
export default class ObjectPool {
  constructor(scene, classType, initialSize, createArgs = []) {
    this.scene = scene;
    this.classType = classType;
    this.group = scene.add.group({ classType, runChildUpdate: false });

    for (let i = 0; i < initialSize; i += 1) {
      const instance = new classType(scene, ...createArgs);
      instance.setActive(false).setVisible(false);
      if (instance.body) scene.physics.world.disable(instance);
      this.group.add(instance, false);
    }
  }

  spawn(x, y, ...spawnArgs) {
    let instance = this.group.getFirstDead(false);
    if (!instance) {
      instance = new this.classType(this.scene);
      this.group.add(instance, false);
    }
    instance.setActive(true).setVisible(true);
    instance.setPosition(x, y);
    if (instance.body) this.scene.physics.world.enable(instance);
    if (typeof instance.onSpawn === 'function') instance.onSpawn(...spawnArgs);
    return instance;
  }

  despawn(instance) {
    instance.setActive(false).setVisible(false);
    if (instance.body) {
      instance.body.setVelocity(0, 0);
      this.scene.physics.world.disable(instance);
    }
  }

  getChildren() {
    return this.group.getChildren();
  }
}
