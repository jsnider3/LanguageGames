/**
 * SaveSystem
 * Handles local persistence of progress and scores.
 */
export class SaveSystem {
    constructor() {
        this.STORAGE_KEY = 'neon_logic_save_v1';
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn("Save load failed", e);
        }
        return {
            completedLevels: [], // Array of level IDs
            scores: {} // { levelId: { silicon, cycles } }
        };
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn("Save write failed", e);
        }
    }

    markLevelComplete(levelId, silicon, cycles) {
        if (!this.data.completedLevels.includes(levelId)) {
            this.data.completedLevels.push(levelId);
        }

        // Update High Score (Lower is better)
        if (!this.data.scores[levelId]) {
            this.data.scores[levelId] = { silicon, cycles };
        } else {
            const best = this.data.scores[levelId];
            // Naive simple score: sum of both
            // If new sum is lower, replace
            if ((silicon + cycles) < (best.silicon + best.cycles)) {
                this.data.scores[levelId] = { silicon, cycles };
            }
        }
        this.save();
    }

    isLevelUnlocked(levelId) {
        if (levelId === 0) return true;
        return this.data.completedLevels.includes(levelId - 1);
    }
}
