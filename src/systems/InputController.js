// Abstracts keyboard + touch into one action interface. Real Phaser key binding happens in
// bindKeyboard(scene); tests inject a fake `_keys` object directly (see tests/InputController.test.js).
export default class InputController {
  constructor() {
    this._keys = null;
    this._touch = { left: false, right: false, jump: false, dash: false };
    this._prevJumpDown = false;
    this._prevDashDown = false;
  }

  bindKeyboard(scene) {
    // Phaser's addKeys() only splits comma-separated key names when the whole `keys` argument
    // is a string (e.g. addKeys('W,S,A,D')); a comma-separated value inside an object (e.g.
    // { left: 'LEFT,A' }) is looked up verbatim in the KeyCodes table and never matches
    // (KeyCodes['LEFT,A'] is undefined), so those keys would silently never register real
    // key presses. Instead, bind each alias to its own real Key object and OR them together
    // behind an `isDown` getter so getState() (and the fake-key shape used in unit tests)
    // sees the same { left: { isDown }, ... } shape either way.
    const kc = scene.input.keyboard;
    const makeAlias = (...codes) => {
      const realKeys = codes.map((code) => kc.addKey(code));
      return {
        get isDown() {
          return realKeys.some((key) => key.isDown);
        },
      };
    };
    this._keys = {
      left: makeAlias('LEFT', 'A'),
      right: makeAlias('RIGHT', 'D'),
      jump: makeAlias('SPACE', 'UP', 'W'),
      dash: makeAlias('SHIFT'),
    };
  }

  // Mobile touch overlay calls this each frame with the currently-held buttons.
  setTouchState(partial) {
    Object.assign(this._touch, partial);
  }

  clearTouchState() {
    this._touch.left = false;
    this._touch.right = false;
    this._touch.jump = false;
    this._touch.dash = false;
  }

  getState() {
    const k = this._keys;
    const left = !!(k?.left?.isDown) || this._touch.left;
    const right = !!(k?.right?.isDown) || this._touch.right;
    const jumpDown = !!(k?.jump?.isDown) || this._touch.jump;
    const dashDown = !!(k?.dash?.isDown) || this._touch.dash;

    const jumpPressed = jumpDown && !this._prevJumpDown;
    const dashPressed = dashDown && !this._prevDashDown;

    this._prevJumpDown = jumpDown;
    this._prevDashDown = dashDown;

    // One-shot touch triggers (jump/dash buttons) consume themselves so a held setTouchState
    // call from a previous frame doesn't re-trigger; the touch overlay (Task 7) calls
    // clearTouchState() after reading, per-frame.
    return { left, right, jump: jumpDown, jumpPressed, dash: dashDown, dashPressed };
  }
}
