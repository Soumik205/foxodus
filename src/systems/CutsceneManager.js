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
    this._subtitleEl = null;
    this._subtitleHandler = null;
  }

  play(slotKey, onComplete, subtitleLines = null) {
    const src = `${import.meta.env.BASE_URL}videos/${slotKey}.mp4`;
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
      // Capture duration before cleanup() runs. cleanup() doesn't actually touch it, but
      // pulling it into a local var here keeps the intent clear at the call site below.
      const duration = probe.duration;
      cleanup();
      this._playOverlay(src, onComplete, subtitleLines, duration);
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
      if (this._subtitleHandler) {
        this._overlay.removeEventListener('timeupdate', this._subtitleHandler);
        this._subtitleHandler = null;
      }
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
    if (this._subtitleEl) {
      this._subtitleEl.remove();
      this._subtitleEl = null;
    }
  }

  _playOverlay(src, onComplete, subtitleLines, duration) {
    const container = document.getElementById(this.containerId);
    const overlay = document.createElement('video');
    overlay.src = src;
    overlay.muted = false; // let the clip's own embedded audio play — see the fallback below
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

    // Only wire up subtitles when there's something usable to sync against — no video-less
    // callers (or future play() call sites that don't pass lines) get a stray empty div.
    let subtitleEl = null;
    let subtitleHandler = null;
    if (Array.isArray(subtitleLines) && subtitleLines.length > 0 && typeof duration === 'number' && duration > 0) {
      subtitleEl = document.createElement('div');
      subtitleEl.style.position = 'absolute';
      subtitleEl.style.bottom = '64px';
      subtitleEl.style.left = '50%';
      subtitleEl.style.transform = 'translateX(-50%)';
      subtitleEl.style.maxWidth = '80%';
      subtitleEl.style.background = 'rgba(0,0,0,0.55)';
      subtitleEl.style.color = '#ffffff';
      subtitleEl.style.padding = '10px 18px';
      subtitleEl.style.borderRadius = '4px';
      subtitleEl.style.textAlign = 'center';
      subtitleEl.style.fontFamily = 'monospace';
      subtitleEl.style.fontSize = '16px';
      subtitleEl.style.zIndex = '11';
      subtitleEl.textContent = '';

      // Weight each line's on-screen duration by its character length (min weight 1, so
      // empty-string pause lines still get a sliver of time) and compute cumulative thresholds
      // across the video's total duration.
      const weights = subtitleLines.map((line) => line.length || 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const thresholds = [];
      let cumulative = 0;
      for (const w of weights) {
        cumulative += w;
        thresholds.push((cumulative / totalWeight) * duration);
      }

      let currentIndex = -1;
      subtitleHandler = () => {
        const t = overlay.currentTime;
        let index = thresholds.findIndex((threshold) => t < threshold);
        if (index === -1) index = subtitleLines.length - 1;
        if (index !== currentIndex) {
          currentIndex = index;
          subtitleEl.textContent = subtitleLines[index];
        }
      };
      overlay.addEventListener('timeupdate', subtitleHandler);

      this._subtitleEl = subtitleEl;
      this._subtitleHandler = subtitleHandler;
    }

    const finish = () => {
      if (subtitleHandler) {
        overlay.removeEventListener('timeupdate', subtitleHandler);
        this._subtitleHandler = null;
      }
      if (subtitleEl) {
        subtitleEl.remove();
        this._subtitleEl = null;
      }
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
    if (subtitleEl) container.appendChild(subtitleEl);
    // Browsers block unmuted autoplay without a preceding user gesture (this fires on plain
    // scene entry, e.g. TitleScene's very first load, before any click has happened yet). If
    // unmuted playback is rejected, retry muted rather than skipping the clip outright — seeing
    // it silently is still better than not seeing it at all.
    overlay.play().catch(() => {
      overlay.muted = true;
      overlay.play().catch(finish);
    });
  }
}
