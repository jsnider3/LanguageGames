import { NODE_TYPES, CARD_TYPES, INTENT_TYPES, REST_HEAL_PERCENT } from './Constants.js';
import { getCardColor, getCardGlow } from './Cards.js';
import { lerp, easeOutCubic } from './Utils.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.time = 0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // ═══════════════════════════════════════════════════════════
    // MAIN MENU
    // ═══════════════════════════════════════════════════════════

    renderMenu(hasSave) {
        const ctx = this.ctx;
        this.time += 0.016;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0a0514');
        grad.addColorStop(0.5, '#150a28');
        grad.addColorStop(1, '#0a0514');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Floating particles
        for (let i = 0; i < 30; i++) {
            const x = (i * 137.5 + this.time * 15 * (i % 3 + 1)) % this.width;
            const y = (i * 89.3 + Math.sin(this.time + i) * 30) % this.height;
            ctx.globalAlpha = 0.15 + Math.sin(this.time * 2 + i) * 0.1;
            ctx.fillStyle = '#7744cc';
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.sin(this.time + i) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.save();
        const titleY = 180 + Math.sin(this.time * 0.8) * 5;
        ctx.fillStyle = '#aa66ff';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#7733cc';
        ctx.shadowBlur = 30;
        ctx.fillText('VOID SPIRE', this.width / 2, titleY);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Subtitle
        ctx.fillStyle = '#6644aa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('A Roguelike Deck Builder', this.width / 2, titleY + 40);

        // Buttons
        const btnW = 200, btnH = 48;
        const btnX = this.width / 2 - btnW / 2;
        let btnY = 320;

        this.renderMenuButton(ctx, 'New Run', btnX, btnY, btnW, btnH, 'newRun');
        if (hasSave) {
            btnY += 65;
            this.renderMenuButton(ctx, 'Continue', btnX, btnY, btnW, btnH, 'continue');
        }

        // Credits
        ctx.fillStyle = '#443366';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Made by Claude Opus 4.6', this.width / 2, this.height - 20);
    }

    renderMenuButton(ctx, text, x, y, w, h, id) {
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ccbbee';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
    }

    // ═══════════════════════════════════════════════════════════
    // MAP
    // ═══════════════════════════════════════════════════════════

    renderMap(map, player, act) {
        const ctx = this.ctx;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0a0514');
        grad.addColorStop(1, '#100820');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Header
        ctx.fillStyle = '#aa66ff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Act ${act}`, 15, 25);

        // Player stats
        this.renderPlayerStats(ctx, player);

        // Draw connections
        for (const path of map.paths) {
            const from = path.from;
            const to = path.to;
            ctx.strokeStyle = to.visited ? '#6644aa' : (to.accessible ? '#4433aa88' : '#221133');
            ctx.lineWidth = to.accessible ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }

        // Draw nodes
        for (const node of map.nodes) {
            this.renderMapNode(ctx, node);
        }

        // Deck button
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 1;
        roundRect(ctx, 860, 8, 90, 28, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bbaadd';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Deck (${player.masterDeck.length})`, 905, 24);
    }

    renderMapNode(ctx, node) {
        const radius = 14;
        const colors = {
            [NODE_TYPES.COMBAT]: '#cc4444',
            [NODE_TYPES.ELITE]: '#ffaa00',
            [NODE_TYPES.SHOP]: '#44cc44',
            [NODE_TYPES.REST]: '#4488cc',
            [NODE_TYPES.EVENT]: '#cc44cc',
            [NODE_TYPES.BOSS]: '#ff2222',
            [NODE_TYPES.START]: '#6644aa',
        };
        const icons = {
            [NODE_TYPES.COMBAT]: '\u2694',
            [NODE_TYPES.ELITE]: '\u2620',
            [NODE_TYPES.SHOP]: '$',
            [NODE_TYPES.REST]: '\u2764',
            [NODE_TYPES.EVENT]: '?',
            [NODE_TYPES.BOSS]: '\u2B50',
            [NODE_TYPES.START]: '\u25CF',
        };

        const color = colors[node.type] || '#666666';
        const icon = icons[node.type] || '?';

        ctx.save();

        if (node.accessible) {
            // Pulse effect
            this.time += 0.0001;
            const pulse = Math.sin(this.time * 120 + node.x) * 0.2 + 0.8;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8 + pulse * 6;
        }

        ctx.fillStyle = node.visited ? '#221133' : (node.accessible ? color : '#1a0e2e');
        ctx.strokeStyle = node.visited ? '#443366' : (node.accessible ? '#ffffff88' : '#332244');
        ctx.lineWidth = node.accessible ? 2 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = node.visited ? '#665588' : '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, node.x, node.y);

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // COMBAT
    // ═══════════════════════════════════════════════════════════

    renderCombat(combat, player, effects) {
        const ctx = this.ctx;
        const shake = effects.getShakeOffset();

        ctx.save();
        ctx.translate(shake.x, shake.y);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0e0820');
        grad.addColorStop(0.4, '#150a28');
        grad.addColorStop(1, '#0a0514');
        ctx.fillStyle = grad;
        ctx.fillRect(-10, -10, this.width + 20, this.height + 20);

        // Floor line
        ctx.strokeStyle = '#221133';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 360);
        ctx.lineTo(this.width, 360);
        ctx.stroke();

        // Enemies
        for (const enemy of combat.enemies) {
            if (enemy.hp <= 0) {
                if (enemy.alpha > 0) {
                    enemy.alpha -= 0.03;
                    this.renderEnemy(ctx, enemy);
                }
                continue;
            }
            this.renderEnemy(ctx, enemy);
        }

        // Player avatar
        this.renderPlayerAvatar(ctx, player);

        // Effects
        effects.render(ctx);

        // Damage numbers
        for (const dn of combat.damageNumbers) {
            ctx.globalAlpha = Math.min(1, dn.timer * 2);
            ctx.fillStyle = dn.color;
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${dn.amount}`, dn.x, dn.y);
        }
        ctx.globalAlpha = 1;

        // Hand
        this.renderHand(ctx, player, combat);

        // Energy
        this.renderEnergy(ctx, player);

        // Player stats bar
        this.renderPlayerStats(ctx, player);

        // Draw/Discard piles
        ctx.fillStyle = '#bbaadd';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Draw: ${player.drawPile.length}`, 15, 520);
        ctx.fillText(`Discard: ${player.discardPile.length}`, 15, 538);
        ctx.fillText(`Exhaust: ${player.exhaustPile.length}`, 15, 556);

        ctx.restore();
    }

    renderEnemy(ctx, enemy) {
        ctx.save();
        ctx.globalAlpha = enemy.alpha || 1;

        const x = enemy.x + (enemy.shakeX || 0);
        const y = enemy.y + (enemy.shakeY || 0);

        // Body
        ctx.fillStyle = enemy.flashTimer > 0 ? '#ffffff' : enemy.color;
        roundRect(ctx, x, y, enemy.width, enemy.height, 8);
        ctx.fill();

        // Boss crown
        if (enemy.isBoss) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('\u2B50', x + enemy.width / 2, y - 10);
        }

        // HP bar
        const hpBarW = enemy.width - 8;
        const hpBarH = 8;
        const hpBarX = x + 4;
        const hpBarY = y + enemy.height + 6;
        ctx.fillStyle = '#330000';
        roundRect(ctx, hpBarX, hpBarY, hpBarW, hpBarH, 3);
        ctx.fill();
        const hpRatio = enemy.hp / enemy.maxHP;
        ctx.fillStyle = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#ccaa00' : '#cc2222';
        roundRect(ctx, hpBarX, hpBarY, hpBarW * hpRatio, hpBarH, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${enemy.hp}/${enemy.maxHP}`, x + enemy.width / 2, hpBarY + hpBarH + 12);

        // Block
        if (enemy.block > 0) {
            ctx.fillStyle = '#3366cc';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`\uD83D\uDEE1${enemy.block}`, x + enemy.width / 2, y - 5);
        }

        // Name
        ctx.fillStyle = '#ddddee';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, x + enemy.width / 2, hpBarY + hpBarH + 24);

        // Intent
        const intentIcon = enemy.getIntentIcon();
        const intentText = enemy.getIntentText();
        const intentColor = enemy.currentIntent.type === INTENT_TYPES.ATTACK || enemy.currentIntent.type === INTENT_TYPES.ATTACK_DEBUFF
            ? '#ff4444' : '#44aaff';
        ctx.fillStyle = intentColor;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${intentIcon} ${intentText}`, x + enemy.width / 2, y - 20);

        // Status effects
        let statusX = x;
        if (enemy.statusEffects.vulnerable > 0) {
            this.renderStatusIcon(ctx, statusX, y + enemy.height + 36, 'V', '#ffaa00', enemy.statusEffects.vulnerable);
            statusX += 28;
        }
        if (enemy.statusEffects.weak > 0) {
            this.renderStatusIcon(ctx, statusX, y + enemy.height + 36, 'W', '#44aaff', enemy.statusEffects.weak);
            statusX += 28;
        }
        if (enemy.statusEffects.strength > 0) {
            this.renderStatusIcon(ctx, statusX, y + enemy.height + 36, 'S', '#ff4444', enemy.statusEffects.strength);
            statusX += 28;
        }
        if (enemy.statusEffects.poison > 0) {
            this.renderStatusIcon(ctx, statusX, y + enemy.height + 36, 'P', '#44cc44', enemy.statusEffects.poison);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    renderStatusIcon(ctx, x, y, letter, color, value) {
        ctx.fillStyle = color + '33';
        ctx.beginPath();
        ctx.arc(x + 10, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${letter}${value}`, x + 10, y);
    }

    renderPlayerAvatar(ctx, player) {
        const x = 100, y = 260, w = 50, h = 70;

        ctx.fillStyle = '#4433aa';
        roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = '#6655cc';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        // Block shield
        if (player.block > 0) {
            ctx.fillStyle = '#3366cc88';
            roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
            ctx.fill();
            ctx.fillStyle = '#88ccff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`\uD83D\uDEE1${player.block}`, x + w / 2, y - 12);
        }

        // HP bar
        const hpBarW = w + 20;
        const hpBarX = x - 10;
        const hpBarY = y + h + 8;
        ctx.fillStyle = '#330000';
        roundRect(ctx, hpBarX, hpBarY, hpBarW, 10, 4);
        ctx.fill();
        const hpRatio = player.hp / player.maxHP;
        ctx.fillStyle = hpRatio > 0.5 ? '#cc2222' : hpRatio > 0.25 ? '#cc6600' : '#cc0000';
        roundRect(ctx, hpBarX, hpBarY, hpBarW * hpRatio, 10, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.hp}/${player.maxHP}`, x + w / 2, hpBarY + 22);

        // Player status effects
        let statusX = hpBarX;
        const statusY = hpBarY + 34;
        if (player.statusEffects.strength > 0) {
            this.renderStatusIcon(ctx, statusX, statusY, 'S', '#ff4444', player.statusEffects.strength);
            statusX += 28;
        }
        if (player.statusEffects.dexterity > 0) {
            this.renderStatusIcon(ctx, statusX, statusY, 'D', '#44cc44', player.statusEffects.dexterity);
            statusX += 28;
        }
        if (player.statusEffects.vulnerable > 0) {
            this.renderStatusIcon(ctx, statusX, statusY, 'V', '#ffaa00', player.statusEffects.vulnerable);
            statusX += 28;
        }
        if (player.statusEffects.weak > 0) {
            this.renderStatusIcon(ctx, statusX, statusY, 'W', '#44aaff', player.statusEffects.weak);
        }
    }

    renderEnergy(ctx, player) {
        const x = 45, y = 480;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#aa66ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${player.energy}`, x, y - 2);

        ctx.fillStyle = '#aa88cc';
        ctx.font = '10px monospace';
        ctx.fillText('ENERGY', x, y + 18);
    }

    renderHand(ctx, player, combat) {
        const hand = player.hand;
        if (hand.length === 0) return;

        const cardW = 100;
        const cardH = 140;
        const maxFanWidth = 650;
        const fanCenterX = 480;
        const fanBaseY = 580;

        const totalWidth = Math.min(hand.length * (cardW + 8), maxFanWidth);
        const startX = fanCenterX - totalWidth / 2;
        const spacing = hand.length > 1 ? totalWidth / hand.length : 0;

        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            card.targetX = startX + i * spacing;
            card.targetY = fanBaseY - (card.hover ? 60 : 0);

            // Smooth interpolation
            card.x = lerp(card.x || card.targetX, card.targetX, 0.2);
            card.y = lerp(card.y || card.targetY, card.targetY, 0.2);

            const canPlay = player.canPlayCard(card);
            this.renderCard(ctx, card, card.x, card.y, cardW, cardH, canPlay, card.hover);
        }
    }

    renderCard(ctx, card, x, y, w, h, canPlay = true, hovered = false) {
        ctx.save();

        if (hovered) {
            ctx.shadowColor = canPlay ? '#aa66ff' : '#662233';
            ctx.shadowBlur = 15;
        }

        // Card background
        const baseColor = getCardColor(card);
        ctx.fillStyle = canPlay ? baseColor : '#222233';
        roundRect(ctx, x, y, w, h, 6);
        ctx.fill();

        // Border
        const glow = getCardGlow(card);
        ctx.strokeStyle = glow || (canPlay ? '#888899' : '#333344');
        ctx.lineWidth = glow ? 2 : 1;
        roundRect(ctx, x, y, w, h, 6);
        ctx.stroke();

        // Card name
        ctx.fillStyle = canPlay ? '#ffffff' : '#666677';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, x + w / 2, y + 18);

        // Cost circle
        if (card.cost >= 0) {
            ctx.fillStyle = '#1a0e2e';
            ctx.beginPath();
            ctx.arc(x + 14, y + 14, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#aa88cc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = canPlay ? '#ffcc44' : '#666655';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${card.cost}`, x + 14, y + 14);
        }

        // Type label
        ctx.fillStyle = '#aaaabb';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(card.type, x + w / 2, y + 28);

        // Description - word wrap
        ctx.fillStyle = canPlay ? '#ddddee' : '#555566';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const lines = wordWrap(ctx, card.description, w - 14);
        for (let i = 0; i < lines.length && i < 6; i++) {
            ctx.fillText(lines[i], x + w / 2, y + 42 + i * 13);
        }

        // Exhaust / Ethereal tags
        if (card.exhaust || card.ethereal) {
            ctx.fillStyle = '#887799';
            ctx.font = '8px monospace';
            const tag = card.exhaust ? 'Exhaust' : 'Ethereal';
            ctx.fillText(tag, x + w / 2, y + h - 14);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    renderMiniCard(ctx, card, x, y, w, h) {
        const baseColor = getCardColor(card);
        ctx.fillStyle = baseColor;
        roundRect(ctx, x, y, w, h, 5);
        ctx.fill();

        ctx.strokeStyle = '#555566';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, w, h, 5);
        ctx.stroke();

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, x + w / 2, y + 16);

        // Cost
        if (card.cost >= 0) {
            ctx.fillStyle = '#1a0e2e';
            ctx.beginPath();
            ctx.arc(x + 12, y + 12, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc44';
            ctx.font = 'bold 11px monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${card.cost}`, x + 12, y + 12);
        }

        // Type
        ctx.fillStyle = '#999aab';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(card.type, x + w / 2, y + 26);

        // Description
        ctx.fillStyle = '#ccccdd';
        ctx.font = '9px monospace';
        const lines = wordWrap(ctx, card.description, w - 10);
        for (let i = 0; i < lines.length && i < 5; i++) {
            ctx.fillText(lines[i], x + w / 2, y + 38 + i * 11);
        }
    }

    renderPlayerStats(ctx, player) {
        // Top-right stats bar
        ctx.fillStyle = '#1a0e2e88';
        roundRect(ctx, 0, 0, 350, 36, 0);
        ctx.fill();

        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // HP
        ctx.fillStyle = '#ff4444';
        ctx.fillText(`\u2764 ${player.hp}/${player.maxHP}`, 15, 18);

        // Gold
        ctx.fillStyle = '#ffcc44';
        ctx.fillText(`\u2B50 ${player.gold}g`, 150, 18);

        // Relics
        ctx.fillStyle = '#aa88cc';
        let rx = 250;
        for (const relic of player.relics) {
            ctx.fillText(relic.symbol || '\u25CF', rx, 18);
            rx += 20;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // REWARD SCREEN
    // ═══════════════════════════════════════════════════════════

    renderReward(rewardCards, goldReward, relicReward, player) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = 'rgba(10, 5, 20, 0.92)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#aa66ff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Victory!', this.width / 2, 60);

        let yPos = 100;

        // Gold
        if (goldReward > 0) {
            ctx.fillStyle = '#ffcc44';
            ctx.font = '16px monospace';
            ctx.fillText(`+${goldReward} Gold`, this.width / 2, yPos);
            yPos += 30;
        }

        // Relic
        if (relicReward) {
            ctx.fillStyle = '#44ccaa';
            ctx.font = '16px monospace';
            ctx.fillText(`Relic: ${relicReward.symbol || ''} ${relicReward.name}`, this.width / 2, yPos);
            ctx.font = '12px monospace';
            ctx.fillStyle = '#88aacc';
            ctx.fillText(relicReward.description, this.width / 2, yPos + 18);
            yPos += 45;
        }

        // Card choices
        if (rewardCards && rewardCards.length > 0) {
            ctx.fillStyle = '#bbaadd';
            ctx.font = '16px monospace';
            ctx.fillText('Choose a card to add to your deck:', this.width / 2, yPos);
            yPos += 20;

            const cardW = 130, cardH = 180;
            const totalW = rewardCards.length * (cardW + 20);
            const startX = this.width / 2 - totalW / 2;

            for (let i = 0; i < rewardCards.length; i++) {
                const card = rewardCards[i];
                const cx = startX + i * (cardW + 20);
                const cy = yPos + 10;
                card._rewardX = cx;
                card._rewardY = cy;
                card._rewardW = cardW;
                card._rewardH = cardH;
                this.renderCard(ctx, card, cx, cy, cardW, cardH, true, card.hover);
            }
        }

        // Skip button
        const skipY = yPos + 220;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 1;
        roundRect(ctx, this.width / 2 - 60, skipY, 120, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Skip', this.width / 2, skipY + 18);
    }

    // ═══════════════════════════════════════════════════════════
    // SHOP
    // ═══════════════════════════════════════════════════════════

    renderShop(shop, player) {
        const ctx = this.ctx;

        ctx.fillStyle = '#0e0820';
        ctx.fillRect(0, 0, this.width, this.height);

        this.renderPlayerStats(ctx, player);

        ctx.fillStyle = '#44cc44';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Shop', this.width / 2, 60);

        // Cards
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText('Cards', this.width / 2, 90);

        const cardW = 110, cardH = 155;
        const cardStartX = (this.width - shop.cards.length * (cardW + 12)) / 2;
        for (let i = 0; i < shop.cards.length; i++) {
            const card = shop.cards[i];
            const x = cardStartX + i * (cardW + 12);
            const y = 100;
            card._shopX = x;
            card._shopY = y;
            card._shopW = cardW;
            card._shopH = cardH;

            if (card.sold) {
                ctx.globalAlpha = 0.3;
            }
            this.renderCard(ctx, card, x, y, cardW, cardH, !card.sold && player.gold >= card.price);

            // Price
            ctx.globalAlpha = card.sold ? 0.3 : 1;
            ctx.fillStyle = player.gold >= card.price ? '#ffcc44' : '#cc4444';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(card.sold ? 'SOLD' : `${card.price}g`, x + cardW / 2, y + cardH + 16);
            ctx.globalAlpha = 1;
        }

        // Relics
        const relicY = 300;
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Relics', this.width / 2, relicY);

        const relicStartX = (this.width - shop.relics.length * 130) / 2;
        for (let i = 0; i < shop.relics.length; i++) {
            const relic = shop.relics[i];
            const x = relicStartX + i * 130;
            const y = relicY + 15;
            relic._shopX = x;
            relic._shopY = y;
            relic._shopW = 120;
            relic._shopH = 70;

            ctx.globalAlpha = relic.sold ? 0.3 : 1;
            ctx.fillStyle = '#1a0e2e';
            ctx.strokeStyle = '#6644aa';
            ctx.lineWidth = 1;
            roundRect(ctx, x, y, 120, 70, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(relic.symbol || '\u25CF', x + 60, y + 22);
            ctx.font = '10px monospace';
            ctx.fillStyle = '#bbaadd';
            ctx.fillText(relic.name, x + 60, y + 40);
            ctx.font = '8px monospace';
            ctx.fillStyle = '#887799';
            const descLines = wordWrap(ctx, relic.description, 110);
            ctx.fillText(descLines[0] || '', x + 60, y + 53);

            ctx.fillStyle = player.gold >= relic.price ? '#ffcc44' : '#cc4444';
            ctx.font = '12px monospace';
            ctx.fillText(relic.sold ? 'SOLD' : `${relic.price}g`, x + 60, y + 86);
            ctx.globalAlpha = 1;
        }

        // Remove card
        const removeY = 420;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = player.gold >= shop.removeCost ? '#cc4444' : '#443344';
        ctx.lineWidth = 1;
        roundRect(ctx, this.width / 2 - 100, removeY, 200, 40, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = player.gold >= shop.removeCost ? '#ff6666' : '#665566';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Remove Card (${shop.removeCost}g)`, this.width / 2, removeY + 20);

        // Leave button
        const leaveY = 530;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 1;
        roundRect(ctx, this.width / 2 - 60, leaveY, 120, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText('Leave', this.width / 2, leaveY + 18);

        // Card removal mode - show deck
        if (shop._removingCard) {
            this.renderCardRemoval(ctx, player, shop);
        }
    }

    renderCardRemoval(ctx, player, shop) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Choose a card to remove', this.width / 2, 30);

        const cols = 6;
        const cardW = 110, cardH = 150, gap = 15;
        const startX = (this.width - cols * (cardW + gap)) / 2;
        const startY = 50;

        for (let i = 0; i < player.masterDeck.length; i++) {
            const card = player.masterDeck[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap);
            card._removeX = x;
            card._removeY = y;
            card._removeW = cardW;
            card._removeH = cardH;
            this.renderMiniCard(ctx, card, x, y, cardW, cardH);
        }

        // Cancel button
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#666688';
        roundRect(ctx, this.width / 2 - 50, this.height - 40, 100, 30, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bbaadd';
        ctx.font = '12px monospace';
        ctx.fillText('Cancel', this.width / 2, this.height - 22);
    }

    // ═══════════════════════════════════════════════════════════
    // EVENT
    // ═══════════════════════════════════════════════════════════

    renderEvent(event, resultMessage) {
        const ctx = this.ctx;

        ctx.fillStyle = '#0e0820';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#cc44cc';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(event.name, this.width / 2, 80);

        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        const descLines = wordWrap(ctx, event.description, this.width - 100);
        for (let i = 0; i < descLines.length; i++) {
            ctx.fillText(descLines[i], this.width / 2, 120 + i * 20);
        }

        if (resultMessage) {
            ctx.fillStyle = '#ffcc44';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(resultMessage, this.width / 2, 300);

            // Continue button
            ctx.fillStyle = '#1a0e2e';
            ctx.strokeStyle = '#6644aa';
            roundRect(ctx, this.width / 2 - 60, 340, 120, 36, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#bbaadd';
            ctx.font = '14px monospace';
            ctx.fillText('Continue', this.width / 2, 358);
        } else {
            // Choices
            const choiceY = 220;
            for (let i = 0; i < event.choices.length; i++) {
                const choice = event.choices[i];
                const y = choiceY + i * 55;
                choice._btnX = this.width / 2 - 250;
                choice._btnY = y;
                choice._btnW = 500;
                choice._btnH = 40;

                ctx.fillStyle = '#1a0e2e';
                ctx.strokeStyle = '#6644aa';
                ctx.lineWidth = 1;
                roundRect(ctx, choice._btnX, y, choice._btnW, choice._btnH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ddddee';
                ctx.font = '13px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(choice.text, this.width / 2, y + 20);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // REST
    // ═══════════════════════════════════════════════════════════

    renderRest(player) {
        const ctx = this.ctx;

        ctx.fillStyle = '#0e0820';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#4488cc';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Rest Site', this.width / 2, 100);

        // Campfire
        const cfx = this.width / 2, cfy = 200;
        this.time += 0.016;
        for (let i = 0; i < 8; i++) {
            const flicker = Math.sin(this.time * 8 + i * 2) * 5;
            ctx.fillStyle = i < 4 ? '#ff6622' : '#ffaa33';
            ctx.beginPath();
            ctx.arc(cfx + Math.sin(i) * 12, cfy - i * 4 + flicker, 8 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const healAmt = Math.floor(player.maxHP * REST_HEAL_PERCENT);
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText(`HP: ${player.hp}/${player.maxHP}`, this.width / 2, 270);

        // Rest button
        const restY = 310;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#4488cc';
        ctx.lineWidth = 2;
        roundRect(ctx, this.width / 2 - 120, restY, 240, 48, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#88ccff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`Rest (Heal ${healAmt} HP)`, this.width / 2, restY + 24);

        // Deck view button
        const deckY = restY + 65;
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 1;
        roundRect(ctx, this.width / 2 - 80, deckY, 160, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText(`View Deck (${player.masterDeck.length})`, this.width / 2, deckY + 18);
    }

    // ═══════════════════════════════════════════════════════════
    // GAME OVER / VICTORY
    // ═══════════════════════════════════════════════════════════

    renderGameOver(player) {
        const ctx = this.ctx;

        ctx.fillStyle = '#0a0514';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#cc2222';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        ctx.fillText('DEFEAT', this.width / 2, 200);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#887799';
        ctx.font = '16px monospace';
        ctx.fillText('The void claims another soul...', this.width / 2, 260);

        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText(`Floor reached: ${player._lastFloor || '?'}`, this.width / 2, 320);

        // Main menu button
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 2;
        roundRect(ctx, this.width / 2 - 100, 380, 200, 48, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ccbbee';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Main Menu', this.width / 2, 404);
    }

    renderVictory(player) {
        const ctx = this.ctx;

        ctx.fillStyle = '#0a0514';
        ctx.fillRect(0, 0, this.width, this.height);

        this.time += 0.016;

        // Particle celebration
        for (let i = 0; i < 40; i++) {
            const x = (i * 97 + this.time * 30) % this.width;
            const y = (i * 53 + Math.sin(this.time * 2 + i) * 40 + this.time * 20) % this.height;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = ['#ffcc44', '#aa66ff', '#44ccaa', '#ff6644'][i % 4];
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 25;
        ctx.fillText('VICTORY!', this.width / 2, 180);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#aa88cc';
        ctx.font = '16px monospace';
        ctx.fillText('The Heart of the Void has been silenced.', this.width / 2, 240);
        ctx.fillText('The Spire crumbles around you as light returns.', this.width / 2, 265);

        ctx.fillStyle = '#bbaadd';
        ctx.font = '14px monospace';
        ctx.fillText(`Cards in deck: ${player.masterDeck.length}`, this.width / 2, 320);
        ctx.fillText(`Relics: ${player.relics.length}`, this.width / 2, 345);
        ctx.fillText(`Gold: ${player.gold}`, this.width / 2, 370);

        // Main menu button
        ctx.fillStyle = '#1a0e2e';
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        roundRect(ctx, this.width / 2 - 100, 420, 200, 48, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Main Menu', this.width / 2, 444);
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wordWrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const test = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = test;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}
