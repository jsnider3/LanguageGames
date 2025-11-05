// SyntaxCity - Enemy Base Class

import { PathFollower } from './Pathfinding.js';
import { ENEMY_STATS } from './Constants.js';

export class Enemy {
    constructor(type, path, waveNumber = 1) {
        this.type = type;
        this.stats = { ...ENEMY_STATS[type] };

        // Scale with wave number
        this.maxHp = this.stats.hp * (1 + (waveNumber - 1) * 0.1);
        this.hp = this.maxHp;
        this.speed = this.stats.speed;
        this.reward = Math.floor(this.stats.reward * (1 + (waveNumber - 1) * 0.05));
        this.armor = this.stats.armor || 0;
        this.color = this.stats.color;
        this.symbol = this.stats.symbol;
        this.special = this.stats.special || {};
        this.boss = this.stats.boss || false;

        // Movement
        this.pathFollower = new PathFollower(path, this.speed);
        this.x = this.pathFollower.position.x;
        this.y = this.pathFollower.position.y;

        // Status
        this.alive = true;
        this.reachedEnd = false;

        // Effects
        this.slowModifier = 1.0;
        this.slowTimer = 0;
        this.stunned = false;
        this.stunTimer = 0;

        // Special behaviors
        this.invisible = this.special.invisible || 0;  // Turns invisible for N hits
        this.invisibleHitsRemaining = this.invisible;
        this.regen = this.special.regen || 0;
        this.frozen = false;
        this.freezeTimer = 0;
        this.freezeInterval = this.special.freezeInterval || 0;
        this.freezeDuration = this.special.freezeDuration || 0;
        this.variableSpeedTimer = 0;
        this.damageSpeedBonus = 0;

        // Visual
        this.size = this.boss ? 30 : 15;
        this.flashTimer = 0;
        this.deathAnimation = 0;
    }

    update(dt, game) {
        if (!this.alive) {
            // Death animation
            if (this.deathAnimation > 0) {
                this.deathAnimation -= dt * 2;
            }
            return;
        }

        // Handle stun
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            return;  // Don't move while stunned
        }

        // Handle deadlock freeze
        if (this.freezeInterval > 0) {
            this.freezeTimer += dt;
            if (this.freezeTimer >= this.freezeInterval) {
                this.frozen = true;
            }
            if (this.frozen) {
                if (this.freezeTimer >= this.freezeInterval + this.freezeDuration) {
                    this.frozen = false;
                    this.freezeTimer = 0;
                }
                return;  // Don't move while frozen
            }
        }

        // Handle slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.slowModifier = 1.0;
            }
        }

        // Handle regeneration
        if (this.regen > 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
        }

        // Variable speed (RaceCondition)
        if (this.special.variableSpeed) {
            this.variableSpeedTimer += dt;
            if (this.variableSpeedTimer >= 1.0) {
                this.variableSpeedTimer = 0;
                const speedMult = 0.5 + Math.random() * 1.0;
                this.pathFollower.setSpeed(this.speed * speedMult);
            }
        }

        // Calculate effective speed
        let effectiveSpeed = this.speed * this.slowModifier;

        // BufferOverflow - speed increases with damage taken
        if (this.special.accelerateOnDamage) {
            const damageTaken = 1 - (this.hp / this.maxHp);
            effectiveSpeed *= (1 + damageTaken * 0.5);
        }

        // Apply speed and move
        if (!this.special.immuneSlow) {
            this.pathFollower.setSpeed(effectiveSpeed);
        }

        this.pathFollower.update(dt);
        this.x = this.pathFollower.position.x;
        this.y = this.pathFollower.position.y;

        // Check if reached end
        if (this.pathFollower.isCompleted()) {
            this.reachedEnd = true;
            this.alive = false;
        }

        // Update flash effect
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        // Special behavior updates
        this.updateSpecialBehavior(dt, game);
    }

    updateSpecialBehavior(dt, game) {
        // Override in subclasses for special behaviors
    }

    takeDamage(amount, game) {
        if (!this.alive || this.frozen) return 0;

        // Apply armor
        const actualDamage = amount * (1 - this.armor);

        // Handle invisible (NullPointer)
        if (this.invisibleHitsRemaining > 0) {
            this.invisibleHitsRemaining--;
            return 0;  // No damage while invisible
        }

        this.hp -= actualDamage;
        this.flashTimer = 0.1;

        if (this.hp <= 0) {
            this.die(game);
        }

        return actualDamage;
    }

    die(game) {
        this.alive = false;
        this.deathAnimation = 1.0;

        // Special death behaviors
        if (this.special.explodeOnDeath) {
            this.explodeOnDeath(game);
        }

        if (this.special.splitOnDeath) {
            this.splitOnDeath(game);
        }
    }

    explodeOnDeath(game) {
        // Damage nearby towers (StackOverflow)
        const damagePercent = this.special.explodeOnDeath;
        if (game.towers) {
            for (let tower of game.towers) {
                const dist = Math.sqrt(
                    Math.pow(tower.x - this.x, 2) +
                    Math.pow(tower.y - this.y, 2)
                );
                if (dist < 100) {
                    // Tower takes damage (reduce its effectiveness or mark for repair)
                    tower.damageTaken = (tower.damageTaken || 0) + damagePercent;
                }
            }
        }
    }

    splitOnDeath(game) {
        // Spawn mini versions (MemoryLeak)
        // This will be handled by the game/wave manager
    }

    applySlow(slowAmount, duration) {
        if (this.special.immuneSlow) return;

        this.slowModifier = Math.min(this.slowModifier, 1 - slowAmount);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    applyStun(duration) {
        this.stunned = true;
        this.stunTimer = Math.max(this.stunTimer, duration);
    }

    teleport(newProgress) {
        this.pathFollower.teleportToProgress(newProgress);
        this.x = this.pathFollower.position.x;
        this.y = this.pathFollower.position.y;
    }

    getProgress() {
        return this.pathFollower.getProgress();
    }

    isAlive() {
        return this.alive;
    }

    hasReachedEnd() {
        return this.reachedEnd;
    }

    getHpPercent() {
        return this.hp / this.maxHp;
    }

    render(ctx) {
        if (!this.alive && this.deathAnimation <= 0) return;

        const alpha = this.deathAnimation > 0 ? this.deathAnimation : 1.0;

        // Check if invisible
        const isInvisible = this.invisibleHitsRemaining > 0;

        // Draw enemy body
        ctx.save();
        ctx.globalAlpha = alpha;

        if (isInvisible) {
            ctx.globalAlpha = alpha * 0.3;
        }

        // Flash white when hit
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // Draw based on boss status
        if (this.boss) {
            // Boss - larger with border
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Boss glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Regular enemy
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.boss ? '20' : '12'}px Courier New`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);

        // Draw HP bar
        if (this.hp < this.maxHp && this.alive) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            const barY = this.y - this.size - 10;

            // Background
            ctx.fillStyle = '#330000';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

            // Health
            const hpPercent = this.hp / this.maxHp;
            ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        }

        // Draw status indicators
        if (this.slowTimer > 0) {
            ctx.fillStyle = '#00aaff';
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.7, this.y - this.size * 0.7, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.stunned) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Courier New';
            ctx.fillText('!', this.x, this.y - this.size - 20);
        }

        if (this.frozen) {
            ctx.fillStyle = '#aaddff80';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    renderInfo(ctx) {
        // Draw detailed info when selected
        const infoY = this.y - this.size - 30;

        ctx.fillStyle = '#000000cc';
        ctx.fillRect(this.x - 60, infoY - 25, 120, 50);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 60, infoY - 25, 120, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.stats.name, this.x, infoY - 15);
        ctx.fillText(`HP: ${Math.floor(this.hp)}/${Math.floor(this.maxHp)}`, this.x, infoY);
        ctx.fillText(`Reward: ${this.reward} MU`, this.x, infoY + 12);
    }
}
