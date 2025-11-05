// SyntaxCity - Tower Base Class

import { distance } from './Utils.js';
import { TOWER_STATS, UPGRADE_MULTIPLIERS } from './Constants.js';
import { Projectile, DelayedProjectile, SplashProjectile, MultiProjectile } from './Projectile.js';

export class Tower {
    constructor(type, gridX, gridY, x, y) {
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = x;
        this.y = y;

        // Stats from constants
        this.baseStats = { ...TOWER_STATS[type] };
        this.stats = { ...this.baseStats };

        this.damage = this.stats.damage;
        this.range = this.stats.range;
        this.attackSpeed = this.stats.attackSpeed;
        this.color = this.stats.color;
        this.symbol = this.stats.symbol;
        this.name = this.stats.name;
        this.special = this.stats.special || {};

        // Upgrade system
        this.tier = 1;
        this.upgradeCost = this.stats.cost * UPGRADE_MULTIPLIERS.tier2.costMultiplier;
        this.upgradeCpuCost = UPGRADE_MULTIPLIERS.tier2.cpuCost;

        // Attack timing
        this.attackTimer = 0;
        this.target = null;
        this.targetingMode = 'FIRST';  // FIRST, LAST, STRONG, WEAK, CLOSE

        // Conditional tower specific
        if (this.special.smartTarget) {
            this.targetingMode = 'SMART';
        }

        // Combo bonuses
        this.comboBonus = {
            damageMultiplier: 1.0,
            rangeBonus: 0,
            speedMultiplier: 1.0
        };

        // Special tracking
        this.kills = 0;
        this.damageDealt = 0;
        this.capturedType = null;  // For Closure tower
        this.yieldIndex = 0;  // For Generator tower
        this.recursionTarget = null;  // For Recursion tower
        this.recursionMultiplier = 1;
        this.catchesRemaining = this.special.catchPerWave || 0;

        // Visual
        this.size = 20;
        this.rotation = 0;
        this.damageTaken = 0;

        // Unique ID for tower
        this.id = Math.random().toString(36).substr(2, 9);
    }

    update(dt, enemies, game) {
        this.attackTimer += dt;

        // Update rotation for visual effect
        this.rotation += dt * 0.5;

        const effectiveAttackSpeed = this.attackSpeed / this.comboBonus.speedMultiplier;

        if (this.attackTimer >= effectiveAttackSpeed) {
            this.attackTimer = 0;

            // Try/Catch tower special behavior
            if (this.special.catchPerWave && this.catchesRemaining > 0) {
                this.tryCatchEnemy(enemies, game);
                return;
            }

            // Find and attack target
            this.findTarget(enemies);
            if (this.target && this.target.isAlive()) {
                this.attack(this.target, enemies, game);
            }
        }
    }

    findTarget(enemies) {
        const inRangeEnemies = enemies.filter(enemy => {
            if (!enemy.isAlive()) return false;
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            return dist <= (this.range + this.comboBonus.rangeBonus);
        });

        if (inRangeEnemies.length === 0) {
            this.target = null;
            return;
        }

        switch (this.targetingMode) {
            case 'FIRST':
                this.target = inRangeEnemies.reduce((first, enemy) =>
                    enemy.getProgress() > first.getProgress() ? enemy : first
                );
                break;

            case 'LAST':
                this.target = inRangeEnemies.reduce((last, enemy) =>
                    enemy.getProgress() < last.getProgress() ? enemy : last
                );
                break;

            case 'STRONG':
                this.target = inRangeEnemies.reduce((strong, enemy) =>
                    enemy.hp > strong.hp ? enemy : strong
                );
                break;

            case 'WEAK':
                this.target = inRangeEnemies.reduce((weak, enemy) =>
                    enemy.hp < weak.hp ? enemy : weak
                );
                break;

            case 'CLOSE':
                this.target = inRangeEnemies.reduce((close, enemy) => {
                    const closeDist = distance(this.x, this.y, close.x, close.y);
                    const enemyDist = distance(this.x, this.y, enemy.x, enemy.y);
                    return enemyDist < closeDist ? enemy : close;
                });
                break;

            case 'SMART':
                // Conditional tower - target highest HP or fastest
                this.target = inRangeEnemies.reduce((best, enemy) => {
                    const bestScore = best.hp + best.speed;
                    const enemyScore = enemy.hp + enemy.speed;
                    return enemyScore > bestScore ? enemy : best;
                });
                break;

            default:
                this.target = inRangeEnemies[0];
        }

        // Recursion tower - prefer same target
        if (this.special.scalingMultiplier && this.recursionTarget && this.recursionTarget.isAlive()) {
            const dist = distance(this.x, this.y, this.recursionTarget.x, this.recursionTarget.y);
            if (dist <= this.range) {
                this.target = this.recursionTarget;
            }
        }
    }

    attack(target, enemies, game) {
        let finalDamage = this.damage * this.comboBonus.damageMultiplier;

        // Apply tower damage if taken explosion damage
        if (this.damageTaken > 0) {
            finalDamage *= (1 - Math.min(0.5, this.damageTaken));
        }

        // Function tower - armor pierce
        if (this.special.armorPierce) {
            target.armor = Math.max(0, target.armor - this.special.armorPierce);
        }

        // Closure tower - bonus to captured type
        if (this.capturedType && target.type === this.capturedType) {
            finalDamage *= (1 + this.special.bonusDamage);
        }

        // Recursion tower - scaling damage
        if (this.special.scalingMultiplier) {
            if (this.recursionTarget === target) {
                this.recursionMultiplier *= this.special.scalingMultiplier;
            } else {
                this.recursionTarget = target;
                this.recursionMultiplier = 1;
            }
            finalDamage *= this.recursionMultiplier;
        }

        // Object tower - damage scales with adjacent towers
        if (this.special.scalingDamage && game) {
            const adjacentCount = game.getAdjacentTowers(this.gridX, this.gridY).length;
            finalDamage += adjacentCount * 5;
        }

        // Create projectile
        this.createProjectile(target, finalDamage, enemies, game);
    }

    createProjectile(target, damage, enemies, game) {
        if (!game || !game.projectiles) return;

        // Array tower - multi-target
        if (this.special.multiTarget) {
            const inRangeEnemies = enemies.filter(enemy => {
                if (!enemy.isAlive()) return false;
                const dist = distance(this.x, this.y, enemy.x, enemy.y);
                return dist <= this.range;
            });

            const targets = inRangeEnemies.slice(0, Math.min(this.special.multiTarget, inRangeEnemies.length));
            if (targets.length > 0) {
                game.projectiles.push(new MultiProjectile(this.x, this.y, targets, damage, this.color));
            }
            return;
        }

        // Async tower - delayed hit
        if (this.special.delayedHit) {
            const proj = new DelayedProjectile(
                this.x, this.y, target, damage, this.color, this.special.delayedHit
            );
            game.projectiles.push(proj);
            return;
        }

        // Generator tower - rotating attack types
        if (this.special.yieldTypes) {
            const attackType = this.special.yieldTypes[this.yieldIndex];
            this.yieldIndex = (this.yieldIndex + 1) % this.special.yieldTypes.length;

            let proj;
            if (attackType === 'pierce') {
                proj = new Projectile(this.x, this.y, target, damage, this.color);
                proj.pierce = true;
                proj.maxPierceHits = 3;
            } else if (attackType === 'splash') {
                proj = new SplashProjectile(this.x, this.y, target, damage, this.color, 50);
            } else if (attackType === 'stun') {
                proj = new Projectile(this.x, this.y, target, damage * 0.5, this.color);
                proj.stun = true;
                proj.stunDuration = 1.0;
            }
            game.projectiles.push(proj);
            return;
        }

        // Regex tower - area slow
        if (this.special.areaSlow) {
            // Apply slow to all enemies in range
            const slowRadius = this.special.areaRadius;
            for (let enemy of enemies) {
                if (!enemy.isAlive()) continue;
                const dist = distance(this.x, this.y, enemy.x, enemy.y);
                if (dist <= slowRadius) {
                    enemy.applySlow(this.special.areaSlow, 2.0);
                }
            }
            // Still shoot a projectile for visual effect
            const proj = new Projectile(this.x, this.y, target, damage, this.color);
            game.projectiles.push(proj);
            return;
        }

        // Loop tower - rapid fire with stacking
        if (this.special.stackDamage) {
            const proj = new Projectile(this.x, this.y, target, damage, this.color);
            proj.stacking = true;
            game.projectiles.push(proj);
            return;
        }

        // Standard projectile
        const proj = new Projectile(this.x, this.y, target, damage, this.color);
        game.projectiles.push(proj);
    }

    tryCatchEnemy(enemies, game) {
        const inRangeEnemies = enemies.filter(enemy => {
            if (!enemy.isAlive() || enemy.boss) return false;
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            return dist <= this.range;
        });

        if (inRangeEnemies.length > 0) {
            const enemy = inRangeEnemies[0];
            enemy.alive = false;
            this.catchesRemaining--;

            // Give reward
            if (game) {
                game.addResources(enemy.reward, 0);
            }

            // Visual effect
            if (game && game.createEffect) {
                game.createEffect('catch', enemy.x, enemy.y);
            }
        }
    }

    upgrade() {
        if (this.tier >= 3) return false;

        this.tier++;

        const mult = this.tier === 2 ? UPGRADE_MULTIPLIERS.tier2 : UPGRADE_MULTIPLIERS.tier3;

        this.damage = this.baseStats.damage * (1 + mult.damageBonus);
        this.range = this.baseStats.range * (1 + mult.rangeBonus);
        this.attackSpeed = this.baseStats.attackSpeed / (1 + mult.speedBonus);

        // Update upgrade costs for next tier
        if (this.tier === 2) {
            this.upgradeCost = this.baseStats.cost * UPGRADE_MULTIPLIERS.tier3.costMultiplier;
            this.upgradeCpuCost = UPGRADE_MULTIPLIERS.tier3.cpuCost;
        }

        this.size += 5;

        return true;
    }

    applyComboBonus(bonus) {
        this.comboBonus = { ...bonus };
    }

    resetCatchesForWave() {
        this.catchesRemaining = this.special.catchPerWave || 0;
    }

    onKill(enemy) {
        this.kills++;

        // Closure tower - capture enemy type
        if (this.special.captureType) {
            this.capturedType = enemy.type;
        }
    }

    getSellValue() {
        const baseCost = this.baseStats.cost;
        const tierCost = this.tier === 1 ? 0 :
            this.tier === 2 ? baseCost * UPGRADE_MULTIPLIERS.tier2.costMultiplier :
            baseCost * UPGRADE_MULTIPLIERS.tier3.costMultiplier;

        return Math.floor((baseCost + tierCost) * 0.75);
    }

    render(ctx) {
        // Draw tower base
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        if (this.tier === 1) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.tier === 2) {
            // Hexagon for tier 2
            this.drawPolygon(ctx, 6);
            // Glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (this.tier === 3) {
            // Star for tier 3
            this.drawStar(ctx, 5);
            // Strong glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.tier * 10}px Courier New`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);

        // Draw damage indicator if damaged
        if (this.damageTaken > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    renderRange(ctx) {
        ctx.strokeStyle = this.color + '60';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range + this.comboBonus.rangeBonus, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = this.color + '20';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range + this.comboBonus.rangeBonus, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPolygon(ctx, sides) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 + this.rotation;
            const x = this.x + Math.cos(angle) * this.size;
            const y = this.y + Math.sin(angle) * this.size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawStar(ctx, points) {
        const outerRadius = this.size;
        const innerRadius = this.size * 0.5;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 + this.rotation;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
