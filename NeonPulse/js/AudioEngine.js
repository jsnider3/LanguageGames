// ═══════════════════════════════════════════════════════════════════
// AudioEngine.js - Web Audio synthesizer & playback engine
// Pre-renders full songs via OfflineAudioContext, plays back from
// a single AudioBuffer. Provides live SFX for hit feedback & UI.
// ═══════════════════════════════════════════════════════════════════

import { SAMPLE_RATE, MASTER_VOLUME, SFX_VOLUME } from './Constants.js';

// ═══════════════════════════════════════════════════════════════════
// AUDIO ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class AudioEngine {

    // ───────────────────────────────────────────────────────────────
    // Constructor
    // ───────────────────────────────────────────────────────────────

    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.offlineBuffer = null;
        this.sourceNode = null;
        this.songStartTime = 0;
        this.pauseOffset = 0;
        this.playing = false;
        this.songDuration = 0;
    }

    // ───────────────────────────────────────────────────────────────
    // Initialization - call on first user gesture
    // ───────────────────────────────────────────────────────────────

    async init() {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = MASTER_VOLUME;
            this.masterGain.connect(this.audioCtx.destination);
        }

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SONG PRE-RENDERING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Pre-render an entire song to an AudioBuffer via OfflineAudioContext.
     * The song object must have: bpm, duration, instruments.
     */
    async loadSong(song) {
        const totalSamples = Math.ceil(song.duration * SAMPLE_RATE);
        const offCtx = new OfflineAudioContext(2, totalSamples, SAMPLE_RATE);

        const bpm = song.bpm;
        const secPerBeat = 60 / bpm;

        // Process each instrument type
        const instruments = song.instruments;

        if (instruments.drums) {
            this._renderDrums(offCtx, instruments.drums, secPerBeat);
        }
        if (instruments.bass) {
            this._renderBass(offCtx, instruments.bass, secPerBeat);
        }
        if (instruments.lead) {
            this._renderLead(offCtx, instruments.lead, secPerBeat);
        }
        if (instruments.pad) {
            this._renderPad(offCtx, instruments.pad, secPerBeat);
        }

        this.offlineBuffer = await offCtx.startRendering();
        this.songDuration = song.duration;
        this.pauseOffset = 0;
        this.playing = false;
    }

    // ───────────────────────────────────────────────────────────────
    // Section expansion - pattern-based to absolute beat times
    // ───────────────────────────────────────────────────────────────

    /**
     * Expand section-based patterns into an array of notes with
     * absolute beat positions. Each section references a named
     * pattern; notes within are offset by the section's startBeat.
     */
    _expandSections(instrument) {
        const notes = [];
        const beatsPerBar = 4;

        for (const section of instrument.sections) {
            const pattern = instrument.patterns[section.pattern];
            if (!pattern) continue;

            const patternLength = section.bars * beatsPerBar;

            for (const note of pattern) {
                const noteOffset = note[0];
                // Only include notes that fall within the section length
                if (noteOffset < patternLength) {
                    const absoluteBeat = section.startBeat + noteOffset;
                    // Clone note data with absolute beat in first position
                    const expanded = [absoluteBeat, ...note.slice(1)];
                    notes.push(expanded);
                }
            }
        }

        return notes;
    }

    // ═══════════════════════════════════════════════════════════════
    // INSTRUMENT RENDERERS (OfflineAudioContext)
    // ═══════════════════════════════════════════════════════════════

    // ───────────────────────────────────────────────────────────────
    // Drums - kick, snare, hat, clap
    // ───────────────────────────────────────────────────────────────

    _renderDrums(offCtx, instrument, secPerBeat) {
        const notes = this._expandSections(instrument);

        for (const note of notes) {
            const time = note[0] * secPerBeat;
            const type = note[1];

            if (time < 0) continue;

            switch (type) {
                case 'kick':
                    this._renderKick(offCtx, time);
                    break;
                case 'snare':
                    this._renderSnare(offCtx, time);
                    break;
                case 'hat':
                    this._renderHat(offCtx, time);
                    break;
                case 'clap':
                    this._renderClap(offCtx, time);
                    break;
            }
        }
    }

    /**
     * Kick drum - sine oscillator with pitch sweep 150Hz → 40Hz,
     * gain envelope 0.7 → 0.01 over 0.2s.
     */
    _renderKick(offCtx, time) {
        const osc = offCtx.createOscillator();
        const gain = offCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);

        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.connect(gain);
        gain.connect(offCtx.destination);

        osc.start(time);
        osc.stop(time + 0.25);
    }

    /**
     * Snare - white noise through bandpass 3000Hz, Q=1,
     * gain 0.5 → 0.01 over 0.12s.
     */
    _renderSnare(offCtx, time) {
        const noiseBuffer = this._createNoise(offCtx, 0.1);
        const source = offCtx.createBufferSource();
        source.buffer = noiseBuffer;

        const filter = offCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 1;

        const gain = offCtx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(offCtx.destination);

        source.start(time);
        source.stop(time + 0.1);
    }

    /**
     * Hi-hat - white noise through highpass 8000Hz,
     * gain 0.25 → 0.01 over 0.05s.
     */
    _renderHat(offCtx, time) {
        const noiseBuffer = this._createNoise(offCtx, 0.05);
        const source = offCtx.createBufferSource();
        source.buffer = noiseBuffer;

        const filter = offCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        const gain = offCtx.createGain();
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(offCtx.destination);

        source.start(time);
        source.stop(time + 0.05);
    }

    /**
     * Clap - white noise through bandpass 1500Hz Q=0.5,
     * gain 0.4 → 0.01 over 0.1s.
     */
    _renderClap(offCtx, time) {
        const noiseBuffer = this._createNoise(offCtx, 0.08);
        const source = offCtx.createBufferSource();
        source.buffer = noiseBuffer;

        const filter = offCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.5;

        const gain = offCtx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(offCtx.destination);

        source.start(time);
        source.stop(time + 0.08);
    }

    // ───────────────────────────────────────────────────────────────
    // Bass - sawtooth through lowpass, punchy envelope
    // ───────────────────────────────────────────────────────────────

    /**
     * Bass synthesizer - sawtooth oscillator, lowpass 400Hz Q=5,
     * attack 0.01s to 0.5, release 0.05s. Note duration is 80%
     * of one beat. Each note: [beatOffset, frequency].
     */
    _renderBass(offCtx, instrument, secPerBeat) {
        const notes = this._expandSections(instrument);
        const noteDuration = 0.8 * secPerBeat;

        for (const note of notes) {
            const time = note[0] * secPerBeat;
            const freq = note[1];

            if (time < 0) continue;

            const osc = offCtx.createOscillator();
            const filter = offCtx.createBiquadFilter();
            const gain = offCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.value = 400;
            filter.Q.value = 5;

            // Gain envelope: attack 0.01s → 0.5, sustain, release 0.05s
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.5, time + 0.01);
            gain.gain.setValueAtTime(0.5, time + noteDuration - 0.05);
            gain.gain.linearRampToValueAtTime(0.001, time + noteDuration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(offCtx.destination);

            osc.start(time);
            osc.stop(time + noteDuration + 0.01);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // Lead - square osc with vibrato & filter sweep
    // ───────────────────────────────────────────────────────────────

    /**
     * Lead synthesizer - square oscillator with sine vibrato LFO
     * (5Hz, 3Hz depth). Lowpass filter sweeps 2000→4000Hz over
     * note duration. Gain: attack 0.02s to 0.35, release 0.05s.
     * Each note: [beatOffset, frequency, duration_in_beats].
     */
    _renderLead(offCtx, instrument, secPerBeat) {
        const notes = this._expandSections(instrument);

        for (const note of notes) {
            const time = note[0] * secPerBeat;
            const freq = note[1];
            const durationBeats = note[2] || 1;
            const duration = durationBeats * secPerBeat;

            if (time < 0) continue;

            // Main oscillator
            const osc = offCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            // Vibrato LFO - sine at 5Hz, depth 3Hz
            const lfo = offCtx.createOscillator();
            const lfoGain = offCtx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(5, time);
            lfoGain.gain.setValueAtTime(3, time);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            // Lowpass filter with sweep
            const filter = offCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, time);
            filter.frequency.linearRampToValueAtTime(4000, time + duration);

            // Gain envelope: attack 0.02s → 0.35, release 0.05s
            const gain = offCtx.createGain();
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.35, time + 0.02);
            gain.gain.setValueAtTime(0.35, time + duration - 0.05);
            gain.gain.linearRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(offCtx.destination);

            osc.start(time);
            lfo.start(time);
            osc.stop(time + duration + 0.01);
            lfo.stop(time + duration + 0.01);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // Pad - detuned sawtooth pair, slow envelope
    // ───────────────────────────────────────────────────────────────

    /**
     * Pad synthesizer - two detuned sawtooth oscillators (+7/-7
     * cents), lowpass 1200Hz. Slow gain envelope: attack 0.3s to
     * 0.15, release 0.5s. Each note: [beatOffset, freq, duration].
     */
    _renderPad(offCtx, instrument, secPerBeat) {
        const notes = this._expandSections(instrument);

        for (const note of notes) {
            const time = note[0] * secPerBeat;
            const freq = note[1];
            const durationBeats = note[2] || 4;
            const duration = durationBeats * secPerBeat;

            if (time < 0) continue;

            // Two detuned sawtooth oscillators
            const osc1 = offCtx.createOscillator();
            const osc2 = offCtx.createOscillator();

            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc1.frequency.setValueAtTime(freq, time);
            osc2.frequency.setValueAtTime(freq, time);
            osc1.detune.setValueAtTime(7, time);
            osc2.detune.setValueAtTime(-7, time);

            // Lowpass filter
            const filter = offCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1200;

            // Slow gain envelope: attack 0.3s → 0.15, release 0.5s
            const gain = offCtx.createGain();
            const attackEnd = Math.min(0.3, duration * 0.3);
            const releaseStart = Math.max(time + attackEnd, time + duration - 0.5);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.15, time + attackEnd);
            gain.gain.setValueAtTime(0.15, releaseStart);
            gain.gain.linearRampToValueAtTime(0.001, time + duration);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(offCtx.destination);

            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + duration + 0.01);
            osc2.stop(time + duration + 0.01);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // Noise helper
    // ───────────────────────────────────────────────────────────────

    /**
     * Create a mono AudioBuffer filled with white noise.
     * Used for snare, hi-hat, clap, and miss SFX.
     */
    _createNoise(ctx, duration) {
        const length = Math.ceil(duration * ctx.sampleRate);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    // ═══════════════════════════════════════════════════════════════
    // PLAYBACK CONTROLS
    // ═══════════════════════════════════════════════════════════════

    // ───────────────────────────────────────────────────────────────
    // Play - start from current pauseOffset
    // ───────────────────────────────────────────────────────────────

    async play() {
        if (!this.offlineBuffer || !this.audioCtx) return;

        // Ensure AudioContext is running (browser may suspend it)
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        // Clean up previous source if any
        this._stopSource();

        this.sourceNode = this.audioCtx.createBufferSource();
        this.sourceNode.buffer = this.offlineBuffer;
        this.sourceNode.connect(this.masterGain);

        this.sourceNode.start(0, this.pauseOffset);
        this.songStartTime = this.audioCtx.currentTime - this.pauseOffset;
        this.playing = true;

        // Auto-stop when buffer finishes
        this.sourceNode.onended = () => {
            if (this.playing) {
                this.pauseOffset = this.getSongTime();
                this.playing = false;
            }
        };
    }

    // ───────────────────────────────────────────────────────────────
    // Pause - freeze at current position
    // ───────────────────────────────────────────────────────────────

    pause() {
        if (!this.playing) return;

        this.pauseOffset = this.getSongTime();
        this._stopSource();
        this.playing = false;
    }

    // ───────────────────────────────────────────────────────────────
    // Resume - continue from paused position
    // ───────────────────────────────────────────────────────────────

    async resume() {
        if (this.playing) return;
        await this.play();
    }

    // ───────────────────────────────────────────────────────────────
    // Stop - halt playback and reset to beginning
    // ───────────────────────────────────────────────────────────────

    stop() {
        this._stopSource();
        this.pauseOffset = 0;
        this.playing = false;
    }

    /**
     * Internal helper to safely stop the current source node.
     */
    _stopSource() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {
                // Already stopped - ignore
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TIMING QUERIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get current playback position in seconds.
     */
    getSongTime() {
        if (this.playing && this.audioCtx) {
            return this.audioCtx.currentTime - this.songStartTime;
        }
        return this.pauseOffset;
    }

    /**
     * Get song progress as a 0-1 fraction, clamped.
     */
    getSongProgress() {
        if (this.songDuration <= 0) return 0;
        const progress = this.getSongTime() / this.songDuration;
        return Math.max(0, Math.min(1, progress));
    }

    /**
     * Check whether the song has reached its end.
     */
    isFinished() {
        return this.getSongTime() >= this.songDuration;
    }

    // ═══════════════════════════════════════════════════════════════
    // SOUND EFFECTS (live AudioContext)
    // ═══════════════════════════════════════════════════════════════

    // ───────────────────────────────────────────────────────────────
    // Hit judgement sounds
    // ───────────────────────────────────────────────────────────────

    /**
     * Play a short SFX for a hit judgement: perfect, great, good,
     * or miss. Each has distinct pitch/timbre for audio feedback.
     */
    playHitSound(judgement) {
        if (!this.audioCtx || this.audioCtx.state !== 'running') return;

        switch (judgement) {
            case 'perfect':
                this._playTone(880, 0.08, 0.2 * SFX_VOLUME / 0.25);
                break;
            case 'great':
                this._playTone(660, 0.08, 0.15 * SFX_VOLUME / 0.25);
                break;
            case 'good':
                this._playTone(440, 0.1, 0.12 * SFX_VOLUME / 0.25);
                break;
            case 'miss':
                this._playMissNoise();
                break;
        }
    }

    /**
     * Play a sine tone for perfect/great/good hit feedback.
     */
    _playTone(freq, decay, volume) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.01);
    }

    /**
     * Play a noise burst for miss feedback - lowpass 500Hz.
     */
    _playMissNoise() {
        const duration = 0.06;
        const noiseBuffer = this._createNoise(this.audioCtx, duration);
        const source = this.audioCtx.createBufferSource();
        source.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;

        const gain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;
        const volume = 0.15 * SFX_VOLUME / 0.25;

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start(now);
        source.stop(now + duration + 0.01);
    }

    // ───────────────────────────────────────────────────────────────
    // UI sounds
    // ───────────────────────────────────────────────────────────────

    /**
     * Menu click - square wave with fast pitch sweep 800→200Hz
     * over 0.04s.
     */
    playMenuClick() {
        if (!this.audioCtx || this.audioCtx.state !== 'running') return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;
        const duration = 0.04;

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + duration);

        const volume = 0.1 * SFX_VOLUME / 0.25;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }
}
