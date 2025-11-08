// SyntaxCity - Save/Load System

export class SaveManager {
    constructor() {
        this.storageKey = 'syntaxcity_save';
    }

    saveGame(game) {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            currentLevelId: game.currentLevel ? game.currentLevel.id : 1,
            unlockedLevels: game.unlockedLevels || [1],
            researchPoints: game.researchPoints || 0,
            permanentUpgrades: game.permanentUpgrades || {},
            settings: {
                showPaths: game.showPaths,
                showCombos: game.showCombos,
                showRanges: game.showRanges
            },
            stats: {
                totalKills: game.totalKills || 0,
                totalWaves: game.totalWavesCompleted || 0,
                totalDamage: game.totalDamageDealt || 0
            }
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem(this.storageKey);
            if (!saveData) return null;

            return JSON.parse(saveData);
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    deleteSave() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (e) {
            console.error('Failed to delete save:', e);
            return false;
        }
    }

    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    exportSave() {
        const saveData = this.loadGame();
        if (!saveData) return null;

        const dataStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    importSave(jsonString) {
        try {
            const saveData = JSON.parse(jsonString);
            // Validate save data
            if (!saveData.version || !saveData.currentLevelId) {
                throw new Error('Invalid save data');
            }

            localStorage.setItem(this.storageKey, jsonString);
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
}
