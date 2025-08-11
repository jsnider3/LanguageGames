export const GameConfig = {
    // Weapon configurations
    weapons: {
        holyWaterSprinkler: {
            damage: 15,
            fireRate: 100,
            range: 15,
            ammo: Infinity,
            damageType: 'holy',
            splashRadius: 3,
            dotDamage: 5,
            dotDuration: 3000
        },
        
        holyLance: {
            damage: 75,
            fireRate: 1200,
            range: 5,
            damageType: 'holy',
            pierceCount: 3,
            chargeTime: 1000,
            maxChargeDamage: 150
        },
        
        throwingCrucifixes: {
            damage: 40,
            fireRate: 600,
            range: 30,
            ammo: 50,
            clipSize: 10,
            damageType: 'holy',
            bounceCount: 2,
            seekRadius: 5
        },
        
        sacredWarhammer: {
            damage: 100,
            fireRate: 1500,
            range: 4,
            damageType: 'holy',
            aoeRadius: 6,
            stunDuration: 1000,
            quakeRadius: 10
        },
        
        blessedCrossbow: {
            damage: 80,
            fireRate: 1800,
            range: 50,
            ammo: 30,
            clipSize: 5,
            damageType: 'holy',
            penetration: true,
            explosiveTip: true
        },
        
        vaticanPistol: {
            damage: 35,
            fireRate: 400,
            range: 40,
            ammo: 150,
            clipSize: 12,
            damageType: 'holy',
            headshotMultiplier: 2.5,
            silverBullets: true
        },
        
        plasmaDisintegrator: {
            damage: 45,
            fireRate: 200,
            range: 35,
            damageType: 'energy',
            chargeMultiplier: 3,
            heatGeneration: 10,
            maxHeat: 100,
            coolingRate: 15
        },
        
        gravityHammer: {
            damage: 120,
            fireRate: 2000,
            range: 5,
            damageType: 'physical',
            gravityRadius: 8,
            gravityForce: 50,
            slamRadius: 12
        },
        
        phaseShifter: {
            damage: 30,
            fireRate: 500,
            range: 25,
            damageType: 'dimensional',
            phaseDuration: 3000,
            phaseSpeed: 2,
            voidDamage: 10
        },
        
        neuralScrambler: {
            damage: 20,
            fireRate: 800,
            range: 20,
            damageType: 'psychic',
            confusionDuration: 4000,
            mindControlDuration: 2000,
            fearRadius: 10
        },
        
        temporalMine: {
            damage: 150,
            deployTime: 1000,
            triggerRadius: 3,
            explosionRadius: 8,
            damageType: 'temporal',
            slowRadius: 15,
            slowDuration: 5000,
            maxDeployed: 3
        }
    },

    // Enemy configurations
    enemies: {
        imp: {
            health: 50,
            speed: 2,
            damage: 15,
            attackRange: 15,
            detectionRange: 20,
            fireballSpeed: 10,
            fireballDamage: 20,
            xpReward: 10
        },
        
        hellhound: {
            health: 80,
            speed: 4,
            damage: 25,
            attackRange: 3,
            detectionRange: 25,
            leapDistance: 8,
            packBonus: 1.2,
            burnDamage: 5,
            xpReward: 15
        },
        
        succubus: {
            health: 120,
            speed: 3,
            damage: 30,
            attackRange: 20,
            detectionRange: 30,
            teleportCooldown: 3000,
            charmDuration: 2000,
            illusionHealth: 40,
            xpReward: 25
        },
        
        brimstoneGolem: {
            health: 250,
            speed: 1.5,
            damage: 50,
            attackRange: 5,
            detectionRange: 15,
            explosionRadius: 10,
            explosionDamage: 100,
            armor: 0.3,
            xpReward: 40
        },
        
        shadowWraith: {
            health: 100,
            speed: 3.5,
            damage: 35,
            attackRange: 4,
            detectionRange: 35,
            phaseShiftCooldown: 2000,
            invisibilityDuration: 3000,
            lifeDrain: 10,
            xpReward: 30
        },
        
        demonKnight: {
            health: 300,
            speed: 2,
            damage: 60,
            attackRange: 6,
            detectionRange: 20,
            shieldHealth: 100,
            shieldRegenRate: 10,
            chargeSpeed: 6,
            xpReward: 50
        },
        
        zombieAgent: {
            health: 150,
            speed: 2.5,
            damage: 40,
            attackRange: 25,
            detectionRange: 30,
            infectionChance: 0.3,
            reanimationDelay: 5000,
            techWeaponDamage: 30,
            xpReward: 35
        },
        
        alienHybrid: {
            health: 180,
            speed: 3,
            damage: 45,
            attackRange: 20,
            detectionRange: 40,
            psychicDamage: 25,
            adaptationRate: 0.1,
            telekinesisCooldown: 4000,
            xpReward: 45
        },
        
        possessedMechSuit: {
            health: 400,
            speed: 1.8,
            damage: 70,
            attackRange: 30,
            detectionRange: 35,
            armor: 0.5,
            missileDamage: 60,
            selfDestructDamage: 200,
            xpReward: 60
        },
        
        corruptedDrone: {
            health: 60,
            speed: 3.5,
            damage: 20,
            attackRange: 12,
            detectionRange: 30,
            flightHeight: 5,
            laserDamage: 15,
            empRadius: 8,
            xpReward: 20
        }
    },

    // Boss configurations
    bosses: {
        theDefiler: {
            health: 2000,
            phases: 3,
            minionSpawnRate: 10000,
            maxMinions: 8,
            corruptionRadius: 20,
            plagueCloudDamage: 10,
            xpReward: 500
        },
        
        subjectZero: {
            health: 1800,
            teleportCooldown: 2000,
            psychicStormRadius: 15,
            psychicStormDamage: 30,
            cloneHealth: 300,
            maxClones: 3,
            xpReward: 500
        },
        
        theIronTyrant: {
            health: 2500,
            partHealth: 200,
            berserkThreshold: 0.3,
            rocketDamage: 80,
            laserDamage: 50,
            cannonDamage: 100,
            xpReward: 600
        },
        
        belial: {
            health: 3000,
            maxIllusions: 6,
            illusionHealth: 200,
            formChangeInterval: 15000,
            realityTearDamage: 15,
            mindPrisonDuration: 5000,
            xpReward: 1000
        }
    },

    // Player configurations
    player: {
        maxHealth: 100,
        maxArmor: 100,
        maxHolyPower: 100,
        moveSpeed: 5,
        sprintMultiplier: 1.5,
        jumpHeight: 2,
        
        holyRage: {
            maxCharge: 100,
            chargeRate: 1,
            decayRate: 0.5,
            damageMultiplier: 2,
            duration: 10000
        },
        
        martyrdom: {
            duration: 10000,
            damageMultiplier: 3,
            moveSpeedMultiplier: 1.5,
            invincible: true
        },
        
        confession: {
            range: 3,
            duration: 3000,
            intelChance: 0.5,
            healAmount: 20
        }
    },

    // Level configurations
    levels: {
        laboratoryComplex: {
            enemyCount: 20,
            enemyTypes: ['zombieAgent', 'alienHybrid', 'corruptedDrone'],
            keycardTypes: ['red', 'blue', 'yellow'],
            secretCount: 3
        },
        
        containmentArea: {
            enemyCount: 25,
            enemyTypes: ['imp', 'hellhound', 'shadowWraith'],
            hazardDamage: 5,
            hazardInterval: 1000
        },
        
        tunnelNetwork: {
            enemyCount: 30,
            enemyTypes: ['zombieAgent', 'hellhound', 'demonKnight'],
            visibility: 0.5,
            ambushChance: 0.3
        },
        
        spawningGrounds: {
            waveCount: 5,
            baseEnemyCount: 10,
            waveMultiplier: 1.5,
            spawnInterval: 30000
        },
        
        observatoryTower: {
            enemyCount: 15,
            enemyTypes: ['corruptedDrone', 'alienHybrid'],
            gravityStrength: 0.3,
            platformCount: 10
        },
        
        communicationsTower: {
            floorCount: 8,
            enemiesPerFloor: 5,
            elevatorSpeed: 2,
            signalStrength: 100
        },
        
        reactorCore: {
            radiationDamage: 10,
            radiationInterval: 2000,
            meltdownTimer: 300000,
            coolantValves: 4
        },
        
        finalArena: {
            boss: 'belial',
            phaseEnemyCounts: [10, 15, 20, 25],
            arenaRadius: 30,
            pillarCount: 8
        }
    },

    // Power-up configurations
    powerups: {
        divineShield: {
            duration: 10000,
            damageReduction: 0.5,
            reflectChance: 0.3
        },
        
        saintsWrath: {
            duration: 15000,
            damageMultiplier: 2,
            attackSpeed: 1.5
        },
        
        miraculousHealing: {
            healAmount: 50,
            regenDuration: 10000,
            regenRate: 5
        },
        
        etherealStep: {
            duration: 8000,
            speedMultiplier: 2,
            phaseThrough: true
        },
        
        revelation: {
            duration: 20000,
            sightRange: 2,
            weakpointHighlight: true
        }
    },

    // Difficulty settings
    difficulty: {
        novice: {
            enemyHealthMultiplier: 0.75,
            enemyDamageMultiplier: 0.75,
            playerDamageMultiplier: 1.25,
            ammoMultiplier: 1.5,
            xpMultiplier: 1.0
        },
        
        crusader: {
            enemyHealthMultiplier: 1.0,
            enemyDamageMultiplier: 1.0,
            playerDamageMultiplier: 1.0,
            ammoMultiplier: 1.0,
            xpMultiplier: 1.0
        },
        
        martyr: {
            enemyHealthMultiplier: 1.5,
            enemyDamageMultiplier: 1.5,
            playerDamageMultiplier: 0.75,
            ammoMultiplier: 0.75,
            xpMultiplier: 1.5
        },
        
        damnation: {
            enemyHealthMultiplier: 2.0,
            enemyDamageMultiplier: 2.0,
            playerDamageMultiplier: 0.5,
            ammoMultiplier: 0.5,
            xpMultiplier: 2.0,
            permadeath: true
        }
    },

    // Graphics settings
    graphics: {
        low: {
            shadowQuality: 0,
            textureQuality: 0.5,
            particleCount: 0.25,
            postProcessing: false,
            maxLights: 4
        },
        
        medium: {
            shadowQuality: 1,
            textureQuality: 0.75,
            particleCount: 0.5,
            postProcessing: true,
            maxLights: 8
        },
        
        high: {
            shadowQuality: 2,
            textureQuality: 1.0,
            particleCount: 1.0,
            postProcessing: true,
            maxLights: 16
        },
        
        ultra: {
            shadowQuality: 3,
            textureQuality: 1.0,
            particleCount: 1.5,
            postProcessing: true,
            maxLights: 32,
            raytracing: true
        }
    },

    // Audio settings
    audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 1.0,
        voiceVolume: 1.0,
        
        distanceModel: 'exponential',
        rolloffFactor: 2,
        refDistance: 1,
        maxDistance: 100
    },

    // Controls
    controls: {
        keyboard: {
            forward: 'W',
            backward: 'S',
            left: 'A',
            right: 'D',
            jump: 'Space',
            sprint: 'Shift',
            crouch: 'C',
            fire: 'MouseLeft',
            altFire: 'MouseRight',
            reload: 'R',
            interact: 'E',
            holyRage: 'Q',
            confession: 'F',
            weaponWheel: 'Tab'
        },
        
        mouse: {
            sensitivity: 1.0,
            invertY: false,
            smoothing: 0.1
        },
        
        gamepad: {
            deadzone: 0.15,
            vibration: true,
            aimAssist: 0.3
        }
    },

    // Accessibility
    accessibility: {
        colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia
        subtitles: true,
        subtitleSize: 1.0,
        screenShake: 1.0,
        motionBlur: true,
        flashingLights: true,
        autoAim: 0,
        holdToAim: false
    }
};

// Configuration manager class
export class ConfigManager {
    constructor() {
        this.config = { ...GameConfig };
        this.userOverrides = {};
        this.loadUserSettings();
    }

    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        this.saveUserSettings();
    }

    reset(path = null) {
        if (path) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let source = GameConfig;
            let target = this.config;
            
            for (const key of keys) {
                source = source[key];
                target = target[key];
            }
            
            target[lastKey] = { ...source[lastKey] };
        } else {
            this.config = { ...GameConfig };
        }
        
        this.saveUserSettings();
    }

    loadUserSettings() {
        try {
            const saved = localStorage.getItem('saintdoom_config');
            if (saved) {
                this.userOverrides = JSON.parse(saved);
                this.applyOverrides();
            }
        } catch (e) {
            console.error('Failed to load user settings:', e);
        }
    }

    saveUserSettings() {
        try {
            localStorage.setItem('saintdoom_config', JSON.stringify(this.userOverrides));
        } catch (e) {
            console.error('Failed to save user settings:', e);
        }
    }

    applyOverrides() {
        // Deep merge overrides into config
        const merge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        
        merge(this.config, this.userOverrides);
    }

    getDifficultySettings(difficulty) {
        return this.config.difficulty[difficulty] || this.config.difficulty.crusader;
    }

    getWeaponConfig(weaponName) {
        return this.config.weapons[weaponName];
    }

    getEnemyConfig(enemyType) {
        return this.config.enemies[enemyType];
    }

    getBossConfig(bossName) {
        return this.config.bosses[bossName];
    }
}

// Export singleton instance
export const configManager = new ConfigManager();