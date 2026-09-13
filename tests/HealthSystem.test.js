import { describe, it, expect } from 'vitest';
import HealthSystem from '../src/systems/HealthSystem.js';

describe('HealthSystem', () => {
  it('starts at max health', () => {
    const hs = new HealthSystem(100);
    expect(hs.current).toBe(100);
    expect(hs.isDead).toBe(false);
  });

  it('drains over time proportionally to deltaMs and drainPerSec', () => {
    const hs = new HealthSystem(100, { drainPerSec: 10 });
    hs.tick(500); // 0.5s
    expect(hs.current).toBeCloseTo(95, 5);
  });

  it('clamps drain at zero and marks dead', () => {
    const hs = new HealthSystem(10, { drainPerSec: 100 });
    hs.tick(1000);
    expect(hs.current).toBe(0);
    expect(hs.isDead).toBe(true);
  });

  it('pickupHeal increases health but never above max', () => {
    const hs = new HealthSystem(100, { drainPerSec: 0 });
    hs.tick(0);
    hs.current = 90;
    hs.pickupHeal(30);
    expect(hs.current).toBe(100);
  });

  it('takeDamage reduces health and can kill', () => {
    const hs = new HealthSystem(100, { drainPerSec: 0 });
    hs.takeDamage(40);
    expect(hs.current).toBe(60);
    hs.takeDamage(70);
    expect(hs.current).toBe(0);
    expect(hs.isDead).toBe(true);
  });
});
