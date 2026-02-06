import { Imp } from '../enemies/imp.js';
import { Hellhound } from '../enemies/hellhound.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import { BrimstoneGolem } from '../enemies/brimstoneGolem.js';
import { DemonKnight } from '../enemies/demonKnight.js';
import { Succubus } from '../enemies/succubus.js';
import { PossessedScientist } from '../enemies/possessedScientist.js';

/**
 * Enemy spawning utilities for levels
 */
export class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemyTypes = {
            'imp': Imp,
            'hellhound': Hellhound,
            'wraith': ShadowWraith,
            'golem': BrimstoneGolem,
            'knight': DemonKnight,
            'succubus': Succubus,
            'scientist': PossessedScientist
        };

        // Predefined spawn patterns
        this.spawnPatterns = {
            // Early game - weaker enemies
            early: {
                weights: { imp: 0.6, hellhound: 0.4 },
                maxAtOnce: 3
            },
            // Mid game - mixed difficulty
            mid: {
                weights: { imp: 0.3, hellhound: 0.3, wraith: 0.25, scientist: 0.15 },
                maxAtOnce: 5
            },
            // Late game - harder enemies
            late: {
                weights: { imp: 0.2, hellhound: 0.2, wraith: 0.25, golem: 0.2, knight: 0.15 },
                maxAtOnce: 7
            },
            // Boss support - elite enemies
            elite: {
                weights: { knight: 0.4, golem: 0.35, succubus: 0.25 },
                maxAtOnce: 4
            },
            // Swarm - lots of weak enemies
            swarm: {
                weights: { imp: 0.8, hellhound: 0.2 },
                maxAtOnce: 10
            },
            // Hell theme - demonic enemies
            hell: {
                weights: { imp: 0.25, hellhound: 0.25, wraith: 0.25, knight: 0.25 },
                maxAtOnce: 6
            },
            // Lab theme - corrupted humans and demons
            lab: {
                weights: { scientist: 0.5, imp: 0.3, wraith: 0.2 },
                maxAtOnce: 4
            }
        };
    }

    /**
     * Spawn a single enemy of specified type
     */
    spawnEnemy(type, position, config = {}) {
        const EnemyClass = this.enemyTypes[type];
        if (!EnemyClass) {
            console.warn(`Unknown enemy type: ${type}`);
            return null;
        }

        const enemy = new EnemyClass(this.scene, position);
        
        // Apply configuration
        if (typeof config.health === 'number') {
            enemy.health = config.health;
            if (typeof enemy.maxHealth === 'number') {
                enemy.maxHealth = Math.max(enemy.maxHealth, enemy.health);
            } else {
                enemy.maxHealth = enemy.health;
            }
        }
        if (typeof config.damage === 'number') {
            enemy.damage = config.damage;
        }
        if (typeof config.speed === 'number') {
            if (typeof enemy.moveSpeed === 'number') enemy.moveSpeed = config.speed;
            if (typeof enemy.speed === 'number') enemy.speed = config.speed;
        }

        // Multiplier support (useful for wave scaling)
        if (typeof config.healthMultiplier === 'number') {
            const m = config.healthMultiplier;
            if (typeof enemy.health === 'number') enemy.health *= m;
            if (typeof enemy.maxHealth === 'number') enemy.maxHealth *= m;
        }
        if (typeof config.damageMultiplier === 'number' && typeof enemy.damage === 'number') {
            enemy.damage *= config.damageMultiplier;
        }
        if (typeof config.speedMultiplier === 'number') {
            const m = config.speedMultiplier;
            if (typeof enemy.moveSpeed === 'number') enemy.moveSpeed *= m;
            if (typeof enemy.speed === 'number') enemy.speed *= m;
        }

        if (typeof config.scale === 'number') {
            // Prefer scaling the rendered mesh/group if present
            if (enemy.mesh && enemy.mesh.scale && typeof enemy.mesh.scale.setScalar === 'function') {
                enemy.mesh.scale.setScalar(config.scale);
            } else if (enemy.mesh && enemy.mesh.scale) {
                enemy.mesh.scale.set(config.scale, config.scale, config.scale);
            } else {
                enemy.scale = config.scale;
            }
        }

        return enemy;
    }

    /**
     * Spawn multiple enemies using a pattern
     */
    spawnWave(pattern, positions, waveNumber = 1) {
        const patternConfig = this.spawnPatterns[pattern];
        if (!patternConfig) {
            console.warn(`Unknown spawn pattern: ${pattern}`);
            return [];
        }

        const enemiesToSpawn = Math.min(
            Math.floor(patternConfig.maxAtOnce * (1 + waveNumber * 0.1)),
            positions.length
        );

        const enemies = [];
        const availablePositions = [...positions];

        for (let i = 0; i < enemiesToSpawn; i++) {
            if (availablePositions.length === 0) break;

            const enemyType = this.selectEnemyByWeight(patternConfig.weights, waveNumber);
            const positionIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions.splice(positionIndex, 1)[0];

            // Scale enemy stats based on wave number (multipliers, not absolute values)
            const progression = Math.max(0, waveNumber - 1);
            const config = {
                healthMultiplier: 1 + progression * 0.1,
                speedMultiplier: 1 + progression * 0.05,
                damageMultiplier: 1 + progression * 0.1
            };

            const enemy = this.spawnEnemy(enemyType, position, config);
            if (enemy) {
                enemies.push(enemy);
            }
        }

        return enemies;
    }

    /**
     * Select enemy type based on weighted probabilities
     */
    selectEnemyByWeight(weights, waveNumber = 1) {
        // Adjust weights based on wave progression
        const adjustedWeights = { ...weights };
        if (waveNumber > 5) {
            // Reduce weak enemy spawn rates in later waves
            if (adjustedWeights.imp) adjustedWeights.imp *= 0.7;
            // Increase strong enemy spawn rates
            if (adjustedWeights.knight) adjustedWeights.knight *= 1.3;
            if (adjustedWeights.golem) adjustedWeights.golem *= 1.2;
        }

        const totalWeight = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [type, weight] of Object.entries(adjustedWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }

        // Fallback to first type
        return Object.keys(adjustedWeights)[0];
    }
}
