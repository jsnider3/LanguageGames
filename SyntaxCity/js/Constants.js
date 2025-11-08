// SyntaxCity - Game Constants

export const GRID = {
    COLS: 24,
    ROWS: 14,
    TILE_SIZE: 50,
    WIDTH: 1200,  // COLS * TILE_SIZE
    HEIGHT: 700   // ROWS * TILE_SIZE
};

export const GAME_STATES = {
    MENU: 'menu',
    LEVEL_SELECT: 'level_select',
    PLAYING: 'playing',
    WAVE_PREP: 'wave_prep',
    WAVE_ACTIVE: 'wave_active',
    PAUSED: 'paused',
    WAVE_COMPLETE: 'wave_complete',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over'
};

export const TOWER_TYPES = {
    VARIABLE: 'variable',
    FUNCTION: 'function',
    LOOP: 'loop',
    CONDITIONAL: 'conditional',
    ARRAY: 'array',
    OBJECT: 'object',
    ASYNC: 'async',
    REGEX: 'regex',
    TRY_CATCH: 'try_catch',
    RECURSION: 'recursion',
    CLOSURE: 'closure',
    GENERATOR: 'generator'
};

export const ENEMY_TYPES = {
    SYNTAX_ERROR: 'syntax_error',
    REFERENCE_ERROR: 'reference_error',
    TYPE_ERROR: 'type_error',
    NULL_POINTER: 'null_pointer',
    INFINITE_LOOP: 'infinite_loop',
    MEMORY_LEAK: 'memory_leak',
    RACE_CONDITION: 'race_condition',
    DEADLOCK: 'deadlock',
    STACK_OVERFLOW: 'stack_overflow',
    HEAP_CORRUPTION: 'heap_corruption',
    SEGMENTATION_FAULT: 'segmentation_fault',
    BUFFER_OVERFLOW: 'buffer_overflow',
    SPAGHETTI_CODE: 'spaghetti_code',
    LEGACY_SYSTEM: 'legacy_system',
    PRODUCTION_BUG: 'production_bug'
};

export const TOWER_STATS = {
    [TOWER_TYPES.VARIABLE]: {
        name: 'Variable',
        symbol: 'let',
        cost: 50,
        damage: 5,
        range: 150,
        attackSpeed: 0.5,
        description: 'Basic tower, cheap and fast',
        color: '#4488ff',
        tier: 1
    },
    [TOWER_TYPES.FUNCTION]: {
        name: 'Function',
        symbol: 'fn()',
        cost: 100,
        damage: 15,
        range: 200,
        attackSpeed: 1.0,
        description: 'Precise single-target, ignores 20% armor',
        color: '#aa66ff',
        special: { armorPierce: 0.2 },
        tier: 1
    },
    [TOWER_TYPES.LOOP]: {
        name: 'Loop',
        symbol: 'for',
        cost: 150,
        damage: 3,
        range: 100,
        attackSpeed: 0.2,
        description: 'Rapid-fire, stacking damage',
        color: '#44ff66',
        special: { stackDamage: true },
        tier: 1
    },
    [TOWER_TYPES.CONDITIONAL]: {
        name: 'Conditional',
        symbol: 'if{}',
        cost: 120,
        damage: 12,
        range: 150,
        attackSpeed: 0.8,
        description: 'Smart targeting - highest HP or fastest',
        color: '#ffdd44',
        special: { smartTarget: true },
        tier: 1
    },
    [TOWER_TYPES.ARRAY]: {
        name: 'Array',
        symbol: '[]',
        cost: 180,
        damage: 10,
        range: 150,
        attackSpeed: 2.0,
        description: 'Shoots 3 projectiles at different targets',
        color: '#ff8844',
        special: { multiTarget: 3 },
        tier: 1
    },
    [TOWER_TYPES.OBJECT]: {
        name: 'Object',
        symbol: '{}',
        cost: 200,
        damage: 25,
        range: 100,
        attackSpeed: 2.5,
        description: 'Damage increases with nearby towers',
        color: '#ff4466',
        special: { scalingDamage: true },
        tier: 1
    },
    [TOWER_TYPES.ASYNC]: {
        name: 'Async',
        symbol: 'async',
        cost: 250,
        damage: 40,
        range: 250,
        attackSpeed: 4.0,
        description: 'Delayed hit - marks target, hits after 2s',
        color: '#44ddff',
        special: { delayedHit: 2.0 },
        tier: 1
    },
    [TOWER_TYPES.REGEX]: {
        name: 'Regex',
        symbol: '/.*/',
        cost: 220,
        damage: 8,
        range: 180,
        attackSpeed: 1.5,
        description: 'Area slow - reduces speed by 40%',
        color: '#ff44ff',
        special: { areaSlow: 0.4, areaRadius: 80 },
        tier: 1
    },
    [TOWER_TYPES.TRY_CATCH]: {
        name: 'Try/Catch',
        symbol: 'try{}',
        cost: 300,
        damage: 0,
        range: 120,
        attackSpeed: 0,
        description: 'Catches one bug per wave',
        color: '#ffffff',
        special: { catchPerWave: 1 },
        tier: 1
    },
    [TOWER_TYPES.RECURSION]: {
        name: 'Recursion',
        symbol: 'f(n-1)',
        cost: 350,
        damage: 5,
        range: 150,
        attackSpeed: 2.0,
        description: 'Doubles damage per successive hit',
        color: '#ffaa00',
        special: { scalingMultiplier: 2 },
        tier: 1
    },
    [TOWER_TYPES.CLOSURE]: {
        name: 'Closure',
        symbol: '()=>{}',
        cost: 280,
        damage: 18,
        range: 150,
        attackSpeed: 0.7,
        description: 'Captures last kill, +50% to that type',
        color: '#00ddaa',
        special: { captureType: true, bonusDamage: 0.5 },
        tier: 1
    },
    [TOWER_TYPES.GENERATOR]: {
        name: 'Generator',
        symbol: 'fn*',
        cost: 400,
        damage: 20,
        range: 200,
        attackSpeed: 1.8,
        description: 'Rotates: pierce, splash, stun',
        color: '#ffdd00',
        special: { yieldTypes: ['pierce', 'splash', 'stun'] },
        tier: 1
    }
};

export const UPGRADE_MULTIPLIERS = {
    tier2: {
        costMultiplier: 2,
        cpuCost: 50,
        damageBonus: 0.5,
        rangeBonus: 0.2,
        speedBonus: 0.2
    },
    tier3: {
        costMultiplier: 3,
        cpuCost: 150,
        damageBonus: 1.0,
        rangeBonus: 0.4,
        speedBonus: 0.4
    }
};

export const ENEMY_STATS = {
    [ENEMY_TYPES.SYNTAX_ERROR]: {
        name: 'SyntaxError',
        hp: 20,
        speed: 60,
        reward: 10,
        color: '#ff3333',
        symbol: '!',
        description: 'Basic bug, standard movement'
    },
    [ENEMY_TYPES.REFERENCE_ERROR]: {
        name: 'ReferenceError',
        hp: 30,
        speed: 80,
        reward: 15,
        color: '#aa44ff',
        symbol: '?',
        description: 'Fast mover, erratic movement'
    },
    [ENEMY_TYPES.TYPE_ERROR]: {
        name: 'TypeError',
        hp: 50,
        speed: 40,
        reward: 20,
        color: '#ff8833',
        symbol: '⚠',
        armor: 0.2,
        description: 'Slow but armored (20% reduction)'
    },
    [ENEMY_TYPES.NULL_POINTER]: {
        name: 'NullPointer',
        hp: 40,
        speed: 100,
        reward: 25,
        color: '#8888ff',
        symbol: '∅',
        special: { invisible: 1 },  // Invisible for first hit
        description: 'Very fast, invisible until first hit'
    },
    [ENEMY_TYPES.INFINITE_LOOP]: {
        name: 'InfiniteLoop',
        hp: 100,
        speed: 30,
        reward: 40,
        color: '#44ff44',
        symbol: '∞',
        special: { regen: 2 },  // HP per second
        description: 'Regenerates 2 HP/second'
    },
    [ENEMY_TYPES.MEMORY_LEAK]: {
        name: 'MemoryLeak',
        hp: 60,
        speed: 40,
        reward: 30,
        color: '#4488ff',
        symbol: '💧',
        special: { splitOnDeath: 2 },
        description: 'Spawns 2 mini-leaks on death'
    },
    [ENEMY_TYPES.RACE_CONDITION]: {
        name: 'RaceCondition',
        hp: 35,
        speed: 70,
        reward: 35,
        color: '#ff44ff',
        symbol: '⚡',
        special: { variableSpeed: true },
        description: 'Speed randomly changes'
    },
    [ENEMY_TYPES.DEADLOCK]: {
        name: 'DeadLock',
        hp: 80,
        speed: 50,
        reward: 45,
        color: '#888888',
        symbol: '🔒',
        special: { freezeInterval: 5, freezeDuration: 2 },
        description: 'Freezes periodically, invulnerable while frozen'
    },
    [ENEMY_TYPES.STACK_OVERFLOW]: {
        name: 'StackOverflow',
        hp: 150,
        speed: 60,
        reward: 60,
        color: '#ff6600',
        symbol: '📚',
        special: { explodeOnDeath: 0.1 },  // 10% tower damage
        description: 'Explodes on death, damaging nearby towers'
    },
    [ENEMY_TYPES.HEAP_CORRUPTION]: {
        name: 'HeapCorruption',
        hp: 120,
        speed: 70,
        reward: 55,
        color: '#ff00ff',
        symbol: '🔀',
        special: { teleport: true },
        description: 'Randomly teleports short distances'
    },
    [ENEMY_TYPES.SEGMENTATION_FAULT]: {
        name: 'SegmentationFault',
        hp: 200,
        speed: 35,
        reward: 80,
        color: '#666666',
        symbol: '⚙',
        armor: 0.5,
        special: { immuneSlow: true },
        description: 'Heavy armor (50%), immune to slow'
    },
    [ENEMY_TYPES.BUFFER_OVERFLOW]: {
        name: 'BufferOverflow',
        hp: 90,
        speed: 75,
        reward: 50,
        color: '#ff0066',
        symbol: '▶',
        special: { accelerateOnDamage: true },
        description: 'Gets faster as it takes damage'
    },
    [ENEMY_TYPES.SPAGHETTI_CODE]: {
        name: 'The Spaghetti Code',
        hp: 500,
        speed: 30,
        reward: 200,
        color: '#ffaa44',
        symbol: '🍝',
        boss: true,
        special: { spawnMinions: true, spawnInterval: 3 },
        description: 'BOSS: Spawns minions continuously'
    },
    [ENEMY_TYPES.LEGACY_SYSTEM]: {
        name: 'The Legacy System',
        hp: 800,
        speed: 25,
        reward: 300,
        color: '#886644',
        symbol: '🏛',
        boss: true,
        special: { immuneToNewTowers: true },
        description: 'BOSS: Immune to towers placed during wave'
    },
    [ENEMY_TYPES.PRODUCTION_BUG]: {
        name: 'The Production Bug',
        hp: 1000,
        speed: 50,
        reward: 500,
        color: '#ff0000',
        symbol: '💀',
        boss: true,
        special: { multiPhase: [0.75, 0.5, 0.25] },
        description: 'BOSS: Multi-phase, calls reinforcements'
    }
};

export const POWER_UPS = {
    GARBAGE_COLLECTOR: {
        name: 'Garbage Collector',
        cost: 100,
        cooldown: 5,
        description: 'Destroys all bugs under 10% HP',
        icon: '🗑️'
    },
    CODE_REVIEW: {
        name: 'Code Review',
        cost: 80,
        cooldown: 3,
        description: 'Slows all bugs by 80% for 5s',
        icon: '🔍'
    },
    HOT_RELOAD: {
        name: 'Hot Reload',
        cost: 60,
        cooldown: 2,
        description: 'All towers attack 300% faster for 8s',
        icon: '🔥'
    },
    STACK_TRACE: {
        name: 'Stack Trace',
        cost: 120,
        cooldown: 4,
        description: 'Reveals paths and HP bars for 10s',
        icon: '📋'
    },
    EMERGENCY_PATCH: {
        name: 'Emergency Patch',
        cost: 150,
        cooldown: 999,  // Once per level
        description: 'Kills 1 boss or 5 regular enemies',
        icon: '⚡'
    }
};

export const COMBO_BONUSES = {
    'function_loop': {
        condition: (tower1, tower2) => tower1.type === TOWER_TYPES.FUNCTION && tower2.type === TOWER_TYPES.LOOP,
        effect: { speedBonus: 0.25, appliesTo: TOWER_TYPES.LOOP }
    },
    'array_conditional': {
        condition: (tower1, tower2) => tower1.type === TOWER_TYPES.ARRAY && tower2.type === TOWER_TYPES.CONDITIONAL,
        effect: { sharedVision: true }
    },
    'async_any': {
        condition: (tower1, tower2) => tower1.type === TOWER_TYPES.ASYNC || tower2.type === TOWER_TYPES.ASYNC,
        effect: { damageBonus: 0.1 }
    },
    'object_multiple': {
        condition: (tower) => tower.type === TOWER_TYPES.OBJECT,
        effect: { damagePerAdjacent: 10 }
    },
    'recursion_recursion': {
        condition: (tower1, tower2) => tower1.type === TOWER_TYPES.RECURSION && tower2.type === TOWER_TYPES.RECURSION,
        effect: { scalingBonus: 1 }
    }
};

export const STARTING_RESOURCES = {
    memoryUnits: 200,
    cpuCycles: 0,
    lives: 20
};

export const GAME_CONFIG = {
    FPS: 60,
    WAVE_PREP_TIME: 15,  // seconds
    SELL_REFUND_PERCENT: 0.75,
    PROJECTILE_SPEED: 400,  // pixels per second (increased to catch fast enemies)
    DAMAGE_NUMBER_DURATION: 1.0,  // seconds
    PARTICLE_LIFETIME: 0.5,  // seconds
    MAX_PROJECTILES: 500,
    MAX_PARTICLES: 1000
};

export const COLORS = {
    PATH: '#2a2a3a',
    BUILDABLE: '#1a1a2a',
    UNBUILDABLE: '#0a0a1a',
    GRID_LINE: '#333344',
    SELECTION_HIGHLIGHT: '#00ff88',
    RANGE_INDICATOR: 'rgba(0, 255, 136, 0.2)',
    DAMAGE_TEXT: '#ffffff',
    DAMAGE_TEXT_CRIT: '#ffdd00',
    DAMAGE_TEXT_RESIST: '#ff4444'
};

export const KEYBOARD_SHORTCUTS = {
    PAUSE: 'p',
    START_WAVE: 'Enter',
    CANCEL_PLACEMENT: 'Escape',
    FAST_FORWARD: 'f',
    HELP: '?',
    TOWER_1: '1',
    TOWER_2: '2',
    TOWER_3: '3',
    TOWER_4: '4',
    TOWER_5: '5',
    TOWER_6: '6',
    TOWER_7: '7',
    TOWER_8: '8',
    TOWER_9: '9',
    TOWER_10: '0',
    SELL: 'Delete',
    UPGRADE: 'u'
};
