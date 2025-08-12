import * as THREE from 'three';
import { BaseWeapon } from '../core/BaseWeapon.js';

export class GravityHammer extends BaseWeapon {
    constructor() {
        super();
        this.name = 'Gravity Hammer';
        this.damage = 120;
        this.fireRate = 2000; // 2 seconds between swings
        this.ammoCapacity = 1; // Melee weapon
        this.currentAmmo = 1;
        this.range = 4; // Short range
        this.accuracy = 1.0;
        
        // Gravity hammer specific properties
        this.chargeTime = 1500; // ms to charge for area attack
        this.currentCharge = 0;
        this.charging = false;
        this.gravityRadius = 8; // Area of effect
        this.gravityForce = 50; // Knockback force
        this.energyLevel = 100; // Energy for special attacks
        this.maxEnergy = 100;
        this.energyRegenRate = 10; // per second
        this.areaAttackCost = 40;
    }

    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.4
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -1;
        weaponGroup.add(handle);

        // Hammer head - main body
        const headGeometry = new THREE.BoxGeometry(2, 1, 1.5);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.9,
            roughness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1;
        weaponGroup.add(head);

        // Gravity core - glowing center
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x9900ff,
            emissive: 0x440088,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1;
        weaponGroup.add(core);
        this.gravityCore = core;

        // Energy rings around core
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.6 + i * 0.2, 0.05, 4, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x6600cc,
                emissive: 0x330066,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = 1;
            ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
            weaponGroup.add(ring);
            
            if (i === 0) this.energyRings = [ring];
            else this.energyRings.push(ring);
        }

        // Hammer spikes
        const spikePositions = [
            { x: 1.2, y: 1, z: 0 },
            { x: -1.2, y: 1, z: 0 },
            { x: 0, y: 1, z: 1 },
            { x: 0, y: 1, z: -1 }
        ];

        spikePositions.forEach(pos => {
            const spikeGeometry = new THREE.ConeGeometry(0.15, 0.6, 6);
            const spikeMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.8,
                roughness: 0.2
            });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(pos.x, pos.y, pos.z);
            
            // Point spikes outward
            if (pos.x !== 0) spike.rotation.z = pos.x > 0 ? -Math.PI/2 : Math.PI/2;
            if (pos.z !== 0) spike.rotation.x = pos.z > 0 ? Math.PI/2 : -Math.PI/2;
            
            weaponGroup.add(spike);
        });

        // Energy indicator on handle
        const indicatorGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x004400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = -0.3;
        weaponGroup.add(indicator);
        this.energyIndicator = indicator;

        return weaponGroup;
    }

    startCharging() {
        if (this.energyLevel < this.areaAttackCost) return;
        
        this.charging = true;
        this.currentCharge = 0;
        
        // Visual charging effect
        if (this.gravityCore) {
            this.gravityCore.material.emissiveIntensity = 1.0;
            this.gravityCore.material.color.setHex(0xff0066);
        }
    }

    stopCharging() {
        this.charging = false;
        
        // Reset core appearance
        if (this.gravityCore) {
            this.gravityCore.material.emissiveIntensity = 0.6;
            this.gravityCore.material.color.setHex(0x9900ff);
        }
    }

    // Primary attack - single target melee
    primaryAttack(scene, position, direction, player) {
        if (Date.now() - this.lastFired < this.fireRate) {
            return null;
        }

        this.lastFired = Date.now();
        
        // Create hammer swing effect
        const swingEffect = this.createSwingEffect(position, direction);
        scene.add(swingEffect);

        // Create shockwave
        this.createShockwave(scene, position);

        return {
            type: 'melee',
            damage: this.damage,
            position: position.clone(),
            direction: direction.clone(),
            range: this.range,
            knockback: 15
        };
    }

    // Secondary attack - area gravity slam
    secondaryAttack(scene, position, direction, player) {
        if (!this.charging || this.currentCharge < 100 || this.energyLevel < this.areaAttackCost) {
            return null;
        }

        this.energyLevel -= this.areaAttackCost;
        this.currentCharge = 0;
        this.charging = false;

        // Create gravity slam effect
        const gravitySlam = this.createGravitySlam(scene, position);
        
        return {
            type: 'gravity_slam',
            damage: this.damage * 1.5,
            position: position.clone(),
            radius: this.gravityRadius,
            force: this.gravityForce,
            effect: gravitySlam
        };
    }

    createSwingEffect(position, direction) {
        const effectGroup = new THREE.Group();

        // Energy trail
        const trailGeometry = new THREE.CylinderGeometry(0.1, 0.3, 3, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.z = Math.PI / 2;
        effectGroup.add(trail);

        // Sparks
        for (let i = 0; i < 10; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 4
            );
            effectGroup.add(spark);
        }

        effectGroup.position.copy(position);
        effectGroup.lookAt(position.clone().add(direction));

        // Animate effect
        let opacity = 0.7;
        const effectInterval = setInterval(() => {
            opacity -= 0.1;
            effectGroup.children.forEach(child => {
                if (child.material.opacity !== undefined) {
                    child.material.opacity = opacity;
                }
            });

            if (opacity <= 0) {
                if (effectGroup.parent) effectGroup.parent.remove(effectGroup);
                clearInterval(effectInterval);
            }
        }, 50);

        return effectGroup;
    }

    createShockwave(scene, position) {
        // Ground shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.5, 1, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x6600cc,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        scene.add(ring);

        // Animate ring expansion
        let scale = 1;
        let opacity = 0.8;
        const shockwaveInterval = setInterval(() => {
            scale += 1;
            opacity -= 0.08;
            ring.scale.setScalar(scale);
            ring.material.opacity = opacity;

            if (opacity <= 0) {
                scene.remove(ring);
                clearInterval(shockwaveInterval);
            }
        }, 50);
    }

    createGravitySlam(scene, position) {
        const effectGroup = new THREE.Group();

        // Central gravity distortion
        const distortionGeometry = new THREE.SphereGeometry(this.gravityRadius, 16, 16);
        const distortionMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
        effectGroup.add(distortion);

        // Gravity particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.gravityRadius;
            const height = (Math.random() - 0.5) * 4;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = 0.6;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 1;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        effectGroup.add(particles);

        effectGroup.position.copy(position);
        scene.add(effectGroup);

        // Animate gravity effect
        let time = 0;
        const gravityInterval = setInterval(() => {
            time += 50;
            
            // Pulsing distortion
            const pulse = 1 + Math.sin(time * 0.01) * 0.2;
            distortion.scale.setScalar(pulse);
            
            // Swirling particles
            particles.rotation.y += 0.1;
            
            if (time > 2000) {
                scene.remove(effectGroup);
                clearInterval(gravityInterval);
            }
        }, 50);

        return effectGroup;
    }

    update(deltaTime) {
        // Energy regeneration
        if (this.energyLevel < this.maxEnergy) {
            this.energyLevel = Math.min(
                this.maxEnergy,
                this.energyLevel + (this.energyRegenRate * deltaTime / 1000)
            );
        }

        // Charge building
        if (this.charging && this.currentCharge < 100) {
            this.currentCharge += (deltaTime / this.chargeTime) * 100;
            this.currentCharge = Math.min(100, this.currentCharge);

            // Update visual effects
            if (this.gravityCore) {
                const intensity = 0.6 + (this.currentCharge / 100) * 0.4;
                this.gravityCore.material.emissiveIntensity = intensity;
            }
        }

        // Animate energy rings
        if (this.energyRings) {
            this.energyRings.forEach((ring, index) => {
                ring.rotation.z += deltaTime * 0.001 * (index + 1);
            });
        }

        // Update energy indicator
        if (this.energyIndicator) {
            const energyPercent = this.energyLevel / this.maxEnergy;
            if (energyPercent > 0.6) {
                this.energyIndicator.material.color.setHex(0x00ff00);
            } else if (energyPercent > 0.3) {
                this.energyIndicator.material.color.setHex(0xffff00);
            } else {
                this.energyIndicator.material.color.setHex(0xff0000);
            }
        }
    }

    getEnergyPercentage() {
        return (this.energyLevel / this.maxEnergy) * 100;
    }

    getChargePercentage() {
        return this.currentCharge;
    }

    canUseSecondaryAttack() {
        return this.energyLevel >= this.areaAttackCost;
    }
}