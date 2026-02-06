import { Player } from './Player.js';
import { Combat } from './Combat.js';
import { generateEncounter } from './Enemy.js';
import { GameMap } from './Map.js';
import { Renderer } from './Renderer.js';
import { Effects } from './Effects.js';
import { UI } from './UI.js';
import { Shop } from './Shop.js';
import { SaveManager } from './SaveManager.js';
import { getStarterRelic, getRandomRelic } from './Relics.js';
import { getRandomEvent, executeEventChoice } from './Events.js';
import { createCard } from './Cards.js';
import {
    NODE_TYPES, CARD_DEFS, CARD_RARITIES, CARD_TYPES,
    CARD_REWARD_COUNT, GOLD_PER_COMBAT, GOLD_PER_ELITE,
    REST_HEAL_PERCENT, ACTS
} from './Constants.js';
import { randomInt, pickRandom } from './Utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.effects = new Effects();
        this.ui = new UI(this);

        this.state = 'menu'; // menu, map, combat, shop, event, rest, reward, gameover, victory
        this.player = null;
        this.combat = null;
        this.map = null;
        this.shop = null;
        this.act = 1;

        // Reward state
        this.rewardCards = null;
        this.goldReward = 0;
        this.relicReward = null;
        this.currentNodeType = null;

        // Event state
        this.currentEvent = null;
        this.eventResult = null;
        this.usedEvents = [];

        // Input
        this.mouse = { x: 0, y: 0, down: false };
        this.setupInput();

        this.lastTime = performance.now();
    }

    setupInput() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
            this.onMouseMove();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.onClick();
        });

        this.canvas.addEventListener('wheel', (e) => {
            if (this.ui.deckViewOpen) {
                this.ui.deckViewScroll += e.deltaY * 0.5;
                this.ui.deckViewScroll = Math.max(0, this.ui.deckViewScroll);
                e.preventDefault();
            }
        }, { passive: false });
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.effects.update(dt);

        if (this.state === 'combat' && this.combat) {
            this.combat.update(dt);
        }
    }

    render() {
        this.renderer.clear();

        switch (this.state) {
            case 'menu':
                this.renderer.renderMenu(SaveManager.hasSave());
                break;
            case 'map':
                this.renderer.renderMap(this.map, this.player, this.act);
                break;
            case 'combat':
                if (this.combat) {
                    this.renderer.renderCombat(this.combat, this.player, this.effects);
                    this.ui.renderEndTurnButton(this.renderer.ctx, this.combat.turnPhase === 'player');
                    this.ui.renderTooltip(this.renderer.ctx);
                }
                break;
            case 'reward':
                this.renderer.renderReward(this.rewardCards, this.goldReward, this.relicReward, this.player);
                break;
            case 'shop':
                if (this.shop) {
                    this.renderer.renderShop(this.shop, this.player);
                }
                break;
            case 'event':
                if (this.currentEvent) {
                    this.renderer.renderEvent(this.currentEvent, this.eventResult);
                }
                break;
            case 'rest':
                this.renderer.renderRest(this.player);
                break;
            case 'gameover':
                this.renderer.renderGameOver(this.player);
                break;
            case 'victory':
                this.renderer.renderVictory(this.player);
                break;
        }

        // Deck view overlay
        if (this.ui.deckViewOpen && this.player) {
            this.ui.renderDeckView(this.renderer.ctx, this.player);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GAME FLOW
    // ═══════════════════════════════════════════════════════════

    newRun() {
        SaveManager.deleteSave();
        this.player = new Player();
        this.player.addRelic(getStarterRelic());
        this.act = 1;
        this.usedEvents = [];
        this.map = new GameMap(this.act);
        this.state = 'map';
    }

    continueRun() {
        const save = SaveManager.load();
        if (!save) return;

        this.player = new Player();
        this.player.loadState(save.player);
        this.act = save.act;
        this.usedEvents = save.usedEvents || [];
        this.map = new GameMap(this.act);
        this.map.loadState(save.map);
        this.state = 'map';
    }

    enterNode(node) {
        this.currentNodeType = node.type;

        switch (node.type) {
            case NODE_TYPES.COMBAT:
            case NODE_TYPES.ELITE:
                this.startCombat(node.type === NODE_TYPES.ELITE ? 'elite' : 'normal');
                break;
            case NODE_TYPES.BOSS:
                this.startCombat('boss');
                break;
            case NODE_TYPES.SHOP:
                this.shop = new Shop(this.player);
                this.state = 'shop';
                break;
            case NODE_TYPES.EVENT:
                this.currentEvent = getRandomEvent(this.usedEvents);
                this.usedEvents.push(this.currentEvent.id);
                this.eventResult = null;
                this.state = 'event';
                break;
            case NODE_TYPES.REST:
                this.state = 'rest';
                break;
        }
    }

    startCombat(type) {
        const enemies = generateEncounter(this.act, type);
        this.combat = new Combat(this, this.player, enemies, this.effects);
        this.state = 'combat';
    }

    onCombatEnd(victory) {
        if (!victory) {
            this.player._lastFloor = this.map.currentFloor;
            SaveManager.deleteSave();
            setTimeout(() => { this.state = 'gameover'; }, 800);
            return;
        }

        // Trigger end-of-combat relics
        this.combat.triggerRelics('onCombatEnd', this.player);

        // Generate rewards
        const isElite = this.currentNodeType === NODE_TYPES.ELITE;
        const isBoss = this.currentNodeType === NODE_TYPES.BOSS;
        const goldRange = isElite ? GOLD_PER_ELITE : GOLD_PER_COMBAT;
        this.goldReward = randomInt(goldRange[0], goldRange[1]);
        this.player.gold += this.goldReward;

        // Relic from elite/boss
        this.relicReward = null;
        if (isElite || isBoss) {
            this.relicReward = getRandomRelic(this.player.relics.map(r => r.id));
            if (this.relicReward) {
                this.player.addRelic(this.relicReward);
            }
        }

        // Card rewards
        this.rewardCards = this.generateCardRewards();

        setTimeout(() => { this.state = 'reward'; }, 600);
    }

    generateCardRewards() {
        const cards = [];
        const allCards = Object.values(CARD_DEFS).filter(d =>
            d.rarity !== CARD_RARITIES.STARTER && !d.unplayable
        );

        for (let i = 0; i < CARD_REWARD_COUNT; i++) {
            // Weight: 60% common, 30% uncommon, 10% rare
            const roll = Math.random();
            let pool;
            if (roll < 0.6) pool = allCards.filter(d => d.rarity === CARD_RARITIES.COMMON);
            else if (roll < 0.9) pool = allCards.filter(d => d.rarity === CARD_RARITIES.UNCOMMON);
            else pool = allCards.filter(d => d.rarity === CARD_RARITIES.RARE);

            // Avoid duplicates in this reward
            const existing = cards.map(c => c.defId);
            const available = pool.filter(d => !existing.includes(d.id));
            if (available.length > 0) {
                cards.push(createCard(pickRandom(available).id));
            }
        }
        return cards;
    }

    selectRewardCard(card) {
        this.player.addCardToDeck(createCard(card.defId));
        this.afterReward();
    }

    skipReward() {
        this.afterReward();
    }

    afterReward() {
        this.rewardCards = null;
        this.relicReward = null;
        this.goldReward = 0;

        // Check if boss defeated = act complete
        if (this.currentNodeType === NODE_TYPES.BOSS) {
            if (this.act >= ACTS) {
                SaveManager.deleteSave();
                this.state = 'victory';
                return;
            }
            this.act++;
            this.map = new GameMap(this.act);
        }

        this.state = 'map';
        this.combat = null;
        SaveManager.save(this);
    }

    // ═══════════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════════

    onMouseMove() {
        const mx = this.mouse.x;
        const my = this.mouse.y;

        if (this.state === 'combat' && this.combat) {
            // Hover cards
            const hand = this.player.hand;
            let hoveredAny = false;
            for (let i = hand.length - 1; i >= 0; i--) {
                const card = hand[i];
                if (mx >= card.x && mx <= card.x + 100 && my >= card.y && my <= card.y + 140) {
                    if (!hoveredAny) {
                        card.hover = true;
                        hoveredAny = true;
                        this.ui.showTooltip(card.description, mx, my);
                    } else {
                        card.hover = false;
                    }
                } else {
                    card.hover = false;
                }
            }
            if (!hoveredAny) this.ui.hideTooltip();

            // Hover enemies
            for (const enemy of this.combat.enemies) {
                if (enemy.hp <= 0) continue;
                const ex = enemy.x, ey = enemy.y;
                if (mx >= ex && mx <= ex + enemy.width && my >= ey && my <= ey + enemy.height) {
                    this.combat.hoveredEnemy = enemy;
                } else if (this.combat.hoveredEnemy === enemy) {
                    this.combat.hoveredEnemy = null;
                }
            }

            this.ui.isEndTurnHovered(mx, my);
        }
    }

    onClick() {
        const mx = this.mouse.x;
        const my = this.mouse.y;

        // Deck view takes priority
        if (this.ui.deckViewOpen) {
            this.ui.deckViewOpen = false;
            return;
        }

        switch (this.state) {
            case 'menu':
                this.handleMenuClick(mx, my);
                break;
            case 'map':
                this.handleMapClick(mx, my);
                break;
            case 'combat':
                this.handleCombatClick(mx, my);
                break;
            case 'reward':
                this.handleRewardClick(mx, my);
                break;
            case 'shop':
                this.handleShopClick(mx, my);
                break;
            case 'event':
                this.handleEventClick(mx, my);
                break;
            case 'rest':
                this.handleRestClick(mx, my);
                break;
            case 'gameover':
            case 'victory':
                this.handleEndScreenClick(mx, my);
                break;
        }
    }

    handleMenuClick(mx, my) {
        const btnW = 200, btnH = 48;
        const btnX = this.canvas.width / 2 - btnW / 2;

        // New Run
        if (mx >= btnX && mx <= btnX + btnW && my >= 320 && my <= 320 + btnH) {
            this.newRun();
            return;
        }

        // Continue
        if (SaveManager.hasSave() && mx >= btnX && mx <= btnX + btnW && my >= 385 && my <= 385 + btnH) {
            this.continueRun();
        }
    }

    handleMapClick(mx, my) {
        // Deck button
        if (mx >= 860 && mx <= 950 && my >= 8 && my <= 36) {
            this.ui.deckViewOpen = true;
            this.ui.deckViewScroll = 0;
            return;
        }

        const node = this.map.getNodeAt(mx, my);
        if (node && node.accessible) {
            if (this.map.selectNode(node)) {
                this.enterNode(node);
            }
        }
    }

    handleCombatClick(mx, my) {
        if (!this.combat || this.combat.combatOver) return;

        // End Turn
        if (this.ui.isEndTurnClicked(mx, my) && this.combat.turnPhase === 'player') {
            this.combat.endPlayerTurn();
            return;
        }

        // Card click
        if (this.combat.turnPhase === 'player') {
            const hand = this.player.hand;
            for (let i = hand.length - 1; i >= 0; i--) {
                const card = hand[i];
                if (mx >= card.x && mx <= card.x + 100 && my >= card.y && my <= card.y + 140) {
                    if (this.player.canPlayCard(card)) {
                        // Target selection for single-target cards
                        let target = null;
                        if (this.combat.needsTarget(card)) {
                            target = this.combat.hoveredEnemy || this.combat.getAliveEnemies()[0];
                        }
                        this.combat.playCard(card, target);
                    }
                    return;
                }
            }
        }
    }

    handleRewardClick(mx, my) {
        if (!this.rewardCards) return;

        // Card selections
        for (const card of this.rewardCards) {
            if (card._rewardX !== undefined) {
                if (mx >= card._rewardX && mx <= card._rewardX + card._rewardW &&
                    my >= card._rewardY && my <= card._rewardY + card._rewardH) {
                    this.selectRewardCard(card);
                    return;
                }
            }
        }

        // Skip button (approximate position)
        const skipY = this.rewardCards[0]?._rewardY + 200 || 450;
        if (mx >= this.canvas.width / 2 - 60 && mx <= this.canvas.width / 2 + 60 &&
            my >= skipY && my <= skipY + 36) {
            this.skipReward();
        }
    }

    handleShopClick(mx, my) {
        if (!this.shop) return;

        // Card removal mode
        if (this.shop._removingCard) {
            // Cancel button
            if (mx >= this.canvas.width / 2 - 50 && mx <= this.canvas.width / 2 + 50 &&
                my >= this.canvas.height - 40 && my <= this.canvas.height - 10) {
                this.shop._removingCard = false;
                return;
            }
            // Click on card to remove
            for (let i = 0; i < this.player.masterDeck.length; i++) {
                const card = this.player.masterDeck[i];
                if (card._removeX !== undefined &&
                    mx >= card._removeX && mx <= card._removeX + card._removeW &&
                    my >= card._removeY && my <= card._removeY + card._removeH) {
                    this.shop.removeCard(i);
                    this.shop._removingCard = false;
                    return;
                }
            }
            return;
        }

        // Buy cards
        for (let i = 0; i < this.shop.cards.length; i++) {
            const card = this.shop.cards[i];
            if (card._shopX !== undefined && !card.sold &&
                mx >= card._shopX && mx <= card._shopX + card._shopW &&
                my >= card._shopY && my <= card._shopY + card._shopH + 20) {
                this.shop.buyCard(i);
                return;
            }
        }

        // Buy relics
        for (let i = 0; i < this.shop.relics.length; i++) {
            const relic = this.shop.relics[i];
            if (relic._shopX !== undefined && !relic.sold &&
                mx >= relic._shopX && mx <= relic._shopX + relic._shopW &&
                my >= relic._shopY && my <= relic._shopY + relic._shopH + 20) {
                this.shop.buyRelic(i);
                return;
            }
        }

        // Remove card button
        const removeY = 420;
        if (mx >= this.canvas.width / 2 - 100 && mx <= this.canvas.width / 2 + 100 &&
            my >= removeY && my <= removeY + 40 && this.player.gold >= this.shop.removeCost) {
            this.shop._removingCard = true;
            return;
        }

        // Leave button
        if (mx >= this.canvas.width / 2 - 60 && mx <= this.canvas.width / 2 + 60 &&
            my >= 530 && my <= 566) {
            this.state = 'map';
            this.shop = null;
            SaveManager.save(this);
        }
    }

    handleEventClick(mx, my) {
        if (!this.currentEvent) return;

        if (this.eventResult) {
            // Continue button
            if (mx >= this.canvas.width / 2 - 60 && mx <= this.canvas.width / 2 + 60 &&
                my >= 340 && my <= 376) {
                // Check player death
                if (this.player.isDead()) {
                    this.player._lastFloor = this.map.currentFloor;
                    SaveManager.deleteSave();
                    this.state = 'gameover';
                    return;
                }
                // Card reward from event
                if (this.eventResult.showCardReward) {
                    this.rewardCards = this.generateCardRewards();
                    this.goldReward = 0;
                    this.relicReward = null;
                    this.state = 'reward';
                    return;
                }
                this.state = 'map';
                this.currentEvent = null;
                this.eventResult = null;
                SaveManager.save(this);
            }
            return;
        }

        // Choice buttons
        for (let i = 0; i < this.currentEvent.choices.length; i++) {
            const choice = this.currentEvent.choices[i];
            if (choice._btnX !== undefined &&
                mx >= choice._btnX && mx <= choice._btnX + choice._btnW &&
                my >= choice._btnY && my <= choice._btnY + choice._btnH) {
                const result = executeEventChoice(choice, this.player, this);
                if (result.failed) return; // Not enough gold, etc.
                this.eventResult = result.message || 'Done.';
                if (result.showCardRemoval) {
                    // TODO: card removal UI in events
                    if (this.player.masterDeck.length > 0) {
                        const idx = randomInt(0, this.player.masterDeck.length - 1);
                        const removed = this.player.masterDeck[idx];
                        this.player.removeCardFromDeck(idx);
                        this.eventResult = `Removed ${removed.name} from your deck.`;
                    }
                }
                return;
            }
        }
    }

    handleRestClick(mx, my) {
        // View Deck
        const deckY = 375;
        if (mx >= this.canvas.width / 2 - 80 && mx <= this.canvas.width / 2 + 80 &&
            my >= deckY && my <= deckY + 36) {
            this.ui.deckViewOpen = true;
            this.ui.deckViewScroll = 0;
            return;
        }

        // Rest button
        const restY = 310;
        if (mx >= this.canvas.width / 2 - 120 && mx <= this.canvas.width / 2 + 120 &&
            my >= restY && my <= restY + 48) {
            const healAmt = Math.floor(this.player.maxHP * REST_HEAL_PERCENT);
            this.player.heal(healAmt);
            this.state = 'map';
            SaveManager.save(this);
        }
    }

    handleEndScreenClick(mx, my) {
        // Main menu button
        if (mx >= this.canvas.width / 2 - 100 && mx <= this.canvas.width / 2 + 100) {
            const btnY = this.state === 'victory' ? 420 : 380;
            if (my >= btnY && my <= btnY + 48) {
                this.state = 'menu';
                this.player = null;
                this.combat = null;
                this.map = null;
            }
        }
    }
}
