/**
 * Neon Logic - Main Entry Point
 */
import { GameEngine } from './GameEngine.js';
import { UIManager } from './UIManager.js';

window.addEventListener('load', () => {
    // Initialize the game engine
    const engine = new GameEngine();

    // Initialize UI Manager (needs engine)
    const ui = new UIManager(engine);
    engine.ui = ui; // Circular ref for LevelManager to call ui.showVictory()

    engine.init();

    // Handle window resize
    window.addEventListener('resize', () => {
        engine.handleResize();
    });

    // Setup basic UI triggers (Toolbox)
    setupUI(engine);
});

function setupUI(engine) {
    // Tool selection
    const toolItems = document.querySelectorAll('.tool-item');
    toolItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active class from all
            toolItems.forEach(t => t.classList.remove('active'));
            // Add to clicked
            const target = e.currentTarget;
            target.classList.add('active');

            const type = target.dataset.type;
            engine.setTool(type);
            engine.audio.playClick();
        });
    });

    // Control buttons
    document.getElementById('btn-run').addEventListener('click', () => {
        engine.audio.playClick();
        engine.startSimulation();
    });
    document.getElementById('btn-stop').addEventListener('click', () => {
        engine.audio.playClick();
        engine.stopSimulation();
    });
    document.getElementById('btn-clear').addEventListener('click', () => {
        engine.audio.playClick();
        engine.clearGrid();
    });

    // Select default tool (Wire)
    document.querySelector('[data-type="WIRE"]').click();
}
