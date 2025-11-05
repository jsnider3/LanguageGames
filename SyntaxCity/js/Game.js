// SyntaxCity - Main Game Class

import { GridManager } from './GridManager.js';
import { getLevel, LEVELS } from './Level.js';
import { createTower } from './TowerTypes.js';
import { createEnemy } from './EnemyTypes.js';
import { EffectsManager } from './EffectsManager.js';
import { Renderer } from './Renderer.js';
import { UIManager } from './UIManager.js';
import { SaveManager } from './SaveManager.js';
import { worldToGrid, gridToWorld, distance } from './Utils.js';
import {
    GAME_STATES,
    GAME_CONFIG,
    STARTING_RESOURCES,
    TOWER_STATS,
    GRID,
    COMBO_BONUSES,
    POWER_UPS,
    TOWER_TYPES
} from './Constants.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.grid = new GridManager();
        this.effects = new EffectsManager();
        this.saveManager = new SaveManager();

        // Game state
        this.state = GAME_STATES.MENU;
        this.currentLevel = null;
        this.currentWaveNumber = 0;
        this.waveActive = false;
        this.wavePrepTime = GAME_CONFIG.WAVE_PREP_TIME;

        // Resources
        this.memoryUnits = STARTING_RESOURCES.memoryUnits;
        this.cpuCycles = STARTING_RESOURCES.cpuCycles;
        this.lives = STARTING_RESOURCES.lives;

        // Entities
        this.enemies = [];
        this.projectiles = [];

        // Tower placement
        this.placingTower = false;
        this.placingTowerType = null;
        this.selectedTower = null;
        this.selectedEnemy = null;

        // Mouse state
        this.mouseWorldX = null;
        this.mouseWorldY = null;
        this.mouseGridX = null;
        this.mouseGridY = null;

        // Power-ups
        this.powerUpCooldowns = {};

        // Wave management
        this.currentWaveEnemies = [];
        this.waveSpawnIndex = 0;
        this.waveSpawnTimer = 0;

        // Settings
        this.showPaths = true;
        this.showCombos = true;
        this.showRanges = false;
        this.gameSpeed = 1.0;
        this.paused = false;

        // Progression
        this.unlockedLevels = [1];
        this.researchPoints = 0;
        this.permanentUpgrades = {};

        // Stats
        this.totalKills = 0;
        this.totalWavesCompleted = 0;
        this.totalDamageDealt = 0;

        // UI
        this.ui = new UIManager(this);

        // Setup
        this.setupCanvas();
        this.setupInput();
        this.loadSave();

        // Start game
        this.startLevel(1);
        this.startGameLoop();
    }

    setupCanvas() {
        this.canvas.width = GRID.WIDTH;
        this.canvas.height = GRID.HEIGHT;
    }

    setupInput() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseWorldX = ((e.clientX - rect.left) / rect.width) * GRID.WIDTH;
        this.mouseWorldY = ((e.clientY - rect.top) / rect.height) * GRID.HEIGHT;

        const gridPos = worldToGrid(this.mouseWorldX, this.mouseWorldY, GRID.TILE_SIZE);
        this.mouseGridX = gridPos.x;
        this.mouseGridY = gridPos.y;
    }

    handleClick(e) {
        if (this.placingTowerType) {
            this.placeTower(this.mouseGridX, this.mouseGridY, this.placingTowerType);
        } else {
            this.selectEntity(this.mouseWorldX, this.mouseWorldY);
        }
    }

    handleRightClick(e) {
        this.cancelPlacement();
    }

    startLevel(levelId) {
        this.currentLevel = getLevel(levelId);
        this.currentWaveNumber = 0;
        this.waveActive = false;
        this.wavePrepTime = GAME_CONFIG.WAVE_PREP_TIME;

        // Reset resources
        this.memoryUnits = STARTING_RESOURCES.memoryUnits;
        this.cpuCycles = STARTING_RESOURCES.cpuCycles;
        this.lives = STARTING_RESOURCES.lives;

        // Clear entities
        this.enemies = [];
        this.projectiles = [];
        this.grid.clear();
        this.effects.clear();

        // Setup level
        this.grid.setLevel(this.currentLevel);

        // Reset state
        this.selectedTower = null;
        this.selectedEnemy = null;
        this.cancelPlacement();

        this.state = GAME_STATES.WAVE_PREP;
    }

    startWave() {
        if (this.waveActive) return;
        if (this.currentWaveNumber >= this.currentLevel.waves.length) return;

        this.waveActive = true;
        this.currentWaveEnemies = [...this.currentLevel.waves[this.currentWaveNumber]];
        this.waveSpawnIndex = 0;
        this.waveSpawnTimer = 0;

        // Reset tower catches for new wave
        for (let tower of this.grid.towers) {
            tower.resetCatchesForWave();
        }

        // For Legacy System boss, record existing towers
        const legacyBoss = this.enemies.find(e => e.type === 'legacy_system');
        if (legacyBoss) {
            const towerIds = this.grid.towers.map(t => t.id);
            legacyBoss.setExistingTowers(towerIds);
        }

        this.currentWaveNumber++;
    }

    selectTowerType(type) {
        const stats = TOWER_STATS[type];
        if (!stats) return;

        if (this.memoryUnits >= stats.cost) {
            this.placingTowerType = type;
            this.placingTower = true;
            this.selectedTower = null;
            this.selectedEnemy = null;
        }
    }

    cancelPlacement() {
        this.placingTower = false;
        this.placingTowerType = null;
    }

    placeTower(gridX, gridY, type) {
        if (!this.grid.canBuild(gridX, gridY)) {
            return false;
        }

        const stats = TOWER_STATS[type];
        if (this.memoryUnits < stats.cost) {
            return false;
        }

        const worldPos = gridToWorld(gridX, gridY, GRID.TILE_SIZE);
        const tower = createTower(type, gridX, gridY, worldPos.x, worldPos.y);

        this.grid.addTower(tower);
        this.memoryUnits -= stats.cost;

        // Apply combo bonuses
        this.updateComboBonuses();

        // Effect
        this.effects.createTowerPlaceEffect(worldPos.x, worldPos.y, stats.color);

        // Auto-select
        this.selectedTower = tower;
        this.cancelPlacement();

        return true;
    }

    upgradeTower() {
        if (!this.selectedTower) return false;
        if (this.selectedTower.tier >= 3) return false;

        const cost = this.selectedTower.upgradeCost;
        const cpuCost = this.selectedTower.upgradeCpuCost;

        if (this.memoryUnits >= cost && this.cpuCycles >= cpuCost) {
            this.memoryUnits -= cost;
            this.cpuCycles -= cpuCost;
            this.selectedTower.upgrade();

            // Effect
            this.effects.createTowerPlaceEffect(
                this.selectedTower.x,
                this.selectedTower.y,
                this.selectedTower.color
            );

            return true;
        }

        return false;
    }

    sellTower() {
        if (!this.selectedTower) return false;

        const refund = this.selectedTower.getSellValue();
        this.memoryUnits += refund;

        this.grid.removeTower(this.selectedTower);
        this.selectedTower = null;

        // Update combo bonuses
        this.updateComboBonuses();

        return true;
    }

    selectEntity(worldX, worldY) {
        // Try to select tower
        const gridPos = worldToGrid(worldX, worldY, GRID.TILE_SIZE);
        const tower = this.grid.getTowerAt(gridPos.x, gridPos.y);

        if (tower) {
            this.selectedTower = tower;
            this.selectedEnemy = null;
            return;
        }

        // Try to select enemy
        for (let enemy of this.enemies) {
            if (!enemy.isAlive()) continue;
            const dist = distance(worldX, worldY, enemy.x, enemy.y);
            if (dist < enemy.size) {
                this.selectedEnemy = enemy;
                this.selectedTower = null;
                return;
            }
        }

        // Deselect
        this.selectedTower = null;
        this.selectedEnemy = null;
    }

    updateComboBonuses() {
        // Reset all bonuses
        for (let tower of this.grid.towers) {
            tower.comboBonus = {
                damageMultiplier: 1.0,
                rangeBonus: 0,
                speedMultiplier: 1.0
            };
        }

        // Apply combo bonuses
        for (let tower of this.grid.towers) {
            const adjacent = this.grid.getAdjacentTowers(tower.gridX, tower.gridY);

            for (let other of adjacent) {
                // Function + Loop combo
                if (tower.type === TOWER_TYPES.FUNCTION && other.type === TOWER_TYPES.LOOP) {
                    other.comboBonus.speedMultiplier += 0.25;
                }

                // Async + Any combo
                if (tower.type === TOWER_TYPES.ASYNC || other.type === TOWER_TYPES.ASYNC) {
                    tower.comboBonus.damageMultiplier += 0.1;
                }

                // Object combo - scales with adjacent count
                if (tower.type === TOWER_TYPES.OBJECT) {
                    tower.comboBonus.damageMultiplier += 0.1;
                }

                // Recursion + Recursion
                if (tower.type === TOWER_TYPES.RECURSION && other.type === TOWER_TYPES.RECURSION) {
                    tower.comboBonus.damageMultiplier += 0.2;
                }
            }
        }
    }

    usePowerUp(key) {
        const powerUp = POWER_UPS[key];
        if (!powerUp) return false;

        // Check cooldown
        if (this.powerUpCooldowns[key] > 0) return false;

        // Check cost
        if (this.cpuCycles < powerUp.cost) return false;

        // Apply power-up effect
        this.cpuCycles -= powerUp.cost;
        this.powerUpCooldowns[key] = powerUp.cooldown;

        switch (key) {
            case 'GARBAGE_COLLECTOR':
                this.garbageCollector();
                break;
            case 'CODE_REVIEW':
                this.codeReview();
                break;
            case 'HOT_RELOAD':
                this.hotReload();
                break;
            case 'STACK_TRACE':
                this.stackTrace();
                break;
            case 'EMERGENCY_PATCH':
                this.emergencyPatch();
                break;
        }

        this.effects.createPowerUpEffect(0, 0, GRID.WIDTH, GRID.HEIGHT, '#9900ff');

        return true;
    }

    garbageCollector() {
        for (let enemy of this.enemies) {
            if (enemy.isAlive() && enemy.getHpPercent() <= 0.1) {
                this.addResources(enemy.reward, 0);
                enemy.die(this);
            }
        }
    }

    codeReview() {
        for (let enemy of this.enemies) {
            if (enemy.isAlive()) {
                enemy.applySlow(0.8, 5.0);
            }
        }
    }

    hotReload() {
        // Temporarily boost all tower attack speeds
        for (let tower of this.grid.towers) {
            const originalSpeed = tower.attackSpeed;
            tower.attackSpeed /= 3;

            setTimeout(() => {
                tower.attackSpeed = originalSpeed;
            }, 8000);
        }
    }

    stackTrace() {
        // Enable path visualization and HP bars temporarily
        this.showPaths = true;
        setTimeout(() => {
            this.showPaths = false;
        }, 10000);
    }

    emergencyPatch() {
        let killed = 0;
        const maxKills = 5;

        // Kill boss first, or kill 5 regular enemies
        for (let enemy of this.enemies) {
            if (!enemy.isAlive()) continue;

            if (enemy.boss) {
                this.addResources(enemy.reward, 0);
                enemy.die(this);
                return;
            }

            if (killed < maxKills) {
                this.addResources(enemy.reward, 0);
                enemy.die(this);
                killed++;
            }
        }
    }

    spawnEnemy(type, progress = 0) {
        const path = this.currentLevel.paths[0];  // Use first path for now
        const enemy = createEnemy(type, path, this.currentWaveNumber);
        enemy.teleport(progress);
        this.enemies.push(enemy);
    }

    spawnMiniEnemy(type, progress, hpMultiplier) {
        const path = this.currentLevel.paths[0];
        const enemy = createEnemy(type, path, this.currentWaveNumber);
        enemy.maxHp *= hpMultiplier;
        enemy.hp = enemy.maxHp;
        enemy.teleport(progress);
        this.enemies.push(enemy);
    }

    addResources(mu, cc) {
        this.memoryUnits += mu;
        this.cpuCycles += cc;
    }

    update(dt) {
        if (this.paused) return;

        dt *= this.gameSpeed;

        // Update power-up cooldowns
        for (let key in this.powerUpCooldowns) {
            if (this.powerUpCooldowns[key] > 0) {
                this.powerUpCooldowns[key] -= dt;
                if (this.powerUpCooldowns[key] < 0) {
                    this.powerUpCooldowns[key] = 0;
                }
            }
        }

        if (this.waveActive) {
            this.updateWave(dt);
        } else {
            this.updateWavePrep(dt);
        }

        // Update towers
        for (let tower of this.grid.towers) {
            tower.update(dt, this.enemies, this);
        }

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(dt, this);

            // Check if reached end
            if (enemy.hasReachedEnd()) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.isAlive() || e.deathAnimation > 0);

        // Update projectiles and check collisions
        this.updateProjectiles(dt);

        // Update effects
        this.effects.update(dt);

        // Update UI
        this.ui.update();
    }

    updateWave(dt) {
        // Spawn enemies
        if (this.waveSpawnIndex < this.currentWaveEnemies.length) {
            const nextEnemy = this.currentWaveEnemies[this.waveSpawnIndex];
            this.waveSpawnTimer += dt;

            if (this.waveSpawnTimer >= nextEnemy.spawnTime) {
                const pathIndex = Math.floor(Math.random() * this.currentLevel.paths.length);
                const path = this.currentLevel.paths[pathIndex];
                const enemy = createEnemy(nextEnemy.type, path, this.currentWaveNumber);
                this.enemies.push(enemy);
                this.waveSpawnIndex++;
            }
        }

        // Check if wave complete
        if (this.waveSpawnIndex >= this.currentWaveEnemies.length &&
            this.enemies.filter(e => e.isAlive()).length === 0) {
            this.waveComplete();
        }
    }

    updateWavePrep(dt) {
        this.wavePrepTime -= dt;

        if (this.wavePrepTime <= 0) {
            this.startWave();
        }
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Handle MultiProjectile
            if (proj.getActiveProjectiles) {
                const hits = proj.update(dt);
                for (let hitProj of hits) {
                    this.handleProjectileHit(hitProj);
                }

                if (!proj.isActive()) {
                    this.projectiles.splice(i, 1);
                }
                continue;
            }

            // Regular projectile
            const hit = proj.update(dt);

            if (hit) {
                this.handleProjectileHit(proj);
            }

            if (!proj.isActive()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    handleProjectileHit(proj) {
        if (!proj.target || !proj.target.isAlive()) {
            proj.deactivate();
            return;
        }

        const actualDamage = proj.target.takeDamage(proj.damage, this, proj.towerId);

        // Create damage number
        this.effects.createDamageNumber(
            proj.target.x,
            proj.target.y - 20,
            actualDamage,
            actualDamage > proj.damage ? 'crit' : actualDamage < proj.damage * 0.5 ? 'resist' : 'normal'
        );

        // Check if enemy died
        if (!proj.target.isAlive()) {
            this.addResources(proj.target.reward, Math.floor(proj.target.reward * 0.2));
            this.effects.createExplosion(proj.target.x, proj.target.y, proj.target.color);
            this.totalKills++;

            // Notify tower of kill
            if (proj.towerId) {
                const tower = this.grid.towers.find(t => t.id === proj.towerId);
                if (tower) {
                    tower.onKill(proj.target);
                }
            }
        }

        // Apply special effects
        if (proj.slow > 0) {
            proj.target.applySlow(proj.slow, proj.slowDuration);
        }

        if (proj.stun) {
            proj.target.applyStun(proj.stunDuration);
        }

        // Handle splash damage
        if (proj.splash && proj.splashRadius > 0) {
            for (let enemy of this.enemies) {
                if (enemy === proj.target || !enemy.isAlive()) continue;

                const dist = distance(proj.target.x, proj.target.y, enemy.x, enemy.y);
                if (dist <= proj.splashRadius) {
                    const splashDamage = proj.damage * 0.5;
                    enemy.takeDamage(splashDamage, this);
                    this.effects.createDamageNumber(enemy.x, enemy.y - 20, splashDamage);
                }
            }
        }

        proj.onHit();
    }

    waveComplete() {
        this.waveActive = false;
        this.wavePrepTime = GAME_CONFIG.WAVE_PREP_TIME;
        this.totalWavesCompleted++;

        // Bonus for surviving wave
        this.addResources(50, 10);

        // Check if level complete
        if (this.currentWaveNumber >= this.currentLevel.waves.length) {
            this.levelComplete();
        }
    }

    levelComplete() {
        const nextLevelId = this.currentLevel.id + 1;
        if (!this.unlockedLevels.includes(nextLevelId) && nextLevelId <= LEVELS.length) {
            this.unlockedLevels.push(nextLevelId);
        }

        this.researchPoints += 10;
        this.saveGame();

        this.ui.showLevelComplete(this.currentLevel);
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        this.ui.showGameOver();
    }

    togglePause() {
        this.paused = !this.paused;
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }

    getTowerStats(type) {
        return TOWER_STATS[type];
    }

    getAdjacentTowers(gridX, gridY) {
        return this.grid.getAdjacentTowers(gridX, gridY);
    }

    calculateScore() {
        return (
            this.totalKills * 10 +
            this.lives * 1000 +
            this.memoryUnits * 2 +
            this.grid.towers.length * 50 +
            this.totalWavesCompleted * 500
        );
    }

    handleModalAction(action) {
        switch (action) {
            case 'next-level':
                const nextLevelId = this.currentLevel.id + 1;
                if (nextLevelId <= LEVELS.length) {
                    this.startLevel(nextLevelId);
                }
                break;
            case 'retry':
                this.startLevel(this.currentLevel.id);
                break;
            case 'level-select':
                // TODO: Show level select screen
                this.startLevel(1);
                break;
            case 'apply-settings':
                const showPaths = document.getElementById('setting-show-paths');
                const showCombos = document.getElementById('setting-show-combos');
                const showRanges = document.getElementById('setting-show-ranges');

                if (showPaths) this.showPaths = showPaths.checked;
                if (showCombos) this.showCombos = showCombos.checked;
                if (showRanges) this.showRanges = showRanges.checked;

                this.saveGame();
                break;
        }
    }

    saveGame() {
        this.saveManager.saveGame(this);
    }

    loadSave() {
        const saveData = this.saveManager.loadGame();
        if (!saveData) return;

        this.unlockedLevels = saveData.unlockedLevels || [1];
        this.researchPoints = saveData.researchPoints || 0;
        this.permanentUpgrades = saveData.permanentUpgrades || {};

        if (saveData.settings) {
            this.showPaths = saveData.settings.showPaths !== false;
            this.showCombos = saveData.settings.showCombos !== false;
            this.showRanges = saveData.settings.showRanges || false;
        }

        if (saveData.stats) {
            this.totalKills = saveData.stats.totalKills || 0;
            this.totalWavesCompleted = saveData.stats.totalWaves || 0;
            this.totalDamageDealt = saveData.stats.totalDamage || 0;
        }
    }

    startGameLoop() {
        let lastTime = performance.now();

        const loop = (currentTime) => {
            const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            this.update(dt);
            this.renderer.render(this);

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }
}
