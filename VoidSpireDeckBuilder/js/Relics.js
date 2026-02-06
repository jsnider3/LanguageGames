import { RELIC_DEFS, RELIC_RARITIES } from './Constants.js';
import { pickRandom, deepClone } from './Utils.js';

export function getRelicDef(relicId) {
    return RELIC_DEFS[relicId] || null;
}

export function createRelic(relicId) {
    const def = RELIC_DEFS[relicId];
    if (!def) return null;
    return deepClone(def);
}

export function getStarterRelic() {
    return createRelic('burning_blood');
}

export function getRandomRelic(ownedRelicIds, rarity = null) {
    const available = Object.values(RELIC_DEFS).filter(r => {
        if (r.rarity === RELIC_RARITIES.STARTER) return false;
        if (ownedRelicIds.includes(r.id)) return false;
        if (rarity && r.rarity !== rarity) return false;
        return true;
    });
    if (available.length === 0) return null;
    return deepClone(pickRandom(available));
}

export function getRandomRelicForShop(ownedRelicIds) {
    // Weight toward common/uncommon
    const common = Object.values(RELIC_DEFS).filter(r => r.rarity === RELIC_RARITIES.COMMON && !ownedRelicIds.includes(r.id));
    const uncommon = Object.values(RELIC_DEFS).filter(r => r.rarity === RELIC_RARITIES.UNCOMMON && !ownedRelicIds.includes(r.id));
    const rare = Object.values(RELIC_DEFS).filter(r => r.rarity === RELIC_RARITIES.RARE && !ownedRelicIds.includes(r.id));

    const pool = [];
    for (const r of common) { pool.push(r); pool.push(r); pool.push(r); }
    for (const r of uncommon) { pool.push(r); pool.push(r); }
    for (const r of rare) { pool.push(r); }

    if (pool.length === 0) return null;
    return deepClone(pickRandom(pool));
}
