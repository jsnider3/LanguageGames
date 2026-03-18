import { STATES, LANE_KEYS, DIFFICULTIES, WIDTH, HEIGHT } from './Constants.js';
import { Renderer } from './Renderer.js';
import { AudioEngine } from './AudioEngine.js';
import { NoteManager } from './NoteManager.js';
import { InputManager } from './InputManager.js';
import { ScoreManager } from './ScoreManager.js';
import { Effects } from './Effects.js';
import { SaveManager } from './SaveManager.js';
import { SONGS } from './SongData.js';

// ═══════════════════════════════════════════════════════════
// GAME - Central orchestrator and state machine for NeonPulse
// ═══════════════════════════════════════════════════════════

export class Game {
    constructor(canvas) {
        this.canvas = canvas;

        // Core systems
        this.renderer = new Renderer(canvas);
        this.audio = new AudioEngine();
        this.noteManager = new NoteManager();
        this.input = new InputManager(canvas);
        this.score = new ScoreManager();
        this.effects = new Effects();
        this.save = new SaveManager();

        // State
        this.state = STATES.MENU;
        this.songs = SONGS;
        this.selectedSongIndex = 0;
        this.selectedDifficulty = 1; // 0=easy, 1=normal, 2=hard
        this.currentSong = null;

        // Judgement display
        this.judgementDisplay = { text: '', color: '', timer: 0 };

        // Audio / loading flags
        this.audioInitialized = false;
        this.songLoading = false;

        // Results data stored when transitioning to RESULTS
        this.resultsData = null;

        // Track song time for paused render
        this.lastSongTime = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════

    update(dt) {
        switch (this.state) {

            // ───────────────────────────────────────────────────
            // MENU
            // ───────────────────────────────────────────────────
            case STATES.MENU:
                if (this.input.clickedThisFrame || this.input.enterPressed) {
                    if (!this.audioInitialized) {
                        this.audio.init().then(() => {
                            this.audioInitialized = true;
                        });
                    }
                    this.state = STATES.SONG_SELECT;
                }
                break;

            // ───────────────────────────────────────────────────
            // SONG SELECT
            // ───────────────────────────────────────────────────
            case STATES.SONG_SELECT:
                if (this.input.arrowUpPressed) {
                    this.selectedSongIndex--;
                    if (this.selectedSongIndex < 0) {
                        this.selectedSongIndex = this.songs.length - 1;
                    }
                }
                if (this.input.arrowDownPressed) {
                    this.selectedSongIndex++;
                    if (this.selectedSongIndex >= this.songs.length) {
                        this.selectedSongIndex = 0;
                    }
                }
                if (this.input.arrowLeftPressed) {
                    this.selectedDifficulty = Math.max(0, this.selectedDifficulty - 1);
                }
                if (this.input.arrowRightPressed) {
                    this.selectedDifficulty = Math.min(2, this.selectedDifficulty + 1);
                }
                if (this.input.enterPressed && !this.songLoading) {
                    this.startSong();
                }
                if (this.input.escapePressed) {
                    this.state = STATES.MENU;
                }
                break;

            // ───────────────────────────────────────────────────
            // PLAYING
            // ───────────────────────────────────────────────────
            case STATES.PLAYING:
                this.updatePlaying(dt);
                break;

            // ───────────────────────────────────────────────────
            // PAUSED
            // ───────────────────────────────────────────────────
            case STATES.PAUSED:
                if (this.input.escapePressed) {
                    this.audio.resume();
                    this.state = STATES.PLAYING;
                }
                if (this.input.qPressed) {
                    this.audio.stop();
                    this.state = STATES.SONG_SELECT;
                }
                break;

            // ───────────────────────────────────────────────────
            // RESULTS
            // ───────────────────────────────────────────────────
            case STATES.RESULTS:
                if (this.input.enterPressed || this.input.clickedThisFrame) {
                    this.state = STATES.SONG_SELECT;
                }
                break;
        }

        // Always consume frame inputs at the end
        this.input.consumeFrameInputs();
    }

    // ═══════════════════════════════════════════════════════════
    // PLAYING STATE UPDATE
    // ═══════════════════════════════════════════════════════════

    updatePlaying(dt) {
        const songTime = this.audio.getSongTime();
        this.lastSongTime = songTime;

        // Update note manager — returns missed notes
        const { missedNotes } = this.noteManager.update(songTime);
        for (const note of missedNotes) {
            this.score.registerMiss();
            this.effects.spawnMissEffect(note.lane);
            this.effects.addJudgement('MISS', '#ff3344');
            this.effects.shake(3);
            this.audio.playHitSound('miss');
        }

        // Check lane tap inputs
        for (let i = 0; i < LANE_KEYS.length; i++) {
            if (this.input.laneJustPressed[i]) {
                const result = this.noteManager.checkHit(i, songTime);

                if (result.hit) {
                    this.score.registerHit(result.judgement);
                    this.effects.spawnHitEffect(i, result.judgement);
                    this.showJudgement(result.judgement);
                    this.audio.playHitSound(result.judgement);

                    if (result.judgement === 'perfect') {
                        this.effects.shake(2);
                    }
                }
            }
        }

        // Check hold releases
        for (let i = 0; i < LANE_KEYS.length; i++) {
            if (this.input.laneJustReleased[i]) {
                const result = this.noteManager.checkHoldRelease(i, songTime);

                if (result && result.dropped) {
                    this.score.registerMiss();
                    this.effects.spawnMissEffect(i);
                    this.showJudgement('miss');
                }
            }
        }

        // Update judgement display timer
        if (this.judgementDisplay.timer > 0) {
            this.judgementDisplay.timer -= dt;
        }

        // Update effects (particles, judgements, shake)
        this.effects.update(dt);

        // Check end conditions
        if (this.audio.isFinished() || this.score.isDead()) {
            this.endSong();
            return;
        }

        // Pause
        if (this.input.escapePressed) {
            this.audio.pause();
            this.state = STATES.PAUSED;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SONG LIFECYCLE
    // ═══════════════════════════════════════════════════════════

    async startSong() {
        this.songLoading = true;

        this.currentSong = this.songs[this.selectedSongIndex];
        const difficulty = DIFFICULTIES[this.selectedDifficulty];

        // Initialize audio system on first user interaction
        await this.audio.init();
        this.audioInitialized = true;

        // Pre-render the song audio
        await this.audio.loadSong(this.currentSong);

        // Load the chart for the selected difficulty
        this.noteManager.loadChart(
            this.currentSong.charts[difficulty],
            this.currentSong.bpm,
            this.currentSong.duration
        );

        // Reset scoring
        this.score.reset(this.noteManager.getTotalNotes());

        // Clear visual state
        this.effects.clear();
        this.judgementDisplay = { text: '', color: '', timer: 0 };
        this.lastSongTime = 0;

        // Start playback
        await this.audio.play();
        this.state = STATES.PLAYING;
        this.songLoading = false;
    }

    endSong() {
        this.audio.stop();

        const difficulty = DIFFICULTIES[this.selectedDifficulty];
        const grade = this.score.getGrade();

        // Check and save high score
        const existing = this.save.getHighScore(this.currentSong.id, difficulty);
        const isNewHighScore = !existing || this.score.score > existing.score;

        if (isNewHighScore) {
            this.save.saveHighScore(
                this.currentSong.id,
                difficulty,
                this.score.score,
                { grade: grade.grade, color: grade.color }
            );
        }

        // Store results data for the results screen
        this.resultsData = {
            songName: this.currentSong.name,
            difficulty,
            score: this.score.score,
            maxCombo: this.score.maxCombo,
            counts: { ...this.score.counts },
            grade,
            isNewHighScore
        };

        this.state = STATES.RESULTS;
    }

    // ═══════════════════════════════════════════════════════════
    // JUDGEMENT DISPLAY
    // ═══════════════════════════════════════════════════════════

    showJudgement(judgement) {
        let text, color;

        switch (judgement) {
            case 'perfect':
                text = 'PERFECT';
                color = '#ffdd00';
                break;
            case 'great':
                text = 'GREAT';
                color = '#00ffcc';
                break;
            case 'good':
                text = 'GOOD';
                color = '#8888ff';
                break;
            case 'miss':
                text = 'MISS';
                color = '#ff3344';
                break;
            default:
                text = judgement.toUpperCase();
                color = '#ffffff';
                break;
        }

        this.judgementDisplay = { text, color, timer: 0.6 };
        this.effects.addJudgement(text, color);
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    render() {
        this.renderer.clear();
        const ctx = this.renderer.ctx;

        // Apply screen shake offset
        const shake = this.effects.getShakeOffset();
        ctx.save();
        if (shake.x !== 0 || shake.y !== 0) {
            ctx.translate(shake.x, shake.y);
        }

        switch (this.state) {

            // ───────────────────────────────────────────────────
            // MENU
            // ───────────────────────────────────────────────────
            case STATES.MENU:
                this.renderer.renderMenu();
                break;

            // ───────────────────────────────────────────────────
            // SONG SELECT
            // ───────────────────────────────────────────────────
            case STATES.SONG_SELECT:
                this.renderSongSelect(ctx);
                break;

            // ───────────────────────────────────────────────────
            // PLAYING
            // ───────────────────────────────────────────────────
            case STATES.PLAYING:
                this.renderPlaying(ctx);
                break;

            // ───────────────────────────────────────────────────
            // PAUSED
            // ───────────────────────────────────────────────────
            case STATES.PAUSED:
                this.renderPaused(ctx);
                break;

            // ───────────────────────────────────────────────────
            // RESULTS
            // ───────────────────────────────────────────────────
            case STATES.RESULTS:
                this.renderResults(ctx);
                break;
        }

        // Undo shake transform
        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════

    renderSongSelect(ctx) {
        // Gather high scores for display
        const highScores = this.save.getAllHighScores();
        const selectedDiff = DIFFICULTIES[this.selectedDifficulty];

        this.renderer.renderSongSelect(
            this.songs,
            this.selectedSongIndex,
            selectedDiff,
            highScores
        );

        // Loading overlay
        if (this.songLoading) {
            ctx.fillStyle = 'rgba(5, 5, 20, 0.85)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.save();
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LOADING...', WIDTH / 2, HEIGHT / 2);
            ctx.restore();
        }
    }

    renderPlaying(ctx) {
        const songTime = this.audio.getSongTime();

        // Background with beat pulse
        this.renderer.renderBackground(songTime, this.currentSong.bpm);

        // Lane tracks with press highlights
        this.renderer.renderLanes(this.input.lanePressed);

        // Falling notes
        const visibleNotes = this.noteManager.getVisibleNotes(songTime);
        this.renderer.renderNotes(visibleNotes, songTime);

        // Hit zone with beat-synced glow
        this.renderer.renderHitZone(songTime, this.currentSong.bpm);

        // Particles from hit/miss effects
        this.renderer.renderParticles(this.effects.particles);

        // Combo fire along lane edges
        this.renderer.renderComboFire(this.score.combo, 0);

        // HUD: score, combo, multiplier, health, progress, song name
        this.renderer.renderHUD(
            this.score.score,
            this.score.combo,
            this.score.multiplier,
            this.score.health,
            100,
            songTime,
            this.currentSong.duration,
            this.currentSong.name
        );

        // Judgement text floaters
        for (const j of this.effects.judgements) {
            ctx.save();
            ctx.globalAlpha = j.alpha;
            ctx.shadowColor = j.color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = j.color;
            ctx.font = `bold ${Math.floor(22 * j.scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(j.text, WIDTH / 2, j.y);
            ctx.restore();
        }

        // CRT scanlines
        this.renderer.renderScanlines();
    }

    renderPaused(ctx) {
        // Render the playing state frozen at the last known song time
        this.renderer.renderBackground(this.lastSongTime, this.currentSong.bpm);
        this.renderer.renderLanes(this.input.lanePressed);

        const visibleNotes = this.noteManager.getVisibleNotes(this.lastSongTime);
        this.renderer.renderNotes(visibleNotes, this.lastSongTime);
        this.renderer.renderHitZone(this.lastSongTime, this.currentSong.bpm);
        this.renderer.renderParticles(this.effects.particles);
        this.renderer.renderComboFire(this.score.combo, 0);
        this.renderer.renderHUD(
            this.score.score,
            this.score.combo,
            this.score.multiplier,
            this.score.health,
            100,
            this.lastSongTime,
            this.currentSong.duration,
            this.currentSong.name
        );
        this.renderer.renderScanlines();

        // Pause overlay on top
        this.renderer.renderPauseOverlay();
    }

    renderResults(ctx) {
        const d = this.resultsData;

        this.renderer.renderResults(
            d.songName,
            d.difficulty,
            d.score,
            d.maxCombo,
            d.counts,
            d.grade,
            d.isNewHighScore
        );
    }
}
