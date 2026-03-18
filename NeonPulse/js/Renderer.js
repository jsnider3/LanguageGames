import {
    WIDTH, HEIGHT, LANE_COUNT, LANE_WIDTH, LANE_TOTAL_WIDTH, LANE_LEFT,
    HIT_ZONE_Y, SCROLL_SPEED, LANE_COLORS, LANE_LABELS, LANE_KEYS,
    STATES, DIFFICULTIES, GRADES, NOTE_TYPES
} from './Constants.js';

import { lerp, clamp, easeOutCubic, formatTime, formatNumber, hexToRgb } from './Utils.js';

export class Renderer {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.time = 0;
        this.scanlineOffset = 0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // ═══════════════════════════════════════════════════════════
    // BACKGROUND
    // ═══════════════════════════════════════════════════════════

    renderBackground(songTime, bpm) {
        const ctx = this.ctx;

        // Dark gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(0.5, '#0a0a2a');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid pattern
        ctx.strokeStyle = '#ffffff08';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Beat pulse overlay
        if (bpm > 0) {
            const beatPhase = (songTime * bpm / 60) % 1;
            const pulseAlpha = 0.03 * Math.max(0, 1 - beatPhase * 3);
            if (pulseAlpha > 0.001) {
                ctx.fillStyle = `rgba(120, 80, 255, ${pulseAlpha})`;
                ctx.fillRect(0, 0, this.width, this.height);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // LANES
    // ═══════════════════════════════════════════════════════════

    renderLanes(lanePressed) {
        const ctx = this.ctx;

        for (let i = 0; i < LANE_COUNT; i++) {
            const x = LANE_LEFT + i * LANE_WIDTH;
            const color = hexToRgb(LANE_COLORS[i]);
            const alpha = lanePressed[i] ? 0.15 : 0.05;

            // Lane background
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.fillRect(x, 0, LANE_WIDTH, this.height);

            // Lane dividers
            if (i > 0) {
                ctx.strokeStyle = '#ffffff15';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }
        }

        // Outer lane dividers
        ctx.strokeStyle = '#ffffff15';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(LANE_LEFT, 0);
        ctx.lineTo(LANE_LEFT, this.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(LANE_LEFT + LANE_TOTAL_WIDTH, 0);
        ctx.lineTo(LANE_LEFT + LANE_TOTAL_WIDTH, this.height);
        ctx.stroke();

        // Hit zone bar
        ctx.save();
        const pulse = 0.6 + Math.sin(this.time * 4) * 0.2;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
        ctx.fillRect(LANE_LEFT, HIT_ZONE_Y - 2, LANE_TOTAL_WIDTH, 4);
        ctx.restore();

        // Lane key labels below hit zone
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < LANE_COUNT; i++) {
            const x = LANE_LEFT + i * LANE_WIDTH + LANE_WIDTH / 2;
            ctx.fillStyle = LANE_COLORS[i];
            ctx.globalAlpha = lanePressed[i] ? 1.0 : 0.5;
            ctx.fillText(LANE_LABELS[i], x, HIT_ZONE_Y + 30);
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════
    // NOTES
    // ═══════════════════════════════════════════════════════════

    renderNotes(notes, songTime) {
        const ctx = this.ctx;

        for (const note of notes) {
            const y = HIT_ZONE_Y - (note.time - songTime) * SCROLL_SPEED;

            // Skip off-screen or completed notes
            if (y < -50 || y > this.height + 50) continue;
            if (note.type === NOTE_TYPES.TAP && (note.hit || note.missed)) continue;

            const laneX = LANE_LEFT + note.lane * LANE_WIDTH + LANE_WIDTH / 2;
            const color = LANE_COLORS[note.lane];
            const isMissed = note.missed;

            if (note.type === NOTE_TYPES.HOLD) {
                this.renderHoldNote(ctx, note, laneX, y, songTime, color, isMissed);
            } else {
                this.renderTapNote(ctx, laneX, y, color, isMissed);
            }
        }
    }

    renderTapNote(ctx, x, y, color, missed) {
        ctx.save();
        const size = 14;
        const alpha = missed ? 0.3 : 1.0;
        const drawColor = missed ? '#666666' : color;

        ctx.globalAlpha = alpha;

        // Glow intensifies near hit zone
        const distToHit = Math.abs(y - HIT_ZONE_Y);
        const glowIntensity = missed ? 0 : clamp(1 - distToHit / 200, 0, 1);

        ctx.shadowColor = drawColor;
        ctx.shadowBlur = 8 + glowIntensity * 12;

        // Diamond shape (rotated square)
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
        const inner = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - inner);
        ctx.lineTo(x + inner, y);
        ctx.lineTo(x, y + inner);
        ctx.lineTo(x - inner, y);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderHoldNote(ctx, note, x, headY, songTime, color, missed) {
        ctx.save();
        const endY = HIT_ZONE_Y - (note.endTime - songTime) * SCROLL_SPEED;
        const drawColor = missed ? '#666666' : color;
        const alpha = missed ? 0.3 : 1.0;

        ctx.globalAlpha = alpha;

        // Hold tail
        const tailTop = Math.min(headY, endY);
        const tailBottom = Math.max(headY, endY);
        const tailWidth = LANE_WIDTH * 0.35;
        const tailAlpha = note.holdActive ? 0.6 : 0.3;

        const rgb = missed ? { r: 102, g: 102, b: 102 } : hexToRgb(color);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tailAlpha})`;
        roundRect(ctx, x - tailWidth / 2, tailTop, tailWidth, tailBottom - tailTop, 4);
        ctx.fill();

        // Glow on active hold
        if (note.holdActive && !missed) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
        }

        // Head diamond (only if not already hit past)
        if (!note.hit) {
            this.renderTapNote(ctx, x, headY, color, missed);
        }

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // HIT ZONE
    // ═══════════════════════════════════════════════════════════

    renderHitZone(songTime, bpm) {
        const ctx = this.ctx;

        // Beat pulse
        const beatPhase = bpm > 0 ? (songTime * bpm / 60) % 1 : 0;
        const beatPulse = Math.max(0, 1 - beatPhase * 4);
        const thickness = 3 + beatPulse * 2;
        const glowSize = 15 + beatPulse * 10;

        ctx.save();
        ctx.shadowBlur = glowSize;

        // Lane-colored segments
        for (let i = 0; i < LANE_COUNT; i++) {
            const x = LANE_LEFT + i * LANE_WIDTH;
            ctx.shadowColor = LANE_COLORS[i];
            ctx.fillStyle = LANE_COLORS[i];
            ctx.globalAlpha = 0.5 + beatPulse * 0.3;
            ctx.fillRect(x, HIT_ZONE_Y - thickness / 2, LANE_WIDTH, thickness);
        }

        // White overlay bar
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = glowSize * 0.5;
        ctx.globalAlpha = 0.2 + beatPulse * 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(LANE_LEFT, HIT_ZONE_Y - 1, LANE_TOTAL_WIDTH, 2);

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════════════════

    renderParticles(particles) {
        const ctx = this.ctx;

        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = clamp(p.alpha, 0, 1);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.size * 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // HUD
    // ═══════════════════════════════════════════════════════════

    renderHUD(score, combo, multiplier, health, maxHealth, songTime, songDuration, songName) {
        const ctx = this.ctx;

        // Score — top-left
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(formatNumber(score), 20, 16);
        ctx.restore();

        // Combo — below score
        if (combo > 0) {
            const comboScale = Math.min(1.4, 1.0 + combo * 0.005);
            const fontSize = Math.floor(16 * comboScale);

            ctx.font = `bold ${fontSize}px monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#ccccee';
            ctx.fillText(`${combo} COMBO`, 20, 50);

            // Multiplier next to combo
            if (multiplier > 1) {
                const comboTextWidth = ctx.measureText(`${combo} COMBO`).width;
                ctx.save();
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffcc00';
                ctx.font = `bold ${fontSize}px monospace`;
                ctx.fillText(`x${multiplier}`, 28 + comboTextWidth, 50);
                ctx.restore();
            }
        }

        // Song name — top-right
        ctx.fillStyle = '#8888aa';
        ctx.font = '13px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(songName, this.width - 20, 14);

        // Progress bar — below song name
        const progBarW = 180;
        const progBarH = 4;
        const progBarX = this.width - 20 - progBarW;
        const progBarY = 34;
        const progress = songDuration > 0 ? clamp(songTime / songDuration, 0, 1) : 0;

        ctx.fillStyle = '#222233';
        roundRect(ctx, progBarX, progBarY, progBarW, progBarH, 2);
        ctx.fill();
        ctx.fillStyle = '#6666aa';
        roundRect(ctx, progBarX, progBarY, progBarW * progress, progBarH, 2);
        ctx.fill();

        // Time label
        ctx.fillStyle = '#666688';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${formatTime(songTime)} / ${formatTime(songDuration)}`, this.width - 20, progBarY + 10);

        // Health bar — bottom-left
        const hpBarW = 160;
        const hpBarH = 10;
        const hpBarX = 20;
        const hpBarY = this.height - 30;
        const hpRatio = maxHealth > 0 ? clamp(health / maxHealth, 0, 1) : 0;

        ctx.fillStyle = '#1a1a2a';
        roundRect(ctx, hpBarX, hpBarY, hpBarW, hpBarH, 4);
        ctx.fill();

        // Color gradient based on health
        let hpColor;
        if (hpRatio > 0.6) hpColor = '#00cc44';
        else if (hpRatio > 0.3) hpColor = '#cccc00';
        else hpColor = '#cc2222';

        ctx.fillStyle = hpColor;
        roundRect(ctx, hpBarX, hpBarY, hpBarW * hpRatio, hpBarH, 4);
        ctx.fill();

        ctx.fillStyle = '#888899';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`HP ${Math.floor(health)}/${maxHealth}`, hpBarX, hpBarY - 6);
    }

    // ═══════════════════════════════════════════════════════════
    // JUDGEMENT TEXT
    // ═══════════════════════════════════════════════════════════

    renderJudgement(judgement, timer) {
        if (!judgement || timer <= 0) return;

        const ctx = this.ctx;
        const maxTimer = 0.8;
        const progress = clamp(timer / maxTimer, 0, 1);
        const alpha = progress;
        const floatOffset = (1 - progress) * 30;

        const centerX = LANE_LEFT + LANE_TOTAL_WIDTH / 2;
        const baseY = HIT_ZONE_Y - 60;

        let color, fontSize;
        switch (judgement) {
            case 'perfect':
                color = '#ffdd00'; fontSize = 28; break;
            case 'great':
                color = '#00ffcc'; fontSize = 22; break;
            case 'good':
                color = '#8888ff'; fontSize = 22; break;
            case 'miss':
                color = '#ff3344'; fontSize = 22; break;
            default:
                color = '#ffffff'; fontSize = 20; break;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = color;
        ctx.shadowBlur = judgement === 'perfect' ? 20 : 10;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(judgement.toUpperCase(), centerX, baseY - floatOffset);
        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // MAIN MENU
    // ═══════════════════════════════════════════════════════════

    renderMenu() {
        const ctx = this.ctx;
        this.time += 0.016;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(0.5, '#0a0a2a');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Floating particles
        for (let i = 0; i < 40; i++) {
            const speed = (i % 3 + 1) * 12;
            const x = (i * 131.7 + this.time * speed) % this.width;
            const y = (i * 79.3 + Math.sin(this.time * 0.8 + i) * 25) % this.height;
            const flicker = 0.12 + Math.sin(this.time * 2.5 + i * 1.7) * 0.08;
            ctx.globalAlpha = flicker;
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff';
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.sin(this.time + i) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Title — NEONPULSE
        ctx.save();
        const titleY = 200 + Math.sin(this.time * 0.7) * 6;

        // Magenta shadow layer
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NEONPULSE', this.width / 2, titleY);

        // Cyan overlay layer
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 1.5) * 0.15;
        ctx.fillText('NEONPULSE', this.width / 2 + 2, titleY + 2);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Subtitle
        ctx.fillStyle = '#665588';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CYBERPUNK RHYTHM', this.width / 2, titleY + 45);

        // "CLICK TO START" pulsing
        const startAlpha = 0.4 + Math.sin(this.time * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = startAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK TO START', this.width / 2, this.height - 120);
        ctx.restore();

        // Credits
        ctx.fillStyle = '#333355';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Made by Claude Opus 4.6', this.width / 2, this.height - 20);
    }

    // ═══════════════════════════════════════════════════════════
    // SONG SELECT
    // ═══════════════════════════════════════════════════════════

    renderSongSelect(songs, selectedIndex, selectedDifficulty, highScores) {
        const ctx = this.ctx;
        this.time += 0.016;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(0.5, '#0a0a2a');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Title
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SELECT TRACK', this.width / 2, 20);
        ctx.restore();

        // Song list
        const listX = 80;
        const listStartY = 80;
        const itemH = 64;
        const listW = 500;

        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const y = listStartY + i * (itemH + 8);
            const isSelected = i === selectedIndex;

            // Item background
            ctx.fillStyle = isSelected ? '#151530' : '#0c0c20';
            roundRect(ctx, listX, y, listW, itemH, 6);
            ctx.fill();

            // Selected glow border
            if (isSelected) {
                ctx.save();
                ctx.shadowColor = '#ff00ff';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                roundRect(ctx, listX, y, listW, itemH, 6);
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.strokeStyle = '#222244';
                ctx.lineWidth = 1;
                roundRect(ctx, listX, y, listW, itemH, 6);
                ctx.stroke();
            }

            // Song name
            ctx.fillStyle = isSelected ? '#ffffff' : '#888899';
            ctx.font = `bold 16px monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(song.name, listX + 16, y + 22);

            // Artist
            ctx.fillStyle = isSelected ? '#aaaacc' : '#555566';
            ctx.font = '12px monospace';
            ctx.fillText(song.artist || 'Unknown', listX + 16, y + 44);

            // BPM and duration on right side
            ctx.textAlign = 'right';
            ctx.fillStyle = isSelected ? '#9999bb' : '#444455';
            ctx.font = '12px monospace';
            ctx.fillText(`${song.bpm} BPM`, listX + listW - 16, y + 22);
            ctx.fillText(formatTime(song.duration || 0), listX + listW - 16, y + 44);
        }

        // Arrow indicators
        if (songs.length > 1) {
            ctx.fillStyle = '#666688';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            if (selectedIndex > 0) {
                ctx.fillText('\u25B2', listX + listW / 2, listStartY - 14);
            }
            if (selectedIndex < songs.length - 1) {
                const lastY = listStartY + (songs.length - 1) * (itemH + 8) + itemH;
                ctx.fillText('\u25BC', listX + listW / 2, lastY + 18);
            }
        }

        // Difficulty selector — right side
        const diffX = 640;
        const diffY = 100;
        ctx.fillStyle = '#888899';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DIFFICULTY', diffX + 100, diffY);

        const diffColors = { easy: '#00cc44', normal: '#cccc00', hard: '#cc2222' };
        for (let i = 0; i < DIFFICULTIES.length; i++) {
            const diff = DIFFICULTIES[i];
            const dy = diffY + 26 + i * 44;
            const isActive = diff === selectedDifficulty;
            const color = diffColors[diff];

            ctx.fillStyle = isActive ? '#151530' : '#0c0c20';
            roundRect(ctx, diffX, dy, 200, 34, 6);
            ctx.fill();

            if (isActive) {
                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                roundRect(ctx, diffX, dy, 200, 34, 6);
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.strokeStyle = '#222244';
                ctx.lineWidth = 1;
                roundRect(ctx, diffX, dy, 200, 34, 6);
                ctx.stroke();
            }

            ctx.fillStyle = isActive ? color : '#555566';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(diff.toUpperCase(), diffX + 100, dy + 17);
        }

        // High score display
        const hsY = diffY + 26 + DIFFICULTIES.length * 44 + 20;
        const selectedSong = songs[selectedIndex];
        const key = selectedSong ? `${selectedSong.id}_${selectedDifficulty}` : null;
        const hs = key && highScores ? highScores[key] : null;

        if (hs) {
            ctx.fillStyle = '#666688';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('HIGH SCORE', diffX + 100, hsY);
            ctx.fillStyle = '#ffdd00';
            ctx.font = 'bold 20px monospace';
            ctx.fillText(formatNumber(hs.score || 0), diffX + 100, hsY + 24);
            if (hs.grade) {
                ctx.fillStyle = hs.grade.color || '#ffffff';
                ctx.font = 'bold 16px monospace';
                ctx.fillText(hs.grade.grade || '', diffX + 100, hsY + 48);
            }
        } else {
            ctx.fillStyle = '#444455';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO SCORE YET', diffX + 100, hsY);
        }

        // Controls hint at bottom
        ctx.fillStyle = '#444466';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER to start  /  ESC to go back', this.width / 2, this.height - 24);
    }

    // ═══════════════════════════════════════════════════════════
    // PAUSE OVERLAY
    // ═══════════════════════════════════════════════════════════

    renderPauseOverlay() {
        const ctx = this.ctx;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 5, 20, 0.82)';
        ctx.fillRect(0, 0, this.width, this.height);

        // PAUSED text
        ctx.save();
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 40);
        ctx.restore();

        ctx.fillStyle = '#8888aa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 20);
        ctx.fillText('Press Q to quit', this.width / 2, this.height / 2 + 50);
    }

    // ═══════════════════════════════════════════════════════════
    // RESULTS SCREEN
    // ═══════════════════════════════════════════════════════════

    renderResults(songName, difficulty, score, maxCombo, counts, grade, isNewHighScore) {
        const ctx = this.ctx;
        this.time += 0.016;

        // Background with subtle animation
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(0.5, '#0c0c28');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Subtle floating particles
        for (let i = 0; i < 20; i++) {
            const x = (i * 113.7 + this.time * 8) % this.width;
            const y = (i * 67.3 + Math.sin(this.time + i) * 20) % this.height;
            ctx.globalAlpha = 0.08 + Math.sin(this.time * 2 + i) * 0.04;
            ctx.fillStyle = grade.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // RESULTS header
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RESULTS', this.width / 2, 50);
        ctx.restore();

        // Song name and difficulty
        ctx.fillStyle = '#8888aa';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${songName}  [${difficulty.toUpperCase()}]`, this.width / 2, 85);

        // Grade letter — large centered
        ctx.save();
        ctx.shadowColor = grade.color || '#ffffff';
        ctx.shadowBlur = 35;
        ctx.fillStyle = grade.color || '#ffffff';
        ctx.font = 'bold 100px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(grade.grade, this.width / 2, 185);
        ctx.restore();

        // Score
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(formatNumber(score), this.width / 2, 270);
        ctx.restore();

        // Note breakdown
        const breakdownY = 320;
        const lineH = 28;
        const labels = [
            { label: 'PERFECT', count: counts.perfect, color: '#ffdd00' },
            { label: 'GREAT',   count: counts.great,   color: '#00ffcc' },
            { label: 'GOOD',    count: counts.good,     color: '#8888ff' },
            { label: 'MISS',    count: counts.miss,     color: '#ff3344' }
        ];

        for (let i = 0; i < labels.length; i++) {
            const item = labels[i];
            const y = breakdownY + i * lineH;
            ctx.fillStyle = item.color;
            ctx.font = '14px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(item.label, this.width / 2 - 10, y);
            ctx.textAlign = 'left';
            ctx.fillText(String(item.count), this.width / 2 + 10, y);
        }

        // Max combo
        const comboY = breakdownY + labels.length * lineH + 12;
        ctx.fillStyle = '#aaaacc';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Max Combo: ${maxCombo}`, this.width / 2, comboY);

        // NEW HIGH SCORE flash
        if (isNewHighScore) {
            const flashAlpha = 0.6 + Math.sin(this.time * 6) * 0.4;
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NEW HIGH SCORE!', this.width / 2, comboY + 40);
            ctx.restore();
        }

        // Continue prompt
        ctx.fillStyle = '#444466';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER to continue', this.width / 2, this.height - 30);
    }

    // ═══════════════════════════════════════════════════════════
    // SCANLINES
    // ═══════════════════════════════════════════════════════════

    renderScanlines() {
        const ctx = this.ctx;
        this.scanlineOffset = (this.scanlineOffset + 0.5) % 3;

        ctx.fillStyle = '#00000015';
        for (let y = this.scanlineOffset; y < this.height; y += 3) {
            ctx.fillRect(0, y, this.width, 1);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // COMBO FIRE
    // ═══════════════════════════════════════════════════════════

    renderComboFire(combo, laneX) {
        if (combo < 30) return;

        const ctx = this.ctx;
        const intensity = clamp((combo - 30) / 60, 0, 1);

        // Tier colors
        let baseColor, glowColor;
        if (combo >= 90) {
            baseColor = '#ffffff';
            glowColor = '#ffdd00';
        } else if (combo >= 60) {
            baseColor = '#ffdd00';
            glowColor = '#ff6600';
        } else {
            baseColor = '#ff6600';
            glowColor = '#ff2200';
        }

        ctx.save();
        const particleCount = 6 + Math.floor(intensity * 10);

        // Left edge fire
        for (let i = 0; i < particleCount; i++) {
            const px = LANE_LEFT + Math.sin(this.time * 8 + i * 1.3) * 6;
            const py = HIT_ZONE_Y - Math.abs(Math.sin(this.time * 5 + i * 0.9)) * (20 + intensity * 30) - i * 3;
            const size = 2 + intensity * 2 + Math.sin(this.time * 10 + i) * 1;
            const alpha = 0.3 + intensity * 0.4 - (i / particleCount) * 0.3;

            ctx.globalAlpha = clamp(alpha, 0, 0.9);
            ctx.fillStyle = i % 2 === 0 ? baseColor : glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Right edge fire
        for (let i = 0; i < particleCount; i++) {
            const px = LANE_LEFT + LANE_TOTAL_WIDTH + Math.sin(this.time * 8 + i * 1.5 + 3) * 6;
            const py = HIT_ZONE_Y - Math.abs(Math.sin(this.time * 5 + i * 1.1 + 2)) * (20 + intensity * 30) - i * 3;
            const size = 2 + intensity * 2 + Math.sin(this.time * 10 + i + 1) * 1;
            const alpha = 0.3 + intensity * 0.4 - (i / particleCount) * 0.3;

            ctx.globalAlpha = clamp(alpha, 0, 0.9);
            ctx.fillStyle = i % 2 === 0 ? baseColor : glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function roundRect(ctx, x, y, w, h, r) {
    if (w < 0) w = 0;
    if (h < 0) h = 0;
    r = Math.min(r, w / 2, h / 2);
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
