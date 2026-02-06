/**
 * GameEngine
 * Manages the main game loop, state, and coordination between subsystems.
 */
import { GridSystem } from './GridSystem.js';
import { ComponentManager } from './ComponentManager.js';
import { InputHandler } from './InputHandler.js';

import { LogicSimulator } from './LogicSimulator.js';
import { LevelManager } from './LevelManager.js';
import { AudioManager } from './AudioManager.js';
import { SaveSystem } from './SaveSystem.js';

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.isRunning = false; // Is the logic simulation running?
        this.totalCycles = 0;
        this.lastTime = 0;

        // Subsystems
        this.grid = new GridSystem(this.ctx);
        this.components = new ComponentManager(this.grid);
        this.simulator = new LogicSimulator(this.components);
        this.input = new InputHandler(this.canvas, this);
        this.levels = new LevelManager(this);
        this.audio = new AudioManager();
        this.saveSystem = new SaveSystem();

        this.currentTool = 'WIRE';
    }

    init() {
        this.handleResize();
        // this.levels.loadLevel(0); // REMOVED: Managed by UIManager now
        this.loop(0);
        console.log("Neon Logic Engine Initialized");
    }

    handleResize() {
        // Resize canvas to fit container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        this.grid.resize(this.canvas.width, this.canvas.height);
    }

    setTool(toolType) {
        this.currentTool = toolType;
        this.input.setTool(toolType);
    }

    startSimulation() {
        // Instead of just running, we ask LevelManager to validate
        this.levels.startValidation();
    }

    stopSimulation() {
        this.levels.stopValidation();
    }

    clearGrid() {
        this.stopSimulation();
        this.components.clear();
        console.log("Grid Cleared");
    }

    update(dt) {

        // Level Logic validation
        this.levels.update(dt);

        // Update simulation if running
        if (this.isRunning) {
            // Run logic tick every X milliseconds or frames
            // For now, let's just tick every few frames for visual clarity
            this.totalCycles++;
            this.simulator.tick(dt, this.totalCycles);

            // Update UI metrics
            document.getElementById('score-cycles').innerText = Math.floor(this.totalCycles / 10);
        }

        // Update visual state of components (Pulse animations, etc)
        this.components.update(dt, this.isRunning);
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#050508';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.grid.draw();

        // Draw components and wires
        this.components.draw(this.ctx);

        // Draw active tool preview / drag state
        this.input.draw(this.ctx);
    }

    loop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
