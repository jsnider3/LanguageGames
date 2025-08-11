// Audio System for SaintDoom
// Handles voice lines, sound effects, and ambient audio

export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.voiceVolume = 0.8;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        
        this.voiceLines = {};
        this.soundEffects = {};
        this.currentVoice = null;
        this.voiceQueue = [];
        
        this.initAudioContext();
        this.generateVoiceLines();
        this.generateSoundEffects();
    }
    
    initAudioContext() {
        // Try to create audio context immediately if possible
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // If immediate creation fails, wait for user interaction
                const initContext = () => {
                    if (!this.audioContext) {
                        try {
                            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            // Remove listener after initialization
                            document.removeEventListener('click', initContext);
                            document.removeEventListener('keydown', initContext);
                        } catch (err) {
                            console.warn('Failed to create AudioContext:', err);
                        }
                    }
                };
                
                document.addEventListener('click', initContext);
                document.addEventListener('keydown', initContext);
            }
        }
    }
    
    generateVoiceLines() {
        // Generate synthesized voice lines for Giovanni
        // Using Web Audio API to create atmospheric, processed voice effects
        
        const voiceData = {
            resurrection: [
                { text: "Seven times called, seven times I answer", pitch: 0.8, reverb: 0.7 },
                { text: "The cold of resurrection never gets easier", pitch: 0.75, reverb: 0.6 },
                { text: "Heaven was so close and yet here I am again", pitch: 0.7, reverb: 0.8 }
            ],
            combat: [
                { text: "Same demons different century", pitch: 0.9, reverb: 0.3 },
                { text: "You'd think they'd learn by now", pitch: 0.85, reverb: 0.3 },
                { text: "Death is merely an inconvenience now", pitch: 0.7, reverb: 0.5 },
                { text: "In nomine Patris", pitch: 0.6, reverb: 0.4 }
            ],
            lowHealth: [
                { text: "Not my first death won't be my last", pitch: 0.6, reverb: 0.4 },
                { text: "The pain reminds me I still serve", pitch: 0.65, reverb: 0.5 },
                { text: "Lord grant me strength for one more swing", pitch: 0.5, reverb: 0.6 }
            ],
            demonKill: [
                { text: "Return to the pit", pitch: 1.0, reverb: 0.2 },
                { text: "Tell them Giovanni sends you Again", pitch: 0.9, reverb: 0.3 },
                { text: "Eight centuries of practice", pitch: 0.85, reverb: 0.3 },
                { text: "Deus Vult as we used to say", pitch: 0.8, reverb: 0.4 }
            ],
            findWeapon: [
                { text: "Still using the Mark Six blessing Good", pitch: 0.9, reverb: 0.3 },
                { text: "Modern tools ancient purpose", pitch: 0.85, reverb: 0.3 },
                { text: "The tools change the mission remains", pitch: 0.8, reverb: 0.4 }
            ],
            findLore: [
                { text: "Another piece of the puzzle", pitch: 0.7, reverb: 0.5 },
                { text: "The truth is always darker than they tell us", pitch: 0.6, reverb: 0.6 },
                { text: "History repeats and I'm always there to see it", pitch: 0.65, reverb: 0.7 }
            ]
        };
        
        // Store voice line configurations
        this.voiceLines = voiceData;
    }
    
    generateSoundEffects() {
        // Pre-generate common sound effects
        this.soundEffectGenerators = {
            swordSwing: () => this.createSwingSound(),
            swordHit: () => this.createImpactSound(800, 0.1),
            block: () => this.createMetallicSound(400, 0.15),
            footstep: () => this.createFootstepSound(),
            hurt: () => this.createHurtSound(),
            death: () => this.createDeathSound(),
            holyCharge: () => this.createHolySound(),
            demonScream: () => this.createDemonSound(),
            pickup: () => this.createPickupSound(),
            doorOpen: () => this.createDoorSound()
        };
    }
    
    playVoiceLine(category) {
        if (!this.audioContext) return;
        
        const lines = this.voiceLines[category];
        if (!lines || lines.length === 0) return;
        
        // Stop current voice if playing
        if (this.currentVoice) {
            this.currentVoice.stop();
        }
        
        const line = lines[Math.floor(Math.random() * lines.length)];
        this.synthesizeVoice(line);
    }
    
    synthesizeVoice(voiceData) {
        if (!this.audioContext) return;
        
        const { text, pitch, reverb } = voiceData;
        
        // Use speech synthesis API if available
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = pitch;
            utterance.rate = 0.9;
            utterance.volume = this.voiceVolume * this.masterVolume;
            
            // Get Italian or Latin voice if available for authenticity
            const voices = speechSynthesis.getVoices();
            const italianVoice = voices.find(v => v.lang.includes('it')) || 
                               voices.find(v => v.lang.includes('la')) ||
                               voices[0];
            if (italianVoice) {
                utterance.voice = italianVoice;
            }
            
            speechSynthesis.speak(utterance);
        } else {
            // Fallback: create atmospheric tone
            this.createAtmosphericTone(200 * pitch, 2, reverb);
        }
    }
    
    createSwingSound() {
        if (!this.audioContext) return;
        
        const duration = 0.2;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createImpactSound(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.audioContext.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        // Add some noise for impact
        this.createNoiseBurst(0.05);
    }
    
    createMetallicSound(frequency, duration) {
        if (!this.audioContext) return;
        
        // Create multiple oscillators for metallic timbre
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency * (1 + i * 0.7), this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.2 / (i + 1), this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        }
    }
    
    createFootstepSound() {
        if (!this.audioContext) return;
        
        this.createNoiseBurst(0.05, 0.1);
    }
    
    createHurtSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(80, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    createDeathSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 1.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 1.5);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 2);
    }
    
    createHolySound() {
        if (!this.audioContext) return;
        
        // Choir-like sound with multiple harmonics
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major chord
        
        frequencies.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume * 0.15, this.audioContext.currentTime + 0.5);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 2);
        });
    }
    
    createDemonSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const distortion = this.audioContext.createWaveShaper();
        
        // Create distortion curve
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * 5);
        }
        distortion.curve = curve;
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(40, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        
        oscillator.connect(distortion);
        distortion.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }
    
    createPickupSound() {
        if (!this.audioContext) return;
        
        // Pleasant ascending tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    createDoorSound() {
        if (!this.audioContext) return;
        
        // Low rumbling sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.4, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    createNoiseBurst(duration, volume = 0.2) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        noise.buffer = buffer;
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume * volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        noise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start(this.audioContext.currentTime);
    }
    
    createAtmosphericTone(frequency, duration, reverbAmount) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.voiceVolume * this.masterVolume * 0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(this.voiceVolume * this.masterVolume * 0.2, this.audioContext.currentTime + duration - 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSoundEffect(effectName) {
        if (!this.audioContext) return;
        
        const generator = this.soundEffectGenerators[effectName];
        if (generator) {
            generator();
        }
    }
    
    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }
    
    setVoiceVolume(value) {
        this.voiceVolume = Math.max(0, Math.min(1, value));
    }
    
    setSfxVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
    }
}