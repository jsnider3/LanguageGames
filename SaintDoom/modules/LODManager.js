import * as THREE from 'three';

/**
 * Level of Detail manager for optimizing rendering performance
 * Automatically switches between different detail levels based on distance
 */
export class LODManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.lodObjects = new Map();
        this.updateFrequency = 0.5; // Update LOD every 0.5 seconds
        this.lastUpdateTime = 0;
        
        // LOD distance thresholds
        this.distances = {
            high: 15,    // Within 15 units: high detail
            medium: 30,  // 15-30 units: medium detail
            low: 50      // 30-50 units: low detail, beyond: culled
        };
    }
    
    /**
     * Register an object with LOD levels
     * @param {Object} object - The object to add LOD to
     * @param {Object} levels - Object containing high, medium, low meshes
     */
    registerLOD(object, levels) {
        const lodGroup = new THREE.LOD();
        
        // Add LOD levels
        if (levels.high) {
            lodGroup.addLevel(levels.high, 0);
        }
        if (levels.medium) {
            lodGroup.addLevel(levels.medium, this.distances.high);
        }
        if (levels.low) {
            lodGroup.addLevel(levels.low, this.distances.medium);
        }
        
        // Store reference
        this.lodObjects.set(object.id || object.uuid, {
            lodGroup: lodGroup,
            originalObject: object,
            levels: levels
        });
        
        return lodGroup;
    }
    
    /**
     * Create LOD levels for an enemy
     */
    createEnemyLOD(enemyType, position) {
        const lodGroup = new THREE.LOD();
        
        // High detail mesh
        const highDetail = this.createHighDetailEnemy(enemyType);
        
        // Medium detail mesh
        const mediumDetail = this.createMediumDetailEnemy(enemyType);
        
        // Low detail mesh (billboard sprite)
        const lowDetail = this.createLowDetailEnemy(enemyType);
        
        // Add levels
        lodGroup.addLevel(highDetail, 0);
        lodGroup.addLevel(mediumDetail, this.distances.high);
        lodGroup.addLevel(lowDetail, this.distances.medium);
        
        lodGroup.position.copy(position);
        
        return lodGroup;
    }
    
    createHighDetailEnemy(type) {
        const group = new THREE.Group();
        
        if (type === 'hellhound') {
            // Full detail hellhound
            const bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.5);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x220000,
                roughness: 0.9,
                emissive: 0x440000,
                emissiveIntensity: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.3;
            body.castShadow = true;
            group.add(body);
            
            // Head
            const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.5);
            const head = new THREE.Mesh(headGeometry, bodyMaterial);
            head.position.set(-0.5, 0.4, 0);
            group.add(head);
            
            // Eyes
            const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.6, 0.45, -0.15);
            group.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(-0.6, 0.45, 0.15);
            group.add(rightEye);
            
            // Tail
            const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.6);
            const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
            tail.position.set(0.5, 0.3, 0);
            tail.rotation.z = Math.PI / 2;
            group.add(tail);
            
        } else if (type === 'possessed_scientist') {
            // Full detail scientist
            const bodyGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.4);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x404040,
                roughness: 0.8
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.8;
            body.castShadow = true;
            group.add(body);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0xffccaa,
                roughness: 0.7
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.9;
            group.add(head);
            
            // Arms
            const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
            leftArm.position.set(-0.5, 0.8, 0);
            group.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
            rightArm.position.set(0.5, 0.8, 0);
            group.add(rightArm);
        }
        
        return group;
    }
    
    createMediumDetailEnemy(type) {
        const group = new THREE.Group();
        
        // Simplified geometry with fewer polygons
        const material = new THREE.MeshLambertMaterial({
            color: type === 'hellhound' ? 0x440000 : 0x606060
        });
        
        // Single box for body
        const bodyGeometry = new THREE.BoxGeometry(
            type === 'hellhound' ? 1.2 : 0.8,
            type === 'hellhound' ? 0.6 : 1.6,
            type === 'hellhound' ? 0.5 : 0.4
        );
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = type === 'hellhound' ? 0.3 : 0.8;
        group.add(body);
        
        // Simple head
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const head = new THREE.Mesh(headGeometry, material);
        head.position.y = type === 'hellhound' ? 0.4 : 1.9;
        head.position.x = type === 'hellhound' ? -0.5 : 0;
        group.add(head);
        
        return group;
    }
    
    createLowDetailEnemy(type) {
        // Billboard sprite for far distance
        const spriteMaterial = new THREE.SpriteMaterial({
            color: type === 'hellhound' ? 0x660000 : 0x808080,
            sizeAttenuation: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 2, 1);
        
        return sprite;
    }
    
    /**
     * Create LOD levels for decorative objects
     */
    createDecorationLOD(type, position) {
        const lodGroup = new THREE.LOD();
        
        if (type === 'barrel') {
            // High detail
            const highGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x654321 });
            const high = new THREE.Mesh(highGeometry, material);
            high.castShadow = true;
            
            // Medium detail
            const mediumGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1);
            const medium = new THREE.Mesh(mediumGeometry, material);
            
            // Low detail
            const lowGeometry = new THREE.BoxGeometry(1, 1, 1);
            const low = new THREE.Mesh(lowGeometry, material);
            
            lodGroup.addLevel(high, 0);
            lodGroup.addLevel(medium, this.distances.high);
            lodGroup.addLevel(low, this.distances.medium);
            
        } else if (type === 'crate') {
            // High detail with texture
            const highGeometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x8b4513,
                roughness: 0.9
            });
            const high = new THREE.Mesh(highGeometry, material);
            high.castShadow = true;
            
            // Medium detail
            const medium = new THREE.Mesh(highGeometry, material);
            
            // Low detail (no shadows)
            const lowMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
            const low = new THREE.Mesh(highGeometry, lowMaterial);
            
            lodGroup.addLevel(high, 0);
            lodGroup.addLevel(medium, this.distances.high);
            lodGroup.addLevel(low, this.distances.medium);
        }
        
        lodGroup.position.copy(position);
        return lodGroup;
    }
    
    /**
     * Update LOD levels based on camera distance
     */
    update(deltaTime) {
        this.lastUpdateTime += deltaTime;
        
        // Only update at specified frequency
        if (this.lastUpdateTime < this.updateFrequency) {
            return;
        }
        
        this.lastUpdateTime = 0;
        
        // Update all LOD objects
        this.lodObjects.forEach(lodData => {
            if (lodData.lodGroup && lodData.lodGroup.parent) {
                lodData.lodGroup.update(this.camera);
            }
        });
    }
    
    /**
     * Set custom distance thresholds
     */
    setDistances(high, medium, low) {
        this.distances.high = high;
        this.distances.medium = medium;
        this.distances.low = low;
        
        // Update existing LOD objects
        this.lodObjects.forEach(lodData => {
            if (lodData.lodGroup) {
                lodData.lodGroup.levels[1].distance = high;
                lodData.lodGroup.levels[2].distance = medium;
            }
        });
    }
    
    /**
     * Remove LOD object
     */
    removeLOD(id) {
        const lodData = this.lodObjects.get(id);
        if (lodData && lodData.lodGroup && lodData.lodGroup.parent) {
            lodData.lodGroup.parent.remove(lodData.lodGroup);
        }
        this.lodObjects.delete(id);
    }
    
    /**
     * Clear all LOD objects
     */
    clear() {
        this.lodObjects.forEach(lodData => {
            if (lodData.lodGroup && lodData.lodGroup.parent) {
                lodData.lodGroup.parent.remove(lodData.lodGroup);
            }
        });
        this.lodObjects.clear();
    }
    
    /**
     * Get statistics
     */
    getStats() {
        let visibleHigh = 0;
        let visibleMedium = 0;
        let visibleLow = 0;
        
        this.lodObjects.forEach(lodData => {
            if (lodData.lodGroup && lodData.lodGroup.visible) {
                const currentLevel = lodData.lodGroup.getCurrentLevel();
                if (currentLevel === 0) visibleHigh++;
                else if (currentLevel === 1) visibleMedium++;
                else if (currentLevel === 2) visibleLow++;
            }
        });
        
        return {
            total: this.lodObjects.size,
            high: visibleHigh,
            medium: visibleMedium,
            low: visibleLow
        };
    }
}