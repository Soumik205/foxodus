// src/systems/AudioManager.js
// All audio is generated in code via the Web Audio API — no imported sound files, matching the
// project's procedural-generation identity. A single AudioContext/master gain persists for the
// whole game session (module singleton, not recreated per scene) per README §10's mandate to
// reuse audio instances rather than allocate per level.
//
// AudioContext creation must happen inside a user-gesture handler (browser autoplay policy) —
// call init() from the Title screen's Start button click, not at module load time.

const LEVEL_MUSIC_PROFILES = [
  { baseFreq: 55, filterFreq: 900, detune: 12, tempo: 0.55, waveform: 'sawtooth' }, // industrial
  { baseFreq: 58, filterFreq: 1100, detune: 9, tempo: 0.5, waveform: 'sawtooth' },
  { baseFreq: 65, filterFreq: 1400, detune: 6, tempo: 0.45, waveform: 'triangle' },
  { baseFreq: 50, filterFreq: 700, detune: 15, tempo: 0.6, waveform: 'sawtooth' }, // darkest/tense
  { baseFreq: 73, filterFreq: 2000, detune: 2, tempo: 0.35, waveform: 'sine' }, // calm/acoustic-ish
];

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this._musicNodes = [];
    this._musicTimers = [];
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.masterGain);
  }

  _ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ---- SFX (README §6 minimum viable set) ----

  playJump() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playDash() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Deliberately the most "designed" SFX — the reward moment, shouldn't be skimped (README §6).
  playChickenPickup() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const start = t + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain).connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  playHit() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(noiseGain).connect(this.masterGain);
    noise.start(t);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  playLevelComplete() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const start = t + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  playGameOver() {
    if (!this.ctx) return;
    this._ensureResumed();
    const t = this.ctx.currentTime;
    [392, 349, 294, 220].forEach((freq, i) => {
      const start = t + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.42);
    });
  }

  // ---- Music: generative ambient pad per level, crossfaded on level change ----
  // Simplification note: this fades the current track out, THEN builds and fades in the new
  // one (rather than two simultaneously-overlapping buses) — a brief silence instead of a true
  // overlap-crossfade, chosen for implementation reliability under time pressure. Still avoids
  // README §6's "no hard-cutting" requirement in spirit.

  playLevelMusic(levelIndex) {
    if (!this.ctx) return;
    this._ensureResumed();
    const profile = LEVEL_MUSIC_PROFILES[levelIndex] || LEVEL_MUSIC_PROFILES[0];
    const hadMusic = this._musicNodes.length > 0;
    const t = this.ctx.currentTime;
    const fadeOut = hadMusic ? 1.2 : 0;

    if (hadMusic) {
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
      this.musicGain.gain.linearRampToValueAtTime(0, t + fadeOut);
    }

    const nodesToStop = this._musicNodes;
    const timersToStop = this._musicTimers;
    setTimeout(() => {
      nodesToStop.forEach((osc) => { try { osc.stop(); } catch (e) { /* already stopped */ } });
      timersToStop.forEach((id) => clearInterval(id));
      this._startMusicGraph(profile);
    }, fadeOut * 1000);
  }

  _startMusicGraph(profile) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(0, t);
    this.musicGain.gain.linearRampToValueAtTime(0.35, t + 1.5);

    this._musicNodes = [];
    this._musicTimers = [];

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = profile.filterFreq;
    filter.connect(this.musicGain);

    [1, 1.5].forEach((mult) => {
      const osc = this.ctx.createOscillator();
      osc.type = profile.waveform;
      osc.frequency.value = profile.baseFreq * mult;
      osc.detune.value = mult === 1 ? -profile.detune : profile.detune;
      osc.connect(filter);
      osc.start(t);
      this._musicNodes.push(osc);
    });

    const sweep = () => {
      const now = this.ctx.currentTime;
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(profile.filterFreq * 0.7, now);
      filter.frequency.linearRampToValueAtTime(profile.filterFreq, now + 6);
      filter.frequency.linearRampToValueAtTime(profile.filterFreq * 0.7, now + 12);
    };
    sweep();
    this._musicTimers.push(setInterval(sweep, 12000));

    this._musicTimers.push(setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const blip = this.ctx.createOscillator();
      const blipGain = this.ctx.createGain();
      blip.type = 'sine';
      blip.frequency.value = profile.baseFreq * (2 + Math.floor(Math.random() * 3));
      blipGain.gain.setValueAtTime(0.0001, now);
      blipGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      blipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      blip.connect(blipGain).connect(this.musicGain);
      blip.start(now);
      blip.stop(now + 0.35);
    }, profile.tempo * 1000 * 4));
  }

  stopMusic() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(0, t + 1);
    const nodes = this._musicNodes;
    const timers = this._musicTimers;
    this._musicNodes = [];
    this._musicTimers = [];
    setTimeout(() => {
      nodes.forEach((osc) => { try { osc.stop(); } catch (e) { /* already stopped */ } });
      timers.forEach((id) => clearInterval(id));
    }, 1100);
  }
}

// Module singleton — importing this file anywhere returns the same instance, satisfying the
// "reuse a single instance, don't recreate per scene" mandate without needing a Phaser registry.
const audioManager = new AudioManager();
export default audioManager;
