// Game Constants
// Extracted magic numbers and values for better maintainability

export const PHYSICS = {
    GRAVITY: -9.8,
    TERMINAL_VELOCITY: -50,
    FRICTION: 0.9,
    AIR_RESISTANCE: 0.95,
    JUMP_FORCE: 5,
    PLAYER_RADIUS: 0.3,
    PLAYER_HEIGHT: 1.8,
    DEFAULT_ENEMY_RADIUS: 0.3,
    DEFAULT_ENEMY_HEIGHT: 1.5
};

export const MOVEMENT = {
    BASE_MOVE_SPEED: 8,
    SPRINT_MULTIPLIER: 1.5,
    CROUCH_MULTIPLIER: 0.5,
    STRAFE_MULTIPLIER: 0.7,
    BACKWARD_MULTIPLIER: 0.8,
    MAX_VELOCITY: 20,
    ACCELERATION: 30,
    DECELERATION: 10
};

export const COMBAT = {
    MELEE_RANGE: 3,
    MELEE_DAMAGE: 10,
    MELEE_COOLDOWN: 500, // ms
    SHOTGUN_RANGE: 20,
    SHOTGUN_SPREAD: 0.15,
    GRENADE_BLAST_RADIUS: 8,
    GRENADE_DAMAGE: 50,
    HOLY_WATER_RADIUS: 5,
    HOLY_WATER_DAMAGE: 30,
    KNOCKBACK_FORCE: 15,
    DAMAGE_FLASH_DURATION: 200 // ms
};

export const ENEMY_AI = {
    DEFAULT_SIGHT_RANGE: 15,
    DEFAULT_ATTACK_RANGE: 2,
    DEFAULT_MOVE_SPEED: 3,
    IDLE_TURN_CHANCE: 0.02,
    STUCK_THRESHOLD: 30, // frames
    MIN_MOVEMENT_THRESHOLD: 0.01,
    WALL_AVOIDANCE_STRENGTH: 0.7,
    ZIGZAG_AMPLITUDE: 0.3,
    PATROL_RADIUS: 5,
    AGGRO_DURATION: 5000 // ms
};

export const LEVEL_BOUNDS = {
    DEFAULT_SIZE: 9.5,
    LEVEL_2_SIZE: 14.5,
    LEVEL_3_SIZE: 19.5,
    CHAPEL_X: 9.5,
    CHAPEL_Z_MIN: -49,
    CHAPEL_Z_MAX: 11.5,
    ARMORY_SIZE: 19.5,
    ARMORY_Z_MIN: -49,
    BOUND_MARGIN: 0.5
};

export const RENDERING = {
    FOV: 75,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1000,
    SHADOW_MAP_SIZE: 2048,
    MAX_PARTICLES: 100,
    PARTICLE_LIFETIME: 1000, // ms
    MUZZLE_FLASH_DURATION: 100, // ms
    BLOOD_PARTICLE_COUNT: 5,
    EXPLOSION_PARTICLE_COUNT: 20
};

export const AUDIO = {
    MASTER_VOLUME: 0.8,
    SFX_VOLUME: 0.6,
    MUSIC_VOLUME: 0.4,
    FOOTSTEP_INTERVAL: 500, // ms
    DAMAGE_SOUND_COOLDOWN: 200, // ms
    AMBIENT_FADE_TIME: 2000, // ms
    MAX_SIMULTANEOUS_SOUNDS: 10
};

export const UI = {
    HUD_OPACITY: 0.8,
    HEALTH_BAR_WIDTH: 200,
    HEALTH_BAR_HEIGHT: 20,
    AMMO_DISPLAY_SIZE: 32,
    CROSSHAIR_SIZE: 20,
    DAMAGE_INDICATOR_DURATION: 500, // ms
    MESSAGE_DISPLAY_TIME: 3000, // ms
    MENU_TRANSITION_TIME: 300 // ms
};

export const ANIMATION = {
    BOB_SPEED: 8,
    BOB_AMPLITUDE: 0.1,
    IDLE_SWAY_SPEED: 2,
    IDLE_SWAY_AMPLITUDE: 0.05,
    HURT_FLASH_SPEED: 20,
    DEATH_FALL_SPEED: 0.15,
    TELEPORT_EFFECT_SCALE: 1.1,
    WING_FLAP_SPEED: 8,
    HOVER_HEIGHT: 0.5,
    HOVER_SPEED: 0.002
};

export const PICKUPS = {
    HEALTH_PACK_HEAL: 25,
    AMMO_PACK_COUNT: 10,
    ARMOR_PACK_AMOUNT: 25,
    POWERUP_DURATION: 30000, // ms
    RESPAWN_TIME: 30000, // ms
    PICKUP_RADIUS: 1,
    FLOAT_HEIGHT: 0.5,
    FLOAT_SPEED: 2,
    ROTATE_SPEED: 1,
    COLLECTION_DISTANCE: 2,
    GLOW_INTENSITY: 0.5,
    BEACON_HEIGHT: 4
};

export const NETWORK = {
    TICK_RATE: 60,
    INTERPOLATION_DELAY: 100, // ms
    TIMEOUT_DURATION: 10000, // ms
    MAX_PREDICTION_FRAMES: 10,
    PACKET_SIZE_LIMIT: 1024 // bytes
};

export const PERFORMANCE = {
    TARGET_FPS: 60,
    LOW_FPS_THRESHOLD: 30,
    LOD_DISTANCES: [10, 25, 50, 100],
    MAX_ENEMIES_PER_FRAME: 50,
    MAX_PROJECTILES: 100,
    SPATIAL_HASH_CELL_SIZE: 10,
    UPDATE_RADIUS: 50,
    CULL_DISTANCE: 100
};

export const GAME_STATES = {
    MENU: 'menu',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    CUTSCENE: 'cutscene'
};

export const DAMAGE_TYPES = {
    NORMAL: 'normal',
    HOLY: 'holy',
    FIRE: 'fire',
    POISON: 'poison',
    ELECTRIC: 'electric',
    PSYCHIC: 'psychic'
};

export const OBJECTIVE_TYPES = {
    KILL_ALL: 'kill_all',
    SURVIVE: 'survive',
    COLLECT: 'collect',
    REACH_EXIT: 'reach_exit',
    DEFEND: 'defend',
    ESCORT: 'escort',
    DESTROY_TARGET: 'destroy_target',
    ACTIVATE_SWITCHES: 'activate_switches'
};

// Level-specific constants
export const LEVEL_CONFIG = {
    CORRIDOR_WIDTH: 6,
    CORRIDOR_HEIGHT: 3,
    ROOM_HEIGHT: 5,
    WALL_THICKNESS: 0.5,
    DOOR_WIDTH: 4,
    DOOR_HEIGHT: 3,
    PILLAR_SIZE: 1,
    LIGHT_RANGE: 15,
    LIGHT_INTENSITY: 0.8,
    AMBIENT_LIGHT_INTENSITY: 0.2,
    EMERGENCY_LIGHT_COLOR: 0xff0000,
    EMERGENCY_LIGHT_INTENSITY: 0.3,
    FLICKER_CHANCE: 0.3,
    BLOOD_STAIN_OPACITY: 0.6,
    DAMAGE_DECAL_OPACITY: 0.7
};

// Timer intervals (to replace magic numbers in setTimeout/setInterval)
export const TIMERS = {
    FLICKER_INTERVAL: 100, // ms
    SPAWN_INTERVAL: 5000, // ms
    WAVE_INTERVAL: 10000, // ms
    DOOR_OPEN_DELAY: 1000, // ms
    EXPLOSION_DELAY: 500, // ms
    RESPAWN_DELAY: 3000, // ms
    MESSAGE_FADE_DELAY: 2000, // ms
    LEVEL_TRANSITION_DELAY: 2000, // ms
    HOWL_COOLDOWN: 10000, // ms
    LEAP_COOLDOWN: 3000, // ms
    SPEED_BOOST_DURATION: 3000 // ms
};

// Collision constants
export const COLLISION = {
    MAX_STEP_SIZE: 0.15, // Half the collision margin for continuous detection
    MAX_DELTA_TIME: 0.05, // Cap at 50ms (20 FPS minimum)
    PUSH_BACK_DISTANCE: 0.1,
    PUSH_BACK_MAX_ATTEMPTS: 10,
    ENEMY_PUSH_FACTOR: 0.5, // How much enemies and players push apart
    WALL_SLIDE_FACTOR: 0.7, // Sliding along walls
    EPSILON: 0.001 // Small value for floating point comparisons
};

// Shadow optimization settings
export const SHADOWS = {
    MAX_SHADOW_CASTERS: 3,
    SHADOW_MAP_SIZE: 1024,
    SHADOW_CAMERA_NEAR: 0.5,
    SHADOW_CAMERA_FAR: 50,
    SHADOW_BIAS: -0.001,
    SHADOW_NORMAL_BIAS: 0.01
};

// Zone management constants
export const ZONES = {
    MAX_MEMORY_MB: 100,
    PROXY_RADIUS: 50,
    SIMPLIFIED_RADIUS: 30,
    FULL_RADIUS: 20,
    UNLOAD_RADIUS: 100,
    PREDICTIVE_RADIUS: 40,
    MEMORY_CHECK_INTERVAL: 1000, // ms
    TRANSITION_DURATION: 1500, // ms
    MIN_FPS_FOR_FULL: 45,
    MIN_FPS_FOR_SIMPLIFIED: 30
};

// Visual effect constants
export const EFFECTS = {
    PARTICLE_POOL_SIZE: 100,
    EXPLOSION_PARTICLES: 20,
    BLOOD_PARTICLES: 5,
    SPARK_PARTICLES: 10,
    SMOKE_PARTICLES: 15,
    PARTICLE_GRAVITY: -9.8,
    PARTICLE_FRICTION: 0.95,
    PARTICLE_LIFETIME: 1.5, // seconds
    GLOW_INTENSITY: 0.5,
    FLASH_DURATION: 0.1, // seconds
    TRAIL_LENGTH: 10,
    IMPACT_SCALE: 1.5
};

// Tutorial constants
export const TUTORIAL = {
    STEP_DELAY: 1000, // ms
    MESSAGE_DURATION: 5000, // ms
    CARDINAL_HEIGHT: 2.0,
    MISSILE_LAUNCH_HEIGHT: 10,
    MISSILE_SPEED: 20,
    CAMERA_TRANSITION_TIME: 2000, // ms
    SWORD_VISIBILITY_DELAY: 200 // ms
};

// Boss constants
export const BOSS = {
    BELIAL_PHASES: 3,
    PHASE_HEALTH_THRESHOLDS: [0.75, 0.5, 0.25],
    TELEPORT_COOLDOWN: 5000, // ms
    SUMMON_COOLDOWN: 8000, // ms
    SPECIAL_ATTACK_COOLDOWN: 10000, // ms
    INVULNERABILITY_DURATION: 2000, // ms
    RAGE_MODE_THRESHOLD: 0.2, // 20% health
    MINION_SPAWN_COUNT: 3
};

// Weapon constants
export const WEAPONS = {
    SWORD_SWING_TIME: 0.3, // seconds
    SHOTGUN_RELOAD_TIME: 1.5, // seconds
    PISTOL_FIRE_RATE: 0.2, // seconds between shots
    GRENADE_FUSE_TIME: 3, // seconds
    ROCKET_SPEED: 30,
    PLASMA_SPEED: 40,
    RAILGUN_CHARGE_TIME: 1, // seconds
    MAX_PROJECTILE_DISTANCE: 100
};

// HUD constants
export const HUD = {
    HEALTH_LOW_THRESHOLD: 30,
    HEALTH_CRITICAL_THRESHOLD: 10,
    AMMO_LOW_THRESHOLD: 10,
    SCORE_POPUP_DURATION: 1000, // ms
    COMBO_TIMEOUT: 2000, // ms
    MESSAGE_FADE_TIME: 500, // ms
    RADAR_RADIUS: 30,
    MINIMAP_SIZE: 200
};

// Debug constants
export const DEBUG = {
    SHOW_COLLISION_BOXES: false,
    SHOW_AI_PATHS: false,
    SHOW_PERFORMANCE_STATS: false,
    LOG_LEVEL: 'info',
    SLOW_MOTION_FACTOR: 0.5,
    GOD_MODE_ENABLED: false,
    INFINITE_AMMO: false
};

// Memory optimization constants
export const MEMORY = {
    POOL_SIZES: {
        VECTORS: 50,
        QUATERNIONS: 20,
        MATRICES: 10,
        BULLETS: 100,
        PARTICLES: 200
    },
    CACHE_SIZES: {
        GEOMETRY: 50,
        MATERIAL: 30,
        TEXTURE: 20
    },
    GC_INTERVAL: 30000, // ms
    MEMORY_WARNING_THRESHOLD: 80, // MB
    MEMORY_CRITICAL_THRESHOLD: 95 // MB
};