// --- Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- Game Classes ---

class InputHandler {
    constructor() {
        this.keys = [];
        window.addEventListener('keydown', e => {
            const key = e.key === 'Enter' ? 'Enter' : e.key.toLowerCase();
            if ((
                key === 'arrowdown' ||
                key === 'arrowup' ||
                key === 'arrowleft' ||
                key === 'arrowright' ||
                key === 'a' ||
                key === 'd' ||
                key === 'w' ||
                key === 's' ||
                key === 'enter'
            ) && !this.keys.includes(key)) {
                this.keys.push(key);
            }
        });

        window.addEventListener('keyup', e => {
            const key = e.key === 'Enter' ? 'Enter' : e.key.toLowerCase();
            const index = this.keys.findIndex(k => k.toLowerCase() === key);
            if (index > -1) {
                this.keys.splice(index, 1);
            }
        });
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 20;
        this.height = 30;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height / 2 - this.height / 2;
        this.speed = 5;
        this.color = 'white';
    }

    update() {
        // Movement
        if (this.game.input.keys.includes('arrowup') || this.game.input.keys.includes('w')) {
            this.y -= this.speed;
        }
        if (this.game.input.keys.includes('arrowdown') || this.game.input.keys.includes('s')) {
            this.y += this.speed;
        }
        if (this.game.input.keys.includes('arrowleft') || this.game.input.keys.includes('a')) {
            this.x -= this.speed;
        }
        if (this.game.input.keys.includes('arrowright') || this.game.input.keys.includes('d')) {
            this.x += this.speed;
        }

        // Keep player within bounds
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.height - this.height) this.y = this.game.height - this.height;
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.moveTo(this.x + this.width / 2, this.y);
        context.lineTo(this.x, this.y + this.height);
        context.lineTo(this.x + this.width, this.y + this.height);
        context.closePath();
        context.fill();
    }
}

class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.color = '#ff4d4d'; // A reddish color
        this.x = 0;
        this.y = 0;
        this.fireInterval = 1000; // Fires every 1 second
        this.fireTimer = 0;

        // Spawn at a random edge, just inside the screen
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? 0 : this.game.width - this.width;
            this.y = Math.random() * this.game.height;
        } else {
            this.x = Math.random() * this.game.width;
            this.y = Math.random() < 0.5 ? 0 : this.game.height - this.height;
        }
    }

    update(deltaTime) {
        // Firing logic
        this.fireTimer += deltaTime;
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            this.game.projectiles.push(new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2));
        }
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Projectile {
    constructor(game, startX, startY) {
        this.game = game;
        this.x = startX;
        this.y = startY;
        this.radius = 5;
        this.color = '#ffdb4d'; // A yellowish color
        this.speed = 4;
        this.markedForDeletion = false;

        // Calculate angle to player
        const angle = Math.atan2(this.game.player.y + this.game.player.height / 2 - this.y, this.game.player.x + this.game.player.width / 2 - this.x);
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Mark for deletion if it goes off-screen
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}

class UI {
    constructor(game) {
        this.game = game;
        this.fontSize = 25;
        this.fontFamily = 'Helvetica';
        this.color = 'white';
    }

    draw(context) {
        context.save();
        context.fillStyle = this.color;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = 'black';
        context.font = `${this.fontSize}px ${this.fontFamily}`;
        
        // Score
        context.fillText(`Time: ${(this.game.survivalTime / 1000).toFixed(2)}`, 20, 40);
        
        // High Score
        context.fillText(`High Score: ${(this.game.highScore / 1000).toFixed(2)}`, 20, 70);

        // Game Over message
        if (this.game.gameOver) {
            context.textAlign = 'center';
            context.font = `50px ${this.fontFamily}`;
            context.fillText('Game Over', this.game.width / 2, this.game.height / 2 - 20);
            context.font = `20px ${this.fontFamily}`;
            context.fillText(`Your time: ${(this.game.survivalTime / 1000).toFixed(2)}`, this.game.width / 2, this.game.height / 2 + 20);
            context.fillText('Press Enter to restart', this.game.width / 2, this.game.height / 2 + 50);
        }
        context.restore();
    }
}

class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.input = new InputHandler();
        this.ui = new UI(this);
        this.player = new Player(this);
        this.enemies = [];
        this.projectiles = [];
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.survivalTime = 0;
        this.highScore = localStorage.getItem('vectorDodgerHighScore') || 0;
        this.gameOver = false;
    }

    update(deltaTime) {
        if (this.gameOver) {
            if (this.input.keys.includes('Enter')) {
                this.restart();
            }
            return;
        }

        this.survivalTime += deltaTime;
        this.player.update();

        // Enemy spawning
        this.enemyTimer += deltaTime;
        if (this.enemyTimer > this.enemyInterval) {
            this.enemyTimer = 0;
            this.enemies.push(new Enemy(this));
        }

        this.enemies.forEach(enemy => enemy.update(deltaTime));
        
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.projectiles.forEach(projectile => {
            projectile.update();
            if (this.checkCollision(this.player, projectile)) {
                projectile.markedForDeletion = true;
                this.endGame();
            }
        });
    }

    draw(context) {
        this.player.draw(context);
        this.enemies.forEach(enemy => enemy.draw(context));
        this.projectiles.forEach(projectile => projectile.draw(context));
        this.ui.draw(context);
    }

    checkCollision(rect1, circle) {
        const closestX = Math.max(rect1.x, Math.min(circle.x, rect1.x + rect1.width));
        const closestY = Math.max(rect1.y, Math.min(circle.y, rect1.y + rect1.height));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (circle.radius * circle.radius);
    }

    endGame() {
        this.gameOver = true;
        if (this.survivalTime > this.highScore) {
            this.highScore = this.survivalTime;
            localStorage.setItem('vectorDodgerHighScore', this.highScore);
        }
    }

    restart() {
        this.player = new Player(this);
        this.enemies = [];
        this.projectiles = [];
        this.enemyTimer = 0;
        this.survivalTime = 0;
        this.gameOver = false;
    }
}

// --- Main Game Loop ---

const game = new Game(canvas.width, canvas.height);
let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    game.update(deltaTime);
    game.draw(ctx);

    if (!game.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

requestAnimationFrame(gameLoop);
