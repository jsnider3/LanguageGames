import * as THREE from 'three';
import { GAME_CONFIG } from './GameConfig.js';

// ============= UTILITY CLASSES =============

export class AudioManager {
    static audioContext = null;

    static getContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    static playSound(config) {
        const context = this.getContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        // Apply pitch variation if requested
        const pitchVariation = config.pitchVariation ?
            1 + (Math.random() - 0.5) * GAME_CONFIG.AUDIO.PITCH_VARIATION : 1;
        const volumeVariation = config.volumeVariation ?
            1 + (Math.random() - 0.5) * GAME_CONFIG.AUDIO.VOLUME_VARIATION : 1;

        oscillator.type = config.type || 'sine';
        oscillator.frequency.setValueAtTime(
            (config.frequency || 440) * pitchVariation,
            context.currentTime
        );

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        const volume = (config.volume || GAME_CONFIG.AUDIO.DEFAULT_GAIN) * volumeVariation;
        gainNode.gain.setValueAtTime(volume, context.currentTime);

        if (config.fadeOut) {
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                context.currentTime + (config.duration || GAME_CONFIG.AUDIO.FADE_DURATION)
            );
        }

        oscillator.start();
        oscillator.stop(context.currentTime + (config.duration || 0.2));

        return { oscillator, gainNode, context };
    }

    static playPickupSound() {
        return this.playSound({
            frequency: GAME_CONFIG.AUDIO.PICKUP_FREQUENCY,
            type: 'sine',
            duration: 0.2,
            fadeOut: true,
            pitchVariation: true
        });
    }

    static playDeath() {
        const context = this.getContext();
        if (!context) return;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, context.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0.25, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.5);
        osc.start();
        osc.stop(context.currentTime + 1.6);
    }

    static playRageSound() {
        const context = this.getContext();
        if (!context) return;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0.2, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
        osc.start();
        osc.stop(context.currentTime + 0.4);
    }

    static playVoiceLine(category) {
        const context = this.getContext();
        if (!context) return;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1100, context.currentTime);
        osc.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.setValueAtTime(0.0, context.currentTime + 0.05);
        osc.start();
        osc.stop(context.currentTime + 0.06);
    }
}

export class GeometryCache {
    static cache = new Map();

    static get(key, createFn) {
        if (!this.cache.has(key)) {
            this.cache.set(key, createFn());
        }
        return this.cache.get(key);
    }

    static getBox(width, height, depth) {
        const key = `box_${width}_${height}_${depth}`;
        return this.get(key, () => new THREE.BoxGeometry(width, height, depth));
    }

    static getSphere(radius, widthSegments = 8, heightSegments = 6) {
        const key = `sphere_${radius}_${widthSegments}_${heightSegments}`;
        return this.get(key, () => new THREE.SphereGeometry(radius, widthSegments, heightSegments));
    }

    static getCylinder(radiusTop, radiusBottom, height, radialSegments = 8) {
        const key = `cylinder_${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
        return this.get(key, () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
    }
}
