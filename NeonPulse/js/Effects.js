import { randomRange, clamp } from './Utils.js';
import { LANE_COLORS, LANE_LEFT, LANE_WIDTH, HIT_ZONE_Y } from './Constants.js';

// ═══════════════════════════════════════════════════════════
// EFFECTS - Particles, judgement text, screen shake
// ═══════════════════════════════════════════════════════════

export class Effects {
    constructor() {
        this.particles = [];
        this.judgements = [];
        this.shakeAmount = 0;
        this.shakeDecay = 0.92;
    }

    // ───────────────────────────────────────────────────────
    // UPDATE
    // ───────────────────────────────────────────────────────

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.life -= dt;
            p.alpha = clamp(p.life / p.maxLife, 0, 1);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update judgements
        for (let i = this.judgements.length - 1; i >= 0; i--) {
            const j = this.judgements[i];
            j.timer -= dt;
            j.y -= 40 * dt;
            j.alpha = clamp(j.timer / j.maxTimer, 0, 1);

            if (j.timer <= 0) {
                this.judgements.splice(i, 1);
            }
        }

        // Decay screen shake
        this.shakeAmount *= this.shakeDecay;
        if (this.shakeAmount < 0.5) {
            this.shakeAmount = 0;
        }
    }

    // ───────────────────────────────────────────────────────
    // HIT EFFECT - bursts of colored particles at the hit zone
    // ───────────────────────────────────────────────────────

    spawnHitEffect(lane, judgement) {
        const x = LANE_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
        const y = HIT_ZONE_Y;
        const color = LANE_COLORS[lane];

        let count, minSize, maxSize, minSpeed, maxSpeed, minLife, maxLife;

        switch (judgement) {
            case 'perfect':
                count = 20;
                minSize = 3;
                maxSize = 6;
                minSpeed = 100;
                maxSpeed = 300;
                minLife = 0.4;
                maxLife = 0.8;
                break;
            case 'great':
                count = 12;
                minSize = 2.5;
                maxSize = 5;
                minSpeed = 80;
                maxSpeed = 220;
                minLife = 0.3;
                maxLife = 0.7;
                break;
            case 'good':
                count = 6;
                minSize = 2;
                maxSize = 4;
                minSpeed = 60;
                maxSpeed = 160;
                minLife = 0.3;
                maxLife = 0.6;
                break;
            default:
                return;
        }

        for (let i = 0; i < count; i++) {
            const angle = randomRange(0, Math.PI * 2);
            const speed = randomRange(minSpeed, maxSpeed);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: randomRange(minSize, maxSize),
                color,
                alpha: 1,
                life: randomRange(minLife, maxLife),
                maxLife: maxLife,
                gravity: randomRange(-100, 100)
            });
        }
    }

    // ───────────────────────────────────────────────────────
    // MISS EFFECT - gray static particles that fall
    // ───────────────────────────────────────────────────────

    spawnMissEffect(lane) {
        const x = LANE_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
        const y = HIT_ZONE_Y;
        const color = '#666666';
        const count = 8;

        for (let i = 0; i < count; i++) {
            const angle = randomRange(0, Math.PI * 2);
            const speed = randomRange(30, 100);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: randomRange(2, 3.5),
                color,
                alpha: 1,
                life: randomRange(0.3, 0.5),
                maxLife: 0.5,
                gravity: randomRange(200, 400)
            });
        }
    }

    // ───────────────────────────────────────────────────────
    // JUDGEMENT TEXT
    // ───────────────────────────────────────────────────────

    addJudgement(text, color) {
        this.judgements.push({
            text,
            color,
            alpha: 1,
            timer: 0.8,
            maxTimer: 0.8,
            y: HIT_ZONE_Y - 60,
            scale: 1.2
        });
    }

    // ───────────────────────────────────────────────────────
    // SCREEN SHAKE
    // ───────────────────────────────────────────────────────

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    getShakeOffset() {
        if (this.shakeAmount > 0.5) {
            return {
                x: randomRange(-this.shakeAmount, this.shakeAmount),
                y: randomRange(-this.shakeAmount, this.shakeAmount)
            };
        }
        return { x: 0, y: 0 };
    }

    // ───────────────────────────────────────────────────────
    // CLEAR
    // ───────────────────────────────────────────────────────

    clear() {
        this.particles = [];
        this.judgements = [];
        this.shakeAmount = 0;
    }
}
