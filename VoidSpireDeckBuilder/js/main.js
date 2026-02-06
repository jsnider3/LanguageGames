import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 960;
    canvas.height = 640;

    const game = new Game(canvas);

    // Expose for debugging
    window.game = game;

    function loop() {
        game.update();
        game.render();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
