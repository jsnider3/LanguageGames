// ═══════════════════════════════════════════════════════════
// SAVE MANAGER - High scores via localStorage
// ═══════════════════════════════════════════════════════════

const STORAGE_PREFIX = 'neonpulse_';

export class SaveManager {

    // ───────────────────────────────────────────────────────
    // SAVE HIGH SCORE
    // ───────────────────────────────────────────────────────

    saveHighScore(songId, difficulty, score, grade) {
        try {
            const key = `${STORAGE_PREFIX}${songId}_${difficulty}`;
            const existing = this.getHighScore(songId, difficulty);

            // Only save if the new score is higher
            if (existing && existing.score >= score) {
                return false;
            }

            const data = { score, grade, date: Date.now() };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('SaveManager: Failed to save high score', e);
            return false;
        }
    }

    // ───────────────────────────────────────────────────────
    // GET HIGH SCORE
    // ───────────────────────────────────────────────────────

    getHighScore(songId, difficulty) {
        try {
            const key = `${STORAGE_PREFIX}${songId}_${difficulty}`;
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('SaveManager: Failed to read high score', e);
            return null;
        }
    }

    // ───────────────────────────────────────────────────────
    // GET ALL HIGH SCORES
    // ───────────────────────────────────────────────────────

    getAllHighScores() {
        const scores = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    const id = key.slice(STORAGE_PREFIX.length);
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        scores[id] = JSON.parse(raw);
                    }
                }
            }
        } catch (e) {
            console.warn('SaveManager: Failed to read all high scores', e);
        }
        return scores;
    }

    // ───────────────────────────────────────────────────────
    // CLEAR ALL
    // ───────────────────────────────────────────────────────

    clearAll() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            for (const key of keysToRemove) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn('SaveManager: Failed to clear data', e);
        }
    }
}
