export class UI {
    constructor(game) {
        this.game = game;
        this.tooltip = null;
        this.modal = null;
        this.buttons = [];
        this.deckViewOpen = false;
        this.deckViewScroll = 0;

        this.setupEndTurnButton();
    }

    setupEndTurnButton() {
        // End Turn button rendered on canvas - coordinates stored here
        this.endTurnBtn = { x: 730, y: 480, w: 120, h: 40, hover: false };
    }

    showTooltip(text, x, y) {
        this.tooltip = { text, x, y };
    }

    hideTooltip() {
        this.tooltip = null;
    }

    isEndTurnClicked(mx, my) {
        const b = this.endTurnBtn;
        return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
    }

    isEndTurnHovered(mx, my) {
        const b = this.endTurnBtn;
        this.endTurnBtn.hover = mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
        return this.endTurnBtn.hover;
    }

    renderEndTurnButton(ctx, enabled) {
        const b = this.endTurnBtn;
        const color = enabled ? (b.hover ? '#5544cc' : '#4433aa') : '#333344';

        ctx.fillStyle = color;
        ctx.strokeStyle = enabled ? '#8877ee' : '#444455';
        ctx.lineWidth = 2;
        roundRect(ctx, b.x, b.y, b.w, b.h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = enabled ? '#ffffff' : '#666677';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('End Turn', b.x + b.w / 2, b.y + b.h / 2);
    }

    renderTooltip(ctx) {
        if (!this.tooltip) return;
        const { text, x, y } = this.tooltip;
        const lines = text.split('\n');
        const lineHeight = 18;
        const padding = 10;
        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const width = maxWidth + padding * 2;
        const height = lines.length * lineHeight + padding * 2;

        let tx = x + 15;
        let ty = y - height / 2;
        if (tx + width > 960) tx = x - width - 15;
        if (ty < 0) ty = 5;
        if (ty + height > 640) ty = 640 - height - 5;

        ctx.fillStyle = 'rgba(10, 5, 20, 0.95)';
        ctx.strokeStyle = '#6644aa';
        ctx.lineWidth = 1;
        roundRect(ctx, tx, ty, width, height, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ddddee';
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], tx + padding, ty + padding + i * lineHeight);
        }
    }

    renderDeckView(ctx, player) {
        if (!this.deckViewOpen) return;

        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 960, 640);

        ctx.fillStyle = '#ddddee';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Deck (${player.masterDeck.length} cards)`, 480, 30);

        ctx.font = '12px monospace';
        ctx.fillText('Click anywhere to close', 480, 620);

        const cols = 6;
        const cardW = 110;
        const cardH = 150;
        const gap = 15;
        const startX = (960 - cols * (cardW + gap)) / 2;
        const startY = 55 - this.deckViewScroll;

        for (let i = 0; i < player.masterDeck.length; i++) {
            const card = player.masterDeck[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap);

            if (y + cardH < 40 || y > 610) continue;

            this.game.renderer.renderMiniCard(ctx, card, x, y, cardW, cardH);
        }
    }
}

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
