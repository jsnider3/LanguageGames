// ============= GAME CONFIGURATION =============
export const GAME_CONFIG = {
    PLAYER: {
        MOVEMENT: {
            SPEED: 10,
            SPRINT_MULTIPLIER: 1.5,
            FRICTION: 0.9,
            BOB_SPEED: 0.018,
            BASE_HEIGHT: 1.7,
            RADIUS: 0.3,
            HEIGHT: 1.8
        },
        MOUSE: {
            SENSITIVITY: 0.008,
            MAX_PITCH: Math.PI / 2 - 0.1
        },
        HEALTH: {
            MAX_HEALTH: 100,
            MAX_ARMOR: 100
        },
        AMMO: {
            INITIAL_SHELLS: 8,
            INITIAL_BULLETS: 50,
            MAX_SHELLS: 50,
            MAX_BULLETS: 200,
            MAX_CELLS: 100,
            MAX_ROCKETS: 25
        },
        RAGE: {
            MAX_RAGE: 100,
            DECAY_RATE: 2,
            DURATION: 5,
            SPEED_BOOST: 1.5,
            BUILD_MELEE: 15,
            BUILD_KILL_BONUS: 10
        }
    },
    
    ENEMIES: {
        SCIENTIST: {
            HEALTH: 50,
            DAMAGE: 10,
            MOVE_SPEED: 2,
            SCORE_VALUE: 100,
            ATTACK_RANGE: 2,
            ATTACK_COOLDOWN: 1.5,
            SIGHT_RANGE: 15,
            MESH_COLOR: 0x4444ff,
            EYE_COLOR: 0xff0000,
            SIZE: { WIDTH: 0.8, HEIGHT: 1.8, DEPTH: 0.4 }
        },
        HELLHOUND: {
            HEALTH: 30,
            DAMAGE: 8,  // Reduced from 15 for testing
            MOVE_SPEED: 4,  // Reduced from 6 - less overwhelming
            SCORE_VALUE: 150,
            ATTACK_RANGE: 1.5,
            ATTACK_COOLDOWN: 1.2,  // Increased from 0.8 - attacks less frequently
            SIGHT_RANGE: 15,  // Reduced from 20 - won't detect you as far away
            MESH_COLOR: 0x990000,
            EYE_COLOR: 0xffff00,
            SIZE: { WIDTH: 1.2, HEIGHT: 0.8, DEPTH: 0.6 }
        },
        BELIAL: {
            HEALTH: 500,
            DAMAGE: 30,
            MOVE_SPEED: 3,
            SCORE_VALUE: 5000,
            ATTACK_RANGE: 3,
            ATTACK_COOLDOWN: 2,
            SIGHT_RANGE: 30,
            MESH_COLOR: 0x330000,
            EYE_COLOR: 0xff00ff,
            SIZE: { WIDTH: 2, HEIGHT: 3, DEPTH: 1 }
        }
    },
    
    WEAPONS: {
        SWORD: {
            DAMAGE: 25,
            RANGE: 3,
            COOLDOWN: 0.5,
            COMBO_DAMAGES: [25, 50, 75],
            SWING_ARC: 90
        },
        SHOTGUN: {
            DAMAGE: 100,
            RANGE: 30,
            COOLDOWN: 1.5,
            SPREAD: 0.2,
            PELLET_COUNT: 8,
            AMMO_TYPE: 'shells',
            AMMO_USE: 1
        },
        HOLYWATER: {
            DAMAGE: 50,
            RADIUS: 5,
            COOLDOWN: 0.8,
            THROW_FORCE: 15,
            BOUNCE_DAMPING: 0.5
        },
        CRUCIFIX: {
            DAMAGE: 75,
            RANGE: 50,
            COOLDOWN: 1.0,
            SPEED: 30
        }
    },
    
    PICKUPS: {
        HEALTH: {
            VALUE: 25,
            SCORE: 25,
            COLOR: 0xff0000,
            SIZE: 0.4
        },
        SHELLS: {
            VALUE: 4,
            SCORE: 50,
            COLOR: 0x884422,
            COUNT: 3
        },
        ARMOR: {
            VALUE: 25,
            SCORE: 50,
            COLOR: 0x4444ff,
            SIZE: 0.4
        },
        RADIUS: 1.0,
        BOB_SPEED: 2,
        BOB_AMPLITUDE: 0.1
    },
    
    AUDIO: {
        PICKUP_FREQUENCY: 400,
        AMMO_FREQUENCY: 200,
        ARMOR_FREQUENCY: 300,
        DEFAULT_GAIN: 0.2,
        FADE_DURATION: 0.2,
        PITCH_VARIATION: 0.2,
        VOLUME_VARIATION: 0.1
    },
    
    COMBAT: {
        COMBO_RESET_TIME: 1000,
        COMBO_MULTIPLIERS: [1, 1.5, 2, 3],
        BLOCK_DAMAGE_REDUCTION: 0.7,
        PARRY_WINDOW: 200,
        DAMAGE_FLASH_DURATION: 100,
        CAMERA_SHAKE_MULTIPLIER: 0.1
    },
    
    LEVEL: {
        WALL_HEIGHT: 3,
        GRID_SIZE: 1,
        DOOR_TRIGGER_RADIUS: 2,
        SPAWN_DISTANCE_MIN: 5,
        SPAWN_DISTANCE_MAX: 15
    },
    
    MARTYRDOM: {
        DEATH_THRESHOLD: 7,
        DAMAGE_MULTIPLIER: 1.5,
        SPEED_MULTIPLIER: 1.2,
        HEALTH_BONUS: 50
    },
    
    ANIMATIONS: {
        BOB_SPEED: 0.02,
        BOB_AMPLITUDE: 0.1,
        DEATH_ANIMATION_DURATION: 2000,
        PARTICLE_LIFETIME: 1.5,
        PARTICLE_COUNT: 20,
        CAMERA_SHAKE_DECAY: 0.9
    },
    
    PHYSICS: {
        GRAVITY: 20,
        GRENADE_BOUNCE_DAMPING: 0.5,
        KNOCKBACK_FORCE: 10,
        ENEMY_SEPARATION_DISTANCE: 1.5,
        STUCK_THRESHOLD: 0.1,
        STUCK_TIME_LIMIT: 2
    },
    
    COLORS: {
        HOLY_GOLD: 0xffcc00,
        DEMON_RED: 0xff0000,
        BLESSED_BLUE: 0x00ccff,
        CORRUPTION_PURPLE: 0x9900ff,
        SACRED_WHITE: 0xffffff
    },
    
    UI: {
        MESSAGE_DURATION: 3000,
        DAMAGE_FLASH_OPACITY: 0.3,
        DEATH_SCREEN_FADE_TIME: 1000,
        HUD_UPDATE_RATE: 100
    }
};