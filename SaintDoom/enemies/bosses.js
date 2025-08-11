// Boss Enemies for SaintDoom
// The Defiler and Belial - Major demonic antagonists

export class TheDefiler {
    constructor(scene, position, game) {
        this.scene = scene;
        this.game = game;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Boss stats
        this.health = 500;
        this.maxHealth = 500;
        this.damage = 25;
        this.speed = 3;
        this.phase = 1;
        this.isDead = false;
        this.type = 'boss_defiler';
        
        // Combat properties
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.specialCooldown = 5000;
        this.lastSpecialTime = 0;
        
        // Visual properties
        this.height = 3;
        this.radius = 1;
        
        // Create boss mesh
        this.createMesh();
        
        // Attack patterns
        this.currentPattern = 0;
        this.patterns = ['rush', 'ranged', 'summon', 'rage'];
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Massive corrupted body
        const bodyGeometry = new THREE.CylinderGeometry(1, 1.5, 3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x440000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 1.5;
        group.add(this.bodyMesh);
        
        // Demonic head with horns
        const headGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x220000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.2;
        group.add(head);
        
        // Horns
        const hornGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
        const hornMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x660000,
            emissiveIntensity: 0.2
        });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.3, 3.6, 0);
        leftHorn.rotation.z = -0.3;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.3, 3.6, 0);
        rightHorn.rotation.z = 0.3;
        group.add(rightHorn);
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 3.2, 0.4);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 3.2, 0.4);
        group.add(rightEye);
        
        // Wings (folded initially)
        const wingGeometry = new THREE.PlaneGeometry(2, 3);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.leftWing.position.set(-1.5, 2, -0.5);
        this.leftWing.rotation.y = -Math.PI / 4;
        group.add(this.leftWing);
        
        this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.rightWing.position.set(1.5, 2, -0.5);
        this.rightWing.rotation.y = Math.PI / 4;
        group.add(this.rightWing);
        
        // Dark aura effect
        this.createAura(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Boss health bar
        this.createHealthBar();
    }
    
    createAura(group) {
        // Create dark particles around the boss
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2;
            particle.userData = {
                angle: angle,
                radius: radius,
                speed: 0.5 + Math.random() * 0.5,
                verticalOffset: Math.random() * 2
            };
            
            particles.push(particle);
            group.add(particle);
        }
        
        // Animate aura
        const animateAura = () => {
            if (!this.isDead) {
                particles.forEach(particle => {
                    particle.userData.angle += particle.userData.speed * 0.02;
                    particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
                    particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
                    particle.position.y = Math.sin(Date.now() * 0.001 * particle.userData.speed) * 0.5 + particle.userData.verticalOffset;
                });
                requestAnimationFrame(animateAura);
            }
        };
        animateAura();
    }
    
    createHealthBar() {
        // Create boss health bar UI
        const healthBar = document.createElement('div');
        healthBar.id = 'bossHealthBar';
        healthBar.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            width: 400px;
            height: 30px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ff0000;
            z-index: 100;
            display: none;
        `;
        
        const healthFill = document.createElement('div');
        healthFill.id = 'bossHealthFill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #660000);
            transition: width 0.3s;
        `;
        
        const bossName = document.createElement('div');
        bossName.style.cssText = `
            position: absolute;
            top: -25px;
            left: 0;
            color: #ff0000;
            font-size: 20px;
            font-family: 'Times New Roman', serif;
            text-shadow: 2px 2px 4px black;
        `;
        bossName.textContent = 'THE DEFILER';
        
        healthBar.appendChild(healthFill);
        healthBar.appendChild(bossName);
        document.body.appendChild(healthBar);
        
        this.healthBar = healthBar;
        this.healthFill = healthFill;
    }
    
    update(deltaTime, player) {
        if (this.isDead) return;
        
        // Show health bar when in combat
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < 30) {
            this.healthBar.style.display = 'block';
            this.updateHealthBar();
        }
        
        // Phase transitions
        this.updatePhase();
        
        // Execute current attack pattern
        this.executePattern(deltaTime, player);
        
        // Update position
        this.mesh.position.copy(this.position);
        
        // Face player
        const lookDirection = new THREE.Vector3()
            .subVectors(player.position, this.position)
            .normalize();
        this.mesh.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
        
        // Wing animation in phase 2+
        if (this.phase >= 2) {
            this.animateWings();
        }
    }
    
    updatePhase() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent <= 0.3 && this.phase < 3) {
            this.enterPhase3();
        } else if (healthPercent <= 0.6 && this.phase < 2) {
            this.enterPhase2();
        }
    }
    
    enterPhase2() {
        this.phase = 2;
        this.speed = 4;
        this.damage = 35;
        
        // Spread wings
        this.leftWing.rotation.y = -Math.PI / 2;
        this.rightWing.rotation.y = Math.PI / 2;
        
        // Enhanced glow
        this.bodyMesh.material.emissiveIntensity = 0.5;
        
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("The Defiler: 'You dare wound me? I'll show you true corruption!'");
        }
    }
    
    enterPhase3() {
        this.phase = 3;
        this.speed = 5;
        this.damage = 45;
        this.attackCooldown = 1000;
        
        // Full demon mode
        this.bodyMesh.material.emissiveIntensity = 0.8;
        this.mesh.scale.set(1.2, 1.2, 1.2);
        
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("The Defiler: 'ENOUGH! WITNESS THE POWER OF THE ABYSS!'");
        }
    }
    
    executePattern(deltaTime, player) {
        const now = Date.now();
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        // Choose pattern based on distance and phase
        if (distanceToPlayer < 5) {
            this.meleeAttack(player, now);
        } else if (distanceToPlayer < 15) {
            this.rushAttack(player, deltaTime);
        } else {
            this.rangedAttack(player, now);
        }
        
        // Special attacks
        if (now - this.lastSpecialTime > this.specialCooldown) {
            this.performSpecialAttack(player);
            this.lastSpecialTime = now;
        }
    }
    
    meleeAttack(player, now) {
        if (now - this.lastAttackTime > this.attackCooldown) {
            // Devastating claw swipe
            player.takeDamage(this.damage);
            
            // Knockback
            const knockback = new THREE.Vector3()
                .subVectors(player.position, this.position)
                .normalize()
                .multiplyScalar(5);
            player.velocity.add(knockback);
            
            // Visual effect
            this.createSlashEffect();
            
            this.lastAttackTime = now;
            
            if (this.game && this.game.audioSystem) {
                this.game.audioSystem.playSoundEffect('demonScream');
            }
        }
    }
    
    rushAttack(player, deltaTime) {
        // Charge at player
        const direction = new THREE.Vector3()
            .subVectors(player.position, this.position)
            .normalize();
        
        this.velocity = direction.multiplyScalar(this.speed);
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
    
    rangedAttack(player, now) {
        if (now - this.lastAttackTime > this.attackCooldown * 1.5) {
            // Fire projectile
            this.fireProjectile(player.position);
            this.lastAttackTime = now;
        }
    }
    
    performSpecialAttack(player) {
        const attacks = ['summonMinions', 'hellfire', 'corruption'];
        const attack = attacks[Math.floor(Math.random() * attacks.length)];
        
        switch(attack) {
            case 'summonMinions':
                this.summonMinions();
                break;
            case 'hellfire':
                this.castHellfire();
                break;
            case 'corruption':
                this.spreadCorruption(player);
                break;
        }
    }
    
    summonMinions() {
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("The Defiler summons reinforcements!");
        }
        
        // Spawn 3 possessed scientists around the boss
        if (this.game && this.game.spawnEnemy) {
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const x = this.position.x + Math.cos(angle) * 5;
                const z = this.position.z + Math.sin(angle) * 5;
                this.game.spawnEnemy(x, 0, z, 'possessed_scientist');
            }
        }
    }
    
    castHellfire() {
        // Create ring of fire
        const fireRing = [];
        const segments = 16;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = this.position.x + Math.cos(angle) * 8;
            const z = this.position.z + Math.sin(angle) * 8;
            
            const fire = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 1, 3, 6),
                new THREE.MeshBasicMaterial({
                    color: 0xff4400,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            fire.position.set(x, 1.5, z);
            this.scene.add(fire);
            fireRing.push(fire);
            
            // Damage zone
            if (this.game && this.game.player) {
                const playerDist = this.game.player.position.distanceTo(fire.position);
                if (playerDist < 2) {
                    this.game.player.takeDamage(15);
                }
            }
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            fireRing.forEach(fire => this.scene.remove(fire));
        }, 3000);
    }
    
    spreadCorruption(player) {
        // Create expanding corruption zone
        const corruption = new THREE.Mesh(
            new THREE.RingGeometry(0, 1, 32),
            new THREE.MeshBasicMaterial({
                color: 0x440044,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            })
        );
        
        corruption.rotation.x = -Math.PI / 2;
        corruption.position.copy(this.position);
        corruption.position.y = 0.1;
        this.scene.add(corruption);
        
        let radius = 1;
        const expand = setInterval(() => {
            radius += 0.5;
            corruption.geometry = new THREE.RingGeometry(0, radius, 32);
            
            // Check if player is in corruption
            const playerDist = player.position.distanceTo(this.position);
            if (playerDist < radius) {
                player.takeDamage(5);
            }
            
            if (radius > 10) {
                clearInterval(expand);
                setTimeout(() => this.scene.remove(corruption), 1000);
            }
        }, 100);
    }
    
    fireProjectile(targetPosition) {
        const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 6),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                emissive: 0xff0000
            })
        );
        
        projectile.position.copy(this.position);
        projectile.position.y = 2;
        
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, projectile.position)
            .normalize();
        
        this.scene.add(projectile);
        
        const speed = 10;
        const moveProjectile = setInterval(() => {
            projectile.position.add(direction.clone().multiplyScalar(speed * 0.016));
            
            // Check collision with player
            if (this.game && this.game.player) {
                const dist = projectile.position.distanceTo(this.game.player.position);
                if (dist < 1) {
                    this.game.player.takeDamage(20);
                    this.scene.remove(projectile);
                    clearInterval(moveProjectile);
                }
            }
            
            // Remove after distance
            if (projectile.position.distanceTo(this.position) > 30) {
                this.scene.remove(projectile);
                clearInterval(moveProjectile);
            }
        }, 16);
    }
    
    createSlashEffect() {
        // Visual slash effect
        const slash = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 0.3),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            })
        );
        
        slash.position.copy(this.position);
        slash.position.y = 2;
        slash.position.z += 1;
        slash.rotation.z = Math.random() * Math.PI - Math.PI / 2;
        
        this.scene.add(slash);
        
        // Fade out
        const fade = setInterval(() => {
            slash.material.opacity -= 0.05;
            if (slash.material.opacity <= 0) {
                this.scene.remove(slash);
                clearInterval(fade);
            }
        }, 50);
    }
    
    animateWings() {
        const time = Date.now() * 0.001;
        this.leftWing.rotation.z = Math.sin(time * 2) * 0.2;
        this.rightWing.rotation.z = -Math.sin(time * 2) * 0.2;
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Boss takes reduced damage
        damage = damage * 0.7;
        
        // Holy damage is more effective
        if (damageType === 'holy') {
            damage *= 1.5;
        }
        
        this.health -= damage;
        this.updateHealthBar();
        
        // Flash red
        this.bodyMesh.material.emissive = new THREE.Color(0xffffff);
        setTimeout(() => {
            this.bodyMesh.material.emissive = new THREE.Color(0xff0000);
        }, 100);
        
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }
    
    updateHealthBar() {
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        this.healthFill.style.width = (healthPercent * 100) + '%';
    }
    
    die() {
        this.isDead = true;
        this.healthBar.style.display = 'none';
        
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("The Defiler: 'This... is not... possible! Belial will... avenge...'");
        }
        
        // Death animation
        let scale = 1;
        const shrink = setInterval(() => {
            scale -= 0.05;
            this.mesh.scale.set(scale, scale, scale);
            this.mesh.rotation.y += 0.2;
            
            if (scale <= 0) {
                clearInterval(shrink);
                this.scene.remove(this.mesh);
                document.body.removeChild(this.healthBar);
                
                // Drop loot
                this.dropLoot();
            }
        }, 50);
        
        // Add score
        if (this.game) {
            this.game.addScore(5000);
            this.game.showMessage("BOSS DEFEATED! +5000");
        }
    }
    
    dropLoot() {
        // Spawn holy weapon or powerup
        if (this.game) {
            // Implementation would spawn special pickup
        }
    }
    
    applyKnockback(direction, force) {
        // Bosses resist knockback
        this.velocity.add(direction.clone().multiplyScalar(force * 0.3));
    }
    
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
    }
}

export class Belial {
    // Final boss - even more powerful
    constructor(scene, position, game) {
        this.scene = scene;
        this.game = game;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Final boss stats
        this.health = 1000;
        this.maxHealth = 1000;
        this.damage = 40;
        this.speed = 2;
        this.phase = 1;
        this.isDead = false;
        this.type = 'boss_belial';
        
        // Properties
        this.height = 4;
        this.radius = 1.5;
        
        this.createMesh();
        this.createHealthBar();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Massive demonic form
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 4, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0xff00ff,
            emissiveIntensity: 0.4
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 2;
        group.add(this.bodyMesh);
        
        // Multiple heads
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const headGeometry = new THREE.SphereGeometry(0.4, 8, 6);
            const headMaterial = new THREE.MeshPhongMaterial({
                color: 0x440044,
                emissive: 0xff00ff,
                emissiveIntensity: 0.6
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(
                Math.cos(angle) * 0.5,
                4,
                Math.sin(angle) * 0.5
            );
            group.add(head);
        }
        
        // Crown of fire
        this.createFireCrown(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }
    
    createFireCrown(group) {
        const crownParticles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.2, 0.8, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xff00ff,
                    transparent: true,
                    opacity: 0.7
                })
            );
            flame.position.set(
                Math.cos(angle) * 1,
                4.5,
                Math.sin(angle) * 1
            );
            flame.rotation.z = angle;
            crownParticles.push(flame);
            group.add(flame);
        }
        
        // Animate crown
        const animateCrown = () => {
            if (!this.isDead) {
                crownParticles.forEach((flame, i) => {
                    flame.position.y = 4.5 + Math.sin(Date.now() * 0.002 + i) * 0.3;
                    flame.material.opacity = 0.5 + Math.sin(Date.now() * 0.003 + i) * 0.3;
                });
                requestAnimationFrame(animateCrown);
            }
        };
        animateCrown();
    }
    
    createHealthBar() {
        const healthBar = document.createElement('div');
        healthBar.id = 'belialHealthBar';
        healthBar.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            width: 500px;
            height: 40px;
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #ff00ff;
            z-index: 100;
            display: none;
        `;
        
        const healthFill = document.createElement('div');
        healthFill.id = 'belialHealthFill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #ff00ff, #660066);
            transition: width 0.3s;
        `;
        
        const bossName = document.createElement('div');
        bossName.style.cssText = `
            position: absolute;
            top: -30px;
            left: 0;
            color: #ff00ff;
            font-size: 24px;
            font-family: 'Times New Roman', serif;
            text-shadow: 2px 2px 4px black;
        `;
        bossName.textContent = 'BELIAL - PRINCE OF HELL';
        
        healthBar.appendChild(healthFill);
        healthBar.appendChild(bossName);
        document.body.appendChild(healthBar);
        
        this.healthBar = healthBar;
        this.healthFill = healthFill;
    }
    
    // Simplified update and combat methods similar to TheDefiler
    update(deltaTime, player) {
        if (this.isDead) return;
        
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < 40) {
            this.healthBar.style.display = 'block';
            this.updateHealthBar();
        }
        
        // Basic AI - move toward player and attack
        if (distanceToPlayer > 3) {
            const direction = new THREE.Vector3()
                .subVectors(player.position, this.position)
                .normalize();
            this.position.add(direction.multiplyScalar(this.speed * deltaTime));
        } else {
            player.takeDamage(this.damage);
        }
        
        this.mesh.position.copy(this.position);
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Final boss takes very reduced damage
        damage = damage * 0.5;
        
        if (damageType === 'holy') {
            damage *= 2; // Vulnerable to holy
        }
        
        this.health -= damage;
        this.updateHealthBar();
        
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }
    
    updateHealthBar() {
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        this.healthFill.style.width = (healthPercent * 100) + '%';
    }
    
    die() {
        this.isDead = true;
        this.healthBar.style.display = 'none';
        
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Belial: 'Seven times... you've defeated me... but I'll return... I always return...'");
        }
        
        // Epic death
        this.scene.remove(this.mesh);
        document.body.removeChild(this.healthBar);
        
        if (this.game) {
            this.game.addScore(10000);
            this.game.showMessage("BELIAL DEFEATED! +10000");
            
            // Trigger ending
            setTimeout(() => {
                this.game.narrativeSystem.displaySubtitle("Portal closed. Hell retreats. For now...");
            }, 3000);
        }
    }
    
    applyKnockback() {
        // Immune to knockback
    }
    
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
    }
}