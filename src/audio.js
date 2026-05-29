// Lightweight Web Audio sound manager — synthesizes all sound effects in-code,
// so the project ships with zero audio asset files.
//
// Usage:  import { sfx } from './audio.js';  sfx.play('correct');
// The AudioContext is created lazily and resumed on first user gesture
// (browsers block audio until the user interacts with the page).

class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  // Call from a pointer/key handler to satisfy autoplay policies.
  unlock() {
    this._ensure();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(value) {
    this.muted = value;
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Schedule a single oscillator note.
  _tone({ freq = 440, dur = 0.15, type = 'sine', gain = 0.6, delay = 0, sweepTo = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);
    }
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Short burst of filtered noise — used for explosions / smashes.
  _noise({ dur = 0.3, gain = 0.5, delay = 0, freq = 1200 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq, t0);
    filter.frequency.exponentialRampToValueAtTime(200, t0 + dur);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  play(name) {
    this._ensure();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (name) {
      case 'click':
        this._tone({ freq: 520, dur: 0.08, type: 'square', gain: 0.25 });
        break;
      case 'hover':
        this._tone({ freq: 700, dur: 0.05, type: 'sine', gain: 0.12 });
        break;
      case 'place': // tic tac toe move
        this._tone({ freq: 330, dur: 0.1, type: 'triangle', gain: 0.4 });
        break;
      case 'win':
        this._tone({ freq: 523, dur: 0.12, type: 'square', gain: 0.4, delay: 0 });
        this._tone({ freq: 659, dur: 0.12, type: 'square', gain: 0.4, delay: 0.12 });
        this._tone({ freq: 784, dur: 0.2, type: 'square', gain: 0.4, delay: 0.24 });
        break;
      case 'lose':
        this._tone({ freq: 392, dur: 0.18, type: 'sawtooth', gain: 0.35, delay: 0, sweepTo: 180 });
        this._tone({ freq: 294, dur: 0.3, type: 'sawtooth', gain: 0.35, delay: 0.18, sweepTo: 110 });
        break;
      case 'correct':
        this._tone({ freq: 660, dur: 0.09, type: 'sine', gain: 0.4 });
        this._tone({ freq: 990, dur: 0.12, type: 'sine', gain: 0.4, delay: 0.09 });
        break;
      case 'wrong':
        this._tone({ freq: 220, dur: 0.18, type: 'square', gain: 0.3, sweepTo: 120 });
        break;
      case 'type':
        this._tone({ freq: 880, dur: 0.03, type: 'square', gain: 0.12 });
        break;
      case 'drop':
        this._tone({ freq: 300, dur: 0.5, type: 'sine', gain: 0.18, sweepTo: 160 });
        break;
      case 'smash':
        this._noise({ dur: 0.4, gain: 0.5, freq: 1600 });
        this._tone({ freq: 160, dur: 0.25, type: 'sawtooth', gain: 0.3, sweepTo: 60 });
        break;
      case 'explosion':
        this._noise({ dur: 0.5, gain: 0.6, freq: 1800 });
        break;
      // --- Space Invaders ---
      case 'shoot':
        this._tone({ freq: 900, dur: 0.16, type: 'square', gain: 0.25, sweepTo: 180 });
        break;
      case 'invaderHit':
        this._noise({ dur: 0.22, gain: 0.45, freq: 1400 });
        this._tone({ freq: 420, dur: 0.16, type: 'square', gain: 0.25, sweepTo: 120 });
        break;
      case 'playerExplode':
        this._noise({ dur: 0.7, gain: 0.7, freq: 2000 });
        this._tone({ freq: 200, dur: 0.6, type: 'sawtooth', gain: 0.4, sweepTo: 40 });
        break;
      case 'marchA':
        this._tone({ freq: 110, dur: 0.1, type: 'square', gain: 0.3 });
        break;
      case 'marchB':
        this._tone({ freq: 92, dur: 0.1, type: 'square', gain: 0.3 });
        break;
      case 'marchC':
        this._tone({ freq: 82, dur: 0.1, type: 'square', gain: 0.3 });
        break;
      case 'marchD':
        this._tone({ freq: 73, dur: 0.1, type: 'square', gain: 0.3 });
        break;
      case 'newWave':
        this._tone({ freq: 392, dur: 0.12, type: 'square', gain: 0.35 });
        this._tone({ freq: 523, dur: 0.12, type: 'square', gain: 0.35, delay: 0.12 });
        this._tone({ freq: 784, dur: 0.18, type: 'square', gain: 0.35, delay: 0.24 });
        break;
      case 'shieldHit':
        this._noise({ dur: 0.12, gain: 0.3, freq: 900 });
        break;
      default:
        break;
    }
  }
}

export const sfx = new Sfx();
