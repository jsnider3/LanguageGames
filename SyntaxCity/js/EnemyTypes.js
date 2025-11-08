// SyntaxCity - Specialized Enemy Types

import { Enemy } from './Enemy.js';
import { ENEMY_TYPES } from './Constants.js';

// Most enemies use the base Enemy class with special properties
// Only enemies with complex unique behavior need custom classes

export class SpaghettiCodeBoss extends Enemy {
    constructor(path, waveNumber) {
        super(ENEMY_TYPES.SPAGHETTI_CODE, path, waveNumber);
        this.minionSpawnTimer = 0;
        this.minionSpawnInterval = this.special.spawnInterval;
    }

    updateSpecialBehavior(dt, game) {
        this.minionSpawnTimer += dt;
        if (this.minionSpawnTimer >= this.minionSpawnInterval) {
            this.minionSpawnTimer = 0;
            this.spawnMinion(game);
        }
    }

    spawnMinion(game) {
        // Spawn a weaker enemy at current position
        if (game && game.spawnEnemy) {
            game.spawnEnemy(ENEMY_TYPES.SYNTAX_ERROR, this.getProgress());
        }
    }
}

export class LegacySystemBoss extends Enemy {
    constructor(path, waveNumber) {
        super(ENEMY_TYPES.LEGACY_SYSTEM, path, waveNumber);
        this.waveTowerIds = new Set();  // Track towers that existed at wave start
    }

    takeDamage(amount, game, towerId) {
        // Immune to towers placed during the wave
        if (game && game.currentWaveActive && !this.waveTowerIds.has(towerId)) {
            return 0;  // Immune to new towers
        }
        return super.takeDamage(amount, game);
    }

    setExistingTowers(towerIds) {
        this.waveTowerIds = new Set(towerIds);
    }
}

export class ProductionBugBoss extends Enemy {
    constructor(path, waveNumber) {
        super(ENEMY_TYPES.PRODUCTION_BUG, path, waveNumber);
        this.phases = this.special.multiPhase;
        this.currentPhase = 0;
        this.hasSpawnedReinforcements = [false, false, false];
    }

    updateSpecialBehavior(dt, game) {
        const hpPercent = this.getHpPercent();

        // Check for phase transitions
        for (let i = 0; i < this.phases.length; i++) {
            if (hpPercent <= this.phases[i] && !this.hasSpawnedReinforcements[i]) {
                this.hasSpawnedReinforcements[i] = true;
                this.spawnReinforcements(game);
            }
        }
    }

    spawnReinforcements(game) {
        // Spawn multiple strong enemies
        if (game && game.spawnEnemy) {
            const progress = this.getProgress();
            for (let i = 0; i < 5; i++) {
                const enemyType = [
                    ENEMY_TYPES.STACK_OVERFLOW,
                    ENEMY_TYPES.HEAP_CORRUPTION,
                    ENEMY_TYPES.BUFFER_OVERFLOW
                ][i % 3];
                game.spawnEnemy(enemyType, Math.max(0, progress - 0.1));
            }
        }
    }
}

export class HeapCorruptionEnemy extends Enemy {
    constructor(path, waveNumber) {
        super(ENEMY_TYPES.HEAP_CORRUPTION, path, waveNumber);
        this.teleportTimer = 0;
        this.teleportInterval = 2.0 + Math.random() * 2.0;
    }

    updateSpecialBehavior(dt, game) {
        this.teleportTimer += dt;
        if (this.teleportTimer >= this.teleportInterval) {
            this.teleportTimer = 0;
            this.teleportInterval = 2.0 + Math.random() * 2.0;

            // Teleport short distance along path
            const currentProgress = this.getProgress();
            const jumpDistance = 0.05 + Math.random() * 0.1;
            const newProgress = Math.min(1.0, currentProgress + jumpDistance);
            this.teleport(newProgress);
        }
    }
}

export class MemoryLeakEnemy extends Enemy {
    constructor(path, waveNumber) {
        super(ENEMY_TYPES.MEMORY_LEAK, path, waveNumber);
    }

    die(game) {
        super.die(game);

        // Spawn mini-leaks
        if (game && game.spawnEnemy) {
            const progress = this.getProgress();
            for (let i = 0; i < this.special.splitOnDeath; i++) {
                // Create a mini version with reduced HP
                game.spawnMiniEnemy(ENEMY_TYPES.SYNTAX_ERROR, progress, 0.5);
            }
        }
    }
}

// Factory function to create the appropriate enemy type
export function createEnemy(type, path, waveNumber) {
    switch (type) {
        case ENEMY_TYPES.SPAGHETTI_CODE:
            return new SpaghettiCodeBoss(path, waveNumber);
        case ENEMY_TYPES.LEGACY_SYSTEM:
            return new LegacySystemBoss(path, waveNumber);
        case ENEMY_TYPES.PRODUCTION_BUG:
            return new ProductionBugBoss(path, waveNumber);
        case ENEMY_TYPES.HEAP_CORRUPTION:
            return new HeapCorruptionEnemy(path, waveNumber);
        case ENEMY_TYPES.MEMORY_LEAK:
            return new MemoryLeakEnemy(path, waveNumber);
        default:
            return new Enemy(type, path, waveNumber);
    }
}
