import * as THREE from 'three';

/**
 * Centralized animation system for common animations
 * Reduces duplicate animation code across levels
 */
export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Set();
    }
    
    /**
     * Register a reusable animation
     */
    registerAnimation(name, updateFunc) {
        this.animations.set(name, updateFunc);
    }
    
    /**
     * Start animating an object with a specific animation
     */
    startAnimation(object, animationType, options = {}) {
        const animationData = {
            object: object,
            type: animationType,
            startTime: Date.now(),
            options: options,
            active: true
        };
        
        // Store initial state for some animations
        if (animationType === 'float') {
            animationData.baseY = object.position.y;
        } else if (animationType === 'pulse') {
            animationData.baseScale = object.scale.clone();
        }
        
        this.activeAnimations.add(animationData);
        return animationData;
    }
    
    /**
     * Stop animating an object
     */
    stopAnimation(animationData) {
        animationData.active = false;
        this.activeAnimations.delete(animationData);
    }
    
    /**
     * Stop all animations for an object
     */
    stopObjectAnimations(object) {
        this.activeAnimations.forEach(anim => {
            if (anim.object === object) {
                this.stopAnimation(anim);
            }
        });
    }
    
    /**
     * Update all active animations
     */
    update(deltaTime) {
        const currentTime = Date.now() * 0.001; // Convert to seconds
        
        this.activeAnimations.forEach(animData => {
            if (!animData.active || !animData.object) {
                this.activeAnimations.delete(animData);
                return;
            }
            
            const elapsedTime = (Date.now() - animData.startTime) * 0.001;
            
            switch (animData.type) {
                case 'float':
                    this.updateFloat(animData, currentTime);
                    break;
                case 'rotate':
                    this.updateRotate(animData, deltaTime);
                    break;
                case 'pulse':
                    this.updatePulse(animData, currentTime);
                    break;
                case 'bob':
                    this.updateBob(animData, currentTime);
                    break;
                case 'flicker':
                    this.updateFlicker(animData, currentTime);
                    break;
                case 'fadeIn':
                    this.updateFadeIn(animData, elapsedTime);
                    break;
                case 'fadeOut':
                    this.updateFadeOut(animData, elapsedTime);
                    break;
                case 'shake':
                    this.updateShake(animData, elapsedTime);
                    break;
                case 'spiral':
                    this.updateSpiral(animData, elapsedTime);
                    break;
                case 'bounce':
                    this.updateBounce(animData, elapsedTime);
                    break;
            }
        });
    }
    
    /**
     * Float animation - object floats up and down
     */
    updateFloat(animData, time) {
        const amplitude = animData.options.amplitude || 0.5;
        const speed = animData.options.speed || 1;
        const offset = animData.options.offset || 0;
        
        animData.object.position.y = animData.baseY + 
            Math.sin(time * speed + offset) * amplitude;
    }
    
    /**
     * Rotate animation - continuous rotation
     */
    updateRotate(animData, deltaTime) {
        const axis = animData.options.axis || 'y';
        const speed = animData.options.speed || 1;
        
        animData.object.rotation[axis] += deltaTime * speed;
    }
    
    /**
     * Pulse animation - scale pulsing
     */
    updatePulse(animData, time) {
        const speed = animData.options.speed || 2;
        const intensity = animData.options.intensity || 0.2;
        
        const scale = 1 + Math.sin(time * speed) * intensity;
        animData.object.scale.copy(animData.baseScale).multiplyScalar(scale);
    }
    
    /**
     * Bob animation - gentle bobbing motion
     */
    updateBob(animData, time) {
        const speed = animData.options.speed || 1;
        const amplitude = animData.options.amplitude || 0.1;
        
        animData.object.position.y += Math.sin(time * speed) * amplitude;
        animData.object.rotation.z = Math.sin(time * speed * 0.5) * 0.05;
    }
    
    /**
     * Flicker animation - for lights
     */
    updateFlicker(animData, time) {
        if (!animData.object.intensity) return;
        
        const baseIntensity = animData.options.baseIntensity || 1;
        const flickerSpeed = animData.options.speed || 10;
        
        animData.object.intensity = baseIntensity + 
            Math.random() * 0.2 * Math.sin(time * flickerSpeed);
    }
    
    /**
     * Fade in animation
     */
    updateFadeIn(animData, elapsed) {
        const duration = animData.options.duration || 1;
        const progress = Math.min(elapsed / duration, 1);
        
        if (animData.object.material) {
            animData.object.material.opacity = progress;
            animData.object.material.transparent = true;
        }
        
        if (progress >= 1) {
            this.stopAnimation(animData);
        }
    }
    
    /**
     * Fade out animation
     */
    updateFadeOut(animData, elapsed) {
        const duration = animData.options.duration || 1;
        const progress = Math.min(elapsed / duration, 1);
        
        if (animData.object.material) {
            animData.object.material.opacity = 1 - progress;
            animData.object.material.transparent = true;
        }
        
        if (progress >= 1) {
            this.stopAnimation(animData);
            if (animData.options.removeOnComplete) {
                if (animData.object.parent) {
                    animData.object.parent.remove(animData.object);
                }
            }
        }
    }
    
    /**
     * Shake animation - random shake effect
     */
    updateShake(animData, elapsed) {
        const duration = animData.options.duration || 0.5;
        const intensity = animData.options.intensity || 0.1;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
            const shake = (1 - progress) * intensity;
            animData.object.position.x += (Math.random() - 0.5) * shake;
            animData.object.position.y += (Math.random() - 0.5) * shake;
            animData.object.position.z += (Math.random() - 0.5) * shake;
        } else {
            this.stopAnimation(animData);
        }
    }
    
    /**
     * Spiral animation - object moves in a spiral
     */
    updateSpiral(animData, elapsed) {
        const radius = animData.options.radius || 2;
        const speed = animData.options.speed || 1;
        const height = animData.options.height || 5;
        const duration = animData.options.duration || 3;
        
        const angle = elapsed * speed * Math.PI * 2;
        const progress = Math.min(elapsed / duration, 1);
        
        animData.object.position.x = Math.cos(angle) * radius * (1 - progress);
        animData.object.position.z = Math.sin(angle) * radius * (1 - progress);
        animData.object.position.y += (height / duration) * deltaTime;
        
        if (progress >= 1) {
            this.stopAnimation(animData);
        }
    }
    
    /**
     * Bounce animation - bouncing motion
     */
    updateBounce(animData, elapsed) {
        const height = animData.options.height || 2;
        const duration = animData.options.duration || 1;
        const bounces = animData.options.bounces || 3;
        
        const progress = (elapsed % duration) / duration;
        const bouncePhase = Math.floor(elapsed / duration);
        
        if (bouncePhase >= bounces) {
            this.stopAnimation(animData);
            return;
        }
        
        // Parabolic bounce
        const heightMultiplier = Math.pow(0.6, bouncePhase); // Each bounce is 60% of previous
        const y = 4 * height * heightMultiplier * progress * (1 - progress);
        
        if (!animData.baseY) {
            animData.baseY = animData.object.position.y;
        }
        
        animData.object.position.y = animData.baseY + y;
    }
    
    /**
     * Create a complex animation sequence
     */
    createSequence(object, animations) {
        let delay = 0;
        
        animations.forEach(anim => {
            setTimeout(() => {
                this.startAnimation(object, anim.type, anim.options);
            }, delay);
            
            delay += (anim.duration || 1) * 1000;
        });
    }
    
    /**
     * Batch animate multiple objects
     */
    batchAnimate(objects, animationType, options = {}, stagger = 0) {
        objects.forEach((obj, index) => {
            setTimeout(() => {
                const animOptions = { ...options };
                // Add phase offset for wave effects
                if (stagger > 0) {
                    animOptions.offset = index * stagger;
                }
                this.startAnimation(obj, animationType, animOptions);
            }, index * stagger * 100);
        });
    }
    
    /**
     * Clear all animations
     */
    clear() {
        this.activeAnimations.clear();
    }
    
    /**
     * Get animation statistics
     */
    getStats() {
        const typeCounts = {};
        
        this.activeAnimations.forEach(anim => {
            typeCounts[anim.type] = (typeCounts[anim.type] || 0) + 1;
        });
        
        return {
            total: this.activeAnimations.size,
            byType: typeCounts
        };
    }
}

/**
 * Preset animation configurations
 */
export const AnimationPresets = {
    pickupFloat: {
        type: 'float',
        options: {
            amplitude: 0.2,
            speed: 2
        }
    },
    
    pickupRotate: {
        type: 'rotate',
        options: {
            axis: 'y',
            speed: 2
        }
    },
    
    enemyHurt: {
        type: 'shake',
        options: {
            duration: 0.2,
            intensity: 0.2
        }
    },
    
    doorOpen: {
        type: 'fadeOut',
        options: {
            duration: 1,
            removeOnComplete: true
        }
    },
    
    lightFlicker: {
        type: 'flicker',
        options: {
            baseIntensity: 1,
            speed: 10
        }
    },
    
    portalPulse: {
        type: 'pulse',
        options: {
            speed: 1,
            intensity: 0.3
        }
    },
    
    itemSpawn: {
        type: 'bounce',
        options: {
            height: 1,
            duration: 0.5,
            bounces: 2
        }
    },
    
    explosionShake: {
        type: 'shake',
        options: {
            duration: 0.5,
            intensity: 0.5
        }
    }
};