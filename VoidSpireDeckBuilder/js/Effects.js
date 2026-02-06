export class Effects {
    constructor() {
        this.particles = [];
        this.slashes = [];
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
    }

    update(dt) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // gravity
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Slashes
        for (let i = this.slashes.length - 1; i >= 0; i--) {
            const s = this.slashes[i];
            s.timer -= dt;
            s.alpha = Math.max(0, s.timer / s.maxTimer);
            if (s.timer <= 0) this.slashes.splice(i, 1);
        }

        // Screen shake
        if (this.shakeAmount > 0.1) {
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }
    }

    render(ctx) {
        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Slashes
        for (const s of this.slashes) {
            ctx.globalAlpha = s.alpha * 0.8;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Second line
            ctx.beginPath();
            ctx.moveTo(s.x1 + 10, s.y1 - 10);
            ctx.lineTo(s.x2 - 10, s.y2 + 10);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
    }

    spawnParticles(x, y, count, color = '#ffaa33') {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.8) * 150,
                size: 1.5 + Math.random() * 3,
                color,
                life: 0.3 + Math.random() * 0.5,
                maxLife: 0.8,
                alpha: 1
            });
        }
    }

    slashAt(x, y) {
        const len = 30 + Math.random() * 20;
        const angle = Math.random() * Math.PI;
        this.slashes.push({
            x1: x - Math.cos(angle) * len,
            y1: y - Math.sin(angle) * len,
            x2: x + Math.cos(angle) * len,
            y2: y + Math.sin(angle) * len,
            color: '#ffffff',
            timer: 0.25,
            maxTimer: 0.25,
            alpha: 1
        });
        this.spawnParticles(x, y, 8, '#ffcc44');
    }

    screenShake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    getShakeOffset() {
        if (this.shakeAmount < 0.1) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeAmount * 2,
            y: (Math.random() - 0.5) * this.shakeAmount * 2
        };
    }
}
