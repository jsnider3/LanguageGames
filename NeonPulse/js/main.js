import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 960;
    canvas.height = 640;

    const game = new Game(canvas);

    window.game = game;

    let lastTime = performance.now();
    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        game.update(dt);
        game.render();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
