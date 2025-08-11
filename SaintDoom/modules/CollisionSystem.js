// CollisionSystem Module
// Handles collision detection between players, enemies, walls, and pickups

export class CollisionSystem {
    constructor() {
        this.margin = 0.3;
    }
    
    checkPlayerWallCollisions(player, walls, deltaTime, level, enemies) {
        
        // Calculate the intended movement step
        const velocityStep = player.velocity.clone().multiplyScalar(deltaTime);
        
        // Store original position for rollback if needed
        const originalPosition = player.position.clone();
        
        // Try X movement first
        const testPosX = player.position.clone();
        testPosX.x += velocityStep.x;
        
        const canMoveX = !this.checkWallCollision(testPosX, walls, this.margin) && 
                        !this.checkEnemyCollision(testPosX, enemies, player.radius);
        
        if (canMoveX) {
            player.position.x = testPosX.x;
        } else {
            player.velocity.x = 0; // Stop X velocity
        }
        
        // Try Z movement from the current (possibly updated) X position
        const testPosZ = player.position.clone();
        testPosZ.z += velocityStep.z;
        
        const canMoveZ = !this.checkWallCollision(testPosZ, walls, this.margin) &&
                        !this.checkEnemyCollision(testPosZ, enemies, player.radius);
        
        if (canMoveZ) {
            player.position.z = testPosZ.z;
        } else {
            player.velocity.z = 0; // Stop Z velocity
        }
        
        // Final position validation - if somehow we're still in a wall, rollback
        const finalCollisionCheck = this.checkWallCollision(player.position, walls, this.margin);
        if (finalCollisionCheck) {
            player.position.copy(originalPosition);
        }
        
        // Apply level-specific bounds
        if (this.game && this.game.chapelLevel) {
            // Extended bounds for chapel
            player.position.x = Math.max(-9.5, Math.min(9.5, player.position.x));
            player.position.z = Math.max(-49, Math.min(11.5, player.position.z));
        } else if (this.game && this.game.armoryLevel) {
            // Armory level bounds
            player.position.x = Math.max(-19.5, Math.min(19.5, player.position.x));
            player.position.z = Math.max(-49, Math.min(19.5, player.position.z));
        }
    }
    
    checkWallCollision(pos, walls, margin) {
        for (let wall of walls) {
            if (this.pointIntersectsBox(pos, wall.min, wall.max, margin)) {
                return true;
            }
        }
        return false;
    }
    
    pointIntersectsBox(point, boxMin, boxMax, margin) {
        return point.x + margin > boxMin.x && point.x - margin < boxMax.x &&
               point.y + margin > boxMin.y && point.y - margin < boxMax.y &&
               point.z + margin > boxMin.z && point.z - margin < boxMax.z;
    }
    
    checkEnemyCollision(pos, enemies, playerRadius) {
        
        for (let enemy of enemies) {
            // Skip dead enemies
            if (enemy.health <= 0) continue;
            
            // Check if position would collide with enemy
            const distance = pos.distanceTo(enemy.position);
            const collisionDistance = (enemy.radius || 0.3) + playerRadius;
            
            if (distance < collisionDistance) {
                return true;
            }
        }
        return false;
    }
    
    checkEnemyWallCollisions(enemy, walls, deltaTime, level) {
        // Calculate movement step
        const velocityStep = enemy.velocity.clone().multiplyScalar(deltaTime);
        const nextPos = enemy.position.clone().add(velocityStep);
        
        // Check if next position would collide
        const collision = this.checkWallCollision(nextPos, walls, enemy.radius || 0.3);
        
        if (collision) {
            // Try sliding along walls
            const slideX = enemy.position.clone();
            slideX.x += velocityStep.x;
            
            const slideZ = enemy.position.clone();
            slideZ.z += velocityStep.z;
            
            if (!this.checkWallCollision(slideX, walls, enemy.radius + 0.1)) {
                // Can move along X axis
                enemy.position.x = slideX.x;
                enemy.velocity.z = 0;
            } else if (!this.checkWallCollision(slideZ, walls, enemy.radius + 0.1)) {
                // Can move along Z axis
                enemy.position.z = slideZ.z;
                enemy.velocity.x = 0;
            } else {
                // Stuck, stop movement and add random turn
                enemy.velocity.set(0, 0, 0);
                
                // Add random direction change to help escape corners
                if (Math.random() < 0.3) {
                    const angle = Math.random() * Math.PI * 2;
                    enemy.velocity.x = Math.cos(angle) * enemy.moveSpeed * 0.5;
                    enemy.velocity.z = Math.sin(angle) * enemy.moveSpeed * 0.5;
                }
            }
        } else {
            // No collision, apply movement
            enemy.position.copy(nextPos);
        }
        
        // Keep enemies in bounds based on level size
        // For chapel level, use extended bounds
        if (this.game && this.game.chapelLevel) {
            const boundMargin = enemy.radius + 0.5;
            enemy.position.x = Math.max(-9.5, Math.min(9.5, enemy.position.x));
            enemy.position.z = Math.max(-50, Math.min(11.5, enemy.position.z));  // Extended for chapel
        } else {
            let levelSize = 9.5;  // Default for level 1
            if (level) {
                const actualLevel = ((level.levelNumber - 1) % 3) + 1;  // Loops levels 1-3
                if (actualLevel === 2) {
                    levelSize = 14.5;
                } else if (actualLevel === 3) {
                    levelSize = 19.5;
                }
            }
            const boundMargin = enemy.radius + 0.5;
            enemy.position.x = Math.max(-levelSize + boundMargin, Math.min(levelSize - boundMargin, enemy.position.x));
            enemy.position.z = Math.max(-levelSize + boundMargin, Math.min(levelSize - boundMargin, enemy.position.z));
        }
    }
    
    checkEnemyPlayerCollisions(enemies, player) {
        enemies.forEach(enemy => {
            // Skip dead enemies
            if (enemy.health <= 0) return;
            
            const distance = enemy.position.distanceTo(player.position);
            const collisionDistance = enemy.radius + player.radius;
            
            if (distance < collisionDistance) {
                const pushDirection = new THREE.Vector3()
                    .subVectors(enemy.position, player.position)
                    .normalize();
                
                const overlap = collisionDistance - distance;
                
                // Push both enemy and player apart (50/50 split)
                const halfOverlap = overlap * 0.5;
                enemy.position.add(pushDirection.clone().multiplyScalar(halfOverlap));
                player.position.sub(pushDirection.clone().multiplyScalar(halfOverlap));
            }
        });
    }
}