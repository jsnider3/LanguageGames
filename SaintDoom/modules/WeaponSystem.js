// WeaponSystem.js - Weapon management and combat classes for SaintDoom
// Dependencies: THREE, GAME_CONFIG, AudioManager (available as globals from index.html)

// Note: The index.html version used GAME_CONFIG which needs to be reconciled

// ============= WEAPON SYSTEM =============
class WeaponSystem {
    constructor(player, scene, camera) {
        this.player = player;
        this.scene = scene;
        this.camera = camera;
        
        // Initialize weapon registry
        this.weapons = {
            sword: new MeleeCombat(player, scene, camera),
            shotgun: new RangedCombat(player, scene, camera),
            holywater: new HolyWaterWeapon(player, scene),
            crucifix: new CrucifixLauncher(player, scene)
        };
        
        // Maintain backward compatibility
        this.meleeCombat = this.weapons.sword;
        this.rangedCombat = this.weapons.shotgun;
        this.holyWater = this.weapons.holywater;
        this.crucifixLauncher = this.weapons.crucifix;
        
        this.activeWeaponType = 'sword';
    }
    
    switchToWeapon(weaponType) {
        this.activeWeaponType = weaponType;
        
        // Hide all weapon models
        Object.values(this.weapons).forEach(weapon => {
            if (weapon.hide) weapon.hide();
        });
        
        // Show active weapon
        const activeWeapon = this.weapons[weaponType];
        if (activeWeapon && activeWeapon.show) {
            activeWeapon.show();
        }
    }
    
    attack(enemies) {
        const weapon = this.weapons[this.activeWeaponType];
        if (!weapon) return [];
        
        // Call appropriate attack method based on weapon type
        if (this.activeWeaponType === 'sword') {
            return weapon.performSwing(enemies);
        } else if (this.activeWeaponType === 'shotgun' || this.activeWeaponType === 'crucifix') {
            return weapon.fire(enemies);
        } else if (this.activeWeaponType === 'holywater') {
            return weapon.throw(enemies);
        }
        return [];
    }
    
    update(deltaTime, enemies) {
        this.meleeCombat.update(deltaTime);
        this.rangedCombat.update(deltaTime);
        this.holyWater.update(deltaTime, enemies || []);
        this.crucifixLauncher.update(deltaTime, enemies || []);
    }
}

// ============= HOLY WATER GRENADES =============
class HolyWaterWeapon {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;
        this.grenades = [];
        this.throwCooldown = 0;
        this.throwForce = 15;
        this.blastRadius = 5;
        this.damage = 40;
    }
    
    throw(enemies) {
        if (this.throwCooldown > 0) return [];
        if (this.player.holyWaterCount <= 0) {
            return [];
        }
        
        this.player.holyWaterCount--;
        this.throwCooldown = 1.5;
        
        // Create grenade projectile
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x00aaff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const grenade = new THREE.Mesh(geometry, material);
        const direction = this.player.getForwardVector();
        
        grenade.position.copy(this.player.camera.position);
        grenade.position.add(direction.clone().multiplyScalar(1));
        
        const velocity = direction.multiplyScalar(this.throwForce);
        velocity.y += 5; // Arc trajectory
        
        this.scene.add(grenade);
        
        const grenadeData = {
            mesh: grenade,
            velocity: velocity,
            timer: 2, // Explodes after 2 seconds
            position: grenade.position.clone()
        };
        
        this.grenades.push(grenadeData);
        
        // Play throw sound
        this.playThrowSound();
        
        return [];
    }
    
    update(deltaTime, enemies) {
        this.throwCooldown = Math.max(0, this.throwCooldown - deltaTime);
        
        // Update grenades
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const grenade = this.grenades[i];
            
            // Physics
            grenade.velocity.y -= 20 * deltaTime; // Gravity
            grenade.position.add(grenade.velocity.clone().multiplyScalar(deltaTime));
            grenade.mesh.position.copy(grenade.position);
            
            // Rotate for visual effect
            grenade.mesh.rotation.x += deltaTime * 5;
            grenade.mesh.rotation.y += deltaTime * 3;
            
            // Bounce on ground
            if (grenade.position.y <= 0.2) {
                grenade.position.y = 0.2;
                grenade.velocity.y *= -0.5;
                grenade.velocity.x *= 0.8;
                grenade.velocity.z *= 0.8;
            }
            
            // Timer
            grenade.timer -= deltaTime;
            if (grenade.timer <= 0) {
                this.explode(grenade, enemies);
                this.grenades.splice(i, 1);
            }
        }
    }
    
    explode(grenade, enemies) {
        // Visual explosion
        this.createHolyExplosion(grenade.position);
        
        // Damage enemies in radius
        const hits = [];
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(grenade.position);
            if (distance <= this.blastRadius) {
                const falloff = 1 - (distance / this.blastRadius);
                const damage = this.damage * falloff;
                enemy.takeDamage(damage);
                
                // Knockback
                const knockback = new THREE.Vector3()
                    .subVectors(enemy.position, grenade.position)
                    .normalize()
                    .multiplyScalar(10 * falloff);
                enemy.applyKnockback(knockback);
                
                hits.push(enemy);
            }
        });
        
        // Remove grenade
        this.scene.remove(grenade.mesh);
        
        // Play explosion sound
        this.playExplosionSound();
        
        return hits;
    }
    
    createHolyExplosion(position) {
        // Create expanding holy light sphere
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Animate expansion
        const animate = () => {
            explosion.scale.multiplyScalar(1.15);
            material.opacity *= 0.95;
            
            if (material.opacity > 0.01) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
        
        // Add holy particles
        for (let i = 0; i < 20; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ccff,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );
            
            this.scene.add(particle);
            
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.3;
                particleMaterial.opacity -= 0.02;
                
                if (particleMaterial.opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    playThrowSound() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    playExplosionSound() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const whiteNoise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        whiteNoise.buffer = buffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        whiteNoise.start();
    }
}

// ============= CRUCIFIX LAUNCHER =============
class CrucifixLauncher {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;
        this.projectiles = [];
        this.fireCooldown = 0;
        this.damage = 75;
        this.projectileSpeed = 30;
    }
    
    fire(enemies) {
        if (this.fireCooldown > 0) return [];
        if (this.player.ammo.rockets <= 0) {
            return [];
        }
        
        this.player.ammo.rockets--;
        this.fireCooldown = 1.0;
        
        // Create crucifix projectile
        const group = new THREE.Group();
        
        // Vertical beam
        const vBeam = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 0.05),
            new THREE.MeshStandardMaterial({
                color: 0xffdd00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.5
            })
        );
        group.add(vBeam);
        
        // Horizontal beam
        const hBeam = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.1, 0.05),
            new THREE.MeshStandardMaterial({
                color: 0xffdd00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.5
            })
        );
        hBeam.position.y = 0.15;
        group.add(hBeam);
        
        // Add holy glow
        const glowLight = new THREE.PointLight(0xffaa00, 2, 5);
        group.add(glowLight);
        
        const direction = this.player.getForwardVector();
        group.position.copy(this.player.camera.position);
        group.position.add(direction.clone().multiplyScalar(1));
        
        this.scene.add(group);
        
        const projectileData = {
            mesh: group,
            velocity: direction.multiplyScalar(this.projectileSpeed),
            position: group.position.clone(),
            lifetime: 3
        };
        
        this.projectiles.push(projectileData);
        
        // Play launch sound
        this.playLaunchSound();
        
        return [];
    }
    
    update(deltaTime, enemies) {
        this.fireCooldown = Math.max(0, this.fireCooldown - deltaTime);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            projectile.mesh.position.copy(projectile.position);
            
            // Rotate for visual effect
            projectile.mesh.rotation.x += deltaTime * 10;
            projectile.mesh.rotation.z += deltaTime * 5;
            
            // Check enemy collisions
            let hit = false;
            enemies.forEach(enemy => {
                if (enemy.health <= 0) return;
                
                const distance = enemy.position.distanceTo(projectile.position);
                if (distance < 1) {
                    enemy.takeDamage(this.damage);
                    
                    // Extra damage to undead
                    if (enemy.damage > 15) { // Boss enemies
                        enemy.takeDamage(25); // Bonus holy damage
                    }
                    
                    // Knockback
                    const knockback = projectile.velocity.clone().normalize().multiplyScalar(15);
                    enemy.applyKnockback(knockback);
                    
                    // Create holy explosion
                    this.createHolyImpact(projectile.position);
                    
                    hit = true;
                }
            });
            
            // Check lifetime
            projectile.lifetime -= deltaTime;
            
            if (hit || projectile.lifetime <= 0) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
                
                if (hit) {
                    this.playImpactSound();
                }
            }
        }
    }
    
    createHolyImpact(position) {
        // Create holy burst effect
        for (let i = 0; i < 15; i++) {
            const geometry = new THREE.BoxGeometry(0.1, 0.3, 0.05);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 1
            });
            
            const shard = new THREE.Mesh(geometry, material);
            shard.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 8,
                (Math.random() - 0.5) * 8
            );
            
            this.scene.add(shard);
            
            const animate = () => {
                shard.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.2;
                material.opacity -= 0.03;
                shard.rotation.x += 0.2;
                shard.rotation.z += 0.1;
                
                if (material.opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(shard);
                }
            };
            animate();
        }
    }
    
    playLaunchSound() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    playImpactSound() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

// ============= RANGED COMBAT =============
class RangedCombat {
    constructor(player, scene, camera) {
        this.player = player;
        this.scene = scene;
        this.camera = camera || player.camera;
        
        const config = GAME_CONFIG.WEAPONS.SHOTGUN;
        this.damage = config.DAMAGE / config.PELLET_COUNT;  // Damage per pellet
        this.pelletCount = config.PELLET_COUNT;
        this.spread = config.SPREAD;
        this.range = config.RANGE;
        this.fireRate = 1 / config.COOLDOWN;  // Convert cooldown to fire rate
        this.lastFireTime = 0;
        
        this.createShotgunModel();
        this.projectiles = [];
        this.muzzleFlash = null;
        
        // Audio
        this.audioContext = AudioManager.getContext();
    }
    
    createShotgunModel() {
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.8);
        const gunMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const barrel = new THREE.Mesh(barrelGeometry, gunMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.4;
        group.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.3);
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3020,
            roughness: 0.8
        });
        
        const stock = new THREE.Mesh(stockGeometry, woodMaterial);
        stock.position.z = 0.1;
        stock.position.y = -0.05;
        group.add(stock);
        
        // Holy symbols
        const crossGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.02);
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffd700,
            emissiveIntensity: 0.1
        });
        
        const cross = new THREE.Mesh(crossGeometry, goldMaterial);
        cross.position.set(0, 0.05, 0);
        group.add(cross);
        
        this.shotgunMesh = group;
        // Position relative to camera for FPS view
        this.shotgunMesh.position.set(0.5, -0.4, -0.8);
        this.shotgunMesh.rotation.y = -0.1;
        this.camera.add(this.shotgunMesh);
        this.hide();
    }
    
    show() {
        if (this.shotgunMesh) {
            this.shotgunMesh.visible = true;
        }
    }
    
    hide() {
        if (this.shotgunMesh) this.shotgunMesh.visible = false;
    }
    
    fire(enemies) {
        const now = Date.now() / 1000;
        
        // Check fire rate
        if (now - this.lastFireTime < 1 / this.fireRate) {
            return [];
        }
        
        // Check ammo
        if (this.player.ammo.shells <= 0) {
            this.playEmptySound();
            return [];
        }
        
        // Use ammo
        this.player.ammo.shells--;
        this.lastFireTime = now;
        
        // Play sound
        this.playShotgunSound();
        
        // Create muzzle flash
        this.createMuzzleFlash();
        
        // Fire pellets
        const hits = [];
        const hitEnemies = new Set(); // Track unique hits
        const forward = this.player.getForwardVector();
        
        for (let i = 0; i < this.pelletCount; i++) {
            // Add spread
            const spreadX = (Math.random() - 0.5) * this.spread;
            const spreadY = (Math.random() - 0.5) * this.spread;
            
            const direction = forward.clone();
            direction.x += spreadX;
            direction.y += spreadY;
            direction.normalize();
            
            // Check hit for this pellet
            const hit = this.checkProjectileHit(this.player.position.clone(), direction, enemies);
            if (hit && hit.health > 0) {
                hit.takeDamage(this.damage);
                hitEnemies.add(hit);
                
                // Visual feedback - create impact particle
                this.createImpactEffect(hit.position);
            }
        }
        
        // Return unique enemies hit
        return Array.from(hitEnemies);
    }
    
    checkProjectileHit(origin, direction, enemies) {
        let closestEnemy = null;
        let closestDistance = this.range;
        
        enemies.forEach(enemy => {
            // Skip dead enemies
            if (enemy.health <= 0) return;
            
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            if (distance < this.range) {
                // Check if enemy is in line of fire (more generous angle)
                const normalizedToEnemy = toEnemy.normalize();
                const angle = direction.angleTo(normalizedToEnemy);
                
                // Increased angle tolerance (about 30 degrees) and added distance-based tolerance
                const angleTolerance = 0.5 + (0.1 * (this.range - distance) / this.range);
                
                if (angle < angleTolerance) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            }
        });
        
        return closestEnemy;
    }
    
    createMuzzleFlash() {
        // Remove old flash
        if (this.muzzleFlash) {
            this.scene.remove(this.muzzleFlash);
        }
        
        const flashGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position at gun barrel
        const offset = new THREE.Vector3(0.3, -0.2, -1.2);
        offset.applyQuaternion(this.player.camera.quaternion);
        this.muzzleFlash.position.copy(this.player.camera.position);
        this.muzzleFlash.position.add(offset);
        
        this.scene.add(this.muzzleFlash);
        
        // Fade out
        const fadeOut = () => {
            this.muzzleFlash.material.opacity -= 0.1;
            if (this.muzzleFlash.material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(this.muzzleFlash);
                this.muzzleFlash = null;
            }
        };
        fadeOut();
    }
    
    playShotgunSound() {
        // Get fresh audio context each time
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        const duration = 0.3;
        
        // Bass boom
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        
        bass.type = 'sine';
        bass.frequency.setValueAtTime(40, audioContext.currentTime);
        bass.connect(bassGain);
        bassGain.connect(audioContext.destination);
        
        bassGain.gain.setValueAtTime(0.8, audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // Crack
        const crack = audioContext.createOscillator();
        const crackGain = audioContext.createGain();
        
        crack.type = 'sawtooth';
        crack.frequency.setValueAtTime(800, audioContext.currentTime);
        crack.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        crack.connect(crackGain);
        crackGain.connect(audioContext.destination);
        
        crackGain.gain.setValueAtTime(0.4, audioContext.currentTime);
        crackGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        bass.start();
        crack.start();
        bass.stop(audioContext.currentTime + duration);
        crack.stop(audioContext.currentTime + 0.1);
    }
    
    createImpactEffect(position) {
        // Create blood splatter at impact point
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x880000,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            
            // Animate particle
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.1; // Gravity
                
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    playEmptySound() {
        // Get fresh audio context each time
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        // Click sound for empty gun
        const click = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        click.type = 'square';
        click.frequency.setValueAtTime(1000, audioContext.currentTime);
        click.connect(gain);
        gain.connect(audioContext.destination);
        
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime + 0.02);
        
        click.start();
        click.stop(audioContext.currentTime + 0.02);
    }
    
    update(deltaTime) {
        // Update shotgun position
        if (this.shotgunMesh && this.shotgunMesh.visible) {
            const camera = this.player.camera;
            const offset = new THREE.Vector3(0.3, -0.25, -0.6);
            offset.applyQuaternion(camera.quaternion);
            
            this.shotgunMesh.position.copy(camera.position);
            this.shotgunMesh.position.add(offset);
            this.shotgunMesh.rotation.copy(camera.rotation);
        }
    }
}

// ============= MELEE COMBAT =============
class MeleeCombat {
    constructor(player, scene, camera) {
        this.player = player;
        this.scene = scene;
        this.camera = camera || player.camera;
        
        const config = GAME_CONFIG.WEAPONS.SWORD;
        this.swordReach = config.RANGE;
        this.swingArc = config.SWING_ARC * Math.PI / 180;
        this.swingTime = 0.3;
        this.swingCooldown = config.COOLDOWN;
        this.lastSwingTime = 0;
        
        this.comboDamage = config.COMBO_DAMAGES;
        this.currentCombo = 0;
        this.comboResetTime = GAME_CONFIG.COMBAT.COMBO_RESET_TIME;
        
        this.isBlocking = false;
        this.createSwordModel();
        this.createArmModel();
        this.initSounds();
    }
    
    initSounds() {
        // Create audio context for sound effects
        this.audioContext = AudioManager.getContext();
        
        // Create sound generators for sword effects
        this.sounds = {
            swing: () => this.createSwingSound(),
            hit: () => this.createHitSound(),
            block: () => this.createBlockSound()
        };
    }
    
    createSwingSound() {
        // Get fresh audio context each time
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        const duration = 0.25;
        
        // Create metallic sword swing with multiple oscillators
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const noise = audioContext.createBufferSource();
        
        // Create white noise for swoosh
        const bufferSize = audioContext.sampleRate * duration;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // High-pass filter for metallic ring
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + duration);
        
        // Connect everything
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Metallic ring frequencies
        oscillator1.type = 'triangle';
        oscillator1.frequency.setValueAtTime(3000, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + duration);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(4500, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + duration);
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        noise.start(audioContext.currentTime);
        
        oscillator1.stop(audioContext.currentTime + duration);
        oscillator2.stop(audioContext.currentTime + duration);
        noise.stop(audioContext.currentTime + duration);
    }
    
    createHitSound() {
        // Get fresh audio context each time
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        const duration = 0.15;
        
        // Layer multiple sounds for impact
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const oscillator3 = audioContext.createOscillator();
        
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const distortion = audioContext.createWaveShaper();
        
        // Create distortion curve for crunch
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * 5);
        }
        distortion.curve = curve;
        
        // Connect everything
        oscillator1.connect(distortion);
        oscillator2.connect(distortion);
        oscillator3.connect(filter);
        distortion.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Low thud
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(60, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + duration);
        
        // Mid crunch
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + duration);
        
        // High metallic ring
        oscillator3.type = 'triangle';
        oscillator3.frequency.setValueAtTime(1200, audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration);
        
        // Sharp attack, quick decay
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator3.start(audioContext.currentTime);
        
        oscillator1.stop(audioContext.currentTime + duration);
        oscillator2.stop(audioContext.currentTime + duration);
        oscillator3.stop(audioContext.currentTime + duration);
    }
    
    createBlockSound() {
        // Get fresh audio context each time
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        const duration = 0.15;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Metal clang sound
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    createSwordModel() {
        const swordGeometry = new THREE.BoxGeometry(0.1, 0.1, 1.5);
        const swordMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x444444,
            emissiveIntensity: 0.2
        });
        
        this.swordMesh = new THREE.Mesh(swordGeometry, swordMaterial);
        this.swordMesh.castShadow = true;
        this.swordMesh.receiveShadow = true;
        // Position sword relative to camera for FPS view
        this.swordMesh.position.set(0.4, -0.3, -0.8);
        this.swordMesh.rotation.set(-0.2, -0.1, -0.785);
        this.camera.add(this.swordMesh);
        this.hide();
    }
    
    show() {
        if (this.swordMesh) {
            this.swordMesh.visible = true;
        }
        if (this.armGroup) {
            this.armGroup.visible = true;
        }
    }
    
    hide() {
        if (this.swordMesh) this.swordMesh.visible = false;
        if (this.armGroup) this.armGroup.visible = false;
    }
    
    createArmModel() {
        // Create arm group
        this.armGroup = new THREE.Group();
        
        // Create upper arm
        const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown leather/armor color
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        this.upperArm.position.set(0, -0.2, 0);
        this.upperArm.rotation.z = Math.PI / 4;
        this.armGroup.add(this.upperArm);
        
        // Create forearm
        const forearmGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.4);
        this.forearm = new THREE.Mesh(forearmGeometry, armMaterial);
        this.forearm.position.set(0.2, -0.4, 0);
        this.forearm.rotation.z = Math.PI / 3;
        this.armGroup.add(this.forearm);
        
        // Create hand
        const handGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.08);
        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFDBCA, // Skin tone
            roughness: 0.9,
            metalness: 0
        });
        
        this.hand = new THREE.Mesh(handGeometry, handMaterial);
        this.hand.position.set(0.35, -0.55, 0);
        this.armGroup.add(this.hand);
        
        // Add armor plates
        const shoulderPadGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const armorMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const shoulderPad = new THREE.Mesh(shoulderPadGeometry, armorMaterial);
        shoulderPad.position.set(0, 0, 0);
        shoulderPad.scale.set(1, 0.8, 0.8);
        this.armGroup.add(shoulderPad);
        
        // Position arm relative to camera
        this.armGroup.position.set(0.25, -0.15, -0.5);
        this.camera.add(this.armGroup);
        this.hide();
    }
    
    updateSwordPosition() {
        if (!this.swordMesh || !this.armGroup) return;
        
        // Since sword and arm are children of camera, use relative positioning only
        // Reset to default position (relative to camera)
        this.swordMesh.position.set(0.4, -0.3, -0.8); // Right, down, forward
        this.swordMesh.rotation.set(-0.2, -0.1, -0.785); // Default tilt
        
        // Position arm relative to camera
        this.armGroup.position.set(0.25, -0.15, -0.5);
        this.armGroup.rotation.set(0, 0, 0); // Reset arm rotation
    }
    
    performSwing(enemies) {
        const now = Date.now();
        
        if (now - this.lastSwingTime < this.swingCooldown * 1000) {
            return [];
        }
        
        if (now - this.lastSwingTime > this.comboResetTime) {
            this.currentCombo = 0;
        }
        
        // Play swing sound
        this.sounds.swing();
        
        const hits = this.checkMeleeHits(enemies);
        
        if (hits.length > 0) {
            // Play hit sound
            this.sounds.hit();
            
            // Create holy explosion during rage mode
            if (this.player.isRaging) {
                this.createHolyExplosion();
            }
        }
        
        // Apply rage mode damage multiplier
        const rageDamageMultiplier = this.player.isRaging ? 2.0 : 1.0;
        const rageKnockbackMultiplier = this.player.isRaging ? 2.0 : 1.0;
        
        hits.forEach(enemy => {
            const damage = this.comboDamage[this.currentCombo] * rageDamageMultiplier;
            enemy.takeDamage(damage);
            
            const knockbackForce = this.player.getForwardVector().multiplyScalar((this.currentCombo + 1) * 2 * rageKnockbackMultiplier);
            enemy.applyKnockback(knockbackForce);
            
            // Heal more during rage mode
            const healAmount = this.player.isRaging ? 20 : (enemy.health <= 0 ? 10 : 5);
            this.player.heal(healAmount);
        });
        
        this.currentCombo = (this.currentCombo + 1) % this.comboDamage.length;
        this.lastSwingTime = now;
        
        this.playSwingAnimation();
        
        return hits;
    }
    
    performBlock() {
        this.sounds.block();
        // Rest of block logic...
    }
    
    checkMeleeHits(enemies) {
        const hits = [];
        const playerPos = this.player.position.clone();
        const forward = this.player.getForwardVector();
        
        // Increase reach during rage mode
        const rageReachBonus = this.player.isRaging ? 1.5 : 1.0;
        const currentReach = this.swordReach * rageReachBonus;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(playerPos);
            toEnemy.y = 0;
            
            const distance = toEnemy.length();
            
            if (distance <= currentReach) {
                const angle = forward.angleTo(toEnemy.normalize());
                
                if (angle <= this.swingArc / 2) {
                    hits.push(enemy);
                }
            }
        });
        
        return hits;
    }
    
    playSwingAnimation() {
        if (this.swingAnimation) {
            cancelAnimationFrame(this.swingAnimation);
        }
        
        const startTime = Date.now();
        const swingDuration = this.swingTime * 1000;
        
        // Store initial position
        const camera = this.player.camera;
        const startOffset = new THREE.Vector3(0.4, -0.3, -0.8);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / swingDuration, 1);
            
            // Swing arc - move sword from right to left
            const swingProgress = Math.sin(progress * Math.PI);
            
            // Calculate dynamic offset for swing motion (relative to camera)
            this.swordMesh.position.set(
                0.4 - swingProgress * 1.2,  // Swing from right to left
                -0.3 + swingProgress * 0.2,  // Slight upward arc
                -0.8 - swingProgress * 0.5   // Forward thrust
            );
            
            // Rotate sword during swing (relative to camera)
            this.swordMesh.rotation.set(
                -0.2,  // Base X rotation
                -0.1 + swingProgress * Math.PI / 3,  // Y swing
                -0.785 - swingProgress * Math.PI / 2  // Z swing arc
            );
            
            // Animate arm to follow sword (relative to camera)
            this.armGroup.position.set(
                0.25 - swingProgress * 0.8,
                -0.15 + swingProgress * 0.1,
                -0.5 - swingProgress * 0.3
            );
            this.armGroup.rotation.copy(camera.rotation);
            
            // Bend elbow during swing
            if (this.forearm) {
                this.forearm.rotation.z = Math.PI / 3 + swingProgress * Math.PI / 4;
            }
            
            // Make sword glow during swing
            this.swordMesh.material.emissiveIntensity = 0.2 + swingProgress * 0.5;
            
            if (progress < 1) {
                this.swingAnimation = requestAnimationFrame(animate);
            } else {
                this.swingAnimation = null;
                this.swordMesh.material.emissiveIntensity = 0.2;
                this.updateSwordPosition();
            }
        };
        
        animate();
        
        // Create swing trail effect
        this.createSwingTrail();
    }
    
    createSwingTrail() {
        const trailGeometry = new THREE.BoxGeometry(2, 0.05, 0.5);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(this.swordMesh.position);
        trail.rotation.copy(this.swordMesh.rotation);
        this.scene.add(trail);
        
        // Fade out trail
        const fadeOut = () => {
            trail.material.opacity -= 0.05;
            if (trail.material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(trail);
            }
        };
        fadeOut();
    }
    
    createHolyExplosion() {
        // Create golden explosion effect
        const explosionGeometry = new THREE.SphereGeometry(3, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.player.position);
        this.scene.add(explosion);
        
        // Animate explosion
        const animateExplosion = () => {
            explosion.scale.multiplyScalar(1.1);
            explosionMaterial.opacity -= 0.05;
            
            if (explosionMaterial.opacity > 0) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        animateExplosion();
        
        // Play holy sound
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    update(deltaTime) {
        // Weapons automatically follow camera since they're attached
    }
}

// Export the WeaponSystem class
export { WeaponSystem, HolyWaterWeapon, CrucifixLauncher, RangedCombat, MeleeCombat };