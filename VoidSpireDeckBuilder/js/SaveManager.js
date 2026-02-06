const SAVE_KEY = 'voidspire_save';

export class SaveManager {
    static save(game) {
        const state = {
            act: game.act,
            player: game.player.getState(),
            map: game.map.getState(),
            usedEvents: game.usedEvents || [],
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }

    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(SAVE_KEY);
    }
}
