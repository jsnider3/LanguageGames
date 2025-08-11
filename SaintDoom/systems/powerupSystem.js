// Power-up System
// Temporary boosts and abilities that spawn throughout levels

export class PowerupSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Active powerups
        this.activePowerups = [];
        this.spawnedPowerups = [];
        
        // Powerup definitions
        this.powerupTypes = {
            divineShield: {
                id: 'divineShield',
                name: 'Divine Shield',
                description: 'Invulnerability for 10 seconds',
                duration: 10000,
                color: 0xffffaa,
                symbol: 'shield',
                rarity: 'rare',
                onActivate: () => this.activateDivineShield(),
                onDeactivate: () => this.deactivateDivineShield()
            },
            
            saintsWrath: {
                id: 'saintsWrath',
                name: "Saint's Wrath",
                description: 'Triple damage for 15 seconds',
                duration: 15000,
                color: 0xff0000,
                symbol: 'sword',
                rarity: 'rare',
                onActivate: () => this.activateSaintsWrath(),
                onDeactivate: () => this.deactivateSaintsWrath()
            },
            
            miraculousHealing: {
                id: 'miraculousHealing',
                name: 'Miraculous Healing',
                description: 'Instantly restore full health and regenerate',
                duration: 0, // Instant effect
                color: 0x00ff00,
                symbol: 'cross',
                rarity: 'common',
                onActivate: () => this.activateMiraculousHealing(),
                onDeactivate: null
            },
            
            etherealStep: {
                id: 'etherealStep',
                name: 'Ethereal Step',
                description: 'Phase through enemies and move at double speed',
                duration: 8000,
                color: 0x8800ff,
                symbol: 'wings',
                rarity: 'epic',
                onActivate: () => this.activateEtherealStep(),
                onDeactivate: () => this.deactivateEtherealStep()
            },
            
            revelation: {
                id: 'revelation',
                name: 'Revelation',
                description: 'See all enemies and secrets through walls',
                duration: 20000,
                color: 0x00ffff,
                symbol: 'eye',
                rarity: 'epic',
                onActivate: () => this.activateRevelation(),
                onDeactivate: () => this.deactivateRevelation()
            },
            
            holyGrenade: {
                id: 'holyGrenade',
                name: 'Holy Grenade',
                description: 'One-time use explosive that clears the room',
                duration: 0, // Instant use
                color: 0xffaa00,
                symbol: 'bomb',
                rarity: 'rare',
                consumable: true,
                onActivate: () => this.useHolyGrenade()
            },
            
            berserk: {
                id: 'berserk',
                name: 'Berserk',
                description: 'Melee damage x10, increased speed',
                duration: 30000,
                color: 0xff00ff,
                symbol: 'fist',
                rarity: 'legendary',
                onActivate: () => this.activateBerserk(),
                onDeactivate: () => this.deactivateBerserk()
            },
            
            invisibility: {
                id: 'invisibility',
                name: 'Invisibility',
                description: 'Become invisible to enemies',
                duration: 10000,
                color: 0x888888,
                symbol: 'ghost',
                rarity: 'rare',
                onActivate: () => this.activateInvisibility(),
                onDeactivate: () => this.deactivateInvisibility()
            },
            
            quadDamage: {
                id: 'quadDamage',
                name: 'Quad Damage',
                description: '4x damage on all attacks',
                duration: 20000,
                color: 0xff00ff,
                symbol: 'quad',
                rarity: 'legendary',
                onActivate: () => this.activateQuadDamage(),
                onDeactivate: () => this.deactivateQuadDamage()
            },
            
            timeStop: {
                id: 'timeStop',
                name: 'Time Stop',
                description: 'Freeze all enemies for 5 seconds',
                duration: 5000,
                color: 0x0000ff,
                symbol: 'clock',
                rarity: 'legendary',
                onActivate: () => this.activateTimeStop(),
                onDeactivate: () => this.deactivateTimeStop()
            }
        };
        
        // Visual effects
        this.effectMeshes = {};
        
        // Spawn timer
        this.spawnInterval = 30000; // 30 seconds
        this.lastSpawnTime = 0;
        this.maxActiveSpawns = 3;
    }
    
    spawnPowerup(position, typeId = null) {
        if (this.spawnedPowerups.length >= this.maxActiveSpawns) return;
        
        // Choose random type if not specified
        if (!typeId) {
            const types = Object.keys(this.powerupTypes);
            // Weight by rarity
            const weights = types.map(t => {
                const rarity = this.powerupTypes[t].rarity;
                switch(rarity) {
                    case 'common': return 5;
                    case 'rare': return 3;
                    case 'epic': return 2;
                    case 'legendary': return 1;
                    default: return 3;
                }
            });
            
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;
            
            for (let i = 0; i < types.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    typeId = types[i];
                    break;
                }
            }
        }
        
        const powerup = this.powerupTypes[typeId];
        if (!powerup) return;
        
        // Create powerup mesh
        const powerupMesh = this.createPowerupMesh(powerup);
        powerupMesh.position.copy(position);
        powerupMesh.position.y = 1;
        powerupMesh.userData = {
            isPowerup: true,
            powerupId: typeId,
            collected: false,
            spawnTime: Date.now()
        };
        
        this.scene.add(powerupMesh);
        
        this.spawnedPowerups.push({
            mesh: powerupMesh,
            type: powerup,
            position: position.clone()
        });
        
        // Add floating animation
        this.animatePowerup(powerupMesh);
    }
    
    createPowerupMesh(powerup) {
        const group = new THREE.Group();
        
        // Base orb
        const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const orbMaterial = new THREE.MeshPhongMaterial({
            color: powerup.color,
            emissive: powerup.color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        group.add(orb);
        
        // Inner core
        const coreGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
        
        // Symbol based on type
        this.addPowerupSymbol(group, powerup);
        
        // Outer ring
        const ringGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: powerup.color,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        // Particles
        this.createPowerupParticles(group, powerup.color);
        
        // Light
        const light = new THREE.PointLight(powerup.color, 1, 5);
        group.add(light);
        
        // Rarity indicator
        if (powerup.rarity === 'legendary') {
            this.addLegendaryEffects(group);
        } else if (powerup.rarity === 'epic') {
            this.addEpicEffects(group);
        }
        
        return group;
    }
    
    addPowerupSymbol(parent, powerup) {
        // Create simple symbol meshes based on type
        let symbolMesh;
        
        switch(powerup.symbol) {
            case 'shield':
                symbolMesh = this.createShieldSymbol();
                break;
            case 'sword':
                symbolMesh = this.createSwordSymbol();
                break;
            case 'cross':
                symbolMesh = this.createCrossSymbol();
                break;
            case 'wings':
                symbolMesh = this.createWingsSymbol();
                break;
            case 'eye':
                symbolMesh = this.createEyeSymbol();
                break;
            case 'bomb':
                symbolMesh = this.createBombSymbol();
                break;
            case 'fist':
                symbolMesh = this.createFistSymbol();
                break;
            case 'ghost':
                symbolMesh = this.createGhostSymbol();
                break;
            case 'quad':
                symbolMesh = this.createQuadSymbol();
                break;
            case 'clock':
                symbolMesh = this.createClockSymbol();
                break;
            default:
                symbolMesh = new THREE.Mesh(
                    new THREE.TetrahedronGeometry(0.1),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
        }
        
        if (symbolMesh) {
            symbolMesh.scale.setScalar(0.5);
            parent.add(symbolMesh);
        }
    }
    
    createShieldSymbol() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.3);
        shape.lineTo(-0.2, 0.1);
        shape.lineTo(-0.2, -0.2);
        shape.lineTo(0, -0.3);
        shape.lineTo(0.2, -0.2);
        shape.lineTo(0.2, 0.1);
        shape.closePath();
        
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide 
        });
        return new THREE.Mesh(geometry, material);
    }
    
    createSwordSymbol() {
        const group = new THREE.Group();
        
        // Blade
        const bladeGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.01);
        const bladeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        group.add(blade);
        
        // Guard
        const guardGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.01);
        const guard = new THREE.Mesh(guardGeometry, bladeMaterial);
        guard.position.y = -0.15;
        group.add(guard);
        
        return group;
    }
    
    createCrossSymbol() {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Vertical
        const vBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.3, 0.01),
            material
        );
        group.add(vBar);
        
        // Horizontal
        const hBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.05, 0.01),
            material
        );
        hBar.position.y = 0.05;
        group.add(hBar);
        
        return group;
    }
    
    createWingsSymbol() {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Simple wing shapes
        const wingGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
        
        const leftWing = new THREE.Mesh(wingGeometry, material);
        leftWing.position.x = -0.1;
        leftWing.rotation.z = -0.3;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, material);
        rightWing.position.x = 0.1;
        rightWing.rotation.z = 0.3;
        group.add(rightWing);
        
        return group;
    }
    
    createEyeSymbol() {
        const group = new THREE.Group();
        
        // Eye outline
        const eyeGeometry = new THREE.TorusGeometry(0.15, 0.02, 4, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.scale.y = 0.6;
        group.add(eye);
        
        // Pupil
        const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const pupil = new THREE.Mesh(pupilGeometry, eyeMaterial);
        group.add(pupil);
        
        return group;
    }
    
    createBombSymbol() {
        const group = new THREE.Group();
        
        // Bomb body
        const bombGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const bombMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
        group.add(bomb);
        
        // Fuse
        const fuseGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4);
        const fuse = new THREE.Mesh(fuseGeometry, bombMaterial);
        fuse.position.y = 0.15;
        group.add(fuse);
        
        return group;
    }
    
    createFistSymbol() {
        const fistGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const fistMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        return new THREE.Mesh(fistGeometry, fistMaterial);
    }
    
    createGhostSymbol() {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });
        
        // Ghost body
        const bodyGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const body = new THREE.Mesh(bodyGeometry, material);
        group.add(body);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.05, 0.05, 0.1);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.05, 0.05, 0.1);
        group.add(rightEye);
        
        return group;
    }
    
    createQuadSymbol() {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Four diamonds
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const diamond = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.05, 0),
                material
            );
            diamond.position.x = Math.cos(angle) * 0.1;
            diamond.position.y = Math.sin(angle) * 0.1;
            group.add(diamond);
        }
        
        return group;
    }
    
    createClockSymbol() {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Clock face
        const faceGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
        const face = new THREE.Mesh(faceGeometry, material);
        group.add(face);
        
        // Clock hands
        const hourHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.08, 0.01),
            material
        );
        hourHand.position.y = 0.04;
        group.add(hourHand);
        
        const minuteHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.12, 0.01),
            material
        );
        minuteHand.position.y = 0.06;
        minuteHand.rotation.z = Math.PI / 3;
        group.add(minuteHand);
        
        return group;
    }
    
    createPowerupParticles(parent, color) {
        const particleCount = 20;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.5;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        parent.add(particleSystem);
        
        // Store for animation
        parent.userData.particles = particleSystem;
    }
    
    addLegendaryEffects(group) {
        // Extra rings
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.3 + i * 0.1, 0.02, 4, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffdd00,
                transparent: true,
                opacity: 0.4 - i * 0.1
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.z = i * 0.5;
            group.add(ring);
        }
        
        // Lightning effect
        const lightningGeometry = new THREE.BufferGeometry();
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        // Store for animation
        group.userData.isLegendary = true;
    }
    
    addEpicEffects(group) {
        // Spiral effect
        const spiralGeometry = new THREE.BufferGeometry();
        const spiralPoints = [];
        
        for (let i = 0; i < 50; i++) {
            const t = i / 50;
            const angle = t * Math.PI * 4;
            const radius = 0.5 * (1 - t);
            spiralPoints.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                t * 0.5 - 0.25,
                Math.sin(angle) * radius
            ));
        }
        
        spiralGeometry.setFromPoints(spiralPoints);
        const spiralMaterial = new THREE.LineBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.6
        });
        
        const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
        group.add(spiral);
        
        group.userData.isEpic = true;
    }
    
    animatePowerup(mesh) {
        const animate = () => {
            if (!mesh.parent) return;
            
            // Bob up and down
            mesh.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            
            // Rotate
            mesh.rotation.y += 0.02;
            
            // Animate particles
            if (mesh.userData.particles) {
                mesh.userData.particles.rotation.y -= 0.01;
            }
            
            // Legendary effects
            if (mesh.userData.isLegendary) {
                mesh.children.forEach((child, i) => {
                    if (child.geometry && child.geometry.type === 'TorusGeometry') {
                        child.rotation.z += 0.02 * (i + 1);
                    }
                });
            }
            
            // Epic effects
            if (mesh.userData.isEpic) {
                mesh.children.forEach(child => {
                    if (child.type === 'Line') {
                        child.rotation.y += 0.03;
                    }
                });
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    checkPowerupPickup(playerPosition) {
        for (let i = this.spawnedPowerups.length - 1; i >= 0; i--) {
            const spawned = this.spawnedPowerups[i];
            if (spawned.mesh.userData.collected) continue;
            
            const distance = playerPosition.distanceTo(spawned.mesh.position);
            
            if (distance < 1.5) {
                this.collectPowerup(spawned, i);
            }
        }
    }
    
    collectPowerup(spawned, index) {
        const powerup = spawned.type;
        
        // Mark as collected
        spawned.mesh.userData.collected = true;
        
        // Collection effect
        this.createCollectionEffect(spawned.mesh.position, powerup.color);
        
        // Remove mesh
        this.scene.remove(spawned.mesh);
        this.spawnedPowerups.splice(index, 1);
        
        // Activate powerup
        this.activatePowerup(powerup);
        
        // Notification
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `${powerup.name}: ${powerup.description}`
            );
        }
    }
    
    activatePowerup(powerup) {
        // Check if consumable (one-time use)
        if (powerup.consumable) {
            if (powerup.onActivate) {
                powerup.onActivate();
            }
            return;
        }
        
        // Check if instant effect
        if (powerup.duration === 0) {
            if (powerup.onActivate) {
                powerup.onActivate();
            }
            return;
        }
        
        // Timed powerup
        const activePowerup = {
            type: powerup,
            startTime: Date.now(),
            duration: powerup.duration
        };
        
        this.activePowerups.push(activePowerup);
        
        // Activate effects
        if (powerup.onActivate) {
            powerup.onActivate();
        }
        
        // Schedule deactivation
        setTimeout(() => {
            this.deactivatePowerup(activePowerup);
        }, powerup.duration);
    }
    
    deactivatePowerup(activePowerup) {
        const index = this.activePowerups.indexOf(activePowerup);
        if (index > -1) {
            this.activePowerups.splice(index, 1);
        }
        
        if (activePowerup.type.onDeactivate) {
            activePowerup.type.onDeactivate();
        }
        
        // Notification
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `${activePowerup.type.name} expired`
            );
        }
    }
    
    createCollectionEffect(position, color) {
        // Burst effect
        const burstGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(position);
        this.scene.add(burst);
        
        // Expand and fade
        const expandBurst = () => {
            burst.scale.multiplyScalar(1.15);
            burst.material.opacity *= 0.9;
            
            if (burst.material.opacity > 0.01) {
                requestAnimationFrame(expandBurst);
            } else {
                this.scene.remove(burst);
            }
        };
        expandBurst();
        
        // Particles
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            );
            
            this.scene.add(particle);
            
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                particle.material.opacity *= 0.95;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    // Individual powerup implementations
    activateDivineShield() {
        this.player.invulnerable = true;
        
        // Create shield mesh
        const shieldGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.effectMeshes.divineShield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.effectMeshes.divineShield.position.copy(this.player.position);
        this.scene.add(this.effectMeshes.divineShield);
        
        // Animate shield
        const animateShield = () => {
            if (this.effectMeshes.divineShield) {
                this.effectMeshes.divineShield.position.copy(this.player.position);
                this.effectMeshes.divineShield.rotation.y += 0.02;
                this.effectMeshes.divineShield.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
                requestAnimationFrame(animateShield);
            }
        };
        animateShield();
    }
    
    deactivateDivineShield() {
        this.player.invulnerable = false;
        
        if (this.effectMeshes.divineShield) {
            this.scene.remove(this.effectMeshes.divineShield);
            delete this.effectMeshes.divineShield;
        }
    }
    
    activateSaintsWrath() {
        this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 3;
        
        // Red aura effect
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0xff0000);
                    child.material.emissiveIntensity = 0.3;
                }
            });
        }
    }
    
    deactivateSaintsWrath() {
        this.player.damageMultiplier = (this.player.damageMultiplier || 3) / 3;
        
        // Remove red aura
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissiveIntensity = 0;
                }
            });
        }
    }
    
    activateMiraculousHealing() {
        // Full heal
        this.player.health = this.player.maxHealth;
        
        // Regeneration effect
        const regenDuration = 5000;
        const regenInterval = 100;
        const regenAmount = 2;
        
        const regen = setInterval(() => {
            if (this.player.health < this.player.maxHealth) {
                this.player.health = Math.min(
                    this.player.maxHealth,
                    this.player.health + regenAmount
                );
            }
        }, regenInterval);
        
        setTimeout(() => clearInterval(regen), regenDuration);
        
        // Visual effect
        this.createHealingEffect();
    }
    
    createHealingEffect() {
        // Green particles rising
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(this.player.position);
            particle.position.x += (Math.random() - 0.5) * 1;
            particle.position.z += (Math.random() - 0.5) * 1;
            
            this.scene.add(particle);
            
            const animateParticle = () => {
                particle.position.y += 0.03;
                particle.material.opacity *= 0.98;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            
            setTimeout(() => animateParticle(), i * 50);
        }
    }
    
    activateEtherealStep() {
        this.player.moveSpeed *= 2;
        this.player.canPhase = true;
        
        // Ghostly effect
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });
        }
    }
    
    deactivateEtherealStep() {
        this.player.moveSpeed /= 2;
        this.player.canPhase = false;
        
        // Remove ghostly effect
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.opacity = 1;
                }
            });
        }
    }
    
    activateRevelation() {
        // Enable wallhack vision
        this.player.hasRevelation = true;
        
        // Show all enemies through walls
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy && enemy.mesh) {
                    // Add outline or glow
                    enemy.mesh.traverse(child => {
                        if (child.isMesh) {
                            child.material.emissive = new THREE.Color(0xff0000);
                            child.material.emissiveIntensity = 0.5;
                        }
                    });
                }
            });
        }
    }
    
    deactivateRevelation() {
        this.player.hasRevelation = false;
        
        // Remove enemy highlights
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy && enemy.mesh) {
                    enemy.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.emissiveIntensity = 0;
                        }
                    });
                }
            });
        }
    }
    
    useHolyGrenade() {
        // Create grenade projectile
        const grenadeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const grenadeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        
        const grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
        grenade.position.copy(this.player.position);
        grenade.position.y += 1.5;
        
        // Throw forward
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        const velocity = direction.multiplyScalar(15);
        velocity.y = 5;
        
        this.scene.add(grenade);
        
        // Animate throw
        const animateGrenade = () => {
            grenade.position.add(velocity.clone().multiplyScalar(0.016));
            velocity.y -= 0.5; // Gravity
            
            // Check ground collision
            if (grenade.position.y <= 0) {
                this.detonateHolyGrenade(grenade.position);
                this.scene.remove(grenade);
            } else {
                requestAnimationFrame(animateGrenade);
            }
        };
        animateGrenade();
    }
    
    detonateHolyGrenade(position) {
        // Massive explosion
        const explosionRadius = 15;
        const explosionDamage = 200;
        
        // Visual effect
        const explosionGeometry = new THREE.SphereGeometry(1, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Expand explosion
        const expandExplosion = () => {
            explosion.scale.multiplyScalar(1.3);
            explosion.material.opacity *= 0.92;
            
            // Damage enemies
            if (explosion.scale.x < explosionRadius && this.player.game && this.player.game.enemies) {
                this.player.game.enemies.forEach(enemy => {
                    if (enemy && !enemy.isDead) {
                        const distance = enemy.position.distanceTo(position);
                        if (distance < explosion.scale.x) {
                            enemy.takeDamage(explosionDamage, 'holy');
                        }
                    }
                });
            }
            
            if (explosion.material.opacity > 0.01) {
                requestAnimationFrame(expandExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        expandExplosion();
    }
    
    activateBerserk() {
        this.player.meleeDamageMultiplier = 10;
        this.player.moveSpeed *= 1.5;
        
        // Red screen tint would be added in real implementation
        // Add rage particles
    }
    
    deactivateBerserk() {
        this.player.meleeDamageMultiplier = 1;
        this.player.moveSpeed /= 1.5;
    }
    
    activateInvisibility() {
        this.player.isInvisible = true;
        
        // Make player transparent
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.1;
                }
            });
        }
    }
    
    deactivateInvisibility() {
        this.player.isInvisible = false;
        
        // Restore visibility
        if (this.player.mesh) {
            this.player.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.opacity = 1;
                }
            });
        }
    }
    
    activateQuadDamage() {
        this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 4;
        
        // Purple glow effect
        const quadLight = new THREE.PointLight(0xff00ff, 2, 10);
        quadLight.position.copy(this.player.position);
        this.scene.add(quadLight);
        this.effectMeshes.quadLight = quadLight;
    }
    
    deactivateQuadDamage() {
        this.player.damageMultiplier = (this.player.damageMultiplier || 4) / 4;
        
        if (this.effectMeshes.quadLight) {
            this.scene.remove(this.effectMeshes.quadLight);
            delete this.effectMeshes.quadLight;
        }
    }
    
    activateTimeStop() {
        // Freeze all enemies
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy && !enemy.isDead) {
                    enemy.frozen = true;
                    enemy.velocity.set(0, 0, 0);
                    
                    // Blue tint
                    if (enemy.mesh) {
                        enemy.mesh.traverse(child => {
                            if (child.isMesh && child.material) {
                                child.material.emissive = new THREE.Color(0x0000ff);
                                child.material.emissiveIntensity = 0.3;
                            }
                        });
                    }
                }
            });
        }
        
        // Time distortion effect
        this.createTimeDistortionEffect();
    }
    
    deactivateTimeStop() {
        // Unfreeze enemies
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy) {
                    enemy.frozen = false;
                    
                    // Remove blue tint
                    if (enemy.mesh) {
                        enemy.mesh.traverse(child => {
                            if (child.isMesh && child.material) {
                                child.material.emissiveIntensity = 0;
                            }
                        });
                    }
                }
            });
        }
    }
    
    createTimeDistortionEffect() {
        // Clock tick particles
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.1, 0.02),
                new THREE.MeshBasicMaterial({
                    color: 0x0000ff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            const angle = (i / 50) * Math.PI * 2;
            const radius = Math.random() * 20;
            particle.position.set(
                this.player.position.x + Math.cos(angle) * radius,
                this.player.position.y + Math.random() * 5,
                this.player.position.z + Math.sin(angle) * radius
            );
            
            particle.rotation.z = angle;
            
            this.scene.add(particle);
            
            // Animate
            const animateParticle = () => {
                particle.rotation.z += 0.1;
                particle.material.opacity *= 0.98;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    update(deltaTime) {
        // Check for powerup collection
        if (this.player && this.player.position) {
            this.checkPowerupPickup(this.player.position);
        }
        
        // Update effect positions
        if (this.effectMeshes.quadLight && this.player.position) {
            this.effectMeshes.quadLight.position.copy(this.player.position);
        }
        
        // Check for spawning new powerups
        const now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            // Would spawn at random locations in real implementation
            this.lastSpawnTime = now;
        }
    }
}