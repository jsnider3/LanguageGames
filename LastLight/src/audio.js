export class Soundscape {
  constructor() {
    this.enabled = true;
    this.music = true;
    this.volume = 0.4;
    this.ctx = null;
    this.noteTimer = 0;
    this.step = 0;
  }
  async unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
        const seconds = 0.5,
          buffer = this.ctx.createBuffer(
            1,
            this.ctx.sampleRate * seconds,
            this.ctx.sampleRate,
          ),
          data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
      }
      await this.ctx.resume();
    } catch {
      this.enabled = false;
    }
  }
  tone(
    frequency,
    duration,
    volume = 0.1,
    type = "sine",
    endFrequency = frequency,
  ) {
    if (!this.ctx || !this.enabled || this.ctx.state !== "running") return;
    const osc = this.ctx.createOscillator(),
      gain = this.ctx.createGain(),
      now = this.ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      now + duration,
    );
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(now + duration + 0.01);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  noise(duration, volume, cutoff = 1300) {
    if (!this.ctx || !this.enabled || this.ctx.state !== "running") return;
    const src = this.ctx.createBufferSource(),
      gain = this.ctx.createGain(),
      filter = this.ctx.createBiquadFilter(),
      now = this.ctx.currentTime;
    src.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    src.stop(now + duration);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  play(name, distance = 0) {
    const v = Math.max(0.06, 1 / (1 + distance * 0.13));
    if (name === "rifle") {
      this.noise(0.1, 0.19, 3800);
      this.tone(150, 0.1, 0.15, "triangle", 45);
    }
    if (name === "shotgun") {
      this.noise(0.25, 0.4, 1800);
      this.tone(100, 0.22, 0.3, "triangle", 28);
    }
    if (name === "sentry") {
      this.noise(0.05, v * 0.08, 2400);
      this.tone(220, 0.07, v * 0.07, "triangle", 70);
    }
    if (name === "mortar" || name === "explosion") {
      this.noise(0.35, v * 0.32, 650);
      this.tone(90, 0.3, v * 0.25, "sine", 25);
    }
    if (name === "rail") {
      this.tone(900, 0.25, v * 0.13, "sawtooth", 70);
      this.noise(0.1, v * 0.1, 5000);
    }
    if (name === "frost") this.tone(800, 0.22, v * 0.05, "sine", 1400);
    if (name === "hit") this.tone(1400, 0.04, 0.07, "sine", 1900);
    if (name === "hurt") {
      this.noise(0.15, 0.22, 250);
      this.tone(65, 0.15, 0.2, "sine", 30);
    }
    if (name === "build") {
      this.tone(300, 0.18, 0.15, "sine", 600);
      this.noise(0.1, 0.1, 1500);
    }
    if (name === "wave") {
      this.tone(160, 0.7, 0.12, "triangle", 230);
      this.tone(240, 0.85, 0.08, "sine");
    }
    if (name === "clear") {
      this.tone(330, 0.8, 0.12);
      this.tone(440, 1, 0.07);
      this.tone(660, 1.2, 0.05);
    }
    if (name === "reload") {
      this.noise(0.08, 0.11, 4000);
      this.tone(500, 0.1, 0.06, "square", 250);
    }
    if (name === "click") this.tone(600, 0.05, 0.07, "sine", 1000);
  }
  update(dt, combat) {
    if (!this.ctx || !this.music || !this.enabled) return;
    this.noteTimer -= dt;
    if (this.noteTimer > 0) return;
    this.noteTimer = combat ? 0.38 : 0.75;
    const notes = [
      110, 164.81, 220, 164.81, 130.81, 196, 261.63, 196, 98, 146.83, 196,
      146.83, 110, 164.81, 220, 246.94,
    ];
    this.tone(
      notes[this.step % notes.length],
      combat ? 0.7 : 1.6,
      0.022,
      "sine",
    );
    if (this.step % 4 === 0)
      this.tone(notes[this.step % notes.length] / 2, 2.3, 0.03, "sine");
    if (combat && this.step % 2 === 0) {
      this.tone(70, 0.2, 0.06, "sine", 30);
      this.noise(0.08, 0.018, 3000);
    }
    this.step++;
  }
  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.value = value;
  }
}
