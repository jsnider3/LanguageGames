// SyntaxCity - Entry Point

import { Game } from './Game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('SyntaxCity - Programming Tower Defense');
    console.log('Loading game...');

    try {
        // Initialize game
        window.game = new Game();
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to load game. Please refresh the page.');
    }
});

function showError(message) {
    const container = document.getElementById('game-container');
    if (container) {
        container.innerHTML = `
            <div style="color: #ff4444; padding: 40px; text-align: center; font-family: 'Courier New', monospace;">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #00ff88;
                    border: none;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                ">Reload</button>
            </div>
        `;
    }
}

// Handle visibility change (pause when tab not visible)
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.paused = true;
        }
    }
});

// Handle resize
window.addEventListener('resize', () => {
    if (window.game && window.game.renderer) {
        // Canvas maintains fixed size, but we could adjust UI here if needed
    }
});

// Export for debugging
window.debugGame = () => {
    if (!window.game) {
        console.log('Game not initialized');
        return;
    }

    console.log('=== Game Debug Info ===');
    console.log('Level:', window.game.currentLevel?.name);
    console.log('Wave:', window.game.currentWaveNumber);
    console.log('Lives:', window.game.lives);
    console.log('Memory Units:', window.game.memoryUnits);
    console.log('CPU Cycles:', window.game.cpuCycles);
    console.log('Towers:', window.game.grid.towers.length);
    console.log('Enemies:', window.game.enemies.length);
    console.log('Score:', window.game.calculateScore());
    console.log('====================');
};

console.log('Type debugGame() in console for game info');
