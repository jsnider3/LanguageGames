/**
 * AudioManager
 * Procedural audio generation for UI and Gameplay sounds.
 * Uses Web Audio API.
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Prevent ear blasting
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
            console.log("Audio Initialized");

            // Start ambient hum
            this.playAmbience();
        } catch (e) {
            console.error("Audio init failed", e);
        }
    }

    playAmbience() {
        if (!this.initialized) return;

        // Low drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime);

        // LFO for the drone to make it throb
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 20;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        // Lowpass filter to make it distant
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        gain.gain.value = 0.05;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
    }

    playClick() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playConnect() {
        if (!this.initialized) return;
        // High pitched "link" sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1800, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playDelete() {
        if (!this.initialized) return;
        // Static noise burst
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playSuccess() {
        if (!this.initialized) return;

        // Arpeggio
        const notes = [440, 554, 659, 880]; // A Major 7
        const now = this.ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + (i * 0.1));
            gain.gain.linearRampToValueAtTime(0.2, now + (i * 0.1) + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + (i * 0.1));
            osc.stop(now + (i * 0.1) + 0.6);
        });
    }

    playFail() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}
