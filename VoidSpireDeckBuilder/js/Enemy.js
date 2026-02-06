import { ENEMY_DEFS, ENCOUNTERS, INTENT_TYPES, VULNERABLE_MULT, WEAK_MULT } from './Constants.js';
import { randomInt, pickRandom, clamp } from './Utils.js';

export class Enemy {
    constructor(def, hpMult = 1.0) {
        this.id = def.id;
        this.name = def.name;
        this.maxHP = Math.floor(randomInt(def.hp[0], def.hp[1]) * hpMult);
        this.hp = this.maxHP;
        this.block = 0;
        this.color = def.color;
        this.isBoss = def.isBoss || false;
        this.isElite = def.isElite || false;

        this.intents = def.intents;
        this.intentIndex = 0;
        this.currentIntent = this.intents[0];
        this.turnCount = 0;

        this.statusEffects = { vulnerable: 0, weak: 0, strength: 0, ritual: 0, poison: 0 };

        // Visual
        this.x = 0;
        this.y = 0;
        this.width = this.isBoss ? 120 : 80;
        this.height = this.isBoss ? 140 : 100;
        this.shakeX = 0;
        this.shakeY = 0;
        this.flashTimer = 0;
        this.alpha = 1;
    }

    getNextIntent() {
        this.turnCount++;

        // Ritual (Cultist): buff on first turn only, then cycle remaining intents
        if (this.intents[0].firstOnly && this.turnCount >= 1) {
            // After first turn, cycle through intents starting from index 1
            this.intentIndex = 1 + ((this.turnCount - 1) % (this.intents.length - 1));
        } else {
            this.intentIndex = this.turnCount % this.intents.length;
        }
        this.currentIntent = this.intents[this.intentIndex];
    }

    executeIntent(player, combat) {
        const intent = this.currentIntent;

        // Apply ritual strength gain
        if (this.statusEffects.ritual > 0) {
            this.statusEffects.strength += this.statusEffects.ritual;
        }

        switch (intent.type) {
            case INTENT_TYPES.ATTACK: {
                const times = intent.times || 1;
                for (let i = 0; i < times; i++) {
                    let dmg = intent.damage + (this.statusEffects.strength || 0);
                    if (this.statusEffects.weak > 0) dmg = Math.floor(dmg * WEAK_MULT);
                    if (player.statusEffects.vulnerable > 0) dmg = Math.floor(dmg * VULNERABLE_MULT);
                    if (dmg < 0) dmg = 0;
                    const actual = player.takeDamage(dmg);
                    if (combat) {
                        combat.addDamageNumber(400, 450, dmg, true);
                        combat.effects.screenShake(3);
                        // Bronze Scales thorns
                        combat.triggerRelics('onDamaged', player, null, this, actual);
                    }
                }
                break;
            }
            case INTENT_TYPES.BLOCK: {
                this.block += intent.block;
                if (intent.buff) {
                    this.statusEffects[intent.buff.status] = (this.statusEffects[intent.buff.status] || 0) + intent.buff.value;
                }
                break;
            }
            case INTENT_TYPES.BUFF: {
                if (intent.status === 'ritual') {
                    this.statusEffects.ritual += intent.value;
                } else {
                    this.statusEffects[intent.status] = (this.statusEffects[intent.status] || 0) + intent.value;
                }
                if (intent.buff) {
                    this.statusEffects[intent.buff.status] = (this.statusEffects[intent.buff.status] || 0) + intent.buff.value;
                }
                break;
            }
            case INTENT_TYPES.DEBUFF: {
                player.statusEffects[intent.status] = (player.statusEffects[intent.status] || 0) + intent.value;
                break;
            }
            case INTENT_TYPES.ATTACK_DEBUFF: {
                const times = intent.times || 1;
                for (let i = 0; i < times; i++) {
                    let dmg = intent.damage + (this.statusEffects.strength || 0);
                    if (this.statusEffects.weak > 0) dmg = Math.floor(dmg * WEAK_MULT);
                    if (player.statusEffects.vulnerable > 0) dmg = Math.floor(dmg * VULNERABLE_MULT);
                    if (dmg < 0) dmg = 0;
                    player.takeDamage(dmg);
                    if (combat) {
                        combat.addDamageNumber(400, 450, dmg, true);
                        combat.effects.screenShake(2);
                    }
                }
                player.statusEffects[intent.status] = (player.statusEffects[intent.status] || 0) + intent.value;
                break;
            }
        }

        this.getNextIntent();
    }

    startTurn() {
        this.block = 0;
    }

    takeDamage(amount) {
        let dmg = amount;
        if (this.block > 0) {
            if (this.block >= dmg) {
                this.block -= dmg;
                return 0;
            } else {
                dmg -= this.block;
                this.block = 0;
            }
        }
        this.hp = Math.max(0, this.hp - dmg);
        this.flashTimer = 0.15;
        this.shakeX = (Math.random() - 0.5) * 8;
        this.shakeY = (Math.random() - 0.5) * 8;
        return dmg;
    }

    applyPoison() {
        if (this.statusEffects.poison > 0) {
            this.hp = Math.max(0, this.hp - this.statusEffects.poison);
            this.statusEffects.poison--;
        }
    }

    tickStatus() {
        if (this.statusEffects.vulnerable > 0) this.statusEffects.vulnerable--;
        if (this.statusEffects.weak > 0) this.statusEffects.weak--;
    }

    isDead() {
        return this.hp <= 0;
    }

    getIntentText() {
        const intent = this.currentIntent;
        switch (intent.type) {
            case INTENT_TYPES.ATTACK: {
                const dmg = intent.damage + (this.statusEffects.strength || 0);
                const times = intent.times || 1;
                return times > 1 ? `${dmg}x${times}` : `${dmg}`;
            }
            case INTENT_TYPES.BLOCK:
                return `${intent.block}`;
            case INTENT_TYPES.BUFF:
                return `+${intent.value}`;
            case INTENT_TYPES.DEBUFF:
                return intent.status;
            case INTENT_TYPES.ATTACK_DEBUFF: {
                const dmg = intent.damage + (this.statusEffects.strength || 0);
                const times = intent.times || 1;
                return times > 1 ? `${dmg}x${times}` : `${dmg}`;
            }
            default: return '?';
        }
    }

    getIntentIcon() {
        switch (this.currentIntent.type) {
            case INTENT_TYPES.ATTACK: return '\u2694';
            case INTENT_TYPES.BLOCK: return '\uD83D\uDEE1';
            case INTENT_TYPES.BUFF: return '\u2B06';
            case INTENT_TYPES.DEBUFF: return '\uD83D\uDCA7';
            case INTENT_TYPES.ATTACK_DEBUFF: return '\u2694';
            default: return '?';
        }
    }
}

export function generateEncounter(act, type) {
    const table = ENCOUNTERS[act];
    if (!table) return [];

    let pool;
    switch (type) {
        case 'elite': pool = table.elite; break;
        case 'boss': pool = table.boss; break;
        default: pool = table.normal;
    }

    const template = pickRandom(pool);
    return template.map(e => {
        const def = ENEMY_DEFS[e.id];
        return new Enemy(def, e.hpMult || 1.0);
    });
}
