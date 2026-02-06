import { CARD_DEFS, CARD_RARITIES, CARD_PRICES, RELIC_PRICES, SHOP_CARD_COUNT, SHOP_RELIC_COUNT, SHOP_REMOVE_COST } from './Constants.js';
import { createCard } from './Cards.js';
import { getRandomRelicForShop } from './Relics.js';
import { pickRandom, randomInt, shuffle } from './Utils.js';

export class Shop {
    constructor(player) {
        this.player = player;
        this.cards = [];
        this.relics = [];
        this.removeCost = SHOP_REMOVE_COST;
        this.generate();
    }

    generate() {
        this.cards = [];
        this.relics = [];

        // Generate card pool: mix of common, uncommon, rare
        const allCards = Object.values(CARD_DEFS).filter(d =>
            d.rarity !== 'Starter' && !d.unplayable
        );
        const commons = allCards.filter(d => d.rarity === CARD_RARITIES.COMMON);
        const uncommons = allCards.filter(d => d.rarity === CARD_RARITIES.UNCOMMON);
        const rares = allCards.filter(d => d.rarity === CARD_RARITIES.RARE);

        const picked = new Set();
        const addCard = (pool) => {
            const available = pool.filter(d => !picked.has(d.id));
            if (available.length === 0) return;
            const def = pickRandom(available);
            picked.add(def.id);
            const card = createCard(def.id);
            const priceRange = CARD_PRICES[def.rarity] || [50, 60];
            card.price = randomInt(priceRange[0], priceRange[1]);
            card.sold = false;
            this.cards.push(card);
        };

        // 3 common, 2 uncommon, 1 rare
        for (let i = 0; i < 3; i++) addCard(commons);
        for (let i = 0; i < 2; i++) addCard(uncommons);
        addCard(rares);

        // Generate relics
        const ownedIds = this.player.relics.map(r => r.id);
        for (let i = 0; i < SHOP_RELIC_COUNT; i++) {
            const relic = getRandomRelicForShop(ownedIds);
            if (relic) {
                const priceRange = RELIC_PRICES[relic.rarity] || [150, 200];
                relic.price = randomInt(priceRange[0], priceRange[1]);
                relic.sold = false;
                ownedIds.push(relic.id);
                this.relics.push(relic);
            }
        }
    }

    buyCard(index) {
        const card = this.cards[index];
        if (!card || card.sold) return false;
        if (this.player.gold < card.price) return false;

        this.player.gold -= card.price;
        this.player.addCardToDeck(createCard(card.defId));
        card.sold = true;
        return true;
    }

    buyRelic(index) {
        const relic = this.relics[index];
        if (!relic || relic.sold) return false;
        if (this.player.gold < relic.price) return false;

        this.player.gold -= relic.price;
        this.player.addRelic(relic);
        relic.sold = true;
        return true;
    }

    removeCard(deckIndex) {
        if (this.player.gold < this.removeCost) return false;
        if (deckIndex < 0 || deckIndex >= this.player.masterDeck.length) return false;

        this.player.gold -= this.removeCost;
        this.player.removeCardFromDeck(deckIndex);
        this.removeCost += 25;
        return true;
    }
}
