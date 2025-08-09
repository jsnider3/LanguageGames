export class Player {
    constructor(camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(0, 1.7, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // Movement properties
        this.moveSpeed = 10;
        this.sprintMultiplier = 1.5;
        this.friction = 0.9;
        this.bobAmount = 0;
        this.bobSpeed = 0.018;
        this.baseHeight = 1.7;
        
        // Mouse look
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;
        this.maxPitch = Math.PI / 2 - 0.1;
        
        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.maxArmor = 100;
        
        // State
        this.isGrounded = true;
        this.isSprinting = false;
        this.isBlocking = false;
        
        // Collision
        this.radius = 0.3;
        this.height = 1.8;
    }
    
    update(deltaTime, input) {
        // Update movement
        this.updateMovement(input, deltaTime);
        
        // Update camera position
        this.camera.position.copy(this.position);
        
        // Apply head bobbing
        if (this.velocity.length() > 0.1) {
            this.bobAmount += this.bobSpeed;
            const bobOffset = Math.sin(this.bobAmount * Math.PI * 2) * 0.05;
            this.camera.position.y = this.position.y + bobOffset;
        } else {
            this.bobAmount = 0;
            this.camera.position.y = this.position.y;
        }
        
        // Update camera rotation from mouse look
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    updateMovement(input, deltaTime) {
        // Get movement direction
        const moveVector = new THREE.Vector3();
        
        if (input.forward) moveVector.z -= 1;
        if (input.backward) moveVector.z += 1;
        if (input.left) moveVector.x -= 1;
        if (input.right) moveVector.x += 1;
        
        // Normalize diagonal movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply sprint multiplier
            const speed = this.isSprinting ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
            moveVector.multiplyScalar(speed);
            
            // Rotate movement vector by camera yaw
            const moveX = moveVector.x * Math.cos(this.yaw) - moveVector.z * Math.sin(this.yaw);
            const moveZ = moveVector.x * Math.sin(this.yaw) + moveVector.z * Math.cos(this.yaw);
            
            moveVector.x = moveX;
            moveVector.z = moveZ;
        }
        
        // Apply movement with momentum
        this.velocity.x = this.velocity.x * this.friction + moveVector.x * (1 - this.friction);
        this.velocity.z = this.velocity.z * this.friction + moveVector.z * (1 - this.friction);
        
        // Apply velocity to position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Handle sprinting
        this.isSprinting = input.sprint;
    }
    
    applyMouseLook(deltaX, deltaY) {
        // Apply mouse movement to camera rotation
        this.yaw -= deltaX * this.mouseSensitivity;
        this.pitch -= deltaY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    }
    
    takeDamage(amount) {
        // Apply armor first
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, amount * 0.5);
            this.armor -= armorAbsorb;
            amount -= armorAbsorb;
        }
        
        // Apply remaining damage to health
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        // Screen shake effect (handled in game.js)
        if (this.health <= 0) {
            this.onDeath();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
    }
    
    onDeath() {
        console.log("Seven times I've died, seven times I rise...");
        // Death handling will be implemented in game.js
    }
    
    getForwardVector() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(new THREE.Euler(0, this.yaw, 0));
        return forward;
    }
    
    getRightVector() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(new THREE.Euler(0, this.yaw, 0));
        return right;
    }
}