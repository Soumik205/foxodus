// src/systems/CutsceneManager.js
// Plays a DOM <video> overlay above the Phaser canvas for a given slot if that slot's file
// exists; otherwise calls onComplete immediately so the caller can render its own fallback.
// The overlay is fully created and torn down per-call — no persistent DOM node during gameplay.
export default class CutsceneManager {
  constructor(containerId = 'game-container') {
    this.containerId = containerId;
    // Handles to whichever async step is currently in flight, so cancel() can tear it down.
    this._probe = null;
    this._onProbeFound = null;
    this._onProbeMissing = null;
    this._overlay = null;
    this._skipBtn = null;
  }

  play(slotKey, onComplete) {
    const src = `/videos/${slotKey}.mp4`;
    const probe = document.createElement('video');
    probe.preload = 'metadata';

    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onFound);
      probe.removeEventListener('error', onMissing);
      probe.src = '';
      this._probe = null;
      this._onProbeFound = null;
      this._onProbeMissing = null;
    };

    const onFound = () => {
      cleanup();
      this._playOverlay(src, onComplete);
    };

    const onMissing = () => {
      cleanup();
      onComplete();
    };

    this._probe = probe;
    this._onProbeFound = onFound;
    this._onProbeMissing = onMissing;

    probe.addEventListener('loadedmetadata', onFound, { once: true });
    probe.addEventListener('error', onMissing, { once: true });
    probe.src = src;
  }

  // Tears down whichever of the in-flight metadata probe or the playing overlay is currently
  // active, WITHOUT calling onComplete — used when the owning scene is shutting down and nothing
  // should act on completion (see TitleScene.shutdown()).
  cancel() {
    if (this._probe) {
      // Remove listeners before clearing src, same order as cleanup() above — otherwise
      // clearing src can fire the 'error' listener and incorrectly trigger onComplete.
      this._probe.removeEventListener('loadedmetadata', this._onProbeFound);
      this._probe.removeEventListener('error', this._onProbeMissing);
      this._probe.src = '';
      this._probe = null;
      this._onProbeFound = null;
      this._onProbeMissing = null;
    }
    if (this._overlay) {
      this._overlay.pause();
      this._overlay.removeAttribute('src');
      this._overlay.load();
      this._overlay.remove();
      this._overlay = null;
    }
    if (this._skipBtn) {
      this._skipBtn.remove();
      this._skipBtn = null;
    }
  }

  _playOverlay(src, onComplete) {
    const container = document.getElementById(this.containerId);
    const overlay = document.createElement('video');
    overlay.src = src;
    overlay.muted = true;
    overlay.playsInline = true;
    overlay.autoplay = true;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.objectFit = 'cover';
    overlay.style.zIndex = '10';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip ▶';
    skipBtn.style.position = 'absolute';
    skipBtn.style.bottom = '16px';
    skipBtn.style.right = '16px';
    skipBtn.style.zIndex = '11';
    skipBtn.style.padding = '8px 14px';
    skipBtn.style.cursor = 'pointer';

    this._overlay = overlay;
    this._skipBtn = skipBtn;

    const finish = () => {
      overlay.pause();
      overlay.removeAttribute('src');
      overlay.load();
      overlay.remove();
      skipBtn.remove();
      this._overlay = null;
      this._skipBtn = null;
      onComplete();
    };

    overlay.addEventListener('ended', finish, { once: true });
    overlay.addEventListener('error', finish, { once: true });
    skipBtn.addEventListener('click', finish, { once: true });

    container.appendChild(overlay);
    container.appendChild(skipBtn);
    overlay.play().catch(finish);
  }
}
