import * as THREE from 'three';

// Vatican Combat Pistol
// Standard sidearm since 1950s with blessed silver bullets

export class VaticanPistol {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Weapon stats
        this.damage = 25;
        this.range = 50;
        this.fireRate = 300; // milliseconds between shots
        this.magazineSize = 15;
        this.currentAmmo = 15;
        this.totalAmmo = 150;
        this.reloadTime = 1500;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // Accuracy
        this.baseSpread = 0.02;
        this.currentSpread = 0.02;
        this.maxSpread = 0.15;
        this.spreadIncrease = 0.02;
        this.spreadRecovery = 0.05;
        
        // Alt-fire rapid mode
        this.rapidFireMode = false;
        this.rapidFireRate = 100;
        
        // Blessed bullets
        this.isBlessed = true;
        this.silverBullets = true;
        this.holyDamageMultiplier = 1.5;
        
        // Create weapon mesh
        this.createPistolMesh();
        
        // Muzzle flash
        this.muzzleFlash = null;
    }
    
    createPistolMesh() {
        const group = new THREE.Group();
        
        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.03);
        const gripMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            roughness: 0.7
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.05, 0);
        group.add(grip);
        
        // Slide
        const slideGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.03);
        const slideMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.3
        });
        const slide = new THREE.Mesh(slideGeometry, slideMaterial);
        slide.position.set(0.02, 0.03, 0);
        group.add(slide);
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6);
        const barrelMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.2
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(0.08, 0.03, 0);
        barrel.rotation.z = Math.PI / 2;
        group.add(barrel);
        
        // Vatican seal on grip
        const sealGeometry = new THREE.CircleGeometry(0.02, 8);
        const sealMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            emissive: 0xffdd00,
            emissiveIntensity: 0.3
        });
        const seal = new THREE.Mesh(sealGeometry, sealMaterial);
        seal.position.set(0, -0.05, 0.02);
        group.add(seal);
        
        // Sights
        const frontSightGeometry = new THREE.BoxGeometry(0.005, 0.01, 0.005);
        const sightMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            emissive: 0x00ff00,
            emissiveIntensity: 0.2
        });
        const frontSight = new THREE.Mesh(frontSightGeometry, sightMaterial);
        frontSight.position.set(0.13, 0.06, 0);
        group.add(frontSight);
        
        const rearSightGeometry = new THREE.BoxGeometry(0.02, 0.008, 0.01);
        const rearSight = new THREE.Mesh(rearSightGeometry, sightMaterial);
        rearSight.position.set(-0.02, 0.06, 0);
        group.add(rearSight);
        
        this.mesh = group;
        
        // Position relative to camera
        this.updatePosition();
    }
    
    updatePosition() {
        if (!this.player || !this.player.camera) return;
        
        // Position pistol in front-right of camera
        this.mesh.position.set(0.3, -0.2, -0.5);
        this.mesh.rotation.set(0, -0.1, 0);
        
        // Recoil animation
        if (Date.now() - this.lastFireTime < 100) {
            const recoilTime = (Date.now() - this.lastFireTime) / 100;
            this.mesh.position.z = -0.5 + Math.sin(recoilTime * Math.PI) * 0.05;
            this.mesh.rotation.x = Math.sin(recoilTime * Math.PI) * 0.2;
        }
        
        // Reload animation
        if (this.isReloading) {
            const reloadProgress = (Date.now() - this.reloadStartTime) / this.reloadTime;
            this.mesh.position.y = -0.2 - Math.sin(reloadProgress * Math.PI) * 0.1;
            this.mesh.rotation.z = Math.sin(reloadProgress * Math.PI) * 0.5;
        }
        
        // Bob animation
        const bobAmount = Math.sin(Date.now() * 0.002) * 0.01;
        this.mesh.position.y += bobAmount;
    }
    
    fire() {
        const now = Date.now();
        const fireRate = this.rapidFireMode ? this.rapidFireRate : this.fireRate;
        
        if (now - this.lastFireTime < fireRate || this.isReloading) return false;
        
        if (this.currentAmmo <= 0) {
            this.reload();
            return false;
        }
        
        // Fire bullet
        this.fireBullet();
        
        this.currentAmmo--;
        this.lastFireTime = now;
        
        // Increase spread
        this.currentSpread = Math.min(this.maxSpread, this.currentSpread + this.spreadIncrease);
        
        // Muzzle flash
        this.createMuzzleFlash();
        
        // Sound
        this.playFireSound();
        
        return true;
    }
    
    fireBullet() {
        // Calculate bullet direction with spread
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        
        // Add spread
        const spreadX = (Math.random() - 0.5) * this.currentSpread;
        const spreadY = (Math.random() - 0.5) * this.currentSpread;
        
        direction.x += spreadX;
        direction.y += spreadY;
        direction.normalize();
        
        // Raycaster for hit detection
        const raycaster = new THREE.Raycaster();
        raycaster.set(this.player.camera.position, direction);
        raycaster.far = this.range;
        
        // Check enemy hits
        if (this.player.game && this.player.game.enemies) {
            const intersects = [];
            
            this.player.game.enemies.forEach(enemy => {
                if (enemy && !enemy.isDead && enemy.mesh) {
                    const intersection = raycaster.intersectObject(enemy.mesh, true);
                    if (intersection.length > 0) {
                        intersects.push({
                            enemy: enemy,
                            distance: intersection[0].distance,
                            point: intersection[0].point
                        });
                    }
                }
            });
            
            // Sort by distance and hit closest
            if (intersects.length > 0) {
                intersects.sort((a, b) => a.distance - b.distance);
                const hit = intersects[0];
                
                // Calculate damage
                let damage = this.damage;
                
                // Headshot check (if hit point is in upper portion)
                const enemyHeight = hit.enemy.height || 2;
                const headHeight = hit.enemy.position.y + enemyHeight * 0.7;
                if (hit.point.y > headHeight) {
                    damage *= 2; // Headshot multiplier
                    this.createHeadshotEffect(hit.point);
                }
                
                // Apply holy damage bonus
                if (this.isBlessed && this.silverBullets) {
                    damage *= this.holyDamageMultiplier;
                }
                
                hit.enemy.takeDamage(damage, 'holy');
                
                // Create hit effect
                this.createHitEffect(hit.point);
                
                // Bullet trail
                this.createBulletTrail(this.player.camera.position, hit.point);
            } else {
                // No enemy hit, create trail to max range
                const endPoint = this.player.camera.position.clone()
                    .add(direction.multiplyScalar(this.range));
                this.createBulletTrail(this.player.camera.position, endPoint);
            }
        }
    }
    
    toggleRapidFire() {
        this.rapidFireMode = !this.rapidFireMode;
        
        if (this.player.game && this.player.game.narrativeSystem) {
            const mode = this.rapidFireMode ? "RAPID FIRE" : "STANDARD";
            this.player.game.narrativeSystem.displaySubtitle(`Pistol mode: ${mode}`);
        }
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.magazineSize) return;
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        // Play reload sound
        this.playReloadSound();
        
        setTimeout(() => {
            const ammoNeeded = this.magazineSize - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
            
            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;
            
            this.isReloading = false;
            
            // Chamber round sound
            this.playChamberSound();
        }, this.reloadTime);
    }
    
    createMuzzleFlash() {
        // Remove previous flash
        if (this.muzzleFlash) {
            if (this.muzzleFlash.parent) {
                this.muzzleFlash.parent.remove(this.muzzleFlash);
            }
        }
        
        // Create new flash
        const flashGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.muzzleFlash.position.set(0.15, 0.03, 0);
        
        if (this.mesh) {
            this.mesh.add(this.muzzleFlash);
        }
        
        // Add light
        const flashLight = new THREE.PointLight(0xffff00, 2, 5);
        flashLight.position.copy(this.muzzleFlash.position);
        this.mesh.add(flashLight);
        
        // Fade out
        setTimeout(() => {
            if (this.muzzleFlash && this.muzzleFlash.parent) {
                this.muzzleFlash.parent.remove(this.muzzleFlash);
            }
            if (flashLight.parent) {
                flashLight.parent.remove(flashLight);
            }
        }, 50);
    }
    
    createBulletTrail(start, end) {
        // Create trail line
        const points = [start.clone(), end.clone()];
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(trail);
        
        // Fade out
        const fadeTrail = () => {
            trail.material.opacity *= 0.8;
            if (trail.material.opacity > 0.01) {
                requestAnimationFrame(fadeTrail);
            } else {
                this.scene.remove(trail);
            }
        };
        
        setTimeout(fadeTrail, 50);
    }
    
    createHitEffect(position) {
        // Spark particles
        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffaa00,
                    transparent: true,
                    opacity: 1
                })
            );
            
            spark.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            this.scene.add(spark);
            
            // Animate spark
            const animateSpark = () => {
                spark.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.1;
                spark.material.opacity *= 0.9;
                
                if (spark.material.opacity > 0.01) {
                    requestAnimationFrame(animateSpark);
                } else {
                    this.scene.remove(spark);
                }
            };
            animateSpark();
        }
        
        // Impact flash
        const impact = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 6),
            new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.4
            })
        );
        
        impact.position.copy(position);
        this.scene.add(impact);
        
        // Fade impact
        const fadeImpact = () => {
            impact.scale.multiplyScalar(1.1);
            impact.material.opacity *= 0.8;
            
            if (impact.material.opacity > 0.01) {
                requestAnimationFrame(fadeImpact);
            } else {
                this.scene.remove(impact);
            }
        };
        fadeImpact();
    }
    
    createHeadshotEffect(position) {
        // Special effect for headshots
        const hsGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
        const hsMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const hsRing = new THREE.Mesh(hsGeometry, hsMaterial);
        hsRing.position.copy(position);
        hsRing.lookAt(this.player.camera.position);
        this.scene.add(hsRing);
        
        // Animate ring
        const animateHS = () => {
            hsRing.scale.multiplyScalar(1.05);
            hsRing.material.opacity *= 0.92;
            
            if (hsRing.material.opacity > 0.01) {
                requestAnimationFrame(animateHS);
            } else {
                this.scene.remove(hsRing);
            }
        };
        animateHS();
        
        // Add text (would need text geometry or sprite in real implementation)
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("HEADSHOT!");
        }
    }
    
    playFireSound() {
        // Pistol fire sound
    }
    
    playReloadSound() {
        // Magazine ejection and insertion sound
    }
    
    playChamberSound() {
        // Slide rack sound
    }
    
    update(deltaTime) {
        // Update position
        this.updatePosition();
        
        // Recover spread
        if (this.currentSpread > this.baseSpread) {
            this.currentSpread = Math.max(
                this.baseSpread,
                this.currentSpread - this.spreadRecovery * deltaTime
            );
        }
        
        // Auto-reload when empty
        if (this.currentAmmo === 0 && !this.isReloading && this.totalAmmo > 0) {
            this.reload();
        }
    }
    
    addAmmo(amount) {
        this.totalAmmo = Math.min(this.totalAmmo + amount, 300); // Max carry
    }
}