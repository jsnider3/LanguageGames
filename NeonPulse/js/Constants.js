// ═══════════════════════════════════════════════════════════
// GAME STATES
// ═══════════════════════════════════════════════════════════

export const STATES = {
    MENU: 'menu',
    SONG_SELECT: 'songSelect',
    PLAYING: 'playing',
    PAUSED: 'paused',
    RESULTS: 'results'
};

// ═══════════════════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════════════════

export const WIDTH = 960;
export const HEIGHT = 640;

export const LANE_COUNT = 4;
export const LANE_WIDTH = 80;
export const LANE_TOTAL_WIDTH = LANE_COUNT * LANE_WIDTH;
export const LANE_LEFT = (WIDTH - LANE_TOTAL_WIDTH) / 2;

export const HIT_ZONE_Y = HEIGHT - 100;
export const SCROLL_SPEED = 400; // pixels per second

// ═══════════════════════════════════════════════════════════
// LANE KEYS AND COLORS
// ═══════════════════════════════════════════════════════════

export const LANE_KEYS = ['d', 'f', 'j', 'k'];
export const LANE_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#00ff88'];
export const LANE_LABELS = ['D', 'F', 'J', 'K'];

// ═══════════════════════════════════════════════════════════
// TIMING WINDOWS (seconds)
// ═══════════════════════════════════════════════════════════

export const TIMING = {
    PERFECT: 0.030,
    GREAT: 0.060,
    GOOD: 0.100,
    MISS_WINDOW: 0.140
};

// ═══════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════

export const SCORE_VALUES = {
    perfect: 300,
    great: 200,
    good: 100,
    miss: 0
};

export const COMBO_THRESHOLDS = [
    { combo: 60, multiplier: 8 },
    { combo: 30, multiplier: 4 },
    { combo: 10, multiplier: 2 },
    { combo: 0, multiplier: 1 }
];

export const HEALTH = {
    MAX: 100,
    MISS_PENALTY: 8,
    PERFECT_RECOVER: 4,
    GREAT_RECOVER: 2,
    GOOD_RECOVER: 1
};

export const GRADES = [
    { threshold: 0.95, grade: 'S', color: '#ffdd00' },
    { threshold: 0.90, grade: 'A', color: '#00ff88' },
    { threshold: 0.80, grade: 'B', color: '#00ccff' },
    { threshold: 0.70, grade: 'C', color: '#ff8800' },
    { threshold: 0.00, grade: 'D', color: '#ff3344' }
];

// ═══════════════════════════════════════════════════════════
// DIFFICULTIES
// ═══════════════════════════════════════════════════════════

export const DIFFICULTIES = ['easy', 'normal', 'hard'];

// ═══════════════════════════════════════════════════════════
// NOTE TYPES
// ═══════════════════════════════════════════════════════════

export const NOTE_TYPES = {
    TAP: 'tap',
    HOLD: 'hold'
};

// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════

export const SAMPLE_RATE = 44100;
export const MASTER_VOLUME = 0.35;
export const SFX_VOLUME = 0.25;
