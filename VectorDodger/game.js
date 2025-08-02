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
        
        // Weapon system
        this.currentWeapon = null;
        this.unlockedWeapons = [];
        this.fireTimer = 0;
        this.autoFire = true;
        this.fireRateMultiplier = 1;
        this.damageMultiplier = 1;
        
        // Orbital shield
        this.orbitals = [];
        this.orbitalAngle = 0;
        
        // Rotation
        this.angle = -Math.PI / 2; // Start facing up
        this.targetAngle = -Math.PI / 2;
        this.rotationSpeed = 0.15;
    }

    update(deltaTime) {
        // Movement and rotation
        let dx = 0;
        let dy = 0;
        
        if (this.game.input.keys.includes('arrowup') || this.game.input.keys.includes('w')) {
            dy = -1;
        }
        if (this.game.input.keys.includes('arrowdown') || this.game.input.keys.includes('s')) {
            dy = 1;
        }
        if (this.game.input.keys.includes('arrowleft') || this.game.input.keys.includes('a')) {
            dx = -1;
        }
        if (this.game.input.keys.includes('arrowright') || this.game.input.keys.includes('d')) {
            dx = 1;
        }
        
        // Update position
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        
        // Update target angle based on movement direction
        if (dx !== 0 || dy !== 0) {
            this.targetAngle = Math.atan2(dy, dx);
        }
        
        // Smooth rotation towards target angle
        let angleDiff = this.targetAngle - this.angle;
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.angle += angleDiff * this.rotationSpeed;

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

        // Update weapon firing
        if (this.currentWeapon && this.autoFire) {
            this.fireTimer += deltaTime;
            const adjustedFireRate = this.currentWeapon.fireRate / this.fireRateMultiplier;
            if (this.fireTimer >= adjustedFireRate) {
                this.fireTimer = 0;
                this.fireWeapon();
            }
        }
        
        // Update orbital shield
        if (this.orbitals.length > 0) {
            this.orbitalAngle += 0.05;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const orbitRadius = 50;
            
            this.orbitals.forEach((orbital, index) => {
                const angle = this.orbitalAngle + (index * Math.PI * 2 / this.orbitals.length);
                orbital.x = centerX + Math.cos(angle) * orbitRadius;
                orbital.y = centerY + Math.sin(angle) * orbitRadius;
                orbital.update();
            });
            
            // Clean up expired orbitals
            this.orbitals = this.orbitals.filter(o => !o.markedForDeletion);
        }

        // Add particles
        // this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, this.color));
    }

    draw(context) {
        context.save();
        
        // Translate to ship center and rotate
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        context.translate(centerX, centerY);
        context.rotate(this.angle + Math.PI / 2); // Add 90 degrees because ship points up by default
        
        context.fillStyle = this.color;
        context.beginPath();
        context.moveTo(0, -this.height / 2);
        context.lineTo(-this.width / 2, this.height / 2);
        context.lineTo(this.width / 2, this.height / 2);
        context.closePath();
        context.fill();

        if (this.shielded) {
            context.strokeStyle = 'cyan';
            context.lineWidth = 3;
            context.stroke();
        }
        
        context.restore();
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
        } else if (type === 'rapid-fire') {
            this.fireRateMultiplier = 3;
            setTimeout(() => {
                this.fireRateMultiplier = 1;
            }, 10000); // Rapid fire lasts for 10 seconds
        } else if (type === 'damage-boost') {
            this.damageMultiplier = 2;
            setTimeout(() => {
                this.damageMultiplier = 1;
            }, 15000); // Damage boost lasts for 15 seconds
        } else if (type === 'score-multiplier') {
            this.game.scoreMultiplier = 2;
            setTimeout(() => {
                this.game.scoreMultiplier = 1;
            }, 20000); // Score multiplier lasts for 20 seconds
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
                this.game.score += 50 * this.game.scoreMultiplier; // Add 50 points for each destroyed projectile
            }
        });
        setTimeout(() => {
            this.empCooldown = false;
        }, 10000); // 10 second cooldown
    }

    fireWeapon() {
        if (!this.currentWeapon) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Calculate spawn position at the tip of the ship
        const tipDistance = this.height / 2;
        const spawnX = centerX + Math.cos(this.angle) * tipDistance;
        const spawnY = centerY + Math.sin(this.angle) * tipDistance;
        
        switch (this.currentWeapon.type) {
            case 'basic':
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX, spawnY, this.angle, 'basic'));
                break;
            case 'spread':
                // Fire 3 projectiles in a spread pattern
                const spreadAngle = Math.PI / 8; // 22.5 degrees
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX, spawnY, this.angle - spreadAngle, 'spread'));
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX, spawnY, this.angle, 'spread'));
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX, spawnY, this.angle + spreadAngle, 'spread'));
                break;
            case 'homing':
                // Fire 2 homing missiles
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX - 5, spawnY, this.angle - 0.2, 'homing'));
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX + 5, spawnY, this.angle + 0.2, 'homing'));
                break;
            case 'laser':
                // Fire a continuous laser beam
                this.game.playerProjectiles.push(new PlayerProjectile(this.game, spawnX, spawnY, this.angle, 'laser'));
                break;
            case 'orbital':
                // Add orbital projectiles
                if (this.orbitals.length < 4) {
                    this.orbitals.push(new PlayerProjectile(this.game, spawnX, spawnY, 0, 'orbital'));
                }
                break;
            case 'bomb':
                // Screen clear bomb
                const projectileCount = this.game.projectiles.length;
                this.game.projectiles = [];
                this.game.score += projectileCount * 25 * this.game.scoreMultiplier;
                // Visual effect
                this.game.bombEffect = true;
                setTimeout(() => { this.game.bombEffect = false; }, 500);
                break;
        }
    }

    unlockWeapon(weaponData) {
        this.unlockedWeapons.push(weaponData);
        this.currentWeapon = weaponData; // Automatically equip new weapon
        this.fireTimer = 0; // Reset fire timer
        
        // Show unlock notification
        this.game.showWeaponUnlock(weaponData);
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

class Sniper extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#00ff99'; // Green color
        this.width = 30;
        this.height = 30;
        this.fireInterval = 3000; // Fires every 3 seconds
        this.fireTimer = 0;
        this.aimDuration = 1000; // 1 second to aim
        this.aiming = false;
        this.targetAngle = 0;
    }

    update(deltaTime) {
        this.fireTimer += deltaTime;
        
        if (this.fireTimer > this.fireInterval - this.aimDuration && !this.aiming) {
            // Start aiming
            this.aiming = true;
            // Calculate angle to player when starting to aim
            this.targetAngle = Math.atan2(
                this.game.player.y + this.game.player.height / 2 - (this.y + this.height / 2),
                this.game.player.x + this.game.player.width / 2 - (this.x + this.width / 2)
            );
        }
        
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            this.aiming = false;
            
            // Fire a precise shot
            const projectile = new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, this.targetAngle);
            projectile.speed = 6;
            projectile.color = '#00ff99';
            projectile.radius = 7;
            this.game.projectiles.push(projectile);
        }
    }

    draw(context) {
        // Draw the enemy
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw aiming laser when aiming
        if (this.aiming) {
            context.save();
            context.strokeStyle = 'rgba(0, 255, 153, 0.5)';
            context.lineWidth = 2;
            context.setLineDash([5, 5]);
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            const laserLength = 800;
            context.lineTo(
                this.x + this.width / 2 + Math.cos(this.targetAngle) * laserLength,
                this.y + this.height / 2 + Math.sin(this.targetAngle) * laserLength
            );
            context.stroke();
            context.restore();
        }
    }
}

class Bomber extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#ff6600'; // Orange color
        this.width = 45;
        this.height = 45;
        this.dropInterval = 2500; // Drop bomb every 2.5 seconds
        this.dropTimer = 0;
        this.moveSpeed = 0.5;
        this.moveDirection = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        // Move slowly in a random direction
        this.x += Math.cos(this.moveDirection) * this.moveSpeed;
        this.y += Math.sin(this.moveDirection) * this.moveSpeed;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= this.game.width - this.width) {
            this.moveDirection = Math.PI - this.moveDirection;
        }
        if (this.y <= 0 || this.y >= this.game.height - this.height) {
            this.moveDirection = -this.moveDirection;
        }
        
        // Keep within bounds
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.height - this.height));
        
        // Drop bombs
        this.dropTimer += deltaTime;
        if (this.dropTimer > this.dropInterval) {
            this.dropTimer = 0;
            this.dropBomb();
        }
    }

    dropBomb() {
        // Create expanding explosion projectiles in a circle
        const numProjectiles = 8;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        for (let i = 0; i < numProjectiles; i++) {
            const angle = (i / numProjectiles) * Math.PI * 2;
            const projectile = new Projectile(this.game, centerX, centerY, angle);
            projectile.speed = 2;
            projectile.color = '#ff3300';
            projectile.radius = 8;
            this.game.projectiles.push(projectile);
        }
    }

    draw(context) {
        // Draw the bomber
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw bomb indicator
        const bombProgress = this.dropTimer / this.dropInterval;
        context.fillStyle = 'rgba(255, 51, 0, 0.3)';
        context.fillRect(this.x, this.y + this.height - 5, this.width * bombProgress, 5);
    }
}


class Shielder extends Enemy {
    constructor(game) {
        super(game);
        this.color = '#6666ff'; // Blue color
        this.width = 40;
        this.height = 40;
        this.fireInterval = 2000;
        this.fireTimer = 0;
        this.shieldActive = true;
        this.shieldHealth = 3;
        this.shieldAngle = 0;
        this.moveSpeed = 0.3;
        this.moveDirection = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime) {
        // Movement
        this.x += Math.cos(this.moveDirection) * this.moveSpeed;
        this.y += Math.sin(this.moveDirection) * this.moveSpeed;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= this.game.width - this.width) {
            this.moveDirection = Math.PI - this.moveDirection;
        }
        if (this.y <= 0 || this.y >= this.game.height - this.height) {
            this.moveDirection = -this.moveDirection;
        }
        
        // Keep within bounds
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.height - this.height));
        
        // Rotate shield
        this.shieldAngle += 0.02;
        
        // Firing
        this.fireTimer += deltaTime;
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // Fire in 4 directions
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + this.shieldAngle;
                const projectile = new Projectile(this.game, centerX, centerY, angle);
                projectile.speed = 3;
                projectile.color = '#9999ff';
                this.game.projectiles.push(projectile);
            }
        }
    }
    
    takeDamage(damage, angle) {
        if (this.shieldActive) {
            // Check if hit is from the front (shield blocks frontal attacks)
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const playerAngle = Math.atan2(
                this.game.player.y - centerY,
                this.game.player.x - centerX
            );
            
            // Normalize angles
            let angleDiff = Math.abs(playerAngle - this.shieldAngle);
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            
            // Shield blocks attacks from front 180 degrees
            if (Math.abs(angleDiff) < Math.PI / 2) {
                this.shieldHealth--;
                if (this.shieldHealth <= 0) {
                    this.shieldActive = false;
                }
                return; // Damage blocked
            }
        }
        
        // Take damage if hit from behind or shield is down
        this.markedForDeletion = true;
        this.game.score += 150 * this.game.scoreMultiplier;
    }
    
    draw(context) {
        // Draw enemy
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw shield
        if (this.shieldActive) {
            context.save();
            context.translate(this.x + this.width / 2, this.y + this.height / 2);
            context.rotate(this.shieldAngle);
            
            // Shield arc
            context.strokeStyle = '#00ffff';
            context.lineWidth = 3;
            context.beginPath();
            context.arc(0, 0, this.width * 0.8, -Math.PI / 2, Math.PI / 2);
            context.stroke();
            
            // Shield health indicators
            for (let i = 0; i < this.shieldHealth; i++) {
                context.fillStyle = '#00ffff';
                context.fillRect(-2, -15 + i * 10, 4, 8);
            }
            
            context.restore();
        }
    }
}

class Splitter extends Enemy {
    constructor(game, size = 'large', x = null, y = null) {
        super(game);
        this.size = size;
        
        if (size === 'large') {
            this.width = 50;
            this.height = 50;
            this.color = '#ff9900'; // Orange
            this.speed = 0.5;
            this.health = 2;
            this.scoreValue = 100;
        } else if (size === 'medium') {
            this.width = 30;
            this.height = 30;
            this.color = '#ffcc00'; // Yellow-orange
            this.speed = 1;
            this.health = 1;
            this.scoreValue = 50;
        } else { // small
            this.width = 20;
            this.height = 20;
            this.color = '#ffff00'; // Yellow
            this.speed = 1.5;
            this.health = 1;
            this.scoreValue = 25;
        }
        
        // Set position
        if (x !== null && y !== null) {
            this.x = x;
            this.y = y;
        }
        
        this.moveDirection = Math.random() * Math.PI * 2;
        this.fireTimer = 0;
        this.fireInterval = size === 'large' ? 3000 : size === 'medium' ? 2000 : 1500;
    }
    
    update(deltaTime) {
        // Movement
        this.x += Math.cos(this.moveDirection) * this.speed;
        this.y += Math.sin(this.moveDirection) * this.speed;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= this.game.width - this.width) {
            this.moveDirection = Math.PI - this.moveDirection;
        }
        if (this.y <= 0 || this.y >= this.game.height - this.height) {
            this.moveDirection = -this.moveDirection;
        }
        
        // Keep within bounds
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.height - this.height));
        
        // Firing
        this.fireTimer += deltaTime;
        if (this.fireTimer > this.fireInterval) {
            this.fireTimer = 0;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            const projectile = new Projectile(this.game, centerX, centerY);
            projectile.color = this.color;
            projectile.speed = 3;
            this.game.projectiles.push(projectile);
        }
    }
    
    split() {
        if (this.size === 'large') {
            // Split into 2 medium
            for (let i = 0; i < 2; i++) {
                const splitter = new Splitter(this.game, 'medium', 
                    this.x + (i - 0.5) * 20, 
                    this.y + Math.random() * 10 - 5
                );
                splitter.moveDirection = this.moveDirection + (i - 0.5) * Math.PI / 3;
                this.game.enemies.push(splitter);
            }
        } else if (this.size === 'medium') {
            // Split into 2 small
            for (let i = 0; i < 2; i++) {
                const splitter = new Splitter(this.game, 'small',
                    this.x + (i - 0.5) * 15,
                    this.y + Math.random() * 10 - 5
                );
                splitter.moveDirection = this.moveDirection + (i - 0.5) * Math.PI / 3;
                this.game.enemies.push(splitter);
            }
        }
        // Small ones don't split further
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            this.game.score += this.scoreValue * this.game.scoreMultiplier;
            this.split();
        }
    }
    
    draw(context) {
        // Draw enemy with size indicator
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw split lines
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        if (this.size === 'large' || this.size === 'medium') {
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y);
            context.lineTo(this.x + this.width / 2, this.y + this.height);
            context.moveTo(this.x, this.y + this.height / 2);
            context.lineTo(this.x + this.width, this.y + this.height / 2);
            context.stroke();
        }
    }
}

class Boss extends Enemy {
    constructor(game, type = 'mini') {
        super(game);
        this.type = type;
        this.isBoss = true;
        
        if (type === 'mini') {
            this.width = 80;
            this.height = 80;
            this.maxHealth = 50;
            this.color = '#ff00ff';
            this.phases = 2;
            this.scoreValue = 1000;
        } else if (type === 'major') {
            this.width = 120;
            this.height = 120;
            this.maxHealth = 100;
            this.color = '#ff0066';
            this.phases = 3;
            this.scoreValue = 5000;
        }
        
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = 50;
        
        // Attack patterns
        this.attackTimer = 0;
        this.attackInterval = 1000;
        this.moveTimer = 0;
        this.movePattern = 0;
        this.invulnerable = false;
        this.phaseTransition = false;
    }
    
    update(deltaTime) {
        // Movement patterns
        this.moveTimer += deltaTime;
        const moveSpeed = this.type === 'mini' ? 2 : 1.5;
        
        switch(this.movePattern) {
            case 0: // Horizontal movement
                this.x += Math.sin(this.moveTimer * 0.002) * moveSpeed;
                break;
            case 1: // Figure-8 pattern
                this.x = this.game.width / 2 + Math.sin(this.moveTimer * 0.002) * 200 - this.width / 2;
                this.y = 100 + Math.sin(this.moveTimer * 0.004) * 50;
                break;
            case 2: // Circular pattern
                const radius = 150;
                this.x = this.game.width / 2 + Math.cos(this.moveTimer * 0.002) * radius - this.width / 2;
                this.y = 150 + Math.sin(this.moveTimer * 0.002) * radius / 2;
                break;
        }
        
        // Keep boss in bounds
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        
        // Attack patterns based on phase
        if (!this.phaseTransition) {
            this.attackTimer += deltaTime;
            if (this.attackTimer > this.attackInterval) {
                this.attackTimer = 0;
                this.executeAttack();
            }
        }
        
        // Check phase transition
        const phaseHealth = this.maxHealth / this.phases;
        const newPhase = Math.ceil(this.health / phaseHealth);
        if (newPhase < this.currentPhase && !this.phaseTransition) {
            this.phaseTransition = true;
            this.invulnerable = true;
            this.currentPhase = newPhase;
            
            // Clear screen and change pattern
            this.game.projectiles = [];
            this.movePattern = (this.movePattern + 1) % 3;
            this.attackInterval = Math.max(500, this.attackInterval - 200);
            
            setTimeout(() => {
                this.phaseTransition = false;
                this.invulnerable = false;
            }, 2000);
        }
    }
    
    executeAttack() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        switch(this.currentPhase) {
            case 1:
                // Phase 1: Spread shot
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const projectile = new Projectile(this.game, centerX, centerY, angle);
                    projectile.speed = 3;
                    projectile.color = '#ff66ff';
                    this.game.projectiles.push(projectile);
                }
                break;
                
            case 2:
                // Phase 2: Aimed burst + spiral
                // Aimed shots
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(
                        this.game.player.y - centerY,
                        this.game.player.x - centerX
                    ) + i * 0.3;
                    const projectile = new Projectile(this.game, centerX, centerY, angle);
                    projectile.speed = 5;
                    projectile.color = '#ff0099';
                    this.game.projectiles.push(projectile);
                }
                
                // Spiral
                for (let i = 0; i < 4; i++) {
                    const angle = (this.attackTimer / 200 + i * Math.PI / 2) % (Math.PI * 2);
                    const projectile = new Projectile(this.game, centerX, centerY, angle);
                    projectile.speed = 2;
                    projectile.color = '#ff99ff';
                    this.game.projectiles.push(projectile);
                }
                break;
                
            case 3:
                // Phase 3: Bullet hell pattern
                const patternType = Math.floor(this.attackTimer / 1000) % 3;
                
                if (patternType === 0) {
                    // Radial burst
                    for (let i = 0; i < 16; i++) {
                        const angle = (i / 16) * Math.PI * 2;
                        const projectile = new Projectile(this.game, centerX, centerY, angle);
                        projectile.speed = 2 + (i % 2);
                        projectile.color = '#ff0066';
                        this.game.projectiles.push(projectile);
                    }
                } else if (patternType === 1) {
                    // Cross pattern
                    for (let i = -3; i <= 3; i++) {
                        if (i !== 0) {
                            // Horizontal
                            const projectile1 = new Projectile(this.game, centerX + i * 20, centerY, Math.PI / 2);
                            projectile1.speed = 4;
                            projectile1.color = '#ff3366';
                            this.game.projectiles.push(projectile1);
                            
                            // Vertical
                            const projectile2 = new Projectile(this.game, centerX, centerY + i * 20, 0);
                            projectile2.speed = 4;
                            projectile2.color = '#ff3366';
                            this.game.projectiles.push(projectile2);
                        }
                    }
                }
                break;
        }
    }
    
    takeDamage(damage) {
        if (!this.invulnerable) {
            this.health -= damage;
            if (this.health <= 0) {
                this.markedForDeletion = true;
                this.game.score += this.scoreValue * this.game.scoreMultiplier;
                
                // Spawn power-ups on death
                for (let i = 0; i < 3; i++) {
                    const powerUp = new PowerUp(this.game);
                    powerUp.x = this.x + Math.random() * this.width;
                    powerUp.y = this.y + Math.random() * this.height;
                    this.game.powerUps.push(powerUp);
                }
            }
        }
    }
    
    draw(context) {
        // Draw boss
        context.fillStyle = this.invulnerable ? this.color + '66' : this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw phase indicator
        context.fillStyle = '#ffffff';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(`PHASE ${this.currentPhase}`, this.x + this.width / 2, this.y + this.height / 2);
        
        // Draw health bar
        const barWidth = this.width + 20;
        const barHeight = 10;
        const barX = this.x - 10;
        const barY = this.y - 20;
        
        // Background
        context.fillStyle = '#333333';
        context.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        context.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        context.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        context.strokeStyle = '#ffffff';
        context.strokeRect(barX, barY, barWidth, barHeight);
    }
}

class PlayerProjectile {
    constructor(game, startX, startY, angle, weaponType = 'basic') {
        this.game = game;
        this.x = startX;
        this.y = startY;
        this.markedForDeletion = false;
        this.weaponType = weaponType;
        
        // Set properties based on weapon type
        switch(weaponType) {
            case 'basic':
                this.radius = 4;
                this.color = '#00ff00';
                this.speed = 8;
                this.damage = 1;
                break;
            case 'spread':
                this.radius = 3;
                this.color = '#00ff88';
                this.speed = 7;
                this.damage = 0.75;
                break;
            case 'homing':
                this.radius = 5;
                this.color = '#ff88ff';
                this.speed = 5;
                this.damage = 1.5;
                this.turnSpeed = 0.08;
                this.target = null;
                break;
            case 'laser':
                this.radius = 2;
                this.color = '#00ffff';
                this.speed = 15;
                this.damage = 0.5;
                this.piercing = true;
                this.hitEnemies = [];
                break;
            case 'orbital':
                this.radius = 6;
                this.color = '#ff00ff';
                this.speed = 0;
                this.damage = 1;
                this.lifetime = 10000; // 10 seconds
                this.age = 0;
                this.isOrbital = true;
                break;
        }

        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
    }

    update() {
        // Orbital lifetime
        if (this.isOrbital) {
            this.age += 16; // Approximate deltaTime
            if (this.age >= this.lifetime) {
                this.markedForDeletion = true;
            }
            // Orbitals don't move on their own, position is controlled by player
            return;
        }
        
        // Homing behavior
        if (this.weaponType === 'homing' && this.game.enemies.length > 0) {
            // Find closest enemy if no target
            if (!this.target || this.target.markedForDeletion) {
                let closestEnemy = null;
                let closestDist = Infinity;
                this.game.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < closestDist && !enemy.markedForDeletion) {
                        closestDist = dist;
                        closestEnemy = enemy;
                    }
                });
                this.target = closestEnemy;
            }
            
            // Turn towards target
            if (this.target) {
                const targetAngle = Math.atan2(
                    this.target.y + this.target.height / 2 - this.y,
                    this.target.x + this.target.width / 2 - this.x
                );
                const currentAngle = Math.atan2(this.velocityY, this.velocityX);
                let angleDiff = targetAngle - currentAngle;
                
                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // Apply turn
                const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed);
                const newAngle = currentAngle + turnAmount;
                
                this.velocityX = Math.cos(newAngle) * this.speed;
                this.velocityY = Math.sin(newAngle) * this.speed;
            }
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Mark for deletion if it goes off-screen
        if (this.x < -this.radius || this.x > this.game.width + this.radius || 
            this.y < -this.radius || this.y > this.game.height + this.radius) {
            this.markedForDeletion = true;
        }

        // Check collision with enemies
        this.game.enemies.forEach(enemy => {
            if (this.checkCollisionWithEnemy(enemy)) {
                const damageAmount = this.damage * this.game.player.damageMultiplier;
                const hitAngle = Math.atan2(this.velocityY, this.velocityX);
                
                if (enemy.isBoss) {
                    // Boss takes damage instead of instant death
                    enemy.takeDamage(damageAmount);
                    if (!this.piercing) {
                        this.markedForDeletion = true;
                    }
                } else if (enemy.takeDamage) {
                    // Enemy has custom damage handling (like Shielder)
                    enemy.takeDamage(damageAmount, hitAngle);
                    if (!this.piercing) {
                        this.markedForDeletion = true;
                    }
                } else if (this.weaponType === 'laser' && this.piercing) {
                    // Laser pierces through enemies
                    if (!this.hitEnemies.includes(enemy)) {
                        this.hitEnemies.push(enemy);
                        enemy.markedForDeletion = true;
                        this.game.score += 100 * this.game.scoreMultiplier;
                    }
                } else {
                    this.markedForDeletion = true;
                    enemy.markedForDeletion = true;
                    this.game.score += 100 * this.game.scoreMultiplier;
                }
            }
        });
    }

    checkCollisionWithEnemy(enemy) {
        const closestX = Math.max(enemy.x, Math.min(this.x, enemy.x + enemy.width));
        const closestY = Math.max(enemy.y, Math.min(this.y, enemy.y + enemy.height));
        const distanceX = this.x - closestX;
        const distanceY = this.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (this.radius * this.radius);
    }

    draw(context) {
        context.fillStyle = this.color;
        
        if (this.weaponType === 'laser') {
            // Draw laser as a line
            context.strokeStyle = this.color;
            context.lineWidth = this.radius * 2;
            context.beginPath();
            context.moveTo(this.x - this.velocityX * 2, this.y - this.velocityY * 2);
            context.lineTo(this.x + this.velocityX * 2, this.y + this.velocityY * 2);
            context.stroke();
        } else if (this.weaponType === 'homing') {
            // Draw homing missile with trail
            context.save();
            context.translate(this.x, this.y);
            context.rotate(Math.atan2(this.velocityY, this.velocityX));
            
            // Trail
            context.fillStyle = this.color + '66';
            context.fillRect(-10, -2, 10, 4);
            
            // Missile body
            context.fillStyle = this.color;
            context.fillRect(-5, -2, 10, 4);
            context.fillRect(0, -3, 3, 6);
            
            context.restore();
        } else {
            // Default circular projectile
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fill();
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
        this.x = Math.random() * (this.game.width - 60) + 30;
        this.y = Math.random() * (this.game.height - 60) + 30;
        this.radius = 15;
        this.markedForDeletion = false;
        
        // More power-up types with weighted probabilities
        const rand = Math.random();
        if (rand < 0.25) {
            this.type = 'shield';
        } else if (rand < 0.45) {
            this.type = 'slow-mo';
        } else if (rand < 0.60) {
            this.type = 'wipeout';
        } else if (rand < 0.75) {
            this.type = 'rapid-fire';
        } else if (rand < 0.90) {
            this.type = 'damage-boost';
        } else {
            this.type = 'score-multiplier';
        }
        
        // Set color and symbol based on type
        switch(this.type) {
            case 'shield':
                this.color = '#00ffff'; // Cyan
                this.symbol = 'S';
                this.label = 'Shield';
                break;
            case 'slow-mo':
                this.color = '#ffff00'; // Yellow
                this.symbol = 'T';
                this.label = 'Time';
                break;
            case 'wipeout':
                this.color = '#ff00ff'; // Magenta
                this.symbol = 'W';
                this.label = 'Wipe';
                break;
            case 'rapid-fire':
                this.color = '#ff8800'; // Orange
                this.symbol = 'R';
                this.label = 'Rapid';
                break;
            case 'damage-boost':
                this.color = '#ff0000'; // Red
                this.symbol = 'D';
                this.label = 'Damage';
                break;
            case 'score-multiplier':
                this.color = '#00ff00'; // Green
                this.symbol = 'X';
                this.label = 'Score x2';
                break;
        }
        
        this.pulseTimer = 0;
    }
    
    update(deltaTime) {
        this.pulseTimer += deltaTime;
    }

    draw(context) {
        // Pulsing effect
        const pulse = Math.sin(this.pulseTimer * 0.005) * 0.2 + 1;
        const actualRadius = this.radius * pulse;
        
        // Draw outer glow
        context.fillStyle = this.color + '40'; // 25% opacity
        context.beginPath();
        context.arc(this.x, this.y, actualRadius + 5, 0, Math.PI * 2);
        context.fill();
        
        // Draw main circle
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, actualRadius, 0, Math.PI * 2);
        context.fill();
        
        // Draw inner circle
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(this.x, this.y, actualRadius - 3, 0, Math.PI * 2);
        context.fill();
        
        // Draw symbol
        context.fillStyle = this.color;
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.symbol, this.x, this.y);
        
        // Draw label below
        context.fillStyle = this.color;
        context.font = '10px Arial';
        context.fillText(this.label, this.x, this.y + actualRadius + 10);
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
        
        // Adjust font size for better fit
        context.font = `20px ${this.fontFamily}`;
        
        // Time
        context.fillText(`Time: ${(this.game.survivalTime / 1000).toFixed(2)}s`, 35, 35);
        
        // Score
        context.fillText(`Score: ${this.game.score}`, 35, 60);

        // High Score
        context.fillText(`High Score: ${this.game.highScore}`, 35, 85);
        
        // Current weapon
        if (this.game.player.currentWeapon) {
            context.fillText(`Weapon: ${this.game.player.currentWeapon.name}`, 35, 110);
        } else {
            context.fillText(`Weapon: None`, 35, 110);
        }
        
        // Next weapon unlock
        if (this.game.nextWeaponIndex < this.game.weaponUnlockTimes.length) {
            const nextUnlock = this.game.weaponUnlockTimes[this.game.nextWeaponIndex];
            const timeUntilUnlock = Math.max(0, (nextUnlock.time - this.game.survivalTime) / 1000);
            context.fillText(`Next Unlock: ${timeUntilUnlock.toFixed(1)}s`, 35, 135);
        } else {
            context.fillText(`All Weapons Unlocked`, 35, 135);
        }

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
        this.playerProjectiles = [];
        this.powerUps = [];
        this.particles = [];
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.powerUpTimer = 0;
        this.powerUpInterval = 10000; // Spawn power-up every 10 seconds
        this.survivalTime = 0;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.highScore = localStorage.getItem('vectorDodgerHighScore') || 0;
        this.gameOver = false;
        
        // Weapon unlock system
        this.weaponUnlockTimes = [
            { time: 20000, weapon: { type: 'basic', name: 'Basic Shot', fireRate: 200 } },
            { time: 40000, weapon: { type: 'spread', name: 'Spread Shot', fireRate: 300 } },
            { time: 60000, weapon: { type: 'homing', name: 'Homing Missiles', fireRate: 500 } },
            { time: 90000, weapon: { type: 'laser', name: 'Laser Beam', fireRate: 100 } },
            { time: 120000, weapon: { type: 'orbital', name: 'Orbital Shield', fireRate: 1000 } },
            { time: 150000, weapon: { type: 'bomb', name: 'Screen Clear Bomb', fireRate: 30000 } }
        ];
        this.nextWeaponIndex = 0;
        this.weaponUnlockNotification = null;
        this.weaponUnlockNotificationTimer = 0;
        
        // Boss system
        this.bossActive = false;
        this.lastMiniBossTime = 0;
        this.lastMajorBossTime = 0;
        this.miniBossInterval = 120000; // 2 minutes
        this.majorBossInterval = 300000; // 5 minutes
    }

    update(deltaTime) {
        if (this.gameOver) {
            if (this.input.keys.includes('enter')) {
                this.restart();
            }
            return;
        }

        this.survivalTime += deltaTime;
        this.player.update(deltaTime);
        
        // Check for weapon unlocks
        if (this.nextWeaponIndex < this.weaponUnlockTimes.length) {
            if (this.survivalTime >= this.weaponUnlockTimes[this.nextWeaponIndex].time) {
                this.player.unlockWeapon(this.weaponUnlockTimes[this.nextWeaponIndex].weapon);
                this.nextWeaponIndex++;
            }
        }
        
        // Update weapon unlock notification
        if (this.weaponUnlockNotification) {
            this.weaponUnlockNotificationTimer -= deltaTime;
            if (this.weaponUnlockNotificationTimer <= 0) {
                this.weaponUnlockNotification = null;
            }
        }
        
        // Update boss warning
        if (this.bossWarningTimer > 0) {
            this.bossWarningTimer -= deltaTime;
        }

        // Boss spawning
        if (!this.bossActive) {
            // Check for major boss first (takes priority)
            if (this.survivalTime - this.lastMajorBossTime >= this.majorBossInterval) {
                this.spawnBoss('major');
                this.lastMajorBossTime = this.survivalTime;
                this.lastMiniBossTime = this.survivalTime; // Reset mini-boss timer
            }
            // Check for mini boss
            else if (this.survivalTime - this.lastMiniBossTime >= this.miniBossInterval) {
                this.spawnBoss('mini');
                this.lastMiniBossTime = this.survivalTime;
            }
        }
        
        // Enemy spawning (reduced during boss fights)
        this.enemyTimer += deltaTime;
        const spawnRate = this.bossActive ? this.enemyInterval * 3 : this.enemyInterval;
        if (this.enemyTimer > spawnRate && !this.bossActive) {
            this.enemyTimer = 0;
            const enemyType = Math.random();
            if (enemyType < 0.25) {
                this.enemies.push(new BasicEnemy(this));
            } else if (enemyType < 0.45) {
                this.enemies.push(new SpiralShooter(this));
            } else if (enemyType < 0.6) {
                this.enemies.push(new Charger(this));
            } else if (enemyType < 0.73) {
                this.enemies.push(new Sniper(this));
            } else if (enemyType < 0.83) {
                this.enemies.push(new Bomber(this));
            } else if (enemyType < 0.93) {
                this.enemies.push(new Shielder(this));
            } else {
                this.enemies.push(new Splitter(this));
            }
        }

        this.enemies = this.enemies.filter(e => {
            if (e.markedForDeletion && e.isBoss) {
                this.bossActive = false;
            }
            return !e.markedForDeletion;
        });
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        // Check if boss is still active
        this.bossActive = this.enemies.some(e => e.isBoss);
        
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
                this.score += 10 * this.scoreMultiplier; // 10 points for a graze
            }
        });
        
        // Update player projectiles
        this.playerProjectiles = this.playerProjectiles.filter(p => !p.markedForDeletion);
        this.playerProjectiles.forEach(projectile => {
            projectile.update();
        });

        // Power-up spawning
        this.powerUpTimer += deltaTime;
        if (this.powerUpTimer > this.powerUpInterval) {
            this.powerUpTimer = 0;
            this.powerUps.push(new PowerUp(this));
        }

        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
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
        this.playerProjectiles.forEach(projectile => projectile.draw(context));
        this.powerUps.forEach(powerUp => powerUp.draw(context));
        this.particles.forEach(particle => particle.draw(context));
        this.ui.draw(context);
        
        // Draw player orbitals
        this.player.orbitals.forEach(orbital => orbital.draw(context));
        
        // Draw weapon unlock notification
        if (this.weaponUnlockNotification) {
            context.save();
            context.fillStyle = 'white';
            context.strokeStyle = 'black';
            context.lineWidth = 3;
            context.font = '30px Helvetica';
            context.textAlign = 'center';
            const text = `WEAPON UNLOCKED: ${this.weaponUnlockNotification.name}`;
            context.strokeText(text, this.width / 2, this.height / 2 - 100);
            context.fillText(text, this.width / 2, this.height / 2 - 100);
            context.restore();
        }
        
        // Draw boss warning
        if (this.bossWarning && this.bossWarningTimer > 0) {
            context.save();
            context.fillStyle = '#ff0000';
            context.strokeStyle = '#ffffff';
            context.lineWidth = 4;
            context.font = 'bold 40px Helvetica';
            context.textAlign = 'center';
            context.strokeText(this.bossWarning, this.width / 2, this.height / 2);
            context.fillText(this.bossWarning, this.width / 2, this.height / 2);
            context.restore();
        }
        
        // Draw bomb effect
        if (this.bombEffect) {
            context.save();
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.fillRect(0, 0, this.width, this.height);
            context.restore();
        }
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
        this.playerProjectiles = [];
        this.powerUps = [];
        this.enemyTimer = 0;
        this.survivalTime = 0;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.gameOver = false;
        this.nextWeaponIndex = 0;
        this.weaponUnlockNotification = null;
        this.weaponUnlockNotificationTimer = 0;
    }
    
    showWeaponUnlock(weaponData) {
        this.weaponUnlockNotification = weaponData;
        this.weaponUnlockNotificationTimer = 3000; // Show for 3 seconds
    }
    
    spawnBoss(type) {
        // Clear regular enemies
        this.enemies = this.enemies.filter(e => e.isBoss);
        
        // Create boss
        const boss = new Boss(this, type);
        this.enemies.push(boss);
        this.bossActive = true;
        
        // Show boss warning
        this.bossWarning = type === 'major' ? 'MAJOR BOSS APPROACHING!' : 'MINI BOSS APPROACHING!';
        this.bossWarningTimer = 2000;
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
