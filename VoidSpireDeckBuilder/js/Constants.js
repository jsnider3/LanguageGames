// ═══════════════════════════════════════════════════════════════
// BALANCE CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const PLAYER_MAX_HP = 80;
export const PLAYER_START_ENERGY = 3;
export const HAND_SIZE = 5;
export const MAP_FLOORS = 15;
export const ACTS = 3;
export const SHOP_CARD_COUNT = 6;
export const SHOP_RELIC_COUNT = 3;
export const SHOP_REMOVE_COST = 75;
export const REST_HEAL_PERCENT = 0.3;
export const CARD_REWARD_COUNT = 3;
export const GOLD_PER_COMBAT = [15, 25];
export const GOLD_PER_ELITE = [30, 45];
export const ELITE_RELIC_CHANCE = 1.0;
export const VULNERABLE_MULT = 1.5;
export const WEAK_MULT = 0.75;
export const POTION_SLOTS = 3;

// ═══════════════════════════════════════════════════════════════
// CARD DATA
// ═══════════════════════════════════════════════════════════════

export const CARD_TYPES = { ATTACK: 'Attack', SKILL: 'Skill', POWER: 'Power', STATUS: 'Status', CURSE: 'Curse' };
export const CARD_RARITIES = { STARTER: 'Starter', COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare' };

export const CARD_DEFS = {
    // Starters
    strike: {
        id: 'strike', name: 'Strike', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.STARTER,
        cost: 1, description: 'Deal 6 damage.',
        effects: [{ type: 'damage', value: 6, target: 'single' }]
    },
    defend: {
        id: 'defend', name: 'Defend', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.STARTER,
        cost: 1, description: 'Gain 5 Block.',
        effects: [{ type: 'block', value: 5 }]
    },

    // Commons - Attacks
    slash: {
        id: 'slash', name: 'Slash', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Deal 8 damage.',
        effects: [{ type: 'damage', value: 8, target: 'single' }]
    },
    bash: {
        id: 'bash', name: 'Bash', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 2, description: 'Deal 8 damage. Apply 2 Vulnerable.',
        effects: [{ type: 'damage', value: 8, target: 'single' }, { type: 'debuff', status: 'vulnerable', value: 2, target: 'single' }]
    },
    twin_strike: {
        id: 'twin_strike', name: 'Twin Strike', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Deal 5 damage twice.',
        effects: [{ type: 'damage', value: 5, target: 'single' }, { type: 'damage', value: 5, target: 'single' }]
    },
    pommel_strike: {
        id: 'pommel_strike', name: 'Pommel Strike', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Deal 9 damage. Draw 1 card.',
        effects: [{ type: 'damage', value: 9, target: 'single' }, { type: 'draw', value: 1 }]
    },
    iron_wave: {
        id: 'iron_wave', name: 'Iron Wave', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Gain 5 Block. Deal 5 damage.',
        effects: [{ type: 'block', value: 5 }, { type: 'damage', value: 5, target: 'single' }]
    },
    anger: {
        id: 'anger', name: 'Anger', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 0, description: 'Deal 6 damage. Add a copy of this card to your discard pile.',
        effects: [{ type: 'damage', value: 6, target: 'single' }, { type: 'addCopy' }]
    },
    cleave: {
        id: 'cleave', name: 'Cleave', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Deal 8 damage to ALL enemies.',
        effects: [{ type: 'damage', value: 8, target: 'all' }]
    },
    headbutt: {
        id: 'headbutt', name: 'Headbutt', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Deal 9 damage. Put a card from your discard pile on top of your draw pile.',
        effects: [{ type: 'damage', value: 9, target: 'single' }, { type: 'putOnDraw', value: 1 }]
    },

    // Commons - Skills
    shroud: {
        id: 'shroud', name: 'Shroud', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Gain 8 Block.',
        effects: [{ type: 'block', value: 8 }]
    },
    true_grit: {
        id: 'true_grit', name: 'True Grit', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Gain 7 Block. Exhaust a random card from your hand.',
        effects: [{ type: 'block', value: 7 }, { type: 'exhaustRandom', value: 1 }]
    },
    havoc: {
        id: 'havoc', name: 'Havoc', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Play the top card of your draw pile and Exhaust it.',
        effects: [{ type: 'playTopDraw' }]
    },
    warcry: {
        id: 'warcry', name: 'Warcry', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 0, description: 'Draw 2 cards. Put a card from your hand on top of your draw pile. Exhaust.',
        effects: [{ type: 'draw', value: 2 }, { type: 'putBack', value: 1 }],
        exhaust: true
    },

    // Commons - Powers
    flex: {
        id: 'flex', name: 'Flex', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 0, description: 'Gain 2 Strength. At end of turn lose 2 Strength.',
        effects: [{ type: 'buff', status: 'strength', value: 2 }, { type: 'tempBuff', status: 'strength', value: -2 }]
    },
    shrug_it_off: {
        id: 'shrug_it_off', name: 'Shrug It Off', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.COMMON,
        cost: 1, description: 'Gain 8 Block. Draw 1 card.',
        effects: [{ type: 'block', value: 8 }, { type: 'draw', value: 1 }]
    },

    // Uncommons - Attacks
    carnage: {
        id: 'carnage', name: 'Carnage', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.UNCOMMON,
        cost: 2, description: 'Deal 20 damage. Ethereal.',
        effects: [{ type: 'damage', value: 20, target: 'single' }],
        ethereal: true
    },
    uppercut: {
        id: 'uppercut', name: 'Uppercut', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.UNCOMMON,
        cost: 2, description: 'Deal 13 damage. Apply 1 Weak. Apply 1 Vulnerable.',
        effects: [
            { type: 'damage', value: 13, target: 'single' },
            { type: 'debuff', status: 'weak', value: 1, target: 'single' },
            { type: 'debuff', status: 'vulnerable', value: 1, target: 'single' }
        ]
    },
    rampage: {
        id: 'rampage', name: 'Rampage', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Deal 8 damage. Increase this card\'s damage by 5 each time it is played.',
        effects: [{ type: 'damage', value: 8, target: 'single' }],
        rampUp: 5
    },
    clothesline: {
        id: 'clothesline', name: 'Clothesline', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.UNCOMMON,
        cost: 2, description: 'Deal 12 damage. Apply 2 Weak.',
        effects: [{ type: 'damage', value: 12, target: 'single' }, { type: 'debuff', status: 'weak', value: 2, target: 'single' }]
    },
    hemo_strike: {
        id: 'hemo_strike', name: 'Hemo Strike', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.UNCOMMON,
        cost: 2, description: 'Lose 3 HP. Deal 18 damage.',
        effects: [{ type: 'loseHP', value: 3 }, { type: 'damage', value: 18, target: 'single' }]
    },

    // Uncommons - Skills
    battle_trance: {
        id: 'battle_trance', name: 'Battle Trance', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.UNCOMMON,
        cost: 0, description: 'Draw 3 cards. You cannot draw additional cards this turn.',
        effects: [{ type: 'draw', value: 3 }, { type: 'noMoreDraw' }]
    },
    ghostly_armor: {
        id: 'ghostly_armor', name: 'Ghostly Armor', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Gain 10 Block. Ethereal.',
        effects: [{ type: 'block', value: 10 }],
        ethereal: true
    },
    infernal_blade: {
        id: 'infernal_blade', name: 'Infernal Blade', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Add a random Attack to your hand. It costs 0 this turn. Exhaust.',
        effects: [{ type: 'addRandomAttack' }],
        exhaust: true
    },
    sentinel: {
        id: 'sentinel', name: 'Sentinel', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Gain 5 Block. If this card is Exhausted, gain 2 energy.',
        effects: [{ type: 'block', value: 5 }],
        onExhaust: [{ type: 'gainEnergy', value: 2 }]
    },
    second_wind: {
        id: 'second_wind', name: 'Second Wind', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Exhaust all non-Attack cards in your hand. Gain 5 Block for each card Exhausted.',
        effects: [{ type: 'secondWind', blockPer: 5 }]
    },

    // Uncommons - Powers
    inflame: {
        id: 'inflame', name: 'Inflame', type: CARD_TYPES.POWER, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'Gain 2 Strength.',
        effects: [{ type: 'buff', status: 'strength', value: 2 }]
    },
    metallicize: {
        id: 'metallicize', name: 'Metallicize', type: CARD_TYPES.POWER, rarity: CARD_RARITIES.UNCOMMON,
        cost: 1, description: 'At the end of your turn, gain 3 Block.',
        effects: [{ type: 'registerPower', power: 'metallicize', value: 3 }]
    },

    // Rares - Attacks
    bludgeon: {
        id: 'bludgeon', name: 'Bludgeon', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.RARE,
        cost: 3, description: 'Deal 32 damage.',
        effects: [{ type: 'damage', value: 32, target: 'single' }]
    },
    reaper: {
        id: 'reaper', name: 'Reaper', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.RARE,
        cost: 2, description: 'Deal 4 damage to ALL enemies. Heal HP equal to unblocked damage dealt.',
        effects: [{ type: 'damage', value: 4, target: 'all', lifesteal: true }]
    },
    immolate: {
        id: 'immolate', name: 'Immolate', type: CARD_TYPES.ATTACK, rarity: CARD_RARITIES.RARE,
        cost: 2, description: 'Deal 21 damage to ALL enemies. Add a Burn to your discard pile.',
        effects: [{ type: 'damage', value: 21, target: 'all' }, { type: 'addCard', cardId: 'burn' }]
    },

    // Rares - Skills
    impervious: {
        id: 'impervious', name: 'Impervious', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.RARE,
        cost: 2, description: 'Gain 30 Block. Exhaust.',
        effects: [{ type: 'block', value: 30 }],
        exhaust: true
    },
    offering: {
        id: 'offering', name: 'Offering', type: CARD_TYPES.SKILL, rarity: CARD_RARITIES.RARE,
        cost: 0, description: 'Lose 6 HP. Gain 2 Energy. Draw 3 cards. Exhaust.',
        effects: [{ type: 'loseHP', value: 6 }, { type: 'gainEnergy', value: 2 }, { type: 'draw', value: 3 }],
        exhaust: true
    },

    // Rares - Powers
    demon_form: {
        id: 'demon_form', name: 'Demon Form', type: CARD_TYPES.POWER, rarity: CARD_RARITIES.RARE,
        cost: 3, description: 'At the start of each turn, gain 2 Strength.',
        effects: [{ type: 'registerPower', power: 'demonForm', value: 2 }]
    },
    barricade: {
        id: 'barricade', name: 'Barricade', type: CARD_TYPES.POWER, rarity: CARD_RARITIES.RARE,
        cost: 3, description: 'Block is no longer removed at the start of your turn.',
        effects: [{ type: 'registerPower', power: 'barricade' }]
    },

    // Status / Curse
    burn: {
        id: 'burn', name: 'Burn', type: CARD_TYPES.STATUS, rarity: CARD_RARITIES.COMMON,
        cost: -1, description: 'Unplayable. At end of turn, take 2 damage.',
        unplayable: true,
        effects: []
    },
    wound: {
        id: 'wound', name: 'Wound', type: CARD_TYPES.STATUS, rarity: CARD_RARITIES.COMMON,
        cost: -1, description: 'Unplayable.',
        unplayable: true,
        effects: []
    },
    void_curse: {
        id: 'void_curse', name: 'Void Curse', type: CARD_TYPES.CURSE, rarity: CARD_RARITIES.COMMON,
        cost: -1, description: 'Unplayable. At end of turn, lose 1 Energy. Ethereal.',
        unplayable: true,
        ethereal: true,
        effects: []
    }
};

// ═══════════════════════════════════════════════════════════════
// ENEMY DATA
// ═══════════════════════════════════════════════════════════════

export const INTENT_TYPES = { ATTACK: 'attack', BLOCK: 'block', BUFF: 'buff', DEBUFF: 'debuff', ATTACK_DEBUFF: 'attack_debuff', UNKNOWN: 'unknown' };

export const ENEMY_DEFS = {
    void_wisp: {
        id: 'void_wisp', name: 'Void Wisp', hp: [10, 14], act: 1,
        color: '#aa44ff',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 5 },
            { type: INTENT_TYPES.ATTACK, damage: 8 },
        ]
    },
    cultist: {
        id: 'cultist', name: 'Cultist', hp: [48, 54], act: 1,
        color: '#cc6633',
        intents: [
            { type: INTENT_TYPES.BUFF, status: 'ritual', value: 3, firstOnly: true },
            { type: INTENT_TYPES.ATTACK, damage: 6 },
        ]
    },
    jaw_worm: {
        id: 'jaw_worm', name: 'Jaw Worm', hp: [40, 46], act: 1,
        color: '#55aa55',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 11 },
            { type: INTENT_TYPES.BLOCK, block: 6, buff: { status: 'strength', value: 3 } },
            { type: INTENT_TYPES.ATTACK, damage: 7 },
        ]
    },
    louse: {
        id: 'louse', name: 'Louse', hp: [10, 15], act: 1,
        color: '#884422',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 5 },
            { type: INTENT_TYPES.BUFF, status: 'strength', value: 3 },
        ]
    },
    gremlin_small: {
        id: 'gremlin_small', name: 'Gremlin', hp: [10, 14], act: 1,
        color: '#66aa33',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 4 },
            { type: INTENT_TYPES.ATTACK, damage: 4 },
        ]
    },

    // Act 2
    shelled_parasite: {
        id: 'shelled_parasite', name: 'Shelled Parasite', hp: [68, 78], act: 2,
        color: '#996655',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 10 },
            { type: INTENT_TYPES.BLOCK, block: 14 },
            { type: INTENT_TYPES.ATTACK, damage: 18 },
        ]
    },
    void_channeler: {
        id: 'void_channeler', name: 'Void Channeler', hp: [55, 65], act: 2,
        color: '#7733cc',
        intents: [
            { type: INTENT_TYPES.DEBUFF, status: 'weak', value: 2 },
            { type: INTENT_TYPES.ATTACK, damage: 14 },
            { type: INTENT_TYPES.ATTACK_DEBUFF, damage: 8, status: 'vulnerable', value: 1 },
        ]
    },
    automaton: {
        id: 'automaton', name: 'Automaton', hp: [72, 82], act: 2,
        color: '#888899',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 12 },
            { type: INTENT_TYPES.BLOCK, block: 10 },
            { type: INTENT_TYPES.ATTACK, damage: 7, times: 2 },
        ]
    },

    // Act 3
    spire_wraith: {
        id: 'spire_wraith', name: 'Spire Wraith', hp: [80, 95], act: 3,
        color: '#334466',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 15 },
            { type: INTENT_TYPES.DEBUFF, status: 'weak', value: 2 },
            { type: INTENT_TYPES.ATTACK, damage: 9, times: 2 },
            { type: INTENT_TYPES.BUFF, status: 'strength', value: 3 },
        ]
    },
    void_colossus: {
        id: 'void_colossus', name: 'Void Colossus', hp: [95, 110], act: 3,
        color: '#552288',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 20 },
            { type: INTENT_TYPES.BLOCK, block: 15 },
            { type: INTENT_TYPES.ATTACK, damage: 12, times: 2 },
        ]
    },

    // Elite
    nemesis: {
        id: 'nemesis', name: 'Nemesis', hp: [55, 65], act: 1, isElite: true,
        color: '#ff4466',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 6, times: 3 },
            { type: INTENT_TYPES.DEBUFF, status: 'vulnerable', value: 2 },
            { type: INTENT_TYPES.ATTACK, damage: 15 },
        ]
    },

    // Bosses
    the_collector: {
        id: 'the_collector', name: 'The Collector', hp: [280, 300], act: 1, isBoss: true,
        color: '#ffaa00',
        intents: [
            { type: INTENT_TYPES.BUFF, status: 'strength', value: 3, summon: true },
            { type: INTENT_TYPES.ATTACK, damage: 14 },
            { type: INTENT_TYPES.ATTACK, damage: 8, times: 2 },
            { type: INTENT_TYPES.BLOCK, block: 15, buff: { status: 'strength', value: 2 } },
        ]
    },
    the_automaton_king: {
        id: 'the_automaton_king', name: 'The Automaton King', hp: [350, 380], act: 2, isBoss: true,
        color: '#aabbcc',
        intents: [
            { type: INTENT_TYPES.ATTACK, damage: 10, times: 2 },
            { type: INTENT_TYPES.BLOCK, block: 20 },
            { type: INTENT_TYPES.ATTACK, damage: 25 },
            { type: INTENT_TYPES.BUFF, status: 'strength', value: 4 },
        ]
    },
    heart_of_the_void: {
        id: 'heart_of_the_void', name: 'Heart of the Void', hp: [450, 500], act: 3, isBoss: true,
        color: '#ff00ff',
        intents: [
            { type: INTENT_TYPES.ATTACK_DEBUFF, damage: 2, times: 10, status: 'vulnerable', value: 1 },
            { type: INTENT_TYPES.DEBUFF, status: 'weak', value: 3 },
            { type: INTENT_TYPES.ATTACK, damage: 35 },
            { type: INTENT_TYPES.BUFF, status: 'strength', value: 5 },
        ]
    }
};

// Encounter tables per act
export const ENCOUNTERS = {
    1: {
        normal: [
            [{ id: 'void_wisp' }, { id: 'void_wisp' }],
            [{ id: 'cultist' }],
            [{ id: 'jaw_worm' }],
            [{ id: 'louse' }, { id: 'louse' }],
            [{ id: 'gremlin_small' }, { id: 'gremlin_small' }, { id: 'gremlin_small' }],
        ],
        elite: [[{ id: 'nemesis' }]],
        boss: [[{ id: 'the_collector' }]]
    },
    2: {
        normal: [
            [{ id: 'shelled_parasite' }],
            [{ id: 'void_channeler' }, { id: 'void_channeler' }],
            [{ id: 'automaton' }],
            [{ id: 'shelled_parasite' }, { id: 'louse' }],
        ],
        elite: [[{ id: 'nemesis', hpMult: 1.5 }]],
        boss: [[{ id: 'the_automaton_king' }]]
    },
    3: {
        normal: [
            [{ id: 'spire_wraith' }],
            [{ id: 'void_colossus' }],
            [{ id: 'spire_wraith' }, { id: 'void_channeler' }],
        ],
        elite: [[{ id: 'nemesis', hpMult: 2.0 }]],
        boss: [[{ id: 'heart_of_the_void' }]]
    }
};

// ═══════════════════════════════════════════════════════════════
// RELIC DATA
// ═══════════════════════════════════════════════════════════════

export const RELIC_RARITIES = { STARTER: 'Starter', COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare' };

export const RELIC_DEFS = {
    burning_blood: {
        id: 'burning_blood', name: 'Burning Blood', rarity: RELIC_RARITIES.STARTER,
        description: 'At the end of combat, heal 6 HP.',
        trigger: 'onCombatEnd', effect: { type: 'heal', value: 6 },
        symbol: '\u2764'
    },
    vajra: {
        id: 'vajra', name: 'Vajra', rarity: RELIC_RARITIES.COMMON,
        description: 'At the start of each combat, gain 1 Strength.',
        trigger: 'onCombatStart', effect: { type: 'buff', status: 'strength', value: 1 },
        symbol: '\u2694'
    },
    anchor: {
        id: 'anchor', name: 'Anchor', rarity: RELIC_RARITIES.COMMON,
        description: 'At the start of each combat, gain 10 Block.',
        trigger: 'onCombatStart', effect: { type: 'block', value: 10 },
        symbol: '\u2693'
    },
    bag_of_preparation: {
        id: 'bag_of_preparation', name: 'Bag of Preparation', rarity: RELIC_RARITIES.COMMON,
        description: 'At the start of each combat, draw 2 additional cards.',
        trigger: 'onCombatStart', effect: { type: 'draw', value: 2 },
        symbol: '\uD83C\uDF92'
    },
    lantern: {
        id: 'lantern', name: 'Lantern', rarity: RELIC_RARITIES.COMMON,
        description: 'Gain 1 Energy on the first turn of each combat.',
        trigger: 'onCombatStart', effect: { type: 'gainEnergy', value: 1 },
        symbol: '\uD83C\uDFEE'
    },
    orichalcum: {
        id: 'orichalcum', name: 'Orichalcum', rarity: RELIC_RARITIES.COMMON,
        description: 'If you end your turn with no Block, gain 6 Block.',
        trigger: 'onTurnEnd', effect: { type: 'orichalcum', value: 6 },
        symbol: '\uD83D\uDEE1'
    },
    pen_nib: {
        id: 'pen_nib', name: 'Pen Nib', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'Every 10th Attack played deals double damage.',
        trigger: 'onPlayAttack', effect: { type: 'penNib', every: 10 },
        symbol: '\u270E',
        counter: 0
    },
    ornamental_fan: {
        id: 'ornamental_fan', name: 'Ornamental Fan', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'Every 3rd Attack played, gain 4 Block.',
        trigger: 'onPlayAttack', effect: { type: 'ornamentalFan', every: 3, block: 4 },
        symbol: '\uD83C\uDF2C',
        counter: 0
    },
    kunai: {
        id: 'kunai', name: 'Kunai', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'Every 3rd Attack played, gain 1 Dexterity.',
        trigger: 'onPlayAttack', effect: { type: 'kunai', every: 3, value: 1 },
        symbol: '\uD83D\uDDE1',
        counter: 0
    },
    meat_on_the_bone: {
        id: 'meat_on_the_bone', name: 'Meat on the Bone', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'If you are at less than 50% HP at the end of combat, heal 12 HP.',
        trigger: 'onCombatEnd', effect: { type: 'meatOnBone', value: 12, threshold: 0.5 },
        symbol: '\uD83C\uDF56'
    },
    blood_vial: {
        id: 'blood_vial', name: 'Blood Vial', rarity: RELIC_RARITIES.COMMON,
        description: 'At the start of each combat, heal 2 HP.',
        trigger: 'onCombatStart', effect: { type: 'heal', value: 2 },
        symbol: '\uD83E\uDDE9'
    },
    horn_cleat: {
        id: 'horn_cleat', name: 'Horn Cleat', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'At the start of your 2nd turn, gain 14 Block.',
        trigger: 'onTurnStart', effect: { type: 'hornCleat', turn: 2, block: 14 },
        symbol: '\uD83D\uDD14'
    },
    bronze_scales: {
        id: 'bronze_scales', name: 'Bronze Scales', rarity: RELIC_RARITIES.UNCOMMON,
        description: 'Whenever you take damage, deal 3 damage back.',
        trigger: 'onDamaged', effect: { type: 'thorns', value: 3 },
        symbol: '\uD83D\uDC09'
    },
    cursed_key: {
        id: 'cursed_key', name: 'Cursed Key', rarity: RELIC_RARITIES.RARE,
        description: 'Gain 1 additional Energy each turn. Gain a Curse when opening chests.',
        trigger: 'passive', effect: { type: 'energy', value: 1 },
        symbol: '\uD83D\uDD11'
    },
    dead_branch: {
        id: 'dead_branch', name: 'Dead Branch', rarity: RELIC_RARITIES.RARE,
        description: 'Whenever you Exhaust a card, add a random card to your hand.',
        trigger: 'onExhaust', effect: { type: 'addRandom' },
        symbol: '\uD83C\uDF3F'
    },
};

// ═══════════════════════════════════════════════════════════════
// EVENT DATA
// ═══════════════════════════════════════════════════════════════

export const EVENT_DEFS = [
    {
        id: 'void_shrine', name: 'Void Shrine',
        description: 'A pulsing shrine of dark energy stands before you. Its whispers promise power... at a price.',
        choices: [
            { text: 'Pray (Lose 7 HP, gain a random Rare card)', effect: { type: 'loseHP', value: 7, reward: { type: 'addRareCard' } } },
            { text: 'Smash it (Gain 50 gold)', effect: { type: 'gainGold', value: 50 } },
            { text: 'Leave', effect: null }
        ]
    },
    {
        id: 'wandering_merchant', name: 'Wandering Merchant',
        description: 'A hooded figure offers you a glowing vial. "Drink, and be renewed," they whisper.',
        choices: [
            { text: 'Drink (Heal 25% HP, gain Void Curse)', effect: { type: 'heal', percent: 0.25, penalty: { type: 'addCurse' } } },
            { text: 'Buy info (Lose 30 gold, upgrade a random card)', effect: { type: 'loseGold', value: 30, reward: { type: 'upgradeRandom' } } },
            { text: 'Decline', effect: null }
        ]
    },
    {
        id: 'forgotten_altar', name: 'Forgotten Altar',
        description: 'An ancient altar hums with residual magic. Dried blood stains the stone.',
        choices: [
            { text: 'Offer blood (Lose 10 HP, gain random relic)', effect: { type: 'loseHP', value: 10, reward: { type: 'addRelic' } } },
            { text: 'Offer gold (Lose 80 gold, heal to full)', effect: { type: 'loseGold', value: 80, reward: { type: 'fullHeal' } } },
            { text: 'Walk away', effect: null }
        ]
    },
    {
        id: 'treasure_chest', name: 'Treasure Chest',
        description: 'A gleaming chest sits in an alcove. It could be trapped...',
        choices: [
            { text: 'Open carefully (Gain 50-80 gold)', effect: { type: 'gainGold', min: 50, max: 80 } },
            { text: 'Smash open greedily (75% chance: 100 gold; 25% chance: take 15 damage)', effect: { type: 'gamble', success: { type: 'gainGold', value: 100 }, fail: { type: 'loseHP', value: 15 }, chance: 0.75 } },
            { text: 'Leave it', effect: null }
        ]
    },
    {
        id: 'dark_mirror', name: 'Dark Mirror',
        description: 'A mirror of obsidian reflects a twisted version of yourself. It reaches out...',
        choices: [
            { text: 'Touch it (Remove a card from your deck)', effect: { type: 'removeCard' } },
            { text: 'Shatter it (Gain 2 Wounds, gain 75 gold)', effect: { type: 'addStatus', cardId: 'wound', count: 2, reward: { type: 'gainGold', value: 75 } } },
            { text: 'Back away', effect: null }
        ]
    },
    {
        id: 'void_rift', name: 'Void Rift',
        description: 'A crack in reality shimmers with void energy. Tendrils of darkness lap at its edges.',
        choices: [
            { text: 'Step through (Random: gain Strength +2 OR lose 12 HP)', effect: { type: 'gamble', success: { type: 'permBuff', status: 'strength', value: 2 }, fail: { type: 'loseHP', value: 12 }, chance: 0.5 } },
            { text: 'Siphon energy (Gain 1 max Energy for next combat)', effect: { type: 'tempEnergy', value: 1 } },
            { text: 'Avoid', effect: null }
        ]
    },
    {
        id: 'old_beggar', name: 'Old Beggar',
        description: 'A frail figure blocks the path. "Help an old soul," they plead.',
        choices: [
            { text: 'Give gold (Lose 50 gold, gain random Uncommon card)', effect: { type: 'loseGold', value: 50, reward: { type: 'addUncommonCard' } } },
            { text: 'Rob them (Gain 30 gold, gain Void Curse)', effect: { type: 'gainGold', value: 30, penalty: { type: 'addCurse' } } },
            { text: 'Ignore', effect: null }
        ]
    },
    {
        id: 'the_library', name: 'The Library',
        description: 'Shelves of ancient tomes line the walls. Knowledge waits to be claimed.',
        choices: [
            { text: 'Study (Choose 1 of 3 cards to add)', effect: { type: 'cardReward', count: 3 } },
            { text: 'Rest among the books (Heal 15% HP)', effect: { type: 'heal', percent: 0.15 } },
            { text: 'Move on', effect: null }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════
// MAP NODE TYPES
// ═══════════════════════════════════════════════════════════════

export const NODE_TYPES = {
    COMBAT: 'combat',
    ELITE: 'elite',
    SHOP: 'shop',
    REST: 'rest',
    EVENT: 'event',
    BOSS: 'boss',
    START: 'start'
};

// Card prices for shop
export const CARD_PRICES = {
    [CARD_RARITIES.COMMON]: [45, 55],
    [CARD_RARITIES.UNCOMMON]: [68, 82],
    [CARD_RARITIES.RARE]: [135, 165]
};

export const RELIC_PRICES = {
    [RELIC_RARITIES.COMMON]: [150, 160],
    [RELIC_RARITIES.UNCOMMON]: [230, 260],
    [RELIC_RARITIES.RARE]: [290, 320]
};
