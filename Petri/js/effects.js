/**
 * Visual effects system for Petri
 * Handles particles for births, deaths, eating, etc.
 */

export class EffectsSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    /**
     * Create a burst of particles at a position
     */
    burst(x, y, color, count = 8, speed = 50, lifetime = 0.5) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift(); // Remove oldest
            }

            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const velocity = speed * (0.5 + Math.random() * 0.5);

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: color,
                size: 2 + Math.random() * 2,
                lifetime: lifetime,
                maxLifetime: lifetime,
                type: 'burst'
            });
        }
    }

    /**
     * Create a ring effect
     */
    ring(x, y, color, radius = 20, lifetime = 0.3) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        this.particles.push({
            x: x,
            y: y,
            color: color,
            radius: 0,
            targetRadius: radius,
            lifetime: lifetime,
            maxLifetime: lifetime,
            type: 'ring'
        });
    }

    /**
     * Create floating text
     */
    floatText(x, y, text, color = '#fff', lifetime = 1.0) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        this.particles.push({
            x: x,
            y: y - 10,
            vy: -30,
            text: text,
            color: color,
            lifetime: lifetime,
            maxLifetime: lifetime,
            type: 'text'
        });
    }

    /**
     * Birth effect - expanding ring + particles
     */
    birth(x, y, color) {
        this.ring(x, y, color, 25, 0.4);
        this.burst(x, y, color, 6, 40, 0.4);
    }

    /**
     * Death effect - fading particles
     */
    death(x, y, color) {
        this.burst(x, y, color, 12, 30, 0.6);
    }

    /**
     * Eat effect - small burst toward organism
     */
    eat(x, y) {
        this.burst(x, y, '#8BC34A', 4, 20, 0.3);
    }

    /**
     * Predation effect
     */
    predation(x, y, preyColor) {
        this.burst(x, y, preyColor, 8, 40, 0.5);
        this.floatText(x, y, '+', '#f44336', 0.8);
    }

    /**
     * Update all particles
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.lifetime -= dt;

            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Update based on type
            switch (p.type) {
                case 'burst':
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                    break;

                case 'ring':
                    const progress = 1 - (p.lifetime / p.maxLifetime);
                    p.radius = p.targetRadius * progress;
                    break;

                case 'text':
                    p.y += p.vy * dt;
                    break;
            }
        }
    }

    /**
     * Render all particles
     */
    render(ctx) {
        for (const p of this.particles) {
            const alpha = p.lifetime / p.maxLifetime;

            switch (p.type) {
                case 'burst':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fillStyle = this.colorWithAlpha(p.color, alpha);
                    ctx.fill();
                    break;

                case 'ring':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = this.colorWithAlpha(p.color, alpha * 0.6);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;

                case 'text':
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = this.colorWithAlpha(p.color, alpha);
                    ctx.fillText(p.text, p.x, p.y);
                    break;
            }
        }
    }

    /**
     * Helper to add alpha to a color
     */
    colorWithAlpha(color, alpha) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Handle rgb/rgba
        if (color.startsWith('rgb')) {
            return color.replace(/rgba?\(/, 'rgba(').replace(/\)/, `, ${alpha})`);
        }

        // Handle hsl
        if (color.startsWith('hsl')) {
            return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
        }

        return color;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
}
