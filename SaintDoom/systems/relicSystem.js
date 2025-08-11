// Relic Collection System
// Sacred artifacts that modify abilities and unlock new powers

export class RelicSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Collected relics
        this.collectedRelics = [];
        this.maxRelics = 10;
        
        // Relic definitions
        this.relics = {
            crownOfThorns: {
                id: 'crownOfThorns',
                name: 'Crown of Thorns',
                description: 'Take 10% more damage, deal 25% more damage',
                rarity: 'legendary',
                effects: {
                    damageTakenMultiplier: 1.1,
                    damageDealtMultiplier: 1.25
                },
                onPickup: () => this.activateCrownOfThorns(),
                onRemove: () => this.deactivateCrownOfThorns(),
                mesh: null
            },
            
            stigmataNails: {
                id: 'stigmataNails',
                name: 'Stigmata Nails',
                description: 'Slowly bleed health but regenerate ammo',
                rarity: 'epic',
                effects: {
                    healthDrainPerSecond: 1,
                    ammoRegenPerSecond: 2
                },
                onPickup: () => this.activateStigmataNails(),
                onRemove: () => this.deactivateStigmataNails(),
                mesh: null
            },
            
            communionWafer: {
                id: 'communionWafer',
                name: 'Communion Wafer',
                description: 'Killing blessed enemies heals you',
                rarity: 'rare',
                effects: {
                    healOnBlessedKill: 15
                },
                onPickup: () => this.activateCommunionWafer(),
                onRemove: () => this.deactivateCommunionWafer(),
                mesh: null
            },
            
            incorruptibleHeart: {
                id: 'incorruptibleHeart',
                name: 'Incorruptible Heart',
                description: 'Immunity to poison and radiation for 30 seconds when activated',
                rarity: 'epic',
                cooldown: 60000,
                lastUsed: 0,
                effects: {
                    poisonImmunity: true,
                    radiationImmunity: true,
                    duration: 30000
                },
                onPickup: () => this.activateIncorruptibleHeart(),
                onRemove: () => this.deactivateIncorruptibleHeart(),
                mesh: null
            },
            
            papalSeal: {
                id: 'papalSeal',
                name: 'Papal Seal',
                description: 'Unlock secret Inquisition weapon caches',
                rarity: 'legendary',
                effects: {
                    secretAccess: true,
                    weaponDamageBonus: 1.1
                },
                onPickup: () => this.activatePapalSeal(),
                onRemove: () => this.deactivatePapalSeal(),
                mesh: null
            },
            
            saintPetersKeys: {
                id: 'saintPetersKeys',
                name: "Saint Peter's Keys",
                description: 'Open any door without keycards',
                rarity: 'epic',
                effects: {
                    universalAccess: true
                },
                onPickup: () => this.activateSaintPetersKeys(),
                onRemove: () => this.deactivateSaintPetersKeys(),
                mesh: null
            },
            
            holyGrailFragment: {
                id: 'holyGrailFragment',
                name: 'Holy Grail Fragment',
                description: 'Double healing from all sources',
                rarity: 'legendary',
                effects: {
                    healingMultiplier: 2.0
                },
                onPickup: () => this.activateHolyGrail(),
                onRemove: () => this.deactivateHolyGrail(),
                mesh: null
            },
            
            shroudOfTurin: {
                id: 'shroudOfTurin',
                name: 'Shroud of Turin',
                description: 'Become invisible when standing still',
                rarity: 'epic',
                effects: {
                    invisibilityWhenStill: true,
                    invisibilityDelay: 2000
                },
                onPickup: () => this.activateShroud(),
                onRemove: () => this.deactivateShroud(),
                mesh: null
            },
            
            spearOfDestiny: {
                id: 'spearOfDestiny',
                name: 'Spear of Destiny',
                description: 'All melee attacks pierce through enemies',
                rarity: 'legendary',
                effects: {
                    meleePiercing: true,
                    meleeDamageMultiplier: 1.5
                },
                onPickup: () => this.activateSpearOfDestiny(),
                onRemove: () => this.deactivateSpearOfDestiny(),
                mesh: null
            },
            
            judas30Silver: {
                id: 'judas30Silver',
                name: "Judas' 30 Silver",
                description: 'Enemies drop more resources but deal critical hits',
                rarity: 'cursed',
                effects: {
                    resourceDropMultiplier: 3.0,
                    enemyCritChance: 0.2
                },
                onPickup: () => this.activateJudasSilver(),
                onRemove: () => this.deactivateJudasSilver(),
                mesh: null
            }
        };
        
        // Active effects timers
        this.activeEffects = {};
        
        // Synergy bonuses
        this.synergies = {
            martyrSet: {
                relics: ['crownOfThorns', 'stigmataNails'],
                bonus: () => this.activateMartyrSynergy()
            },
            divineAuthority: {
                relics: ['papalSeal', 'saintPetersKeys'],
                bonus: () => this.activateDivineAuthority()
            },
            holyTrinity: {
                relics: ['holyGrailFragment', 'shroudOfTurin', 'spearOfDestiny'],
                bonus: () => this.activateHolyTrinity()
            }
        };
    }
    
    spawnRelic(position, relicId = null) {
        // Choose random relic if not specified
        if (!relicId) {
            const relicKeys = Object.keys(this.relics);
            relicId = relicKeys[Math.floor(Math.random() * relicKeys.length)];
        }
        
        const relic = this.relics[relicId];
        if (!relic) return;
        
        // Create relic mesh
        const relicMesh = this.createRelicMesh(relic);
        relicMesh.position.copy(position);
        relicMesh.userData = {
            isRelic: true,
            relicId: relicId,
            collected: false
        };
        
        this.scene.add(relicMesh);
        relic.mesh = relicMesh;
        
        // Add floating animation
        this.animateRelic(relicMesh);
    }
    
    createRelicMesh(relic) {
        const group = new THREE.Group();
        
        // Base pedestal
        const pedestalGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
        const pedestalMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.5,
            roughness: 0.5
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        group.add(pedestal);
        
        // Relic item (varies by type)
        let itemMesh;
        const rarityColors = {
            common: 0x888888,
            rare: 0x0088ff,
            epic: 0x8800ff,
            legendary: 0xffaa00,
            cursed: 0xff0000
        };
        
        const glowColor = rarityColors[relic.rarity] || 0xffffff;
        
        switch(relic.id) {
            case 'crownOfThorns':
                itemMesh = this.createCrownMesh();
                break;
            case 'stigmataNails':
                itemMesh = this.createNailsMesh();
                break;
            case 'communionWafer':
                itemMesh = this.createWaferMesh();
                break;
            case 'papalSeal':
                itemMesh = this.createSealMesh();
                break;
            case 'saintPetersKeys':
                itemMesh = this.createKeysMesh();
                break;
            case 'holyGrailFragment':
                itemMesh = this.createGrailMesh();
                break;
            case 'spearOfDestiny':
                itemMesh = this.createSpearTipMesh();
                break;
            default:
                // Generic relic
                const relicGeometry = new THREE.OctahedronGeometry(0.2, 0);
                const relicMaterial = new THREE.MeshPhongMaterial({
                    color: glowColor,
                    emissive: glowColor,
                    emissiveIntensity: 0.3
                });
                itemMesh = new THREE.Mesh(relicGeometry, relicMaterial);
        }
        
        itemMesh.position.y = 0.5;
        group.add(itemMesh);
        
        // Glow effect
        const glowLight = new THREE.PointLight(glowColor, 0.5, 3);
        glowLight.position.y = 0.5;
        group.add(glowLight);
        
        // Particle aura
        this.createRelicAura(group, glowColor);
        
        return group;
    }
    
    createCrownMesh() {
        const group = new THREE.Group();
        
        // Crown ring
        const crownGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
        const crownMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.rotation.x = Math.PI / 2;
        group.add(crown);
        
        // Thorns
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const thornGeometry = new THREE.ConeGeometry(0.02, 0.1, 4);
            const thorn = new THREE.Mesh(thornGeometry, crownMaterial);
            thorn.position.x = Math.cos(angle) * 0.15;
            thorn.position.z = Math.sin(angle) * 0.15;
            thorn.rotation.z = angle + Math.PI / 2;
            group.add(thorn);
        }
        
        return group;
    }
    
    createNailsMesh() {
        const group = new THREE.Group();
        
        // Three nails
        for (let i = 0; i < 3; i++) {
            const nailGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.3, 6);
            const nailMaterial = new THREE.MeshPhongMaterial({
                color: 0x444444,
                metalness: 0.8,
                roughness: 0.3
            });
            const nail = new THREE.Mesh(nailGeometry, nailMaterial);
            nail.position.x = (i - 1) * 0.05;
            nail.rotation.z = (i - 1) * 0.2;
            group.add(nail);
        }
        
        return group;
    }
    
    createWaferMesh() {
        const waferGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);
        const waferMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.2
        });
        const wafer = new THREE.Mesh(waferGeometry, waferMaterial);
        
        // Add cross pattern
        const crossGeometry = new THREE.BoxGeometry(0.02, 0.025, 0.1);
        const cross1 = new THREE.Mesh(crossGeometry, waferMaterial);
        cross1.position.y = 0.015;
        wafer.add(cross1);
        
        const cross2 = new THREE.Mesh(crossGeometry, waferMaterial);
        cross2.position.y = 0.015;
        cross2.rotation.y = Math.PI / 2;
        wafer.add(cross2);
        
        return wafer;
    }
    
    createSealMesh() {
        const sealGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
        const sealMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            metalness: 0.7,
            roughness: 0.3
        });
        const seal = new THREE.Mesh(sealGeometry, sealMaterial);
        
        // Vatican emblem (simplified)
        const emblemGeometry = new THREE.RingGeometry(0.05, 0.1, 6);
        const emblemMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem.position.y = 0.026;
        emblem.rotation.x = -Math.PI / 2;
        seal.add(emblem);
        
        return seal;
    }
    
    createKeysMesh() {
        const group = new THREE.Group();
        
        // Two crossed keys
        for (let i = 0; i < 2; i++) {
            const keyGroup = new THREE.Group();
            
            // Key shaft
            const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6);
            const keyMaterial = new THREE.MeshPhongMaterial({
                color: i === 0 ? 0xffdd00 : 0xcccccc,
                metalness: 0.8,
                roughness: 0.2
            });
            const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
            keyGroup.add(shaft);
            
            // Key head
            const headGeometry = new THREE.TorusGeometry(0.05, 0.02, 4, 8);
            const head = new THREE.Mesh(headGeometry, keyMaterial);
            head.position.y = 0.15;
            keyGroup.add(head);
            
            // Key teeth
            const teethGeometry = new THREE.BoxGeometry(0.04, 0.03, 0.01);
            const teeth = new THREE.Mesh(teethGeometry, keyMaterial);
            teeth.position.y = -0.1;
            keyGroup.add(teeth);
            
            keyGroup.rotation.z = (i === 0 ? -1 : 1) * Math.PI / 6;
            group.add(keyGroup);
        }
        
        return group;
    }
    
    createGrailMesh() {
        const group = new THREE.Group();
        
        // Cup shape
        const cupGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.2, 8);
        const cupMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        group.add(cup);
        
        // Handle
        const handleGeometry = new THREE.TorusGeometry(0.08, 0.01, 4, 8, Math.PI);
        const handle = new THREE.Mesh(handleGeometry, cupMaterial);
        handle.position.x = 0.1;
        handle.rotation.z = -Math.PI / 2;
        group.add(handle);
        
        return group;
    }
    
    createSpearTipMesh() {
        const tipGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xff0000,
            emissiveIntensity: 0.1
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        
        // Blood stains
        const bloodGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const bloodMaterial = new THREE.MeshBasicMaterial({
            color: 0x440000
        });
        
        for (let i = 0; i < 3; i++) {
            const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
            blood.position.y = -0.1 + i * 0.05;
            blood.position.x = Math.random() * 0.02;
            tip.add(blood);
        }
        
        return tip;
    }
    
    createRelicAura(parent, color) {
        // Floating particles around relic
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.3;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.y = 0.5;
            particle.position.z = Math.sin(angle) * radius;
            particle.userData = { angle: angle, baseY: 0.5 };
            
            parent.add(particle);
            particles.push(particle);
        }
        
        parent.userData.auraParticles = particles;
    }
    
    animateRelic(relicMesh) {
        const animate = () => {
            if (!relicMesh.parent) return;
            
            // Float up and down
            relicMesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
            
            // Rotate
            relicMesh.rotation.y += 0.02;
            
            // Animate aura particles
            if (relicMesh.userData.auraParticles) {
                relicMesh.userData.auraParticles.forEach((particle, i) => {
                    const time = Date.now() * 0.001;
                    particle.userData.angle += 0.02;
                    particle.position.x = Math.cos(particle.userData.angle) * 0.3;
                    particle.position.z = Math.sin(particle.userData.angle) * 0.3;
                    particle.position.y = particle.userData.baseY + Math.sin(time + i) * 0.1;
                });
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    checkRelicPickup(playerPosition) {
        Object.values(this.relics).forEach(relic => {
            if (relic.mesh && !relic.mesh.userData.collected) {
                const distance = playerPosition.distanceTo(relic.mesh.position);
                
                if (distance < 2) {
                    this.collectRelic(relic);
                }
            }
        });
    }
    
    collectRelic(relic) {
        if (this.collectedRelics.length >= this.maxRelics) {
            // Show message that inventory is full
            if (this.player.game && this.player.game.narrativeSystem) {
                this.player.game.narrativeSystem.displaySubtitle("Relic inventory full!");
            }
            return;
        }
        
        // Add to collected
        this.collectedRelics.push(relic.id);
        
        // Apply effects
        if (relic.onPickup) {
            relic.onPickup();
        }
        
        // Remove mesh
        if (relic.mesh) {
            relic.mesh.userData.collected = true;
            this.createCollectionEffect(relic.mesh.position);
            this.scene.remove(relic.mesh);
            relic.mesh = null;
        }
        
        // Check synergies
        this.checkSynergies();
        
        // Show notification
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `Collected: ${relic.name} - ${relic.description}`
            );
        }
    }
    
    createCollectionEffect(position) {
        // Holy light burst
        const burstGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(position);
        this.scene.add(burst);
        
        // Animate burst
        const animateBurst = () => {
            burst.scale.multiplyScalar(1.1);
            burst.material.opacity *= 0.92;
            
            if (burst.material.opacity > 0.01) {
                requestAnimationFrame(animateBurst);
            } else {
                this.scene.remove(burst);
            }
        };
        animateBurst();
        
        // Rising particles
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffaa,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            this.scene.add(particle);
            
            // Animate upward
            const animateParticle = () => {
                particle.position.y += 0.03;
                particle.material.opacity *= 0.97;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    checkSynergies() {
        Object.values(this.synergies).forEach(synergy => {
            const hasAll = synergy.relics.every(relicId => 
                this.collectedRelics.includes(relicId)
            );
            
            if (hasAll && synergy.bonus) {
                synergy.bonus();
            }
        });
    }
    
    // Relic activation methods
    activateCrownOfThorns() {
        if (this.player) {
            this.player.damageTakenMultiplier = 1.1;
            this.player.damageDealtMultiplier = 1.25;
        }
    }
    
    deactivateCrownOfThorns() {
        if (this.player) {
            this.player.damageTakenMultiplier = 1;
            this.player.damageDealtMultiplier = 1;
        }
    }
    
    activateStigmataNails() {
        // Start health drain and ammo regen
        this.activeEffects.stigmata = setInterval(() => {
            if (this.player) {
                this.player.health = Math.max(1, this.player.health - 1);
                
                // Regen ammo for current weapon
                if (this.player.currentWeapon && this.player.currentWeapon.addAmmo) {
                    this.player.currentWeapon.addAmmo(2);
                }
            }
        }, 1000);
    }
    
    deactivateStigmataNails() {
        if (this.activeEffects.stigmata) {
            clearInterval(this.activeEffects.stigmata);
            delete this.activeEffects.stigmata;
        }
    }
    
    activateCommunionWafer() {
        this.player.healOnBlessedKill = true;
    }
    
    deactivateCommunionWafer() {
        this.player.healOnBlessedKill = false;
    }
    
    activateIncorruptibleHeart() {
        // Can be activated on demand
        this.player.hasIncorruptibleHeart = true;
    }
    
    deactivateIncorruptibleHeart() {
        this.player.hasIncorruptibleHeart = false;
    }
    
    activatePapalSeal() {
        this.player.hasSecretAccess = true;
        this.player.weaponDamageBonus = 1.1;
    }
    
    deactivatePapalSeal() {
        this.player.hasSecretAccess = false;
        this.player.weaponDamageBonus = 1;
    }
    
    activateSaintPetersKeys() {
        this.player.hasUniversalAccess = true;
    }
    
    deactivateSaintPetersKeys() {
        this.player.hasUniversalAccess = false;
    }
    
    activateHolyGrail() {
        this.player.healingMultiplier = 2;
    }
    
    deactivateHolyGrail() {
        this.player.healingMultiplier = 1;
    }
    
    activateShroud() {
        this.player.canGoInvisible = true;
    }
    
    deactivateShroud() {
        this.player.canGoInvisible = false;
    }
    
    activateSpearOfDestiny() {
        this.player.meleePiercing = true;
        this.player.meleeDamageMultiplier = 1.5;
    }
    
    deactivateSpearOfDestiny() {
        this.player.meleePiercing = false;
        this.player.meleeDamageMultiplier = 1;
    }
    
    activateJudasSilver() {
        this.player.resourceDropMultiplier = 3;
        // Enemies get crit chance - handled in enemy classes
    }
    
    deactivateJudasSilver() {
        this.player.resourceDropMultiplier = 1;
    }
    
    // Synergy bonuses
    activateMartyrSynergy() {
        // Martyr Set: Crown + Nails = Damage increases as health decreases
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                "SYNERGY: Martyr Set - Damage scales with missing health!"
            );
        }
        this.player.martyrSynergyActive = true;
    }
    
    activateDivineAuthority() {
        // Divine Authority: Papal Seal + Keys = All doors auto-open, enemies flee
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                "SYNERGY: Divine Authority - Enemies fear your presence!"
            );
        }
        this.player.divineAuthorityActive = true;
    }
    
    activateHolyTrinity() {
        // Holy Trinity: Grail + Shroud + Spear = Become angelic warrior
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                "SYNERGY: Holy Trinity - Ascended to angelic form!"
            );
        }
        this.player.holyTrinityActive = true;
        
        // Create angel wings visual
        this.createAngelWings();
    }
    
    createAngelWings() {
        // Add glowing wings to player
        // This would attach to player model
    }
    
    update(deltaTime) {
        // Check for nearby relics
        if (this.player && this.player.position) {
            this.checkRelicPickup(this.player.position);
        }
    }
}