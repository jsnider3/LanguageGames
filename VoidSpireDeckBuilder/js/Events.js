import { EVENT_DEFS, CARD_DEFS, CARD_RARITIES, CARD_TYPES } from './Constants.js';
import { createCard } from './Cards.js';
import { getRandomRelic } from './Relics.js';
import { pickRandom, randomInt, deepClone } from './Utils.js';

export function getRandomEvent(usedEvents = []) {
    const available = EVENT_DEFS.filter(e => !usedEvents.includes(e.id));
    if (available.length === 0) return deepClone(pickRandom(EVENT_DEFS));
    return deepClone(pickRandom(available));
}

export function executeEventChoice(choice, player, game) {
    const effect = choice.effect;
    if (!effect) return { message: 'You walk away.' };

    const result = { message: '' };

    switch (effect.type) {
        case 'loseHP':
            player.loseHP(effect.value);
            result.message = `Lost ${effect.value} HP.`;
            if (effect.reward) {
                applyReward(effect.reward, player, game, result);
            }
            break;

        case 'gainGold':
            if (effect.min) {
                const gold = randomInt(effect.min, effect.max);
                player.gold += gold;
                result.message = `Gained ${gold} gold.`;
            } else {
                player.gold += effect.value;
                result.message = `Gained ${effect.value} gold.`;
            }
            if (effect.penalty) {
                applyPenalty(effect.penalty, player, game, result);
            }
            break;

        case 'loseGold':
            if (player.gold < effect.value) {
                result.message = 'Not enough gold!';
                result.failed = true;
                return result;
            }
            player.gold -= effect.value;
            result.message = `Lost ${effect.value} gold.`;
            if (effect.reward) {
                applyReward(effect.reward, player, game, result);
            }
            break;

        case 'heal':
            if (effect.percent) {
                const amt = Math.floor(player.maxHP * effect.percent);
                player.heal(amt);
                result.message = `Healed ${amt} HP.`;
            } else {
                player.heal(effect.value);
                result.message = `Healed ${effect.value} HP.`;
            }
            if (effect.penalty) {
                applyPenalty(effect.penalty, player, game, result);
            }
            break;

        case 'gamble': {
            const success = Math.random() < effect.chance;
            if (success) {
                applyReward(effect.success, player, game, result);
            } else {
                applyPenalty(effect.fail, player, game, result);
            }
            break;
        }

        case 'removeCard':
            if (player.masterDeck.length > 0) {
                result.showCardRemoval = true;
                result.message = 'Choose a card to remove.';
            } else {
                result.message = 'No cards to remove.';
            }
            break;

        case 'addStatus': {
            for (let i = 0; i < effect.count; i++) {
                player.addCardToDeck(createCard(effect.cardId));
            }
            result.message = `Added ${effect.count} ${CARD_DEFS[effect.cardId].name}(s) to your deck.`;
            if (effect.reward) {
                applyReward(effect.reward, player, game, result);
            }
            break;
        }

        case 'tempEnergy':
            player.baseEnergy += effect.value;
            result.message = `Gained ${effect.value} max Energy!`;
            result.tempEnergy = true;
            break;

        case 'cardReward':
            result.showCardReward = true;
            result.message = 'Choose a card.';
            break;
    }

    return result;
}

function applyReward(reward, player, game, result) {
    switch (reward.type) {
        case 'addRareCard': {
            const rares = Object.values(CARD_DEFS).filter(d => d.rarity === CARD_RARITIES.RARE);
            const card = createCard(pickRandom(rares).id);
            player.addCardToDeck(card);
            result.message += ` Gained ${card.name}!`;
            break;
        }
        case 'addUncommonCard': {
            const uncommons = Object.values(CARD_DEFS).filter(d => d.rarity === CARD_RARITIES.UNCOMMON);
            const card = createCard(pickRandom(uncommons).id);
            player.addCardToDeck(card);
            result.message += ` Gained ${card.name}!`;
            break;
        }
        case 'addRelic': {
            const relic = getRandomRelic(player.relics.map(r => r.id));
            if (relic) {
                player.addRelic(relic);
                result.message += ` Gained relic: ${relic.name}!`;
            }
            break;
        }
        case 'fullHeal':
            player.hp = player.maxHP;
            result.message += ' Fully healed!';
            break;
        case 'upgradeRandom':
            result.message += ' A card glows with power!';
            break;
        case 'gainGold':
            player.gold += reward.value;
            result.message += ` Gained ${reward.value} gold.`;
            break;
        case 'permBuff':
            player.statusEffects[reward.status] = (player.statusEffects[reward.status] || 0) + reward.value;
            result.message = `Gained +${reward.value} ${reward.status}!`;
            break;
    }
}

function applyPenalty(penalty, player, game, result) {
    switch (penalty.type) {
        case 'addCurse': {
            const curse = createCard('void_curse');
            player.addCardToDeck(curse);
            result.message += ' Gained a Void Curse!';
            break;
        }
        case 'loseHP':
            player.loseHP(penalty.value);
            result.message = `Lost ${penalty.value} HP!`;
            break;
        case 'gainGold':
            player.gold += penalty.value;
            result.message += ` Gained ${penalty.value} gold.`;
            break;
    }
}
