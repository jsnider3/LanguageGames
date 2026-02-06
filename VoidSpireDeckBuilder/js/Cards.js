import { CARD_DEFS, CARD_TYPES, VULNERABLE_MULT, WEAK_MULT } from './Constants.js';
import { deepClone, pickRandom } from './Utils.js';

let nextCardId = 0;

export function createCard(defId, overrides = {}) {
    const def = CARD_DEFS[defId];
    if (!def) { console.error('Unknown card:', defId); return null; }
    return {
        uid: nextCardId++,
        defId: def.id,
        name: def.name,
        type: def.type,
        rarity: def.rarity,
        cost: def.cost,
        description: def.description,
        effects: deepClone(def.effects),
        exhaust: def.exhaust || false,
        ethereal: def.ethereal || false,
        unplayable: def.unplayable || false,
        rampUp: def.rampUp || 0,
        rampBonus: overrides.rampBonus || 0,
        onExhaust: def.onExhaust ? deepClone(def.onExhaust) : null,
        // visual state
        x: 0, y: 0, targetX: 0, targetY: 0,
        scale: 1, targetScale: 1,
        angle: 0, targetAngle: 0,
        hover: false, dragging: false,
        alpha: 1,
    };
}

export function executeCard(card, player, enemies, targetEnemy, combat) {
    let totalLifesteal = 0;

    for (const effect of card.effects) {
        switch (effect.type) {
            case 'damage': {
                let dmg = effect.value + (card.rampBonus || 0) + (player.statusEffects.strength || 0);
                if (player.statusEffects.weak > 0) dmg = Math.floor(dmg * WEAK_MULT);
                if (dmg < 0) dmg = 0;

                // Pen Nib check
                const penNib = player.relics.find(r => r.id === 'pen_nib');
                let penNibActive = false;
                if (penNib && penNib.counter >= 9) {
                    dmg *= 2;
                    penNibActive = true;
                }

                if (effect.target === 'all') {
                    for (const enemy of enemies) {
                        if (enemy.hp <= 0) continue;
                        let d = dmg;
                        if (enemy.statusEffects.vulnerable > 0) d = Math.floor(d * VULNERABLE_MULT);
                        const actual = enemy.takeDamage(d);
                        if (effect.lifesteal) totalLifesteal += actual;
                        if (combat) combat.addDamageNumber(enemy.x + enemy.width / 2, enemy.y, d);
                    }
                } else {
                    const target = targetEnemy || enemies.find(e => e.hp > 0);
                    if (target) {
                        let d = dmg;
                        if (target.statusEffects.vulnerable > 0) d = Math.floor(d * VULNERABLE_MULT);
                        const times = effect.times || 1;
                        for (let i = 0; i < times; i++) {
                            if (target.hp <= 0) break;
                            const actual = target.takeDamage(d);
                            if (effect.lifesteal) totalLifesteal += actual;
                            if (combat) combat.addDamageNumber(target.x + target.width / 2, target.y, d);
                        }
                    }
                }
                break;
            }
            case 'block':
                player.gainBlock(effect.value);
                break;
            case 'draw':
                player.drawCards(effect.value);
                break;
            case 'debuff': {
                if (effect.target === 'all') {
                    for (const enemy of enemies) {
                        if (enemy.hp <= 0) continue;
                        enemy.statusEffects[effect.status] = (enemy.statusEffects[effect.status] || 0) + effect.value;
                    }
                } else {
                    const target = targetEnemy || enemies.find(e => e.hp > 0);
                    if (target) target.statusEffects[effect.status] = (target.statusEffects[effect.status] || 0) + effect.value;
                }
                break;
            }
            case 'buff':
                player.statusEffects[effect.status] = (player.statusEffects[effect.status] || 0) + effect.value;
                break;
            case 'tempBuff':
                player.tempBuffs.push({ status: effect.status, value: effect.value });
                break;
            case 'gainEnergy':
                player.gainEnergy(effect.value);
                break;
            case 'loseHP':
                player.loseHP(effect.value);
                break;
            case 'addCopy': {
                const copy = createCard(card.defId);
                player.addCardToDiscard(copy);
                break;
            }
            case 'addCard': {
                const newCard = createCard(effect.cardId);
                player.addCardToDiscard(newCard);
                break;
            }
            case 'registerPower':
                player.powers[effect.power] = (player.powers[effect.power] || 0) + (effect.value || 1);
                break;
            case 'noMoreDraw':
                player.noMoreDraw = true;
                break;
            case 'exhaustRandom': {
                const nonThis = player.hand.filter(c => c.uid !== card.uid);
                if (nonThis.length > 0) {
                    const target = pickRandom(nonThis);
                    player.exhaustCard(target);
                    if (combat) combat.triggerRelics('onExhaust', player, target);
                }
                break;
            }
            case 'secondWind': {
                const toExhaust = player.hand.filter(c => c.uid !== card.uid && c.type !== CARD_TYPES.ATTACK);
                for (const c of toExhaust) {
                    player.exhaustCard(c);
                    player.gainBlock(effect.blockPer);
                    if (combat) combat.triggerRelics('onExhaust', player, c);
                }
                break;
            }
            case 'addRandomAttack': {
                const attacks = Object.values(CARD_DEFS).filter(d => d.type === CARD_TYPES.ATTACK && d.rarity !== 'Starter' && d.rarity !== 'Common');
                if (attacks.length > 0) {
                    const def = pickRandom(attacks);
                    const c = createCard(def.id);
                    c.cost = 0;
                    player.addCardToHand(c);
                }
                break;
            }
            case 'playTopDraw': {
                if (player.drawPile.length > 0) {
                    const topCard = player.drawPile.pop();
                    player.addCardToHand(topCard);
                    if (!topCard.unplayable && combat) {
                        executeCard(topCard, player, enemies, targetEnemy, combat);
                        player.exhaustCard(topCard);
                    }
                }
                break;
            }
            case 'putOnDraw':
            case 'putBack':
                // These require UI interaction - simplified: just a visual indicator
                break;
        }
    }

    // Ramp up damage (Rampage)
    if (card.rampUp) {
        card.rampBonus = (card.rampBonus || 0) + card.rampUp;
        // Update in master deck too
        const master = player.masterDeck.find(c => c.uid === card.uid);
        if (master) master.rampBonus = card.rampBonus;
    }

    // Lifesteal healing
    if (totalLifesteal > 0) {
        player.heal(totalLifesteal);
    }
}

export function getCardColor(card) {
    switch (card.type) {
        case CARD_TYPES.ATTACK: return '#cc3333';
        case CARD_TYPES.SKILL: return '#3366cc';
        case CARD_TYPES.POWER: return '#cc9933';
        case CARD_TYPES.STATUS: return '#666666';
        case CARD_TYPES.CURSE: return '#6633aa';
        default: return '#555555';
    }
}

export function getCardGlow(card) {
    switch (card.rarity) {
        case 'Rare': return '#ffaa00';
        case 'Uncommon': return '#44aaff';
        default: return null;
    }
}
