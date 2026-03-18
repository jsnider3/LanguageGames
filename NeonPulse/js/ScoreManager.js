import { SCORE_VALUES, COMBO_THRESHOLDS, HEALTH, GRADES } from './Constants.js';

// ═══════════════════════════════════════════════════════════
// SCORE MANAGER - Score, combo, health, and grading
// ═══════════════════════════════════════════════════════════

export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.health = HEALTH.MAX;
        this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
        this.totalNotes = 0;
    }

    // ───────────────────────────────────────────────────────
    // RESET
    // ───────────────────────────────────────────────────────

    reset(totalNotes) {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.health = HEALTH.MAX;
        this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
        this.totalNotes = totalNotes;
    }

    // ───────────────────────────────────────────────────────
    // REGISTER HIT
    // ───────────────────────────────────────────────────────

    registerHit(judgement) {
        // Increment hit count
        this.counts[judgement]++;

        // Add score with multiplier
        this.score += SCORE_VALUES[judgement] * this.multiplier;

        // Update combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Update multiplier from combo thresholds (sorted highest first)
        for (let i = 0; i < COMBO_THRESHOLDS.length; i++) {
            if (this.combo >= COMBO_THRESHOLDS[i].combo) {
                this.multiplier = COMBO_THRESHOLDS[i].multiplier;
                break;
            }
        }

        // Recover health
        switch (judgement) {
            case 'perfect':
                this.health = Math.min(this.health + HEALTH.PERFECT_RECOVER, HEALTH.MAX);
                break;
            case 'great':
                this.health = Math.min(this.health + HEALTH.GREAT_RECOVER, HEALTH.MAX);
                break;
            case 'good':
                this.health = Math.min(this.health + HEALTH.GOOD_RECOVER, HEALTH.MAX);
                break;
        }
    }

    // ───────────────────────────────────────────────────────
    // REGISTER MISS
    // ───────────────────────────────────────────────────────

    registerMiss() {
        this.counts.miss++;
        this.combo = 0;
        this.multiplier = 1;
        this.health = Math.max(this.health - HEALTH.MISS_PENALTY, 0);
    }

    // ───────────────────────────────────────────────────────
    // QUERIES
    // ───────────────────────────────────────────────────────

    isDead() {
        return this.health <= 0;
    }

    getAccuracy() {
        if (this.totalNotes <= 0) return 0;
        const weighted =
            this.counts.perfect * 1.0 +
            this.counts.great * 0.7 +
            this.counts.good * 0.4;
        return weighted / this.totalNotes;
    }

    getGrade() {
        const accuracy = this.getAccuracy();
        for (let i = 0; i < GRADES.length; i++) {
            if (accuracy >= GRADES[i].threshold) {
                return GRADES[i];
            }
        }
        return GRADES[GRADES.length - 1];
    }

    getMaxPossibleScore() {
        return this.totalNotes * SCORE_VALUES.perfect * 8;
    }

    getScorePercentage() {
        const max = this.getMaxPossibleScore();
        if (max <= 0) return 0;
        return this.score / max;
    }
}
