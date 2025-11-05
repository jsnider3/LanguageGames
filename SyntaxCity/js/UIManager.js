// SyntaxCity - UI Management System

import { TOWER_TYPES, TOWER_STATS, POWER_UPS, KEYBOARD_SHORTCUTS } from './Constants.js';
import { formatNumber } from './Utils.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        // Header elements
        this.levelNameEl = document.getElementById('level-name');
        this.currentWaveEl = document.getElementById('current-wave');
        this.totalWavesEl = document.getElementById('total-waves');
        this.livesContainerEl = document.getElementById('lives-container');
        this.memoryUnitsEl = document.getElementById('memory-units');
        this.cpuCyclesEl = document.getElementById('cpu-cycles');

        // Tower bar
        this.towerButtonsEl = document.getElementById('tower-buttons');

        // Info panel
        this.selectionDetailsEl = document.getElementById('selection-details');
        this.towerActionsEl = document.getElementById('tower-actions');
        this.upgradeBtn = document.getElementById('upgrade-btn');
        this.sellBtn = document.getElementById('sell-btn');

        // Power-ups
        this.powerUpsContainer = document.getElementById('power-ups-container');

        // Wave control
        this.waveTimerEl = document.getElementById('timer-value');
        this.startWaveBtn = document.getElementById('start-wave-btn');
        this.fastForwardToggle = document.getElementById('fast-forward-toggle');

        // Controls
        this.pauseBtn = document.getElementById('pause-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.helpBtn = document.getElementById('help-btn');

        // Modal
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalContent = document.getElementById('modal-content');
    }

    setupEventListeners() {
        // Tower buttons
        this.createTowerButtons();

        // Action buttons
        if (this.upgradeBtn) {
            this.upgradeBtn.addEventListener('click', () => this.game.upgradeTower());
        }
        if (this.sellBtn) {
            this.sellBtn.addEventListener('click', () => this.game.sellTower());
        }

        // Wave control
        if (this.startWaveBtn) {
            this.startWaveBtn.addEventListener('click', () => this.game.startWave());
        }
        if (this.fastForwardToggle) {
            this.fastForwardToggle.addEventListener('change', (e) => {
                this.game.setGameSpeed(e.target.checked ? 2 : 1);
            });
        }

        // Control buttons
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.game.togglePause());
        }
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.showSettings());
        }
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => this.showHelp());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Modal close
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.hideModal();
                }
            });
        }
    }

    createTowerButtons() {
        if (!this.towerButtonsEl) return;

        const towerTypes = Object.values(TOWER_TYPES);
        let hotkey = 1;

        for (let type of towerTypes) {
            const stats = TOWER_STATS[type];
            const btn = document.createElement('button');
            btn.className = 'tower-button';
            btn.dataset.towerType = type;

            btn.innerHTML = `
                <div class="tower-icon" style="color: ${stats.color}">${stats.symbol}</div>
                <div class="tower-name">${stats.name}</div>
                <div class="tower-cost">${stats.cost} MU</div>
                <div class="tower-hotkey">[${hotkey}]</div>
            `;

            btn.addEventListener('click', () => this.game.selectTowerType(type));

            this.towerButtonsEl.appendChild(btn);
            hotkey++;
        }

        // Create power-up buttons
        this.createPowerUpButtons();
    }

    createPowerUpButtons() {
        if (!this.powerUpsContainer) return;

        const powerUps = Object.entries(POWER_UPS);

        for (let [key, powerUp] of powerUps) {
            const btn = document.createElement('button');
            btn.className = 'power-up-btn';
            btn.dataset.powerUp = key;

            btn.innerHTML = `
                ${powerUp.icon} ${powerUp.name}<br>
                <small>${powerUp.cost} CC</small>
            `;

            btn.addEventListener('click', () => this.game.usePowerUp(key));
            this.powerUpsContainer.appendChild(btn);
        }
    }

    handleKeyPress(e) {
        const key = e.key.toLowerCase();

        // Tower selection (1-9, 0)
        if (key >= '1' && key <= '9') {
            const index = parseInt(key) - 1;
            const towerTypes = Object.values(TOWER_TYPES);
            if (index < towerTypes.length) {
                this.game.selectTowerType(towerTypes[index]);
            }
        } else if (key === '0' && Object.values(TOWER_TYPES).length >= 10) {
            this.game.selectTowerType(Object.values(TOWER_TYPES)[9]);
        }

        // Other shortcuts
        switch (key) {
            case KEYBOARD_SHORTCUTS.PAUSE:
                this.game.togglePause();
                break;
            case KEYBOARD_SHORTCUTS.START_WAVE:
                this.game.startWave();
                break;
            case KEYBOARD_SHORTCUTS.CANCEL_PLACEMENT:
                this.game.cancelPlacement();
                break;
            case KEYBOARD_SHORTCUTS.FAST_FORWARD:
                if (this.fastForwardToggle) {
                    this.fastForwardToggle.checked = !this.fastForwardToggle.checked;
                    this.game.setGameSpeed(this.fastForwardToggle.checked ? 2 : 1);
                }
                break;
            case KEYBOARD_SHORTCUTS.UPGRADE:
                this.game.upgradeTower();
                break;
            case KEYBOARD_SHORTCUTS.SELL:
            case 'delete':
                this.game.sellTower();
                break;
            case KEYBOARD_SHORTCUTS.HELP:
                this.showHelp();
                break;
        }
    }

    update() {
        this.updateHeader();
        this.updateTowerButtons();
        this.updateSelectionInfo();
        this.updateWaveControl();
        this.updatePowerUps();
    }

    updateHeader() {
        if (this.game.currentLevel) {
            this.levelNameEl.textContent = this.game.currentLevel.name;
            this.currentWaveEl.textContent = this.game.currentWaveNumber;
            this.totalWavesEl.textContent = this.game.currentLevel.waves.length;
        }

        // Update lives
        if (this.livesContainerEl) {
            this.livesContainerEl.innerHTML = '❤️'.repeat(Math.max(0, this.game.lives));
        }

        // Update resources
        if (this.memoryUnitsEl) {
            this.memoryUnitsEl.textContent = formatNumber(this.game.memoryUnits);
        }
        if (this.cpuCyclesEl) {
            this.cpuCyclesEl.textContent = formatNumber(this.game.cpuCycles);
        }
    }

    updateTowerButtons() {
        const buttons = this.towerButtonsEl.querySelectorAll('.tower-button');

        buttons.forEach(btn => {
            const type = btn.dataset.towerType;
            const stats = TOWER_STATS[type];
            const canAfford = this.game.memoryUnits >= stats.cost;

            btn.classList.toggle('disabled', !canAfford);
            btn.classList.toggle('selected', this.game.placingTowerType === type);
        });
    }

    updateSelectionInfo() {
        if (this.game.selectedTower) {
            this.showTowerInfo(this.game.selectedTower);
        } else if (this.game.selectedEnemy) {
            this.showEnemyInfo(this.game.selectedEnemy);
        } else {
            this.selectionDetailsEl.innerHTML = '<p class="info-placeholder">Click a tower or enemy for details</p>';
            this.towerActionsEl.style.display = 'none';
        }
    }

    showTowerInfo(tower) {
        const damageBonus = (tower.comboBonus.damageMultiplier - 1) * 100;
        const speedBonus = (tower.comboBonus.speedMultiplier - 1) * 100;

        this.selectionDetailsEl.innerHTML = `
            <h4 style="color: ${tower.color}">${tower.name} (Tier ${tower.tier})</h4>
            <div class="stat-line">
                <span class="stat-label">Damage:</span>
                <span class="stat-value">${Math.floor(tower.damage)}${damageBonus > 0 ? ` (+${damageBonus.toFixed(0)}%)` : ''}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Range:</span>
                <span class="stat-value">${Math.floor(tower.range)}${tower.comboBonus.rangeBonus > 0 ? ` (+${tower.comboBonus.rangeBonus})` : ''}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Attack Speed:</span>
                <span class="stat-value">${tower.attackSpeed.toFixed(2)}s${speedBonus > 0 ? ` (-${speedBonus.toFixed(0)}%)` : ''}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Kills:</span>
                <span class="stat-value">${tower.kills}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Sell Value:</span>
                <span class="stat-value">${tower.getSellValue()} MU</span>
            </div>
            ${tower.stats.description ? `<p style="font-size: 11px; margin-top: 8px; color: #aaa;">${tower.stats.description}</p>` : ''}
        `;

        this.towerActionsEl.style.display = 'flex';

        // Update upgrade button
        if (tower.tier < 3) {
            this.upgradeBtn.disabled = false;
            this.upgradeBtn.textContent = `Upgrade (${tower.upgradeCost} MU + ${tower.upgradeCpuCost} CC)`;

            const canAfford = this.game.memoryUnits >= tower.upgradeCost &&
                             this.game.cpuCycles >= tower.upgradeCpuCost;
            this.upgradeBtn.disabled = !canAfford;
        } else {
            this.upgradeBtn.disabled = true;
            this.upgradeBtn.textContent = 'Max Level';
        }

        this.sellBtn.disabled = false;
    }

    showEnemyInfo(enemy) {
        if (!enemy.isAlive()) {
            this.selectionDetailsEl.innerHTML = '<p class="info-placeholder">Enemy defeated</p>';
            return;
        }

        this.selectionDetailsEl.innerHTML = `
            <h4 style="color: ${enemy.color}">${enemy.stats.name}</h4>
            <div class="stat-line">
                <span class="stat-label">HP:</span>
                <span class="stat-value">${Math.floor(enemy.hp)} / ${Math.floor(enemy.maxHp)}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Speed:</span>
                <span class="stat-value">${enemy.speed}</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Armor:</span>
                <span class="stat-value">${(enemy.armor * 100).toFixed(0)}%</span>
            </div>
            <div class="stat-line">
                <span class="stat-label">Reward:</span>
                <span class="stat-value">${enemy.reward} MU</span>
            </div>
            ${enemy.stats.description ? `<p style="font-size: 11px; margin-top: 8px; color: #aaa;">${enemy.stats.description}</p>` : ''}
        `;

        this.towerActionsEl.style.display = 'none';
    }

    updateWaveControl() {
        if (this.game.waveActive) {
            this.waveTimerEl.textContent = '--';
            this.startWaveBtn.disabled = true;
            this.startWaveBtn.textContent = 'Wave Active';
        } else {
            const timeLeft = Math.ceil(this.game.wavePrepTime);
            this.waveTimerEl.textContent = timeLeft;
            this.startWaveBtn.disabled = false;
            this.startWaveBtn.textContent = 'Start Wave';
        }
    }

    updatePowerUps() {
        const buttons = this.powerUpsContainer.querySelectorAll('.power-up-btn');

        buttons.forEach(btn => {
            const key = btn.dataset.powerUp;
            const powerUp = POWER_UPS[key];
            const cooldown = this.game.powerUpCooldowns[key] || 0;
            const canAfford = this.game.cpuCycles >= powerUp.cost;
            const onCooldown = cooldown > 0;

            btn.disabled = !canAfford || onCooldown || !this.game.waveActive;

            if (onCooldown) {
                btn.innerHTML = `
                    ${powerUp.icon} ${powerUp.name}<br>
                    <small class="power-up-cooldown">Cooldown: ${Math.ceil(cooldown)}s</small>
                `;
            } else {
                btn.innerHTML = `
                    ${powerUp.icon} ${powerUp.name}<br>
                    <small>${powerUp.cost} CC</small>
                `;
            }
        });
    }

    showModal(title, content, buttons = []) {
        this.modalContent.innerHTML = `
            <h2>${title}</h2>
            <div class="modal-body">${content}</div>
            <div class="modal-buttons">
                ${buttons.map(btn => `
                    <button class="action-btn ${btn.class || ''}" data-action="${btn.action}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;

        // Add button listeners
        const btnEls = this.modalContent.querySelectorAll('[data-action]');
        btnEls.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') {
                    this.hideModal();
                } else {
                    this.game.handleModalAction(action);
                    this.hideModal();
                }
            });
        });

        this.modalOverlay.style.display = 'flex';
    }

    hideModal() {
        this.modalOverlay.style.display = 'none';
    }

    showHelp() {
        this.showModal('How to Play', `
            <p><strong>Objective:</strong> Defend your codebase by preventing bugs from reaching the end of the path!</p>

            <p><strong>Towers:</strong> Place programming concept towers to attack bugs. Each tower has unique abilities.</p>

            <p><strong>Resources:</strong></p>
            <ul>
                <li><strong>Memory Units (MU):</strong> Used to build and upgrade towers</li>
                <li><strong>CPU Cycles (CC):</strong> Used for tower upgrades and power-ups</li>
            </ul>

            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul>
                <li><strong>1-9:</strong> Select tower type</li>
                <li><strong>P:</strong> Pause</li>
                <li><strong>Enter:</strong> Start wave</li>
                <li><strong>Esc:</strong> Cancel placement</li>
                <li><strong>F:</strong> Fast forward</li>
                <li><strong>U:</strong> Upgrade selected tower</li>
                <li><strong>Delete:</strong> Sell selected tower</li>
            </ul>

            <p><strong>Tips:</strong></p>
            <ul>
                <li>Place towers strategically along the path</li>
                <li>Adjacent towers create combo bonuses</li>
                <li>Upgrade towers to increase their power</li>
                <li>Use power-ups during tough waves</li>
            </ul>
        `, [
            { text: 'Close', action: 'close', class: 'primary' }
        ]);
    }

    showSettings() {
        this.showModal('Settings', `
            <div class="settings-panel">
                <label>
                    <input type="checkbox" id="setting-show-paths" ${this.game.showPaths ? 'checked' : ''}>
                    Show enemy paths
                </label>
                <label>
                    <input type="checkbox" id="setting-show-combos" ${this.game.showCombos ? 'checked' : ''}>
                    Show combo connections
                </label>
                <label>
                    <input type="checkbox" id="setting-show-ranges" ${this.game.showRanges ? 'checked' : ''}>
                    Always show tower ranges
                </label>
            </div>
        `, [
            { text: 'Apply', action: 'apply-settings', class: 'primary' },
            { text: 'Close', action: 'close' }
        ]);
    }

    showLevelComplete(level) {
        this.showModal('Level Complete!', `
            <p>Congratulations! You've completed <strong>${level.name}</strong>!</p>
            <p>Final Score: ${this.game.calculateScore()}</p>
        `, [
            { text: 'Next Level', action: 'next-level', class: 'primary' },
            { text: 'Level Select', action: 'level-select' }
        ]);
    }

    showGameOver() {
        this.showModal('Game Over', `
            <p>Your codebase has crashed!</p>
            <p>Wave reached: ${this.game.currentWaveNumber}</p>
            <p>Score: ${this.game.calculateScore()}</p>
        `, [
            { text: 'Retry', action: 'retry', class: 'primary' },
            { text: 'Level Select', action: 'level-select' }
        ]);
    }
}
