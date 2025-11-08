// SyntaxCity - Effects and Particles System

import { randomRange, getColorWithAlpha } from './Utils.js';

export class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt;  // Gravity

        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const alpha = this.lifetime / this.maxLifetime;
        ctx.fillStyle = getColorWithAlpha(this.color, alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isActive() {
        return this.active;
    }
}

export class DamageNumber {
    constructor(x, y, damage, color = '#ffffff', crit = false) {
        this.x = x;
        this.y = y;
        this.damage = Math.floor(damage);
        this.color = color;
        this.crit = crit;
        this.lifetime = 1.0;
        this.maxLifetime = 1.0;
        this.active = true;
        this.vy = -50;  // Float upward
    }

    update(dt) {
        if (!this.active) return;

        this.y += this.vy * dt;
        this.lifetime -= dt;

        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.font = this.crit ? 'bold 20px Courier New' : 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.damage.toString(), this.x, this.y);

        // Fill
        ctx.fillStyle = this.color;
        ctx.fillText(this.damage.toString(), this.x, this.y);

        ctx.restore();
    }

    isActive() {
        return this.active;
    }
}

export class EffectsManager {
    constructor() {
        this.particles = [];
        this.damageNumbers = [];
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = randomRange(50, 150);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = randomRange(2, 6);
            const lifetime = randomRange(0.3, 0.8);

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    createDamageNumber(x, y, damage, type = 'normal') {
        let color = '#ffffff';
        let crit = false;

        if (type === 'crit') {
            color = '#ffdd00';
            crit = true;
        } else if (type === 'resist') {
            color = '#ff4444';
        } else if (type === 'heal') {
            color = '#00ff88';
        }

        this.damageNumbers.push(new DamageNumber(x, y, damage, color, crit));
    }

    createCatchEffect(x, y) {
        // White particles expanding outward
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = randomRange(100, 200);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = randomRange(3, 8);
            const lifetime = 0.5;

            this.particles.push(new Particle(x, y, vx, vy, '#ffffff', size, lifetime));
        }
    }

    createTowerPlaceEffect(x, y, color) {
        // Ring of particles
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = randomRange(30, 60);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = randomRange(3, 6);
            const lifetime = 0.6;

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    createPowerUpEffect(x, y, width, height, color) {
        // Screen-wide effect
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const px = randomRange(0, width);
            const py = randomRange(0, height);
            const vx = randomRange(-100, 100);
            const vy = randomRange(-100, 100);
            const size = randomRange(4, 10);
            const lifetime = randomRange(0.5, 1.5);

            this.particles.push(new Particle(px, py, vx, vy, color, size, lifetime));
        }
    }

    update(dt) {
        // Update particles
        for (let particle of this.particles) {
            particle.update(dt);
        }

        // Remove inactive particles
        this.particles = this.particles.filter(p => p.isActive());

        // Update damage numbers
        for (let num of this.damageNumbers) {
            num.update(dt);
        }

        // Remove inactive damage numbers
        this.damageNumbers = this.damageNumbers.filter(n => n.isActive());
    }

    render(ctx) {
        // Render particles
        for (let particle of this.particles) {
            particle.render(ctx);
        }

        // Render damage numbers
        for (let num of this.damageNumbers) {
            num.render(ctx);
        }
    }

    clear() {
        this.particles = [];
        this.damageNumbers = [];
    }
}
