import { describe, it, expect } from 'vitest';
import InputController from '../src/systems/InputController.js';

function makeKeys(overrides = {}) {
  return {
    left: { isDown: false, ...overrides.left },
    right: { isDown: false, ...overrides.right },
    jump: { isDown: false, ...overrides.jump },
    dash: { isDown: false, ...overrides.dash },
    ...overrides,
  };
}

describe('InputController', () => {
  it('reports left/right movement from key state', () => {
    const ic = new InputController();
    ic._keys = makeKeys({ left: { isDown: true } });
    let state = ic.getState();
    expect(state.left).toBe(true);
    expect(state.right).toBe(false);
  });

  it('reports jumpPressed only on the rising edge', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic._keys.jump.isDown = true;
    let state = ic.getState();
    expect(state.jump).toBe(true);
    expect(state.jumpPressed).toBe(true);

    state = ic.getState(); // still held, same key object
    expect(state.jumpPressed).toBe(false);

    ic._keys.jump.isDown = false;
    state = ic.getState();
    ic._keys.jump.isDown = true;
    state = ic.getState();
    expect(state.jumpPressed).toBe(true);
  });

  it('reports dashPressed only on the rising edge, independent of jump', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic._keys.dash.isDown = true;
    let state = ic.getState();
    expect(state.dashPressed).toBe(true);
    state = ic.getState();
    expect(state.dashPressed).toBe(false);
  });

  it('touch overrides can force a direction/action true for one getState call', () => {
    const ic = new InputController();
    ic._keys = makeKeys();
    ic.setTouchState({ left: true, dash: true });
    const state = ic.getState();
    expect(state.left).toBe(true);
    expect(state.dashPressed).toBe(true);
  });
});
