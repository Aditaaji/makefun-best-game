// Procedural sound: every effect is synthesized with WebAudio, no audio files.
// The context is created on the first user gesture; headless runs stay silent.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.padNodes = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.startPad();
    } catch (e) {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  // A quiet two-oscillator ambient pad under the game.
  startPad() {
    if (!this.ctx || this.padNodes) return;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.045;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const o1 = this.ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = this.ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 82.5;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    o1.start();
    o2.start();
    lfo.start();
    this.padNodes = { o1, o2, lfo };
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (e) {
      // Sound is garnish: never let it break the game.
    }
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t);
    } catch (e) {
      // Sound is garnish: never let it break the game.
    }
  }

  shoot() {
    this.tone(720, 0.09, 'square', 0.10, 240);
  }

  enemyDie(big) {
    this.noise(big ? 0.35 : 0.18, big ? 0.30 : 0.16, big ? 900 : 1400);
    this.tone(big ? 160 : 220, 0.22, 'sawtooth', 0.10, 40);
  }

  pickup(combo) {
    const base = 520 + Math.min(combo, 8) * 45;
    this.tone(base, 0.12, 'sine', 0.16, base * 1.6);
  }

  playerHit() {
    this.noise(0.4, 0.32, 700);
    this.tone(110, 0.4, 'sawtooth', 0.18, 30);
  }

  powerup() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.16, 'triangle', 0.16), i * 70);
    });
  }

  bomb() {
    this.noise(0.7, 0.4, 500);
    this.tone(90, 0.6, 'sine', 0.22, 28);
  }

  waveStart() {
    this.tone(392, 0.18, 'triangle', 0.16);
    setTimeout(() => this.tone(523, 0.22, 'triangle', 0.16), 140);
  }

  bossAlarm() {
    this.tone(196, 0.3, 'sawtooth', 0.16, 180);
    setTimeout(() => this.tone(196, 0.3, 'sawtooth', 0.16, 180), 320);
  }

  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, 'triangle', 0.18), i * 130);
    });
  }

  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.4, 'triangle', 0.16), i * 180);
    });
  }
}
