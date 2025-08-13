import * as THREE from 'three';
import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class ZombieAgent extends BaseEnemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Zombie agent specific properties
        this.infectionChance = 0.3; // 30% chance to infect on attack
        this.resilience = 0.7; // Takes 70% damage from non-headshots
        this.reanimated = false;
        this.agentEquipment = this.generateEquipment();
        this.combatTraining = true; // Former agent, better tactics
        this.lastShotTime = 0;
        this.shootCooldown = 2000; // 2 seconds between shots
        this.ammo = 15;
        
        this.createMesh();
        this.createWeapon();
    }

    createMesh() {
        const agentGroup = new THREE.Group();

        // Body - agent suit (now tattered)
        const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        agentGroup.add(body);

        // Head - pale and decaying
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x6a7a5a,
            transparent: true,
            opacity: 0.85
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.2;
        agentGroup.add(head);

        // Glowing eyes - MeshBasicMaterial doesn't support emissive
        const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: THEME.ui.health.full
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 2.25, 0.35);
        agentGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 2.25, 0.35);
        agentGroup.add(rightEye);

        // Arms - one damaged
        const armGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 1, 0);
        agentGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 1, 0);
        rightArm.rotation.z = 0.2; // Damaged arm hangs differently
        agentGroup.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1.8, 0.3);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.1, 0);
        agentGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.1, 0);
        agentGroup.add(rightLeg);

        // Zombie decay effects
        this.addDecayEffects(agentGroup);

        // Agent badge (tarnished)
        const badgeGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.05);
        const badgeMaterial = new THREE.MeshLambertMaterial({ 
            color: THEME.materials.wall.armory,
            metalness: 0.3
        });
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.position.set(-0.4, 1.3, 0.26);
        agentGroup.add(badge);

        agentGroup.position.copy(this.position);
        this.mesh = agentGroup;
        this.scene.add(agentGroup);

        // Store references
        this.head = head;
        this.leftEye = leftEye;
        this.rightEye = rightEye;
    }

    addDecayEffects(agentGroup) {
        // Blood stains
        for (let i = 0; i < 5; i++) {
            const stainGeometry = new THREE.PlaneGeometry(0.2, 0.2);
            const stainMaterial = new THREE.MeshBasicMaterial({
                color: THEME.materials.robeEmissive,
                transparent: true,
                opacity: 0.7
            });
            const stain = new THREE.Mesh(stainGeometry, stainMaterial);
            stain.position.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 0.5,
                0.26
            );
            stain.rotation.z = Math.random() * Math.PI;
            agentGroup.add(stain);
        }

        // Visible wounds
        const woundGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const woundMaterial = new THREE.MeshBasicMaterial({
            color: 0x220000,
            transparent: true,
            opacity: 0.8
        });
        const wound = new THREE.Mesh(woundGeometry, woundMaterial);
        wound.position.set(0.3, 1.8, 0.26);
        agentGroup.add(wound);
    }

    createWeapon() {
        if (this.agentEquipment.weapon === 'pistol') {
            const weaponGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.8);
            const weaponMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x333333,
                metalness: 0.6
            });
            const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
            weapon.position.set(0.4, 1.2, 0.5);
            this.mesh.add(weapon);
            this.weapon = weapon;
        }
    }

    generateEquipment() {
        const weapons = ['pistol', 'taser', 'baton'];
        const armor = ['vest', 'tactical', 'suit'];
        
        return {
            weapon: weapons[Math.floor(Math.random() * weapons.length)],
            armor: armor[Math.floor(Math.random() * armor.length)],
            hasRadio: Math.random() > 0.5,
            hasFlashlight: Math.random() > 0.3
        };
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);
        
        // Detection logic with tactical awareness
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            
            if (distance <= this.attackRange) {
                this.performAttack(player);
            } else {
                // Tactical movement - use cover and flanking
                this.tacticalMovement(playerPosition, deltaTime);
            }
        } else {
            // Patrol behavior
            this.patrol(deltaTime);
        }

        // Animate decay effects
        this.animateDecayEffects(deltaTime);
        
        // Update position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    tacticalMovement(playerPosition, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();

        // Check if should take cover or advance
        const distance = this.position.distanceTo(playerPosition);
        
        if (distance > 8 && this.ammo > 0) {
            // Try to maintain shooting distance
            const moveDirection = direction.clone();
            
            // Add some tactical positioning (not straight line)
            const tacticalOffset = new THREE.Vector3(
                Math.sin(Date.now() * 0.001) * 2,
                0,
                Math.cos(Date.now() * 0.001) * 2
            );
            moveDirection.add(tacticalOffset.multiplyScalar(0.3));
            
            this.position.add(moveDirection.multiplyScalar(this.speed * deltaTime / 1000));
        } else {
            // Move to melee range or retreat if out of ammo
            const moveDirection = this.ammo > 0 ? 
                direction.clone().negate() : // Retreat
                direction.clone(); // Advance for melee
                
            this.position.add(moveDirection.multiplyScalar(this.speed * deltaTime / 1000));
        }

        // Face the player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    performAttack(player) {
        const currentTime = Date.now();
        const distance = this.position.distanceTo(player.position || player.mesh.position);

        if (distance <= 6 && this.ammo > 0 && 
            currentTime - this.lastShotTime > this.shootCooldown) {
            // Ranged attack
            this.shootAtPlayer(player);
            this.lastShotTime = currentTime;
            this.ammo--;
        } else if (distance <= this.attackRange && 
                   currentTime - this.lastAttackTime > this.attackCooldown) {
            // Melee attack
            this.meleeAttack(player);
            this.lastAttackTime = currentTime;
        }
    }

    shootAtPlayer(player) {
        if (!this.weapon) return;

        // Muzzle flash
        const flashGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.medium,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(this.weapon.position);
        this.mesh.add(flash);

        // Remove flash after short time
        setTimeout(() => {
            this.mesh.remove(flash);
        }, 100);

        // Create projectile
        const bulletDirection = new THREE.Vector3()
            .subVectors(player.position || player.mesh.position, this.position)
            .normalize();

        this.createBulletProjectile(bulletDirection);

        // Play shooting animation
        this.animateShot();
    }

    createBulletProjectile(direction) {
        const bulletGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.spot.white,
            emissive: THEME.materials.metal.dark,
            emissiveIntensity: 0.5
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(this.position);
        bullet.position.y += 1.5; // Chest height

        const speed = 30;
        const velocity = direction.clone().multiplyScalar(speed);

        bullet.userData = {
            type: 'zombie_bullet',
            velocity: velocity,
            damage: 20,
            life: 2000,
            birthTime: Date.now()
        };

        this.scene.add(bullet);

        // Animate bullet
        const bulletInterval = setInterval(() => {
            const age = Date.now() - bullet.userData.birthTime;
            if (age > bullet.userData.life) {
                this.scene.remove(bullet);
                clearInterval(bulletInterval);
                return;
            }

            const movement = velocity.clone().multiplyScalar(16 / 1000);
            bullet.position.add(movement);
        }, 16);
    }

    meleeAttack(player) {
        // Zombie bite/claw attack
        const attackEffect = this.createAttackEffect();
        this.mesh.add(attackEffect);

        // Infection chance
        if (Math.random() < this.infectionChance) {
            this.infectPlayer(player);
        }

        // Deal damage
        if (player.takeDamage) {
            player.takeDamage(this.damage, "Zombie Agent");
        }

        // Remove effect after animation
        setTimeout(() => {
            this.mesh.remove(attackEffect);
        }, 500);

        // Animate attack
        this.animateAttack();
    }

    createAttackEffect() {
        const effectGroup = new THREE.Group();

        // Claw marks
        for (let i = 0; i < 3; i++) {
            const clawGeometry = new THREE.PlaneGeometry(0.1, 1);
            const clawMaterial = new THREE.MeshBasicMaterial({
                color: THEME.items.weapons.legendary,
                transparent: true,
                opacity: 0.8
            });
            const claw = new THREE.Mesh(clawGeometry, clawMaterial);
            claw.position.set(0.5 + i * 0.1, 1.5, 0.5);
            claw.rotation.z = (i - 1) * 0.2;
            effectGroup.add(claw);
        }

        // Infection particles
        const particleCount = 20;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0.5 + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = 1.5 + Math.random();
            positions[i * 3 + 2] = 0.5 + (Math.random() - 0.5);

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 0;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        effectGroup.add(particleSystem);

        return effectGroup;
    }

    infectPlayer(player) {
        // Create infection status effect
        if (player.addStatusEffect) {
            player.addStatusEffect('infection', {
                duration: 10000, // 10 seconds
                damagePerSecond: 2,
                speedReduction: 0.8, // 20% speed reduction
                healthRegenBlock: true
            });
        }

        // Visual infection effect
        this.createInfectionEffect();
    }

    createInfectionEffect() {
        const infectionGeometry = new THREE.RingGeometry(1, 2, 16);
        const infectionMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.full,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const infection = new THREE.Mesh(infectionGeometry, infectionMaterial);
        infection.position.copy(this.position);
        infection.position.y = 0.1;
        infection.rotation.x = -Math.PI / 2;
        this.scene.add(infection);

        // Animate infection spread
        let scale = 1;
        let opacity = 0.6;
        const infectionInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.06;
            infection.scale.setScalar(scale);
            infection.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(infection);
                clearInterval(infectionInterval);
            }
        }, 100);
    }

    animateShot() {
        // Recoil animation
        if (this.weapon) {
            const originalRotation = this.weapon.rotation.x;
            this.weapon.rotation.x = -0.3;
            
            setTimeout(() => {
                this.weapon.rotation.x = originalRotation;
            }, 100);
        }

        // Body animation
        const originalScale = this.mesh.scale.clone();
        this.mesh.scale.set(1.1, 0.95, 1.1);
        
        setTimeout(() => {
            this.mesh.scale.copy(originalScale);
        }, 150);
    }

    animateAttack() {
        // Lunge forward
        const originalPosition = this.position.clone();
        const lungeDistance = 0.5;
        
        if (this.target) {
            const lungeDirection = new THREE.Vector3()
                .subVectors(this.target, this.position)
                .normalize()
                .multiplyScalar(lungeDistance);
            
            this.position.add(lungeDirection);
            
            // Return to original position
            setTimeout(() => {
                this.position.copy(originalPosition);
            }, 300);
        }

        // Swipe animation
        if (this.mesh.children.length > 4) { // Arms
            const leftArm = this.mesh.children[4];
            const originalRotation = leftArm.rotation.z;
            leftArm.rotation.z = -Math.PI / 4;
            
            setTimeout(() => {
                leftArm.rotation.z = originalRotation;
            }, 200);
        }
    }

    animateDecayEffects(deltaTime) {
        // Flickering eyes
        if (this.leftEye && this.rightEye) {
            const flicker = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.leftEye.material.emissiveIntensity = flicker;
            this.rightEye.material.emissiveIntensity = flicker;
        }

        // Subtle body sway (undead movement)
        if (this.mesh) {
            const sway = Math.sin(Date.now() * 0.003) * 0.02;
            this.mesh.rotation.z = sway;
        }

        // Head twitching occasionally
        if (this.head && Math.random() < 0.001) {
            const twitchX = (Math.random() - 0.5) * 0.4;
            const twitchY = (Math.random() - 0.5) * 0.4;
            this.head.rotation.x = twitchX;
            this.head.rotation.y = twitchY;
            
            setTimeout(() => {
                this.head.rotation.x = 0;
                this.head.rotation.y = 0;
            }, 200);
        }
    }

    patrol(deltaTime) {
        // Random patrol movement with agent discipline
        if (!this.patrolTarget || Math.random() < 0.002) {
            this.patrolTarget = new THREE.Vector3(
                this.position.x + (Math.random() - 0.5) * 10,
                this.position.y,
                this.position.z + (Math.random() - 0.5) * 10
            );
        }

        const direction = new THREE.Vector3()
            .subVectors(this.patrolTarget, this.position)
            .normalize();

        this.position.add(direction.multiplyScalar(this.speed * 0.3 * deltaTime / 1000));

        // Face patrol direction
        if (this.mesh) {
            this.mesh.lookAt(this.patrolTarget);
        }
    }

    takeDamage(amount, damageType) {
        // Resilience to body shots
        let actualDamage = amount;
        if (damageType !== 'headshot') {
            actualDamage *= this.resilience;
        }

        this.health -= actualDamage;
        
        // Death animation and possible reanimation
        if (this.health <= 0 && !this.reanimated && Math.random() < 0.4) {
            this.reanimate();
            return;
        }

        // Damage effect
        if (this.mesh) {
            const originalColor = this.mesh.children[0].material.color.getHex();
            this.mesh.children[0].material.color.setHex(THEME.ui.health.low);
            
            setTimeout(() => {
                if (this.mesh && this.mesh.children[0]) {
                    this.mesh.children[0].material.color.setHex(originalColor);
                }
            }, 100);
        }

        // Stagger effect
        const staggerDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        ).normalize();
        this.position.add(staggerDirection.multiplyScalar(0.5));
    }

    reanimate() {
        this.reanimated = true;
        this.health = this.maxHealth * 0.4; // Come back with less health
        this.speed *= 1.3; // But faster
        this.damage *= 1.2; // And more dangerous
        
        // Visual reanimation effect
        const reanimationGeometry = new THREE.SphereGeometry(2, 16, 16);
        const reanimationMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.full,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        const reanimation = new THREE.Mesh(reanimationGeometry, reanimationMaterial);
        reanimation.position.copy(this.position);
        this.scene.add(reanimation);

        // Animate reanimation
        let scale = 0.1;
        let opacity = 0.7;
        const reanimationInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.07;
            reanimation.scale.setScalar(scale);
            reanimation.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(reanimation);
                clearInterval(reanimationInterval);
            }
        }, 50);

        // Change appearance for reanimated form
        if (this.mesh) {
            this.mesh.children[0].material.color.setHex(0x1a4a1a); // Greener tint
            this.mesh.children[0].material.emissive.setHex(0x002200);
            this.mesh.children[0].material.emissiveIntensity = 0.2;
        }
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Death explosion for dramatic effect
        const deathGeometry = new THREE.SphereGeometry(1.5, 12, 12);
        const deathMaterial = new THREE.MeshBasicMaterial({
            color: 0x006600,
            transparent: true,
            opacity: 0.8
        });
        const deathEffect = new THREE.Mesh(deathGeometry, deathMaterial);
        deathEffect.position.copy(this.position);
        this.scene.add(deathEffect);

        let scale = 1;
        let opacity = 0.8;
        const deathInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.08;
            deathEffect.scale.setScalar(scale);
            deathEffect.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(deathEffect);
                clearInterval(deathInterval);
            }
        }, 50);
    }

    getStatusInfo() {
        return {
            type: 'Zombie Agent',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'High',
            abilities: ['Tactical Combat', 'Infection', 'Reanimation'],
            equipment: this.agentEquipment,
            reanimated: this.reanimated,
            ammo: this.ammo
        };
    }
}