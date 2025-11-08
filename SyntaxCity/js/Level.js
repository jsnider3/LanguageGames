// SyntaxCity - Level Definitions

import { Path } from './Pathfinding.js';
import { ENEMY_TYPES } from './Constants.js';

export class Level {
    constructor(id, name, description, paths, waves, unbuildableZones = []) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.paths = paths.map(p => new Path(p));
        this.waves = waves;
        this.unbuildableZones = unbuildableZones;
    }
}

// Helper function to create wave compositions
function createWave(enemies) {
    // enemies is array of {type, count, delay}
    const composition = [];
    let currentTime = 0;

    for (let group of enemies) {
        for (let i = 0; i < group.count; i++) {
            composition.push({
                type: group.type,
                spawnTime: currentTime
            });
            currentTime += group.delay || 0.5;
        }
    }

    return composition;
}

// Level 1: Hello World (Tutorial)
const level1Paths = [[
    { x: 0, y: 7 },
    { x: 5, y: 7 },
    { x: 5, y: 3 },
    { x: 12, y: 3 },
    { x: 12, y: 10 },
    { x: 23, y: 10 }
]];

const level1Waves = [
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 5, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 8, delay: 0.8 }
    ]),
    createWave([
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 6, delay: 0.7 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 10, delay: 0.5 },
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 5, delay: 0.6 }
    ]),
    createWave([
        { type: ENEMY_TYPES.TYPE_ERROR, count: 3, delay: 1.5 },
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 8, delay: 0.5 }
    ])
];

// Level 2: The Startup Codebase
const level2Paths = [[
    { x: 0, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 8 },
    { x: 15, y: 8 },
    { x: 15, y: 4 },
    { x: 23, y: 4 }
]];

const level2Waves = [
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 10, delay: 0.6 }
    ]),
    createWave([
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 12, delay: 0.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.TYPE_ERROR, count: 5, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.NULL_POINTER, count: 6, delay: 0.8 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 15, delay: 0.4 },
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 10, delay: 0.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.INFINITE_LOOP, count: 2, delay: 2.0 },
        { type: ENEMY_TYPES.TYPE_ERROR, count: 8, delay: 0.7 }
    ]),
    createWave([
        { type: ENEMY_TYPES.MEMORY_LEAK, count: 4, delay: 1.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.NULL_POINTER, count: 10, delay: 0.6 },
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 15, delay: 0.4 }
    ]),
    createWave([
        { type: ENEMY_TYPES.RACE_CONDITION, count: 8, delay: 0.8 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 1, delay: 0 },
        { type: ENEMY_TYPES.TYPE_ERROR, count: 12, delay: 0.5 }
    ])
];

// Level 3: The Refactor
const level3Paths = [
    [
        { x: 0, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 7 },
        { x: 23, y: 7 }
    ],
    [
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 7 },
        { x: 23, y: 7 }
    ]
];

const level3Waves = [
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 12, delay: 0.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 15, delay: 0.4 }
    ]),
    createWave([
        { type: ENEMY_TYPES.TYPE_ERROR, count: 8, delay: 0.7 },
        { type: ENEMY_TYPES.NULL_POINTER, count: 8, delay: 0.7 }
    ]),
    createWave([
        { type: ENEMY_TYPES.INFINITE_LOOP, count: 3, delay: 2.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.MEMORY_LEAK, count: 6, delay: 1.2 }
    ]),
    createWave([
        { type: ENEMY_TYPES.RACE_CONDITION, count: 10, delay: 0.6 }
    ]),
    createWave([
        { type: ENEMY_TYPES.DEADLOCK, count: 5, delay: 1.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.NULL_POINTER, count: 15, delay: 0.4 },
        { type: ENEMY_TYPES.TYPE_ERROR, count: 10, delay: 0.6 }
    ]),
    createWave([
        { type: ENEMY_TYPES.INFINITE_LOOP, count: 4, delay: 1.5 },
        { type: ENEMY_TYPES.MEMORY_LEAK, count: 8, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.STACK_OVERFLOW, count: 3, delay: 2.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.RACE_CONDITION, count: 15, delay: 0.5 },
        { type: ENEMY_TYPES.DEADLOCK, count: 8, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 1, delay: 0 },
        { type: ENEMY_TYPES.STACK_OVERFLOW, count: 5, delay: 1.5 }
    ])
];

// Level 4: Open Source Chaos
const level4Paths = [
    [
        { x: 0, y: 2 },
        { x: 12, y: 2 },
        { x: 12, y: 12 },
        { x: 23, y: 12 }
    ],
    [
        { x: 23, y: 2 },
        { x: 12, y: 2 },
        { x: 12, y: 12 },
        { x: 23, y: 12 }
    ]
];

const level4Waves = [
    createWave([
        { type: ENEMY_TYPES.SYNTAX_ERROR, count: 20, delay: 0.4 }
    ]),
    createWave([
        { type: ENEMY_TYPES.NULL_POINTER, count: 18, delay: 0.4 }
    ]),
    createWave([
        { type: ENEMY_TYPES.TYPE_ERROR, count: 12, delay: 0.6 },
        { type: ENEMY_TYPES.REFERENCE_ERROR, count: 12, delay: 0.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.INFINITE_LOOP, count: 5, delay: 1.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.MEMORY_LEAK, count: 10, delay: 0.8 }
    ]),
    createWave([
        { type: ENEMY_TYPES.RACE_CONDITION, count: 15, delay: 0.5 },
        { type: ENEMY_TYPES.DEADLOCK, count: 10, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.STACK_OVERFLOW, count: 5, delay: 1.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.HEAP_CORRUPTION, count: 8, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.BUFFER_OVERFLOW, count: 12, delay: 0.6 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SEGMENTATION_FAULT, count: 4, delay: 2.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.STACK_OVERFLOW, count: 8, delay: 1.2 },
        { type: ENEMY_TYPES.HEAP_CORRUPTION, count: 10, delay: 0.8 }
    ]),
    createWave([
        { type: ENEMY_TYPES.NULL_POINTER, count: 20, delay: 0.3 },
        { type: ENEMY_TYPES.BUFFER_OVERFLOW, count: 15, delay: 0.5 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 1, delay: 0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.SEGMENTATION_FAULT, count: 6, delay: 1.5 },
        { type: ENEMY_TYPES.INFINITE_LOOP, count: 8, delay: 1.0 }
    ]),
    createWave([
        { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 0 }
    ])
];

// Level 5: The Legacy Migration
const level5Paths = [
    [
        { x: 0, y: 7 },
        { x: 8, y: 7 },
        { x: 8, y: 3 },
        { x: 16, y: 3 },
        { x: 16, y: 10 },
        { x: 23, y: 10 }
    ]
];

const level5Waves = Array.from({ length: 18 }, (_, i) => {
    const waveNum = i + 1;
    if (waveNum === 10) {
        return createWave([
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 0 }
        ]);
    } else if (waveNum === 18) {
        return createWave([
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 0 },
            { type: ENEMY_TYPES.SEGMENTATION_FAULT, count: 8, delay: 1.2 }
        ]);
    } else if (waveNum % 5 === 0) {
        return createWave([
            { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 1, delay: 0 },
            { type: ENEMY_TYPES.STACK_OVERFLOW, count: 6, delay: 1.0 }
        ]);
    } else {
        const types = [
            ENEMY_TYPES.NULL_POINTER,
            ENEMY_TYPES.INFINITE_LOOP,
            ENEMY_TYPES.MEMORY_LEAK,
            ENEMY_TYPES.RACE_CONDITION,
            ENEMY_TYPES.DEADLOCK,
            ENEMY_TYPES.STACK_OVERFLOW,
            ENEMY_TYPES.HEAP_CORRUPTION,
            ENEMY_TYPES.BUFFER_OVERFLOW
        ];
        const type1 = types[Math.floor(Math.random() * types.length)];
        const type2 = types[Math.floor(Math.random() * types.length)];
        return createWave([
            { type: type1, count: 10 + waveNum, delay: 0.5 - waveNum * 0.01 },
            { type: type2, count: 8 + waveNum, delay: 0.6 - waveNum * 0.01 }
        ]);
    }
});

// Level 6: Production Deployment
const level6Paths = [
    [
        { x: 0, y: 3 },
        { x: 18, y: 3 },
        { x: 18, y: 13 },
        { x: 0, y: 13 }
    ],
    [
        { x: 23, y: 7 },
        { x: 5, y: 7 },
        { x: 5, y: 13 },
        { x: 0, y: 13 }
    ]
];

const level6Waves = Array.from({ length: 20 }, (_, i) => {
    const waveNum = i + 1;
    if (waveNum === 20) {
        return createWave([
            { type: ENEMY_TYPES.PRODUCTION_BUG, count: 1, delay: 0 }
        ]);
    } else if (waveNum % 5 === 0) {
        return createWave([
            { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 1, delay: 0 },
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 5.0 }
        ]);
    } else {
        const allTypes = Object.values(ENEMY_TYPES).filter(t =>
            t !== ENEMY_TYPES.PRODUCTION_BUG &&
            t !== ENEMY_TYPES.SPAGHETTI_CODE &&
            t !== ENEMY_TYPES.LEGACY_SYSTEM
        );
        const shuffled = allTypes.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 3);
        return createWave([
            { type: selected[0], count: 15, delay: 0.3 },
            { type: selected[1], count: 12, delay: 0.4 },
            { type: selected[2], count: 10, delay: 0.5 }
        ]);
    }
});

// Level 7: The Security Audit
const level7Paths = [
    [
        { x: 0, y: 2 },
        { x: 10, y: 2 },
        { x: 10, y: 7 },
        { x: 18, y: 7 },
        { x: 18, y: 12 },
        { x: 23, y: 12 }
    ],
    [
        { x: 0, y: 12 },
        { x: 6, y: 12 },
        { x: 6, y: 7 },
        { x: 14, y: 7 },
        { x: 14, y: 2 },
        { x: 23, y: 2 }
    ]
];

const level7Waves = Array.from({ length: 22 }, (_, i) => {
    const waveNum = i + 1;
    const advancedTypes = [
        ENEMY_TYPES.STACK_OVERFLOW,
        ENEMY_TYPES.HEAP_CORRUPTION,
        ENEMY_TYPES.SEGMENTATION_FAULT,
        ENEMY_TYPES.BUFFER_OVERFLOW
    ];

    if (waveNum === 11 || waveNum === 22) {
        return createWave([
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 0 },
            { type: ENEMY_TYPES.SEGMENTATION_FAULT, count: 10, delay: 1.0 },
            { type: ENEMY_TYPES.BUFFER_OVERFLOW, count: 15, delay: 0.5 }
        ]);
    } else {
        const count = 20 + waveNum * 2;
        return createWave([
            { type: advancedTypes[0], count: count, delay: 0.25 },
            { type: advancedTypes[1], count: count * 0.8, delay: 0.3 },
            { type: advancedTypes[2], count: count * 0.6, delay: 0.35 },
            { type: advancedTypes[3], count: count * 0.4, delay: 0.4 }
        ]);
    }
});

// Level 8: The Kernel Panic
const level8Paths = [
    [
        { x: 0, y: 7 },
        { x: 23, y: 7 }
    ],
    [
        { x: 12, y: 0 },
        { x: 12, y: 13 }
    ]
];

const level8Waves = Array.from({ length: 25 }, (_, i) => {
    const waveNum = i + 1;

    if (waveNum === 25) {
        return createWave([
            { type: ENEMY_TYPES.PRODUCTION_BUG, count: 1, delay: 0 },
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 2, delay: 3.0 },
            { type: ENEMY_TYPES.SEGMENTATION_FAULT, count: 15, delay: 0.8 }
        ]);
    } else if (waveNum % 5 === 0) {
        return createWave([
            { type: ENEMY_TYPES.SPAGHETTI_CODE, count: 2, delay: 3.0 },
            { type: ENEMY_TYPES.LEGACY_SYSTEM, count: 1, delay: 5.0 }
        ]);
    } else {
        const allTypes = Object.values(ENEMY_TYPES).filter(t =>
            t !== ENEMY_TYPES.PRODUCTION_BUG
        );
        const count = 25 + waveNum * 3;
        const selected = allTypes.sort(() => Math.random() - 0.5).slice(0, 4);
        return createWave([
            { type: selected[0], count: count, delay: 0.2 },
            { type: selected[1], count: count * 0.9, delay: 0.25 },
            { type: selected[2], count: count * 0.7, delay: 0.3 },
            { type: selected[3], count: count * 0.5, delay: 0.35 }
        ]);
    }
});

// Export all levels
export const LEVELS = [
    new Level(1, 'Hello World', 'Your first program. Keep it clean!', level1Paths, level1Waves),
    new Level(2, 'The Startup Codebase', 'Rapid development = rapid bugs. Stay vigilant!', level2Paths, level2Waves),
    new Level(3, 'The Refactor', 'Cleaning up technical debt attracts old bugs.', level3Paths, level3Waves),
    new Level(4, 'Open Source Chaos', '100 contributors, 1000 bugs. Welcome to OSS.', level4Paths, level4Waves),
    new Level(5, 'The Legacy Migration', 'Modernizing ancient code awakens dormant horrors.', level5Paths, level5Waves),
    new Level(6, 'Production Deployment', 'Friday evening deployment. What could go wrong?', level6Paths, level6Waves),
    new Level(7, 'The Security Audit', 'Every vulnerability found is trying to break in.', level7Paths, level7Waves),
    new Level(8, 'The Kernel Panic', 'The ultimate debugging challenge. Core meltdown imminent.', level8Paths, level8Waves)
];

export function getLevel(id) {
    return LEVELS.find(level => level.id === id) || LEVELS[0];
}
