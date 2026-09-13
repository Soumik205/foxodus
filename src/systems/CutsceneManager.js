// src/systems/CutsceneManager.js
// Plays a DOM <video> overlay above the Phaser canvas for a given slot if that slot's file
// exists; otherwise calls onComplete immediately so the caller can render its own fallback.
// The overlay is fully created and torn down per-call — no persistent DOM node during gameplay.
export default class CutsceneManager {
  constructor(containerId = 'game-container') {
    this.containerId = containerId;
  }

  play(slotKey, onComplete) {
    const src = `/videos/${slotKey}.mp4`;
    const probe = document.createElement('video');
    probe.preload = 'metadata';

    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onFound);
      probe.removeEventListener('error', onMissing);
      probe.src = '';
    };

    const onFound = () => {
      cleanup();
      this._playOverlay(src, onComplete);
    };

    const onMissing = () => {
      cleanup();
      onComplete();
    };

    probe.addEventListener('loadedmetadata', onFound, { once: true });
    probe.addEventListener('error', onMissing, { once: true });
    probe.src = src;
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

    const finish = () => {
      overlay.pause();
      overlay.removeAttribute('src');
      overlay.load();
      overlay.remove();
      skipBtn.remove();
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
