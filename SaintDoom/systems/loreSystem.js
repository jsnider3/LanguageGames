// Lore Collectibles System
// Scattered documents, audio logs, and artifacts that reveal the story

export class LoreSystem {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.collectibles = [];
        this.collectedLore = new Set();
        this.totalLoreCount = 0;
        
        // Lore entries database
        this.loreDatabase = {
            // Chapter 1 - Chapel
            chapel_1: {
                title: "MIB Report #001",
                text: "Subject: Vatican Liaison Protocol\nThe Pope's envoy arrived today. He warned us about 'playing with forces beyond our comprehension.' The General laughed. If only he knew what we've already accomplished with the Grey technology.",
                type: "document",
                chapter: 1
            },
            chapel_2: {
                title: "Scientist's Journal",
                text: "Day 47: The portal is stable. We've made contact with... something. It claims to be an angel, but Father Martinez crossed himself and ran from the room. He keeps muttering about 'the Defiler.'",
                type: "document",
                chapter: 1
            },
            chapel_3: {
                title: "Audio Log - Dr. Sarah Chen",
                text: "[STATIC] They're inside the base. The things from the portal. Security is down. I can hear them in the walls. They're singing... Latin? No, older. Much older. [SCREAMING] [END]",
                type: "audio",
                chapter: 1
            },
            chapel_4: {
                title: "Giovanni's Previous Death",
                text: "Carved in stone: 'Here fell Giovanni, 1943. The Nazis thought they could control it. I died closing their portal. The Americans learned nothing from history.'",
                type: "carving",
                chapter: 1
            },
            
            // Chapter 2 - Armory
            armory_1: {
                title: "Weapons Manifest",
                text: "Special Requisition Order:\n- Holy Water Grenades (Batch 7-A)\n- Blessed Ammunition (.50 cal)\n- Cruciform Bayonets\n- One (1) Spear of Longinus replica\nNote: Vatican approved. Do not question.",
                type: "document",
                chapter: 2
            },
            armory_2: {
                title: "Guard's Last Stand",
                text: "Blood-stained note: 'They got through. Sealed myself in. Can hear Henderson screaming about his eyes. The possessed ones keep praying while they kill. God help us all.'",
                type: "document",
                chapter: 2
            },
            armory_3: {
                title: "Grey Artifact Analysis",
                text: "Lab Report: The artifact responds to human faith. Literally. Prayer amplifies its energy output by 340%. The atheists on the team can't even touch it without protective gear. What have we found?",
                type: "document",
                chapter: 2
            },
            
            // Tutorial - Vatican Archives
            tutorial_1: {
                title: "The Seven Deaths Prophecy",
                text: "Medieval manuscript excerpt: 'And the Saint shall die seven times for the sins of man. On the seventh resurrection, he shall become Martyrdom incarnate, and Hell itself shall tremble.'",
                type: "manuscript",
                chapter: 0
            },
            tutorial_2: {
                title: "Cardinal's Secret Orders",
                text: "For Inquisitor Eyes Only: Giovanni must never know about his seventh death. Let him believe each resurrection could be his last. Hope keeps him human. Martyrdom would make him... something else.",
                type: "document",
                chapter: 0
            },
            
            // Hidden Lore
            secret_1: {
                title: "The Truth About Area 51",
                text: "Roswell was a cover story. The real crash was something returning to Earth - a Nephilim escape pod from the Flood. We've been reverse-engineering divine technology. God help us.",
                type: "classified",
                chapter: -1
            },
            secret_2: {
                title: "Belial's Whisper",
                text: "Etched in sulfur: 'Giovanni... my favorite toy. Six times you've sent me back. This time, I prepared a special gift. Ask yourself - why does the Vatican fear your seventh death?'",
                type: "demonic",
                chapter: -1
            }
        };
    }
    
    createCollectible(x, y, z, loreId) {
        const loreEntry = this.loreDatabase[loreId];
        if (!loreEntry) return;
        
        // Create visual representation based on type
        let geometry, material, glowColor;
        
        switch(loreEntry.type) {
            case 'document':
                geometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
                material = new THREE.MeshStandardMaterial({
                    color: 0xf4e4bc,
                    emissive: 0xffff00,
                    emissiveIntensity: 0.1
                });
                glowColor = 0xffff00;
                break;
                
            case 'audio':
                geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
                material = new THREE.MeshStandardMaterial({
                    color: 0x404040,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: 0x00ffff,
                    emissiveIntensity: 0.2
                });
                glowColor = 0x00ffff;
                break;
                
            case 'carving':
            case 'manuscript':
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
                material = new THREE.MeshStandardMaterial({
                    color: 0x8b7355,
                    roughness: 0.9,
                    emissive: 0xffd700,
                    emissiveIntensity: 0.15
                });
                glowColor = 0xffd700;
                break;
                
            case 'classified':
                geometry = new THREE.BoxGeometry(0.35, 0.45, 0.08);
                material = new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.2
                });
                glowColor = 0xff0000;
                break;
                
            case 'demonic':
                geometry = new THREE.TetrahedronGeometry(0.3, 0);
                material = new THREE.MeshStandardMaterial({
                    color: 0x440000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.3
                });
                glowColor = 0xff0000;
                break;
                
            default:
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
                glowColor = 0xffffff;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.userData = {
            isLoreCollectible: true,
            loreId: loreId,
            collected: false,
            glowColor: glowColor
        };
        
        // Add floating animation
        const baseY = y;
        const animate = () => {
            if (!mesh.userData.collected) {
                mesh.position.y = baseY + Math.sin(Date.now() * 0.001) * 0.1;
                mesh.rotation.y += 0.01;
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        // Add glow effect
        const glowLight = new THREE.PointLight(glowColor, 0.5, 3);
        glowLight.position.copy(mesh.position);
        mesh.userData.glowLight = glowLight;
        
        this.scene.add(mesh);
        this.scene.add(glowLight);
        this.collectibles.push(mesh);
        this.totalLoreCount++;
        
        return mesh;
    }
    
    checkCollection(playerPosition) {
        this.collectibles.forEach(collectible => {
            if (collectible.userData.collected) return;
            
            const distance = playerPosition.distanceTo(collectible.position);
            if (distance < 2) {
                this.collectLore(collectible);
            }
        });
    }
    
    collectLore(collectible) {
        const loreId = collectible.userData.loreId;
        const loreEntry = this.loreDatabase[loreId];
        
        if (!loreEntry || collectible.userData.collected) return;
        
        collectible.userData.collected = true;
        this.collectedLore.add(loreId);
        
        // Visual feedback
        this.playCollectionEffect(collectible);
        
        // Display lore
        this.displayLoreEntry(loreEntry);
        
        // Update game stats
        if (this.game) {
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.playVoiceLine('findLore');
            }
            if (this.game.audioSystem) {
                this.game.audioSystem.playSoundEffect('pickup');
            }
            
            // Add score
            this.game.addScore(250);
            this.game.showMessage("Lore Discovered! +250");
            
            // Save collection progress
            this.saveProgress();
        }
        
        // Remove from scene after animation
        setTimeout(() => {
            this.scene.remove(collectible);
            if (collectible.userData.glowLight) {
                this.scene.remove(collectible.userData.glowLight);
            }
        }, 1000);
    }
    
    playCollectionEffect(collectible) {
        // Expand and fade animation
        const startScale = collectible.scale.x;
        let scale = startScale;
        let opacity = 1;
        
        const animate = () => {
            scale += 0.05;
            opacity -= 0.03;
            
            collectible.scale.set(scale, scale, scale);
            if (collectible.material.opacity !== undefined) {
                collectible.material.transparent = true;
                collectible.material.opacity = opacity;
            }
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        // Create particle effect
        this.createCollectionParticles(collectible.position, collectible.userData.glowColor);
    }
    
    createCollectionParticles(position, color) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            particle.position.copy(position);
            
            // Random direction
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3 + 0.1,
                (Math.random() - 0.5) * 0.2
            );
            
            this.scene.add(particle);
            
            // Animate particle
            const animateParticle = () => {
                particle.position.add(velocity);
                velocity.y -= 0.01; // Gravity
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
    
    displayLoreEntry(loreEntry) {
        // Create lore display UI
        const loreDisplay = document.createElement('div');
        loreDisplay.id = 'loreDisplay';
        loreDisplay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid gold;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            color: white;
            font-family: 'Garamond', serif;
            animation: fadeIn 0.5s;
        `;
        
        let icon = '';
        switch(loreEntry.type) {
            case 'document': icon = '📄'; break;
            case 'audio': icon = '🔊'; break;
            case 'manuscript': icon = '📜'; break;
            case 'carving': icon = '🗿'; break;
            case 'classified': icon = '🔒'; break;
            case 'demonic': icon = '👹'; break;
            default: icon = '📋';
        }
        
        loreDisplay.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid gold; padding-bottom: 10px;">
                <span style="font-size: 30px; margin-right: 15px;">${icon}</span>
                <h2 style="color: gold; margin: 0; font-size: 24px;">${loreEntry.title}</h2>
            </div>
            <div style="white-space: pre-wrap; line-height: 1.6; font-size: 16px;">
                ${loreEntry.text}
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button id="closeLore" style="
                    padding: 10px 20px;
                    background: #800000;
                    color: white;
                    border: 1px solid gold;
                    cursor: pointer;
                    font-family: 'Garamond', serif;
                    font-size: 16px;
                ">Continue (ESC)</button>
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 12px; text-align: center;">
                Collected: ${this.collectedLore.size} / ${this.totalLoreCount}
            </div>
        `;
        
        document.body.appendChild(loreDisplay);
        
        // Pause game
        if (this.game) {
            this.game.isPaused = true;
        }
        
        // Close handlers
        const closeLore = () => {
            loreDisplay.remove();
            if (this.game) {
                this.game.isPaused = false;
            }
            document.removeEventListener('keydown', handleEsc);
        };
        
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeLore();
            }
        };
        
        document.getElementById('closeLore').addEventListener('click', closeLore);
        document.addEventListener('keydown', handleEsc);
    }
    
    placeChapelLore() {
        // Place lore collectibles in chapel level
        this.createCollectible(-3, 1, 5, 'chapel_1');    // Near entrance
        this.createCollectible(4, 1, -15, 'chapel_2');   // By pillar
        this.createCollectible(-4, 1, -25, 'chapel_3');  // Near chapel entrance
        this.createCollectible(0, 1, -45, 'chapel_4');   // Near altar
        this.createCollectible(3, 1, 0, 'secret_1');     // Hidden in corner
    }
    
    placeArmoryLore() {
        // Place lore collectibles in armory level
        this.createCollectible(0, 1, -5, 'armory_1');    // Entry corridor
        this.createCollectible(-12, 1, -20, 'armory_2'); // By weapon rack
        this.createCollectible(12, 1, -25, 'armory_3');  // Other side
        this.createCollectible(0, 1, -35, 'secret_2');   // Near exit
    }
    
    placeTutorialLore() {
        // Place lore collectibles in tutorial level
        this.createCollectible(-5, 1, -5, 'tutorial_1');
        this.createCollectible(5, 1, -5, 'tutorial_2');
    }
    
    saveProgress() {
        // Save collected lore to localStorage
        const saveData = {
            collected: Array.from(this.collectedLore),
            totalFound: this.collectedLore.size,
            totalCount: this.totalLoreCount
        };
        localStorage.setItem('saintdoom_lore', JSON.stringify(saveData));
    }
    
    loadProgress() {
        // Load collected lore from localStorage
        const saveData = localStorage.getItem('saintdoom_lore');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.collectedLore = new Set(data.collected);
            
            // Hide already collected items
            this.collectibles.forEach(collectible => {
                if (this.collectedLore.has(collectible.userData.loreId)) {
                    collectible.userData.collected = true;
                    this.scene.remove(collectible);
                    if (collectible.userData.glowLight) {
                        this.scene.remove(collectible.userData.glowLight);
                    }
                }
            });
        }
    }
    
    getLoreStats() {
        return {
            collected: this.collectedLore.size,
            total: this.totalLoreCount,
            percentage: Math.floor((this.collectedLore.size / this.totalLoreCount) * 100)
        };
    }
}

// Add fadeIn animation if not already defined
if (!document.getElementById('loreAnimationStyles')) {
    const style = document.createElement('style');
    style.id = 'loreAnimationStyles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}