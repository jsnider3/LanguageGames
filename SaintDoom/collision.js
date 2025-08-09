export class CollisionSystem {
    constructor() {
        this.margin = 0.3; // Player/enemy collision radius
    }
    
    checkPlayerWallCollisions(player, walls) {
        const nextPos = player.position.clone().add(player.velocity);
        
        // Check X and Z axes separately for smooth wall sliding
        const canMoveX = !this.checkWallCollision(
            new THREE.Vector3(nextPos.x, player.position.y, player.position.z),
            walls,
            this.margin
        );
        
        const canMoveZ = !this.checkWallCollision(
            new THREE.Vector3(player.position.x, player.position.y, nextPos.z),
            walls,
            this.margin
        );
        
        // Apply movement based on collision
        if (!canMoveX) {
            player.velocity.x = 0;
        }
        if (!canMoveZ) {
            player.velocity.z = 0;
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
    
    checkEnemyPlayerCollisions(enemies, player) {
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(player.position);
            const collisionDistance = enemy.radius + player.radius;
            
            if (distance < collisionDistance) {
                // Push enemy away from player
                const pushDirection = new THREE.Vector3()
                    .subVectors(enemy.position, player.position)
                    .normalize();
                
                const overlap = collisionDistance - distance;
                enemy.position.add(pushDirection.multiplyScalar(overlap));
            }
        });
    }
    
    checkEnemyWallCollisions(enemy, walls) {
        const nextPos = enemy.position.clone().add(enemy.velocity);
        
        // Check X and Z axes separately
        const canMoveX = !this.checkWallCollision(
            new THREE.Vector3(nextPos.x, enemy.position.y, enemy.position.z),
            walls,
            enemy.radius
        );
        
        const canMoveZ = !this.checkWallCollision(
            new THREE.Vector3(enemy.position.x, enemy.position.y, nextPos.z),
            walls,
            enemy.radius
        );
        
        // Apply movement based on collision
        if (!canMoveX) {
            enemy.velocity.x = 0;
        }
        if (!canMoveZ) {
            enemy.velocity.z = 0;
        }
    }
    
    checkEnemyEnemyCollisions(enemies) {
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const enemy1 = enemies[i];
                const enemy2 = enemies[j];
                
                const distance = enemy1.position.distanceTo(enemy2.position);
                const collisionDistance = enemy1.radius + enemy2.radius;
                
                if (distance < collisionDistance) {
                    // Push enemies apart
                    const pushDirection = new THREE.Vector3()
                        .subVectors(enemy2.position, enemy1.position)
                        .normalize();
                    
                    const overlap = collisionDistance - distance;
                    const halfOverlap = overlap / 2;
                    
                    enemy1.position.sub(pushDirection.clone().multiplyScalar(halfOverlap));
                    enemy2.position.add(pushDirection.clone().multiplyScalar(halfOverlap));
                }
            }
        }
    }
    
    raycast(origin, direction, distance, walls) {
        // Simple raycasting for line of sight checks
        const ray = new THREE.Raycaster(origin, direction, 0, distance);
        const intersects = [];
        
        walls.forEach(wall => {
            const wallIntersects = ray.intersectObject(wall.mesh);
            intersects.push(...wallIntersects);
        });
        
        return intersects.length > 0;
    }
    
    checkProjectileCollisions(projectile, walls, enemies, player) {
        const collisions = {
            wall: null,
            enemy: null,
            player: false
        };
        
        // Check wall collisions
        for (let wall of walls) {
            if (this.pointIntersectsBox(projectile.position, wall.min, wall.max, 0.1)) {
                collisions.wall = wall;
                break;
            }
        }
        
        // Check enemy collisions
        for (let enemy of enemies) {
            const distance = projectile.position.distanceTo(enemy.position);
            if (distance < enemy.radius + 0.1) {
                collisions.enemy = enemy;
                break;
            }
        }
        
        // Check player collision (for enemy projectiles)
        if (projectile.isEnemyProjectile) {
            const distance = projectile.position.distanceTo(player.position);
            if (distance < player.radius + 0.1) {
                collisions.player = true;
            }
        }
        
        return collisions;
    }
}