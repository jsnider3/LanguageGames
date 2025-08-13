import * as THREE from 'three';
import { BaseWeapon } from '../core/BaseWeapon.js';
import { THEME } from '../modules/config/theme.js';


export class TemporalMine extends BaseWeapon {
    constructor() {
        super();
        this.name = 'Temporal Mine';
        this.damage = 80; // Base explosion damage
        this.fireRate = 1500; // Time between deployments
        this.ammoCapacity = 5; // Limited mine count
        this.currentAmmo = this.ammoCapacity;
        this.range = 15; // Throwing range
        this.accuracy = 1.0;
        
        // Temporal mine specific properties
        this.activeMines = []; // Track deployed mines
        this.maxActiveMines = 3; // Maximum active mines
        this.mineArmTime = 2000; // 2 seconds to arm
        this.mineLifetime = 30000; // 30 seconds before auto-detonation
        this.explosionRadius = 6;
        this.timeDistortionRadius = 10;
        this.timeSlowFactor = 0.3; // Enemies move at 30% speed
        this.timeSlowDuration = 8000; // 8 seconds
        this.chronoEnergy = 100;
        this.maxChronoEnergy = 100;
        this.energyRegenRate = 8; // per second
        this.activeEffects = [];
    }

    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // Main temporal device body
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.8, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a3a,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        weaponGroup.add(body);

        // Temporal core
        const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ced1,
            metalness: 0.4,
            roughness: 0.2,
            emissive: 0x002222,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.x = 0.2;
        weaponGroup.add(core);
        this.temporalCore = core;

        // Time field rings
        for (let i = 0; i < 4; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.4 + i * 0.08, 0.02, 4, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x40e0d0,
                emissive: 0x104040,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.x = 0.2;
            ring.rotation.y = (i * Math.PI / 4);
            ring.rotation.z = (i * Math.PI / 6);
            weaponGroup.add(ring);
            
            if (i === 0) this.timeRings = [ring];
            else this.timeRings.push(ring);
        }

        // Mine launcher tube
        const tubeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.rotation.z = Math.PI / 2;
        tube.position.x = 1;
        weaponGroup.add(tube);

        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.4, 1, 0.6);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(-0.5, -0.7, 0);
        weaponGroup.add(grip);

        // Chrono energy indicator
        const indicatorGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.08);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ced1,
            emissive: 0x004444,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(0, 0.5, 0);
        weaponGroup.add(indicator);
        this.energyIndicator = indicator;

        // Mine count display
        const countGeometry = new THREE.PlaneGeometry(0.4, 0.2);
        const countMaterial = new THREE.MeshStandardMaterial({
            color: THEME.ui.health.full,
            emissive: 0x004400,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const countDisplay = new THREE.Mesh(countGeometry, countMaterial);
        countDisplay.position.set(-0.3, 0.3, 0.31);
        weaponGroup.add(countDisplay);
        this.mineCountDisplay = countDisplay;

        return weaponGroup;
    }

    // Primary fire - deploy temporal mine
    fire(scene, position, direction, player) {
        if (this.currentAmmo <= 0 || this.chronoEnergy < 25 || 
            this.activeMines.length >= this.maxActiveMines ||
            Date.now() - this.lastFired < this.fireRate) {
            return null;
        }

        this.currentAmmo--;
        this.chronoEnergy -= 25;
        this.lastFired = Date.now();

        // Calculate throw position
        const throwDistance = Math.min(this.range, 10);
        const targetPosition = position.clone().add(
            direction.clone().multiplyScalar(throwDistance)
        );

        // Create and deploy mine
        const mine = this.createTemporalMine(targetPosition);
        scene.add(mine);
        this.activeMines.push(mine);

        // Deployment effect
        this.createDeploymentEffect(scene, position, targetPosition);

        return mine;
    }

    // Secondary fire - detonate all mines manually
    detonateAllMines(scene) {
        if (this.activeMines.length === 0) return;

        this.activeMines.forEach(mine => {
            if (mine.userData && !mine.userData.exploded) {
                this.explodeMine(scene, mine);
            }
        });

        this.activeMines = [];
    }

    // Tertiary ability - temporal field generator
    createTemporalField(scene, position) {
        if (this.chronoEnergy < 50) return null;

        this.chronoEnergy -= 50;

        const field = this.createTimeDistortionField(scene, position);
        
        return {
            type: 'temporal_field',
            position: position.clone(),
            radius: this.timeDistortionRadius,
            duration: this.timeSlowDuration,
            slowFactor: this.timeSlowFactor,
            effect: field
        };
    }

    createTemporalMine(position) {
        const mineGroup = new THREE.Group();

        // Mine base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.4, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.2;
        mineGroup.add(base);

        // Temporal core
        const coreGeometry = new THREE.SphereGeometry(0.4, 12, 12);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ced1,
            emissive: 0x004455,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.6;
        mineGroup.add(core);

        // Temporal field emitters
        for (let i = 0; i < 6; i++) {
            const emitterGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
            const emitterMaterial = new THREE.MeshStandardMaterial({
                color: 0x40e0d0,
                emissive: 0x205050,
                emissiveIntensity: 0.4
            });
            const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            emitter.position.set(
                Math.cos(angle) * 0.7,
                0.4,
                Math.sin(angle) * 0.7
            );
            mineGroup.add(emitter);
        }

        // Status indicator lights
        const statusGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const statusMaterial = new THREE.MeshStandardMaterial({
            color: THEME.ui.health.low, // Red when arming
            emissive: THEME.materials.robeEmissive,
            emissiveIntensity: 0.8
        });
        const statusLight = new THREE.Mesh(statusGeometry, statusMaterial);
        statusLight.position.y = 0.8;
        mineGroup.add(statusLight);

        // Proximity sensor rings
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.5, 0.02, 4, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ced1,
                emissive: 0x002222,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.3
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.1;
            mineGroup.add(ring);
        }

        mineGroup.position.copy(position);
        mineGroup.position.y = 0; // Place on ground

        // Mine properties
        mineGroup.userData = {
            type: 'temporal_mine',
            armed: false,
            exploded: false,
            deployTime: Date.now(),
            proximityRadius: 3,
            damage: this.damage,
            explosionRadius: this.explosionRadius,
            statusLight: statusLight,
            core: core,
            rings: mineGroup.children.slice(-3) // Last 3 children are the rings
        };

        // Arm the mine after delay
        setTimeout(() => {
            if (!mineGroup.userData.exploded) {
                this.armMine(mineGroup);
            }
        }, this.mineArmTime);

        // Auto-detonate after lifetime
        setTimeout(() => {
            if (!mineGroup.userData.exploded) {
                this.explodeMine(mineGroup.parent, mineGroup);
            }
        }, this.mineLifetime);

        return mineGroup;
    }

    armMine(mine) {
        mine.userData.armed = true;
        
        // Change status light to green
        if (mine.userData.statusLight) {
            mine.userData.statusLight.material.color.setHex(THEME.ui.health.full);
            mine.userData.statusLight.material.emissive.setHex(0x004400);
        }

        // Increase core glow
        if (mine.userData.core) {
            mine.userData.core.material.emissiveIntensity = 0.8;
        }
    }

    explodeMine(scene, mine) {
        if (mine.userData.exploded) return;

        mine.userData.exploded = true;
        const position = mine.position.clone();

        // Create temporal explosion
        this.createTemporalExplosion(scene, position);

        // Create time distortion field
        this.createTimeDistortionField(scene, position);

        // Remove mine from scene and active list
        scene.remove(mine);
        const index = this.activeMines.indexOf(mine);
        if (index > -1) {
            this.activeMines.splice(index, 1);
        }

        return {
            type: 'temporal_explosion',
            position: position,
            damage: this.damage,
            radius: this.explosionRadius,
            timeDistortion: {
                radius: this.timeDistortionRadius,
                slowFactor: this.timeSlowFactor,
                duration: this.timeSlowDuration
            }
        };
    }

    createTemporalExplosion(scene, position) {
        // Main temporal explosion
        const explosionGeometry = new THREE.SphereGeometry(this.explosionRadius, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ced1,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        scene.add(explosion);

        // Time fracture effects
        for (let i = 0; i < 8; i++) {
            const fractureGeometry = new THREE.PlaneGeometry(
                this.explosionRadius * 2, 
                0.2
            );
            const fractureMaterial = new THREE.MeshBasicMaterial({
                color: 0x87ceeb,
                transparent: true,
                opacity: 0.9
            });
            const fracture = new THREE.Mesh(fractureGeometry, fractureMaterial);
            fracture.position.copy(position);
            fracture.rotation.y = (i / 8) * Math.PI * 2;
            fracture.rotation.z = (Math.random() - 0.5) * 0.5;
            scene.add(fracture);
        }

        // Chrono shockwave
        const shockwaveGeometry = new THREE.RingGeometry(
            this.explosionRadius * 0.5,
            this.explosionRadius * 1.5,
            32
        );
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0x40e0d0,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(position);
        shockwave.position.y = 0.1;
        shockwave.rotation.x = -Math.PI / 2;
        scene.add(shockwave);

        this.activeEffects.push({
            mesh: explosion,
            type: 'temporal_explosion',
            duration: 1000,
            currentTime: 0,
            shockwave: shockwave,
            fractures: scene.children.filter(c => c.geometry && c.geometry.type === 'PlaneGeometry' && c.material.color.getHex() === 0x87ceeb)
        });
    }

    createTimeDistortionField(scene, position) {
        const fieldGroup = new THREE.Group();

        // Time bubble
        const bubbleGeometry = new THREE.SphereGeometry(this.timeDistortionRadius, 32, 32);
        const bubbleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ced1,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        fieldGroup.add(bubble);

        // Temporal distortion waves
        for (let i = 0; i < 5; i++) {
            const waveGeometry = new THREE.SphereGeometry(
                2 + i * 1.5, 16, 16
            );
            const waveMaterial = new THREE.MeshBasicMaterial({
                color: 0x40e0d0,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            fieldGroup.add(wave);
        }

        // Chrono particles
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * this.timeDistortionRadius * 2;
            const radius = Math.random() * this.timeDistortionRadius;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 0.8;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        fieldGroup.add(particles);

        fieldGroup.position.copy(position);
        scene.add(fieldGroup);

        this.activeEffects.push({
            mesh: fieldGroup,
            type: 'time_distortion_field',
            duration: this.timeSlowDuration,
            currentTime: 0,
            bubble: bubble,
            particles: particles
        });

        return fieldGroup;
    }

    createDeploymentEffect(scene, startPos, endPos) {
        // Temporal trail
        const trailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 
            startPos.distanceTo(endPos), 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ced1,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        
        trail.position.copy(startPos.clone().lerp(endPos, 0.5));
        trail.lookAt(endPos);
        scene.add(trail);

        this.activeEffects.push({
            mesh: trail,
            type: 'deployment_trail',
            duration: 1000,
            currentTime: 0
        });
    }

    update(deltaTime) {
        // Chrono energy regeneration
        if (this.chronoEnergy < this.maxChronoEnergy) {
            this.chronoEnergy = Math.min(
                this.maxChronoEnergy,
                this.chronoEnergy + (this.energyRegenRate * deltaTime)
            );
        }

        // Animate weapon effects
        if (this.timeRings) {
            this.timeRings.forEach((ring, index) => {
                ring.rotation.x += deltaTime * 0.3 * (index + 1);
                ring.rotation.y += deltaTime * 0.5;
                ring.rotation.z += deltaTime * 0.2;
            });
        }

        // Animate temporal core
        if (this.temporalCore) {
            const pulseIntensity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
            this.temporalCore.material.emissiveIntensity = pulseIntensity;
        }

        // Update energy indicator
        if (this.energyIndicator) {
            const energyPercent = this.chronoEnergy / this.maxChronoEnergy;
            this.energyIndicator.scale.x = energyPercent;
            
            if (energyPercent > 0.6) {
                this.energyIndicator.material.color.setHex(0x00ced1);
            } else if (energyPercent > 0.3) {
                this.energyIndicator.material.color.setHex(THEME.ui.health.medium);
            } else {
                this.energyIndicator.material.color.setHex(THEME.ui.health.low);
            }
        }

        // Update active mines
        this.activeMines.forEach(mine => {
            if (mine.userData && !mine.userData.exploded) {
                this.updateMine(mine, deltaTime);
            }
        });

        this.updateEffects(deltaTime);
    }

    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.currentTime += deltaTime;
            const progress = effect.currentTime / effect.duration;

            if (progress >= 1) {
                this.scene.remove(effect.mesh);
                return false;
            }

            switch (effect.type) {
                case 'temporal_explosion':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + 20 * deltaTime);
                    effect.mesh.material.opacity -= 0.8 * deltaTime;
                    effect.shockwave.material.opacity -= 0.8 * deltaTime;
                    effect.fractures.forEach(f => f.material.opacity -= 0.8 * deltaTime);
                    break;
                case 'time_distortion_field':
                    const pulse = 1 + Math.sin(effect.currentTime * 2) * 0.1;
                    effect.bubble.scale.setScalar(pulse);
                    effect.mesh.children.forEach((child, index) => {
                        if (index > 0 && index < 6) { // Wave meshes
                            child.scale.setScalar(1 + Math.sin(effect.currentTime * 3 + index) * 0.2);
                        }
                    });
                    effect.particles.rotation.y += 0.5 * deltaTime;
                    break;
                case 'deployment_trail':
                    effect.mesh.material.opacity -= 1 * deltaTime;
                    break;
            }

            return true;
        });
    }

    updateMine(mine, deltaTime) {
        // Animate mine core
        if (mine.userData.core) {
            mine.userData.core.rotation.y += 2 * deltaTime;
            const pulseIntensity = mine.userData.armed ? 
                0.8 + Math.sin(Date.now() * 0.008) * 0.2 : 0.5;
            mine.userData.core.material.emissiveIntensity = pulseIntensity;
        }

        // Animate proximity rings
        if (mine.userData.rings) {
            mine.userData.rings.forEach((ring, index) => {
                ring.rotation.z += 1 * (index + 1) * deltaTime;
                if (mine.userData.armed) {
                    const scale = 1 + Math.sin(Date.now() * 0.005 + index) * 0.1;
                    ring.scale.setScalar(scale);
                }
            });
        }

        // Pulse status light
        if (mine.userData.statusLight && mine.userData.armed) {
            const intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            mine.userData.statusLight.material.emissiveIntensity = intensity;
        }
    }

    checkMineProximity(playerPosition, enemies) {
        this.activeMines.forEach(mine => {
            if (!mine.userData.armed || mine.userData.exploded) return;

            // Check player distance
            const playerDist = playerPosition.distanceTo(mine.position);
            if (playerDist < mine.userData.proximityRadius) return; // Don't detonate on player

            // Check enemy proximity
            enemies.forEach(enemy => {
                if (enemy.position) {
                    const enemyDist = enemy.position.distanceTo(mine.position);
                    if (enemyDist < mine.userData.proximityRadius) {
                        this.explodeMine(mine.parent, mine);
                    }
                }
            });
        });
    }

    reload() {
        if (this.currentAmmo < this.ammoCapacity && this.totalAmmo > 0) {
            const ammoNeeded = this.ammoCapacity - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
            
            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;
            
            return true;
        }
        return false;
    }

    getChronoEnergyPercentage() {
        return (this.chronoEnergy / this.maxChronoEnergy) * 100;
    }

    getActiveMineCount() {
        return this.activeMines.length;
    }

    canDeployMine() {
        return this.currentAmmo > 0 && 
               this.chronoEnergy >= 25 && 
               this.activeMines.length < this.maxActiveMines;
    }

    canUseTemporalField() {
        return this.chronoEnergy >= 50;
    }
}
