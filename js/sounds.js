const Sound = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },

  setEnabled(on) {
    this.enabled = on;
  },

  tone(freq, duration, type = "sine", volume = 0.15) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playCorrect() {
    this.init();
    this.tone(523, 0.12);
    setTimeout(() => this.tone(659, 0.12), 100);
    setTimeout(() => this.tone(784, 0.18), 200);
  },

  playWrong() {
    this.init();
    this.tone(330, 0.25, "triangle", 0.1);
  },

  playUnlock() {
    this.init();
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.2), i * 120);
    });
  },

  playClick() {
    this.init();
    this.tone(440, 0.06, "sine", 0.08);
  },

  playBubblePop() {
    this.init();
    if (!this.enabled || !this.ctx) return;

    const t = this.ctx.currentTime;

    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(720, t);
    pop.frequency.exponentialRampToValueAtTime(160, t + 0.11);
    popGain.gain.setValueAtTime(0.28, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    pop.connect(popGain);
    popGain.connect(this.ctx.destination);
    pop.start(t);
    pop.stop(t + 0.14);

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 1.2;
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.07);

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = "triangle";
    chime.frequency.setValueAtTime(1047, t + 0.05);
    chime.frequency.exponentialRampToValueAtTime(1568, t + 0.18);
    chimeGain.gain.setValueAtTime(0.001, t + 0.05);
    chimeGain.gain.linearRampToValueAtTime(0.12, t + 0.07);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(t + 0.05);
    chime.stop(t + 0.22);
  },
};
