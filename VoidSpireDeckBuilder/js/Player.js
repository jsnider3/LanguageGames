import { PLAYER_MAX_HP, PLAYER_START_ENERGY, HAND_SIZE, CARD_DEFS } from './Constants.js';
import { createCard } from './Cards.js';
import { shuffle } from './Utils.js';

export class Player {
    constructor() {
        this.maxHP = PLAYER_MAX_HP;
        this.hp = this.maxHP;
        this.baseEnergy = PLAYER_START_ENERGY;
        this.energy = this.baseEnergy;
        this.gold = 99;
        this.block = 0;

        this.masterDeck = [];
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];

        this.relics = [];
        this.powers = {};
        this.statusEffects = { strength: 0, dexterity: 0, vulnerable: 0, weak: 0, poison: 0 };
        this.tempBuffs = [];

        this.noMoreDraw = false;
        this.turnNumber = 0;
        this.attacksPlayed = 0;

        this.initStarterDeck();
    }

    initStarterDeck() {
        for (let i = 0; i < 5; i++) this.masterDeck.push(createCard('strike'));
        for (let i = 0; i < 5; i++) this.masterDeck.push(createCard('defend'));
    }

    startCombat() {
        this.drawPile = shuffle(this.masterDeck.map(c => createCard(c.defId, c)));
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];
        this.block = 0;
        this.powers = {};
        this.statusEffects = { strength: 0, dexterity: 0, vulnerable: 0, weak: 0, poison: 0 };
        this.tempBuffs = [];
        this.noMoreDraw = false;
        this.turnNumber = 0;
        this.attacksPlayed = 0;
    }

    startTurn() {
        this.turnNumber++;
        if (!this.powers.barricade) {
            this.block = 0;
        }
        this.energy = this.baseEnergy + (this.hasRelic('cursed_key') ? 1 : 0);
        this.noMoreDraw = false;

        if (this.powers.demonForm) {
            this.statusEffects.strength += this.powers.demonForm;
        }

        this.drawCards(HAND_SIZE);
    }

    endTurn() {
        if (this.powers.metallicize) {
            this.gainBlock(this.powers.metallicize);
        }

        // Apply temp buffs (like Flex losing strength)
        for (const tb of this.tempBuffs) {
            this.statusEffects[tb.status] = (this.statusEffects[tb.status] || 0) + tb.value;
        }
        this.tempBuffs = [];

        // Burn damage
        const burns = this.hand.filter(c => c.defId === 'burn');
        for (const b of burns) {
            this.takeDamage(2);
        }

        // Void Curse energy loss
        const curses = this.hand.filter(c => c.defId === 'void_curse');
        for (const c of curses) {
            this.energy = Math.max(0, this.energy - 1);
        }

        // Exhaust ethereal cards
        const ethereals = this.hand.filter(c => c.ethereal);
        for (const e of ethereals) {
            this.exhaustCard(e);
        }

        // Discard remaining hand
        while (this.hand.length > 0) {
            this.discardPile.push(this.hand.pop());
        }
    }

    drawCards(count) {
        if (this.noMoreDraw) return;
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) return;
                this.drawPile = shuffle(this.discardPile);
                this.discardPile = [];
            }
            this.hand.push(this.drawPile.pop());
        }
    }

    canPlayCard(card) {
        if (card.unplayable) return false;
        return this.energy >= card.cost;
    }

    spendEnergy(amount) {
        this.energy -= amount;
    }

    gainEnergy(amount) {
        this.energy += amount;
    }

    gainBlock(amount) {
        let block = amount + (this.statusEffects.dexterity || 0);
        if (block < 0) block = 0;
        this.block += block;
    }

    takeDamage(amount, ignoreBlock = false) {
        let dmg = amount;
        if (!ignoreBlock && this.block > 0) {
            if (this.block >= dmg) {
                this.block -= dmg;
                return 0;
            } else {
                dmg -= this.block;
                this.block = 0;
            }
        }
        this.hp = Math.max(0, this.hp - dmg);
        return dmg;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHP, this.hp + amount);
    }

    loseHP(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    exhaustCard(card) {
        const idx = this.hand.indexOf(card);
        if (idx !== -1) this.hand.splice(idx, 1);
        this.exhaustPile.push(card);
        return card;
    }

    discardCard(card) {
        const idx = this.hand.indexOf(card);
        if (idx !== -1) this.hand.splice(idx, 1);
        this.discardPile.push(card);
    }

    addCardToDiscard(card) {
        this.discardPile.push(card);
    }

    addCardToHand(card) {
        if (this.hand.length < 10) {
            this.hand.push(card);
        } else {
            this.discardPile.push(card);
        }
    }

    addCardToDeck(card) {
        this.masterDeck.push(card);
    }

    removeCardFromDeck(index) {
        this.masterDeck.splice(index, 1);
    }

    hasRelic(relicId) {
        return this.relics.some(r => r.id === relicId);
    }

    addRelic(relic) {
        this.relics.push({ ...relic, counter: relic.counter || 0 });
    }

    isDead() {
        return this.hp <= 0;
    }

    getState() {
        return {
            maxHP: this.maxHP,
            hp: this.hp,
            baseEnergy: this.baseEnergy,
            gold: this.gold,
            masterDeck: this.masterDeck.map(c => ({ defId: c.defId, rampBonus: c.rampBonus || 0 })),
            relics: this.relics.map(r => ({ id: r.id, counter: r.counter || 0 })),
        };
    }

    loadState(state) {
        this.maxHP = state.maxHP;
        this.hp = state.hp;
        this.baseEnergy = state.baseEnergy;
        this.gold = state.gold;
        this.masterDeck = state.masterDeck.map(c => createCard(c.defId, c));
        this.relics = state.relics;
    }
}
