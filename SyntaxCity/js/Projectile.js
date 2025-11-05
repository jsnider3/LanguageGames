// SyntaxCity - Projectile System

import { distance, getAngle, Vector2 } from './Utils.js';
import { GAME_CONFIG } from './Constants.js';

export class Projectile {
    constructor(x, y, target, damage, color, speed = GAME_CONFIG.PROJECTILE_SPEED, special = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.color = color;
        this.speed = speed;
        this.special = special || {};
        this.active = true;
        this.size = 4;

        // Calculate initial direction
        if (target) {
            this.angle = getAngle(x, y, target.x, target.y);
            this.vx = Math.cos(this.angle) * speed;
            this.vy = Math.sin(this.angle) * speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 5;

        // Special properties
        this.homing = this.special.homing || false;
        this.pierce = this.special.pierce || false;
        this.splash = this.special.splash || false;
        this.splashRadius = this.special.splashRadius || 0;
        this.slow = this.special.slow || 0;
        this.slowDuration = this.special.slowDuration || 0;
        this.hitCount = 0;
        this.maxPierceHits = this.special.maxPierceHits || 3;
    }

    update(dt) {
        if (!this.active) return;

        // Store trail position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Homing behavior
        if (this.homing && this.target && this.target.alive) {
            this.angle = getAngle(this.x, this.y, this.target.x, this.target.y);
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Move projectile
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check if target is reached
        if (this.target) {
            const dist = distance(this.x, this.y, this.target.x, this.target.y);
            if (dist < 10) {
                return true;  // Hit target
            }
        }

        // Check bounds
        if (this.x < -50 || this.x > 1250 || this.y < -50 || this.y > 750) {
            this.active = false;
        }

        return false;
    }

    onHit() {
        this.hitCount++;
        if (this.pierce && this.hitCount < this.maxPierceHits) {
            // Continue through target
            return false;
        }
        this.active = false;
        return true;
    }

    render(ctx) {
        if (!this.active) return;

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color + '40';  // Add transparency
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        // Draw projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isActive() {
        return this.active;
    }

    deactivate() {
        this.active = false;
    }
}

export class DelayedProjectile extends Projectile {
    constructor(x, y, target, damage, color, delay) {
        super(x, y, target, damage, color, 0);
        this.delay = delay;
        this.elapsed = 0;
        this.marked = false;
    }

    update(dt) {
        if (!this.active) return false;

        this.elapsed += dt;

        // Update position to follow target while delayed
        if (this.target && this.target.alive) {
            this.x = this.target.x;
            this.y = this.target.y;
        }

        if (this.elapsed >= this.delay) {
            return true;  // Hit after delay
        }

        return false;
    }

    render(ctx) {
        if (!this.active || !this.target) return;

        // Draw delayed hit indicator
        const progress = this.elapsed / this.delay;
        const radius = 15 + Math.sin(progress * Math.PI * 4) * 5;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 20, 0, Math.PI * 2 * progress);
        ctx.stroke();
    }
}

export class SplashProjectile extends Projectile {
    constructor(x, y, target, damage, color, splashRadius) {
        super(x, y, target, damage, color);
        this.splashRadius = splashRadius;
        this.splash = true;
    }

    render(ctx) {
        super.render(ctx);

        // Draw splash indicator when close to target
        if (this.target) {
            const dist = distance(this.x, this.y, this.target.x, this.target.y);
            if (dist < 50) {
                ctx.strokeStyle = this.color + '40';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.target.x, this.target.y, this.splashRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

export class MultiProjectile {
    constructor(x, y, targets, damage, color) {
        this.projectiles = targets.map(target =>
            new Projectile(x, y, target, damage, color)
        );
    }

    update(dt) {
        const hits = [];
        for (let proj of this.projectiles) {
            if (proj.update(dt)) {
                hits.push(proj);
            }
        }
        return hits;
    }

    render(ctx) {
        for (let proj of this.projectiles) {
            proj.render(ctx);
        }
    }

    isActive() {
        return this.projectiles.some(p => p.isActive());
    }

    getActiveProjectiles() {
        return this.projectiles.filter(p => p.isActive());
    }
}
