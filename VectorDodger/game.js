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
            const key = e.key.toLowerCase();
            if ((
                key === 'arrowdown' ||
                key === 'arrowup' ||
                key === 'arrowleft' ||
                key === 'arrowright' ||
                key === 'a' ||
                key === 'd' ||
                key === 'w' ||
                key === 's' ||
                key === 'enter' ||
                key === 'shift' ||
                key === ' '
            ) && !this.keys.includes(key)) {
                this.keys.push(key);
            }
        });

        window.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            const index = this.keys.indexOf(key);
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
        this.shielded = false;
        this.dashCooldown = false;
        this.empCooldown = false;
        this.grazeRadius = 40;
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

        // Dash
        if (this.game.input.keys.includes('shift') && !this.dashCooldown) {
            this.dash();
        }

        // EMP Burst
        if (this.game.input.keys.includes(' ') && !this.empCooldown) {
            this.empBurst();
        }

        // Keep player within bounds
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.height - this.height) this.y = this.game.height - this.height;
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Add particles
        // this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, this.color));
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.moveTo(this.x + this.width / 2, this.y);
        context.lineTo(this.x, this.y + this.height);
        context.lineTo(this.x + this.width, this.y + this.height);
        context.closePath();
        context.fill();

        if (this.shielded) {
            context.strokeStyle = 'cyan';
            context.lineWidth = 3;
            context.stroke();
        }
    }

    activatePowerUp(type) {
        if (type === 'shield') {
            this.shielded = true;
            setTimeout(() => {
                this.shielded = false;
            }, 5000); // Shield lasts for 5 seconds
        } else if (type === 'slow-mo') {
            this.game.projectiles.forEach(p => {
                p.speed *= 0.5;
                p.velocityX *= 0.5;
                p.velocityY *= 0.5;
            });
            setTimeout(() => {
                this.game.projectiles.forEach(p => {
                    p.speed *= 2;
                    p.velocityX *= 2;
                    p.velocityY *= 2;
                });
            }, 5000); // Slow-mo lasts for 5 seconds
        } else if (type === 'wipeout') {
            this.game.projectiles = [];
        }
    }

    dash() {
        this.dashCooldown = true;
        this.speed *= 3;
        setTimeout(() => {
            this.speed /= 3;
        }, 100);
        setTimeout(() => {
            this.dashCooldown = false;
        }, 2000); // 2 second cooldown
    }

    empBurst() {
        this.empCooldown = true;
        this.game.projectiles.forEach(p => {
            const dist = Math.hypot(this.x - p.x, this.y - p.y);
            if (dist < 150) {
                p.markedForDeletion = true;
                this.game.score += 50; // Add 50 points for each destroyed projectile
            }
        });
        setTimeout(() => {
            this.empCooldown = false;
        }, 10000); // 10 second cooldown
    }
}

class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        this.markedForDeletion = false;

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
        // To be implemented by subclasses
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class BasicEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#ff4d4d'; // A reddish color
        this.fireInterval = 1000; // Fires every 1 second
        this.fireTimer = 0;
    }

    update(deltaTime) {
        // Firing logic
        this.fireTimer += deltaTime;
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            this.game.projectiles.push(new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2));
        }
    }
}

class SpiralShooter extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#ff9933'; // An orange color
        this.fireInterval = 200; // Fires every 0.2 seconds
        this.fireTimer = 0;
        this.angle = 0;
    }

    update(deltaTime) {
        // Firing logic
        this.fireTimer += deltaTime;
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            this.game.projectiles.push(new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, this.angle));
            this.angle += 0.5;
        }
    }
}

class Charger extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#cc33ff'; // A purple color
        this.chargeDuration = 2000; // Time to charge before firing
        this.chargeTimer = 0;
        this.charging = false;
    }

    update(deltaTime) {
        this.chargeTimer += deltaTime;

        if (this.chargeTimer > this.chargeDuration) {
            this.chargeTimer = 0;
            this.charging = !this.charging;
        }

        if (this.charging) {
            // Fire a fast projectile
            const projectile = new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2);
            projectile.speed = 8; // Make it faster than normal
            projectile.color = 'magenta';
            this.game.projectiles.push(projectile);
            this.charging = false; // Fire once and then wait
        }
    }

    draw(context) {
        super.draw(context);
        if (this.charging) {
            context.fillStyle = 'rgba(255, 0, 255, 0.2)';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}


class Projectile {
    constructor(game, startX, startY, angle) {
        this.game = game;
        this.x = startX;
        this.y = startY;
        this.radius = 5;
        this.color = '#ffdb4d'; // A yellowish color
        this.speed = 4;
        this.markedForDeletion = false;
        this.grazed = false;

        // Calculate angle to player if not provided
        const targetAngle = angle !== undefined ? angle : Math.atan2(this.game.player.y + this.game.player.height / 2 - this.y, this.game.player.x + this.game.player.width / 2 - this.x);
        this.velocityX = Math.cos(targetAngle) * this.speed;
        this.velocityY = Math.sin(targetAngle) * this.speed;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Mark for deletion if it goes off-screen
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }

        // Add particles
        // this.game.particles.push(new Particle(this.game, this.x, this.y, this.color));
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}

class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 2 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.markedForDeletion = false;
        this.life = 100;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1;
        if (this.life < 0) {
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

class PowerUp {
    constructor(game) {
        this.game = game;
        this.x = Math.random() * this.game.width;
        this.y = Math.random() * this.game.height;
        this.radius = 15;
        this.markedForDeletion = false;
        this.type = ['shield', 'slow-mo', 'wipeout'][Math.floor(Math.random() * 3)];
        this.color = 'cyan';
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
        
        // Time
        context.fillText(`Time: ${(this.game.survivalTime / 1000).toFixed(2)}`, 20, 40);
        
        // Score
        context.fillText(`Score: ${this.game.score}`, 20, 70);

        // High Score
        context.fillText(`High Score: ${this.game.highScore}`, 20, 100);

        // Game Over message
        if (this.game.gameOver) {
            context.textAlign = 'center';
            context.font = `50px ${this.fontFamily}`;
            context.fillText('Game Over', this.game.width / 2, this.game.height / 2 - 20);
            context.font = `20px ${this.fontFamily}`;
            context.fillText(`Your score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 20);
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
        this.powerUps = [];
        this.particles = [];
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.powerUpTimer = 0;
        this.powerUpInterval = 10000; // Spawn power-up every 10 seconds
        this.survivalTime = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('vectorDodgerHighScore') || 0;
        this.gameOver = false;
    }

    update(deltaTime) {
        if (this.gameOver) {
            if (this.input.keys.includes('enter')) {
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
            const enemyType = Math.random();
            if (enemyType < 0.5) {
                this.enemies.push(new BasicEnemy(this));
            } else if (enemyType < 0.8) {
                this.enemies.push(new SpiralShooter(this));
            } else {
                this.enemies.push(new Charger(this));
            }
        }

        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.projectiles.forEach(projectile => {
            projectile.update();
            if (this.checkCollision(this.player, projectile) && !this.player.shielded) {
                projectile.markedForDeletion = true;
                this.endGame();
            }

            // Grazing check
            const dist = Math.hypot(this.player.x + this.player.width / 2 - projectile.x, this.player.y + this.player.height / 2 - projectile.y);
            if (dist < this.player.grazeRadius + projectile.radius && !projectile.grazed) {
                projectile.grazed = true;
                this.score += 10; // 10 points for a graze
            }
        });

        // Power-up spawning
        this.powerUpTimer += deltaTime;
        if (this.powerUpTimer > this.powerUpInterval) {
            this.powerUpTimer = 0;
            this.powerUps.push(new PowerUp(this));
        }

        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
        this.powerUps.forEach(powerUp => {
            if (this.checkCollision(this.player, powerUp)) {
                powerUp.markedForDeletion = true;
                this.player.activatePowerUp(powerUp.type);
            }
        });

        this.particles = this.particles.filter(p => !p.markedForDeletion);
        this.particles.forEach(particle => particle.update());
    }

    draw(context) {
        this.player.draw(context);
        this.enemies.forEach(enemy => enemy.draw(context));
        this.projectiles.forEach(projectile => projectile.draw(context));
        this.powerUps.forEach(powerUp => powerUp.draw(context));
        this.particles.forEach(particle => particle.draw(context));
        this.ui.draw(context);
    }

    checkCollision(rect, circle) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (circle.radius * circle.radius);
    }

    endGame() {
        this.gameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('vectorDodgerHighScore', this.highScore);
        }
    }

    restart() {
        this.player = new Player(this);
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.enemyTimer = 0;
        this.survivalTime = 0;
        this.score = 0;
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

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
