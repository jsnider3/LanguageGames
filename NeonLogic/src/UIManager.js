/**
 * UIManager
 * Handles menus, overlays, and game flow between states.
 */
import { LEVELS } from './Levels.js';

export class UIManager {
    constructor(engine) {
        this.engine = engine;

        // DOM Elements
        this.menuOverlay = document.getElementById('menu-overlay');
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.levelList = document.getElementById('level-list');

        this.bindEvents();
        this.refreshLevelList();
    }

    bindEvents() {
        // Start button on main menu just enters latest unlocked level or Level 0
        document.getElementById('btn-start').addEventListener('click', () => {
            this.engine.audio.init(); // Init audio on user gesture
            this.engine.audio.playClick();
            // Find first unlocked level that isn't completed? Or just last unlocked?
            const latest = this.engine.saveSystem.data.completedLevels.length;
            const target = Math.min(latest, LEVELS.length - 1);
            this.startLevel(target);
        });

        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.engine.audio.playClick();
            this.startLevel(this.engine.levels.currentLevelIdx + 1);
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            this.engine.audio.playClick();
            this.showMainMenu();
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            this.engine.audio.playClick();
            this.showMainMenu();
        });
    }

    showMainMenu() {
        this.refreshLevelList();
        this.menuOverlay.classList.add('active');
        this.victoryOverlay.classList.remove('active');
        this.engine.isRunning = false; // Pause background
    }

    showVictory(silicon, cycles) {
        this.engine.audio.playSuccess();
        document.getElementById('vic-silicon').innerText = silicon;
        document.getElementById('vic-cycles').innerText = cycles;

        this.victoryOverlay.classList.add('active');
    }

    startLevel(index) {
        if (index >= LEVELS.length) {
            alert("ALL NODES REPAIRED. SYSTEM RESTORED.");
            this.showMainMenu();
            return;
        }

        this.engine.audio.init(); // Ensure init
        this.menuOverlay.classList.remove('active');
        this.victoryOverlay.classList.remove('active');

        this.engine.levels.loadLevel(index);
    }

    refreshLevelList() {
        this.levelList.innerHTML = '';

        LEVELS.forEach((level, idx) => {
            const node = document.createElement('div');
            node.className = 'level-node';
            node.innerText = idx;

            const isUnlocked = this.engine.saveSystem.isLevelUnlocked(idx);
            const isCompleted = this.engine.saveSystem.data.completedLevels.includes(idx);

            if (isUnlocked) {
                node.classList.add('unlocked');
                node.onclick = () => {
                    this.engine.audio.playClick();
                    this.startLevel(idx);
                };
            }
            if (isCompleted) {
                node.classList.add('completed');
            }

            this.levelList.appendChild(node);
        });
    }
}
