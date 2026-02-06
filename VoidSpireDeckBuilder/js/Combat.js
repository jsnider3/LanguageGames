import { CARD_TYPES, CARD_DEFS } from './Constants.js';
import { executeCard, createCard } from './Cards.js';
import { pickRandom } from './Utils.js';

export class Combat {
    constructor(game, player, enemies, effects) {
        this.game = game;
        this.player = player;
        this.enemies = enemies;
        this.effects = effects;
        this.turnPhase = 'player'; // 'player', 'enemy', 'animating'
        this.damageNumbers = [];
        this.selectedCard = null;
        this.hoveredCard = null;
        this.hoveredEnemy = null;
        this.targetingCard = null;
        this.isAnimating = false;
        this.enemyActionQueue = [];
        this.enemyActionTimer = 0;
        this.combatOver = false;

        this.init();
    }

    init() {
        // Position enemies
        const count = this.enemies.length;
        const startX = 750 - (count - 1) * 70;
        for (let i = 0; i < count; i++) {
            const e = this.enemies[i];
            e.x = startX + i * 140;
            e.y = 200;
        }

        // Start player turn
        this.player.startCombat();
        this.triggerRelics('onCombatStart', this.player);
        this.startPlayerTurn();
    }

    startPlayerTurn() {
        this.turnPhase = 'player';
        this.player.startTurn();
        this.triggerRelics('onTurnStart', this.player);
    }

    endPlayerTurn() {
        if (this.turnPhase !== 'player' || this.combatOver) return;

        // Orichalcum
        this.triggerRelics('onTurnEnd', this.player);

        this.player.endTurn();
        this.turnPhase = 'enemy';
        this.enemyActionQueue = [...this.enemies.filter(e => e.hp > 0)];
        this.enemyActionTimer = 0.4;
    }

    update(dt) {
        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.timer -= dt;
            dn.y -= 30 * dt;
            if (dn.timer <= 0) this.damageNumbers.splice(i, 1);
        }

        // Update enemy shake
        for (const e of this.enemies) {
            if (e.flashTimer > 0) {
                e.flashTimer -= dt;
                e.shakeX *= 0.9;
                e.shakeY *= 0.9;
            } else {
                e.shakeX = 0;
                e.shakeY = 0;
            }
        }

        // Enemy turn processing
        if (this.turnPhase === 'enemy') {
            this.enemyActionTimer -= dt;
            if (this.enemyActionTimer <= 0) {
                if (this.enemyActionQueue.length > 0) {
                    const enemy = this.enemyActionQueue.shift();
                    if (enemy.hp > 0) {
                        enemy.applyPoison();
                        if (enemy.hp > 0) {
                            enemy.executeIntent(this.player, this);
                        }
                        enemy.tickStatus();
                    }
                    this.enemyActionTimer = 0.35;
                } else {
                    // All enemies done, start enemy next turn prep
                    for (const e of this.enemies) {
                        if (e.hp > 0) e.startTurn();
                    }

                    // Decrement player debuffs
                    if (this.player.statusEffects.vulnerable > 0) this.player.statusEffects.vulnerable--;
                    if (this.player.statusEffects.weak > 0) this.player.statusEffects.weak--;

                    // Check death
                    if (this.player.isDead()) {
                        this.combatOver = true;
                        this.game.onCombatEnd(false);
                        return;
                    }

                    this.startPlayerTurn();
                }
            }
        }

        // Check if all enemies dead
        if (!this.combatOver && this.enemies.every(e => e.isDead())) {
            this.combatOver = true;
            this.game.onCombatEnd(true);
        }
    }

    playCard(card, targetEnemy) {
        if (this.turnPhase !== 'player' || this.combatOver) return false;
        if (!this.player.canPlayCard(card)) return false;

        this.player.spendEnergy(card.cost);

        // Track attack plays for relics
        if (card.type === CARD_TYPES.ATTACK) {
            this.player.attacksPlayed++;
            this.triggerRelics('onPlayAttack', this.player, card);
        }

        executeCard(card, this.player, this.enemies, targetEnemy, this);

        // Remove from hand
        const idx = this.player.hand.indexOf(card);
        if (idx !== -1) this.player.hand.splice(idx, 1);

        // Exhaust or discard
        if (card.exhaust) {
            this.player.exhaustPile.push(card);
            // Card-level onExhaust effects (e.g. Sentinel)
            if (card.onExhaust) {
                for (const eff of card.onExhaust) {
                    if (eff.type === 'gainEnergy') this.player.gainEnergy(eff.value);
                }
            }
            this.triggerRelics('onExhaust', this.player, card);
        } else {
            this.player.discardPile.push(card);
        }

        // Slash effect
        if (card.type === CARD_TYPES.ATTACK && targetEnemy) {
            this.effects.slashAt(targetEnemy.x + targetEnemy.width / 2, targetEnemy.y + targetEnemy.height / 2);
        }

        // Check if all enemies dead
        if (this.enemies.every(e => e.isDead())) {
            this.combatOver = true;
            this.game.onCombatEnd(true);
        }

        // Check player death (from self-damage cards)
        if (this.player.isDead()) {
            this.combatOver = true;
            this.game.onCombatEnd(false);
        }

        return true;
    }

    addDamageNumber(x, y, amount, isPlayerDamage = false) {
        this.damageNumbers.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            amount,
            timer: 0.8,
            isPlayerDamage,
            color: isPlayerDamage ? '#ff4444' : '#ffff44'
        });
    }

    triggerRelics(trigger, player, card = null, enemy = null, damageAmount = 0) {
        for (const relic of player.relics) {
            if (relic.trigger !== trigger) continue;
            const eff = relic.effect;

            switch (eff.type) {
                case 'heal':
                    player.heal(eff.value);
                    break;
                case 'buff':
                    player.statusEffects[eff.status] = (player.statusEffects[eff.status] || 0) + eff.value;
                    break;
                case 'block':
                    player.gainBlock(eff.value);
                    break;
                case 'draw':
                    player.drawCards(eff.value);
                    break;
                case 'gainEnergy':
                    player.gainEnergy(eff.value);
                    break;
                case 'orichalcum':
                    if (player.block === 0) player.gainBlock(eff.value);
                    break;
                case 'penNib':
                    relic.counter = (relic.counter || 0) + 1;
                    if (relic.counter >= eff.every) relic.counter = 0;
                    break;
                case 'ornamentalFan':
                    relic.counter = (relic.counter || 0) + 1;
                    if (relic.counter >= eff.every) {
                        player.gainBlock(eff.block);
                        relic.counter = 0;
                    }
                    break;
                case 'kunai':
                    relic.counter = (relic.counter || 0) + 1;
                    if (relic.counter >= eff.every) {
                        player.statusEffects.dexterity = (player.statusEffects.dexterity || 0) + eff.value;
                        relic.counter = 0;
                    }
                    break;
                case 'meatOnBone':
                    if (player.hp < player.maxHP * eff.threshold) {
                        player.heal(eff.value);
                    }
                    break;
                case 'hornCleat':
                    if (player.turnNumber === eff.turn) {
                        player.gainBlock(eff.block);
                    }
                    break;
                case 'thorns':
                    if (enemy && damageAmount > 0) {
                        enemy.takeDamage(eff.value);
                    }
                    break;
                case 'addRandom': {
                    if (card) {
                        const pool = Object.values(CARD_DEFS).filter(d => !d.unplayable && d.rarity !== 'Starter');
                        if (pool.length > 0) {
                            const def = pickRandom(pool);
                            player.addCardToHand(createCard(def.id));
                        }
                    }
                    break;
                }
            }
        }
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e.hp > 0);
    }

    needsTarget(card) {
        if (!card.effects) return false;
        return card.effects.some(e => e.target === 'single');
    }
}
