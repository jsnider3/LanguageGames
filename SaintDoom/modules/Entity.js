// Base Entity class for all game objects with common properties
export class Entity {
    constructor(scene, position = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mesh = null;
        
        // Common properties
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        this.radius = 0.5;  // Collision radius
        this.height = 2;    // Entity height
        this.speed = 5;     // Movement speed
        
        // Physics
        this.isGrounded = true;
        this.gravity = -9.8;
        this.jumpForce = 5;
        
        // Combat
        this.damage = 10;
        this.attackCooldown = 1000;  // ms
        this.lastAttackTime = 0;
        
        // Type identification
        this.type = 'entity';
        this.team = 'neutral';  // 'player', 'enemy', 'neutral'
    }
    
    // Update method to be overridden by subclasses
    update(deltaTime) {
        if (this.isDead) return;
        
        // Apply gravity if not grounded
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update mesh position if it exists
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        
        // Check if dead
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }
    
    // Take damage
    takeDamage(amount, damageType = 'normal') {
        if (this.isDead) return;
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health <= 0) {
            this.die();
        }
        
        this.onDamage(amount, damageType);
    }
    
    // Heal
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    // Death handling
    die() {
        this.isDead = true;
        this.onDeath();
    }
    
    // Attack method
    canAttack() {
        const now = Date.now();
        return now - this.lastAttackTime >= this.attackCooldown;
    }
    
    performAttack(target) {
        if (!this.canAttack()) return false;
        
        const distance = this.position.distanceTo(target.position);
        if (distance < this.getAttackRange()) {
            target.takeDamage(this.damage);
            this.lastAttackTime = Date.now();
            this.onAttack(target);
            return true;
        }
        return false;
    }
    
    // Movement methods
    moveToward(targetPosition, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();
        
        this.velocity.x = direction.x * this.speed;
        this.velocity.z = direction.z * this.speed;
    }
    
    // Apply knockback
    applyKnockback(direction, force) {
        this.velocity.add(direction.clone().normalize().multiplyScalar(force));
    }
    
    // Collision detection helpers
    getBoundingBox() {
        return {
            min: new THREE.Vector3(
                this.position.x - this.radius,
                this.position.y,
                this.position.z - this.radius
            ),
            max: new THREE.Vector3(
                this.position.x + this.radius,
                this.position.y + this.height,
                this.position.z + this.radius
            )
        };
    }
    
    isCollidingWith(other) {
        const distance = this.position.distanceTo(other.position);
        return distance < (this.radius + other.radius);
    }
    
    // Cleanup
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            // Dispose of geometry and materials
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        
        this.onDestroy();
    }
    
    // Virtual methods to be overridden by subclasses
    onDamage(amount, damageType) {
        // Override in subclass for damage effects
    }
    
    onDeath() {
        // Override in subclass for death effects
    }
    
    onAttack(target) {
        // Override in subclass for attack effects
    }
    
    onDestroy() {
        // Override in subclass for cleanup
    }
    
    getAttackRange() {
        // Override in subclass
        return 2;
    }
    
    // Utility methods
    distanceTo(entity) {
        return this.position.distanceTo(entity.position);
    }
    
    lookAt(target) {
        if (!this.mesh) return;
        
        const direction = new THREE.Vector3()
            .subVectors(target.position || target, this.position)
            .normalize();
        
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    // Save/Load for persistence
    serialize() {
        return {
            type: this.type,
            position: { x: this.position.x, y: this.position.y, z: this.position.z },
            health: this.health,
            isDead: this.isDead
        };
    }
    
    deserialize(data) {
        this.position.set(data.position.x, data.position.y, data.position.z);
        this.health = data.health;
        this.isDead = data.isDead;
    }
}