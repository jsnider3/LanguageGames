import * as THREE from 'three';
import { BaseWeapon } from '../core/BaseWeapon.js';

export class NeuralScrambler extends BaseWeapon {
    constructor() {
        super();
        this.name = 'Neural Scrambler';
        this.damage = 25; // Low direct damage, high status effects
        this.fireRate = 600; // ms between shots
        this.ammoCapacity = 15;
        this.currentAmmo = this.ammoCapacity;
        this.range = 50;
        this.accuracy = 0.88;
        
        // Neural scrambler specific properties
        this.psychicAmplifier = 100;
        this.maxAmplifier = 100;
        this.amplifierDrain = 8; // per shot
        this.rechargeRate = 12; // per second
        this.mindControlDuration = 5000; // 5 seconds
        this.confusionRadius = 8;
        this.panicRadius = 12;
    }

    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // Main body - neural interface design
        const bodyGeometry = new THREE.BoxGeometry(2, 0.7, 0.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2e2e4a,
            metalness: 0.6,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        weaponGroup.add(body);

        // Neural processing core
        const coreGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xff1493,
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x440022,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.x = 0.3;
        weaponGroup.add(core);
        this.neuralCore = core;

        // Synaptic emitters - multiple small spheres
        const emitterPositions = [
            { x: 0.8, y: 0.2, z: 0 },
            { x: 0.8, y: -0.2, z: 0 },
            { x: 0.8, y: 0, z: 0.2 },
            { x: 0.8, y: 0, z: -0.2 }
        ];

        emitterPositions.forEach(pos => {
            const emitterGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const emitterMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff41,
                emissive: 0x004411,
                emissiveIntensity: 0.6
            });
            const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
            emitter.position.set(pos.x, pos.y, pos.z);
            weaponGroup.add(emitter);
        });

        // Brain wave projector
        const projectorGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
        const projectorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const projector = new THREE.Mesh(projectorGeometry, projectorMaterial);
        projector.rotation.z = -Math.PI / 2;
        projector.position.x = 1.2;
        weaponGroup.add(projector);

        // Psychic field generators
        for (let i = 0; i < 3; i++) {
            const fieldGeometry = new THREE.TorusGeometry(0.4 + i * 0.1, 0.02, 4, 12);
            const fieldMaterial = new THREE.MeshStandardMaterial({
                color: 0xff1493,
                emissive: 0x330022,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.6
            });
            const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
            field.position.x = 0.3;
            field.rotation.y = (i * Math.PI / 3);
            weaponGroup.add(field);
            
            if (i === 0) this.psychicFields = [field];
            else this.psychicFields.push(field);
        }

        // Grip with neural interface
        const gripGeometry = new THREE.BoxGeometry(0.4, 1, 0.5);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            roughness: 0.9
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(-0.6, -0.7, 0);
        weaponGroup.add(grip);

        // Amplifier indicator
        const indicatorGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff41,
            emissive: 0x004411,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(-0.6, 0.3, 0);
        weaponGroup.add(indicator);
        this.amplifierIndicator = indicator;

        return weaponGroup;
    }

    // Primary fire - neural disruption blast
    fire(scene, position, direction, player) {
        if (this.currentAmmo <= 0 || this.psychicAmplifier < this.amplifierDrain || 
            Date.now() - this.lastFired < this.fireRate) {
            return null;
        }

        this.currentAmmo--;
        this.psychicAmplifier -= this.amplifierDrain;
        this.lastFired = Date.now();

        // Create neural disruption projectile
        const projectile = this.createNeuralBlast(position, direction);
        scene.add(projectile);

        // Mind wave effect
        this.createMindWave(scene, position, direction);

        return projectile;
    }

    // Secondary fire - area of effect mind control
    mindControlBlast(scene, position, direction, player) {
        if (this.psychicAmplifier < 40) return null;

        this.psychicAmplifier -= 40;

        // Create mind control wave
        const controlWave = this.createMindControlWave(scene, position);
        
        return {
            type: 'mind_control',
            position: position.clone(),
            radius: this.confusionRadius,
            duration: this.mindControlDuration,
            effect: controlWave
        };
    }

    // Tertiary ability - panic wave
    panicWave(scene, position, player) {
        if (this.psychicAmplifier < 30) return null;

        this.psychicAmplifier -= 30;

        // Create panic effect
        const panic = this.createPanicWave(scene, position);

        return {
            type: 'panic',
            position: position.clone(),
            radius: this.panicRadius,
            duration: 8000,
            effect: panic
        };
    }

    createNeuralBlast(position, direction) {
        const projectileGroup = new THREE.Group();

        // Neural energy core
        const coreGeometry = new THREE.SphereGeometry(0.25, 12, 12);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff1493,
            emissive: 0xff0080,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);

        // Synaptic lightning
        for (let i = 0; i < 6; i++) {
            const lightningGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
            const lightningMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff41,
                emissive: 0x00aa22,
                emissiveIntensity: 1.0
            });
            const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            lightning.position.set(
                Math.cos(angle) * 0.4,
                Math.sin(angle) * 0.4,
                0
            );
            lightning.rotation.z = angle + Math.PI / 2;
            projectileGroup.add(lightning);
        }

        // Brain wave particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = Math.random() * 0.3;
            colors[i * 3 + 2] = 0.8;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        projectileGroup.add(particles);

        // Point light
        const light = new THREE.PointLight(0xff1493, 2, 12);
        projectileGroup.add(light);

        projectileGroup.position.copy(position);

        const speed = 45;
        const velocity = direction.clone().multiplyScalar(speed);

        projectileGroup.userData = {
            type: 'neural_blast',
            damage: this.damage,
            velocity: velocity,
            speed: speed,
            life: 3000,
            birthTime: Date.now(),
            confusion: true,
            statusEffect: 'neural_disruption'
        };

        return projectileGroup;
    }

    createMindWave(scene, position, direction) {
        // Psychic wave effect
        const waveGeometry = new THREE.RingGeometry(0.5, 1, 16);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff1493,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(position);
        wave.lookAt(position.clone().add(direction));
        scene.add(wave);

        // Animate wave
        let scale = 1;
        let opacity = 0.6;
        const waveInterval = setInterval(() => {
            scale += 0.8;
            opacity -= 0.08;
            wave.scale.setScalar(scale);
            wave.material.opacity = opacity;

            if (opacity <= 0) {
                scene.remove(wave);
                clearInterval(waveInterval);
            }
        }, 50);
    }

    createMindControlWave(scene, position) {
        const controlGroup = new THREE.Group();

        // Central mind control vortex
        const vortexGeometry = new THREE.CylinderGeometry(0.2, this.confusionRadius, 8, 16, 1, true);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: 0xff1493,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.rotation.x = Math.PI / 2;
        controlGroup.add(vortex);

        // Hypnotic spirals
        for (let i = 0; i < 4; i++) {
            const spiralGeometry = new THREE.TorusGeometry(2 + i, 0.2, 4, 16);
            const spiralMaterial = new THREE.MeshBasicMaterial({
                color: 0x8a2be2,
                transparent: true,
                opacity: 0.5
            });
            const spiral = new THREE.Mesh(spiralGeometry, spiralMaterial);
            spiral.position.y = i * 0.5;
            spiral.rotation.x = Math.PI / 2;
            controlGroup.add(spiral);
        }

        // Brain wave particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.confusionRadius;
            const height = (Math.random() - 0.5) * 6;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.1;
            colors[i * 3 + 2] = 0.9;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        controlGroup.add(particles);

        controlGroup.position.copy(position);
        scene.add(controlGroup);

        // Animate mind control effect
        let time = 0;
        const controlInterval = setInterval(() => {
            time += 50;
            
            // Rotating spirals
            controlGroup.children.forEach((child, index) => {
                if (index > 0 && index < 5) { // Spiral rings
                    child.rotation.z += 0.05 * (index % 2 === 0 ? 1 : -1);
                }
            });

            // Swirling particles
            particles.rotation.y += 0.02;

            if (time > this.mindControlDuration) {
                scene.remove(controlGroup);
                clearInterval(controlInterval);
            }
        }, 50);

        return controlGroup;
    }

    createPanicWave(scene, position) {
        const panicGroup = new THREE.Group();

        // Fear aura
        const auraGeometry = new THREE.SphereGeometry(this.panicRadius, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b0000,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        panicGroup.add(aura);

        // Nightmare fragments
        for (let i = 0; i < 12; i++) {
            const fragmentGeometry = new THREE.TetrahedronGeometry(0.5);
            const fragmentMaterial = new THREE.MeshBasicMaterial({
                color: 0x4b0000,
                transparent: true,
                opacity: 0.8
            });
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            
            const angle = (i / 12) * Math.PI * 2;
            const radius = this.panicRadius * 0.7;
            fragment.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 4,
                Math.sin(angle) * radius
            );
            panicGroup.add(fragment);
        }

        panicGroup.position.copy(position);
        scene.add(panicGroup);

        // Animate panic wave
        let time = 0;
        const panicInterval = setInterval(() => {
            time += 50;
            
            // Pulsing aura
            const pulse = 1 + Math.sin(time * 0.01) * 0.2;
            aura.scale.setScalar(pulse);

            // Floating fragments
            panicGroup.children.forEach((child, index) => {
                if (index > 0) {
                    child.rotation.x += 0.02;
                    child.rotation.y += 0.03;
                    child.position.y += Math.sin(time * 0.01 + index) * 0.01;
                }
            });

            if (time > 8000) {
                scene.remove(panicGroup);
                clearInterval(panicInterval);
            }
        }, 50);

        return panicGroup;
    }

    update(deltaTime) {
        // Psychic amplifier recharge
        if (this.psychicAmplifier < this.maxAmplifier) {
            this.psychicAmplifier = Math.min(
                this.maxAmplifier,
                this.psychicAmplifier + (this.rechargeRate * deltaTime / 1000)
            );
        }

        // Animate psychic fields
        if (this.psychicFields) {
            this.psychicFields.forEach((field, index) => {
                field.rotation.z += deltaTime * 0.0005 * (index + 1);
                field.rotation.y += deltaTime * 0.001;
            });
        }

        // Animate neural core
        if (this.neuralCore) {
            const pulseIntensity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
            this.neuralCore.material.emissiveIntensity = pulseIntensity;
        }

        // Update amplifier indicator
        if (this.amplifierIndicator) {
            const amplifierPercent = this.psychicAmplifier / this.maxAmplifier;
            this.amplifierIndicator.scale.y = amplifierPercent;
            
            if (amplifierPercent > 0.6) {
                this.amplifierIndicator.material.color.setHex(0x00ff41);
            } else if (amplifierPercent > 0.3) {
                this.amplifierIndicator.material.color.setHex(0xffff00);
            } else {
                this.amplifierIndicator.material.color.setHex(0xff0000);
            }
        }
    }

    updateProjectile(projectile, deltaTime, scene) {
        const userData = projectile.userData;
        const age = Date.now() - userData.birthTime;

        if (age > userData.life) {
            scene.remove(projectile);
            return false;
        }

        // Move projectile
        const movement = userData.velocity.clone().multiplyScalar(deltaTime / 1000);
        projectile.position.add(movement);

        // Animate effects
        projectile.children[0].rotation.x += deltaTime * 0.02;
        projectile.children[0].rotation.y += deltaTime * 0.03;

        // Lightning effects
        for (let i = 1; i < 7; i++) {
            if (projectile.children[i]) {
                projectile.children[i].rotation.z += deltaTime * 0.01;
            }
        }

        // Particle system rotation
        if (projectile.children[7]) {
            projectile.children[7].rotation.y += deltaTime * 0.005;
        }

        return true;
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

    getPsychicAmplifierPercentage() {
        return (this.psychicAmplifier / this.maxAmplifier) * 100;
    }

    canUseMindControl() {
        return this.psychicAmplifier >= 40;
    }

    canUsePanic() {
        return this.psychicAmplifier >= 30;
    }
}