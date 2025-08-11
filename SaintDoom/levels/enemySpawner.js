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
        if (config.health) enemy.health = config.health;
        if (config.speed) enemy.speed = config.speed;
        if (config.damage) enemy.damage = config.damage;
        if (config.scale) enemy.scale = config.scale;

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

            // Scale enemy stats based on wave number
            const config = {
                health: 1 + waveNumber * 0.1,
                speed: 1 + waveNumber * 0.05,
                damage: 1 + waveNumber * 0.1
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

    /**
     * Create spawn positions in a circle
     */
    createCircularSpawnPositions(center, radius, count, height = 0) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            positions.push({
                x: center.x + Math.cos(angle) * radius,
                y: center.y + height,
                z: center.z + Math.sin(angle) * radius
            });
        }
        return positions;
    }

    /**
     * Create spawn positions in a grid
     */
    createGridSpawnPositions(center, width, depth, spacing, height = 0) {
        const positions = [];
        const cols = Math.floor(width / spacing);
        const rows = Math.floor(depth / spacing);
        const offsetX = -(cols - 1) * spacing / 2;
        const offsetZ = -(rows - 1) * spacing / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: center.x + offsetX + col * spacing,
                    y: center.y + height,
                    z: center.z + offsetZ + row * spacing
                });
            }
        }
        return positions;
    }

    /**
     * Create random spawn positions within a rectangular area
     */
    createRandomSpawnPositions(center, width, depth, count, height = 0) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push({
                x: center.x + (Math.random() - 0.5) * width,
                y: center.y + height,
                z: center.z + (Math.random() - 0.5) * depth
            });
        }
        return positions;
    }

    /**
     * Get pattern configuration
     */
    getPattern(name) {
        return this.spawnPatterns[name];
    }

    /**
     * Add custom pattern
     */
    addPattern(name, config) {
        this.spawnPatterns[name] = config;
    }

    /**
     * Register custom enemy type
     */
    registerEnemyType(name, enemyClass) {
        this.enemyTypes[name] = enemyClass;
    }
}