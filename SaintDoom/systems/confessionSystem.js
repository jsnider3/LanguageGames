// Confession Mechanic System
// Extract intel from dying enemies to reveal secrets and lore

export class ConfessionSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Confession state
        this.activeConfession = null;
        this.confessionRange = 3;
        this.confessionDuration = 5000; // milliseconds
        this.confessionStartTime = 0;
        
        // Intel collected
        this.collectedIntel = [];
        this.secretsRevealed = 0;
        
        // Confession categories
        this.confessionTypes = {
            location: {
                prompts: [
                    "Where is your master?",
                    "What lies ahead?",
                    "Where are the weapons?"
                ],
                responses: {
                    demon: [
                        "The... the portal... in the depths...",
                        "Belial awaits... in the final chamber...",
                        "The armory... sealed with blood..."
                    ],
                    possessed: [
                        "Laboratory... level 3... experiments...",
                        "They're making more... so many more...",
                        "The reactor... it feeds them..."
                    ],
                    corrupted: [
                        "Command center... override codes...",
                        "Emergency bunker... west wing...",
                        "Weapons cache... behind the altar..."
                    ]
                }
            },
            
            weakness: {
                prompts: [
                    "What are they planning?",
                    "What is their weakness?",
                    "How can I stop them?"
                ],
                responses: {
                    demon: [
                        "Holy water... burns us... storage room B2...",
                        "The blessed weapons... they fear them...",
                        "Silver... consecrated silver..."
                    ],
                    possessed: [
                        "The neural inhibitor... disrupts control...",
                        "EMP... frees us momentarily...",
                        "The possession weakens at dawn..."
                    ],
                    corrupted: [
                        "The virus... it's airborne now...",
                        "Override protocol 7... shuts it down...",
                        "The hivemind... destroy the core..."
                    ]
                }
            },
            
            lore: {
                prompts: [
                    "Why are you here?",
                    "Who sent you?",
                    "What happened here?"
                ],
                responses: {
                    demon: [
                        "The seals... they were broken...",
                        "Your kind... invited us in...",
                        "The experiments... opened the way..."
                    ],
                    possessed: [
                        "They came... in the night... took us...",
                        "The voices... never stop... help me...",
                        "We were... researchers... once..."
                    ],
                    corrupted: [
                        "Project Pandora... we succeeded...",
                        "The merger... human and alien...",
                        "Evolution... or damnation..."
                    ]
                }
            },
            
            redemption: {
                prompts: [
                    "Do you seek forgiveness?",
                    "Can you be saved?",
                    "Confess your sins"
                ],
                responses: {
                    demon: [
                        "Never... we are legion...",
                        "Your God... has abandoned this place...",
                        "We are eternal... you are dust..."
                    ],
                    possessed: [
                        "Please... free me... end this...",
                        "I didn't... mean to... forgive me...",
                        "Save... my soul... please..."
                    ],
                    corrupted: [
                        "Too late... for redemption...",
                        "We chose... this path...",
                        "Knowledge... was worth the price..."
                    ]
                }
            }
        };
        
        // Visual elements
        this.confessionUI = null;
        this.holySymbols = [];
        
        // Create confession interface
        this.createConfessionUI();
    }
    
    createConfessionUI() {
        // This would create HTML overlay in real implementation
        // For now, we'll use the narrative system
    }
    
    checkForDyingEnemies() {
        if (this.activeConfession) return null;
        
        if (!this.player.game || !this.player.game.enemies) return null;
        
        let closestDying = null;
        let closestDistance = this.confessionRange;
        
        this.player.game.enemies.forEach(enemy => {
            if (enemy && !enemy.isDead && enemy.health <= enemy.maxHealth * 0.2) {
                const distance = enemy.position.distanceTo(this.player.position);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDying = enemy;
                }
            }
        });
        
        return closestDying;
    }
    
    startConfession(enemy) {
        if (this.activeConfession) return;
        
        this.activeConfession = {
            enemy: enemy,
            type: this.getEnemyType(enemy),
            questionIndex: 0,
            responses: [],
            completed: false
        };
        
        this.confessionStartTime = Date.now();
        
        // Put enemy in confession state
        enemy.state = 'confessing';
        enemy.velocity.set(0, 0, 0);
        
        // Create visual effect
        this.createConfessionEffect(enemy);
        
        // Show first prompt
        this.showPromptSelection();
        
        // Start extraction animation
        this.startExtractionAnimation(enemy);
    }
    
    getEnemyType(enemy) {
        // Determine enemy category for appropriate responses
        if (enemy.type) {
            if (enemy.type.includes('demon') || enemy.type.includes('imp') || 
                enemy.type.includes('hellhound') || enemy.type.includes('succubus')) {
                return 'demon';
            } else if (enemy.type.includes('possessed') || enemy.type.includes('scientist')) {
                return 'possessed';
            } else {
                return 'corrupted';
            }
        }
        return 'corrupted';
    }
    
    showPromptSelection() {
        // Get available prompts
        const categories = Object.keys(this.confessionTypes);
        const prompts = [];
        
        categories.forEach(cat => {
            const categoryPrompts = this.confessionTypes[cat].prompts;
            prompts.push({
                category: cat,
                text: categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)]
            });
        });
        
        // Display prompts (would be interactive UI in real implementation)
        if (this.player.game && this.player.game.narrativeSystem) {
            const promptText = prompts.map((p, i) => `${i+1}. ${p.text}`).join('\n');
            this.player.game.narrativeSystem.displaySubtitle(
                `CONFESSION:\n${promptText}\n[Press 1-4 to choose]`
            );
        }
        
        // Store prompts for selection
        this.activeConfession.availablePrompts = prompts;
    }
    
    selectPrompt(index) {
        if (!this.activeConfession || this.activeConfession.completed) return;
        
        const prompt = this.activeConfession.availablePrompts[index];
        if (!prompt) return;
        
        // Get response
        const responses = this.confessionTypes[prompt.category].responses[this.activeConfession.type];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Store intel
        this.activeConfession.responses.push({
            question: prompt.text,
            answer: response,
            category: prompt.category
        });
        
        // Display response
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `Enemy: "${response}"`
            );
        }
        
        // Process intel
        this.processIntel(prompt.category, response);
        
        // Check if confession complete
        this.activeConfession.questionIndex++;
        if (this.activeConfession.questionIndex >= 3 || 
            Date.now() - this.confessionStartTime > this.confessionDuration) {
            this.completeConfession();
        } else {
            // Show next prompts after delay
            setTimeout(() => this.showPromptSelection(), 2000);
        }
    }
    
    processIntel(category, response) {
        const intel = {
            category: category,
            content: response,
            timestamp: Date.now(),
            location: this.player.position.clone()
        };
        
        this.collectedIntel.push(intel);
        
        // Check for secret reveals
        if (category === 'location' && response.includes('cache')) {
            this.revealSecret('weapon_cache');
        } else if (category === 'location' && response.includes('portal')) {
            this.revealSecret('demon_portal');
        } else if (category === 'weakness' && response.includes('holy water')) {
            this.revealSecret('holy_water_location');
        } else if (category === 'weakness' && response.includes('override')) {
            this.revealSecret('override_codes');
        }
        
        // Grant XP or blessing
        if (this.player.addExperience) {
            this.player.addExperience(50);
        }
    }
    
    revealSecret(secretId) {
        this.secretsRevealed++;
        
        // Mark on map (if map system exists)
        if (this.player.game && this.player.game.mapSystem) {
            this.player.game.mapSystem.revealSecret(secretId);
        }
        
        // Notification
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `SECRET REVEALED: ${secretId.replace(/_/g, ' ').toUpperCase()}`
            );
        }
    }
    
    completeConfession() {
        if (!this.activeConfession) return;
        
        const enemy = this.activeConfession.enemy;
        
        // Determine outcome based on responses
        const hasRedemption = this.activeConfession.responses.some(r => 
            r.category === 'redemption' && r.answer.includes('forgive')
        );
        
        if (hasRedemption) {
            // Peaceful death
            this.grantAbsolution(enemy);
        } else {
            // Forced extraction complete
            this.executeJudgment(enemy);
        }
        
        // Clear confession
        this.activeConfession = null;
    }
    
    grantAbsolution(enemy) {
        // Create holy light effect
        const lightGeometry = new THREE.CylinderGeometry(0.5, 2, 5, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.6
        });
        
        const holyLight = new THREE.Mesh(lightGeometry, lightMaterial);
        holyLight.position.copy(enemy.position);
        holyLight.position.y += 2.5;
        this.scene.add(holyLight);
        
        // Soul ascension particles
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(enemy.position);
            particle.position.y += 1;
            
            const angle = (i / 30) * Math.PI * 2;
            const radius = 0.5;
            
            this.scene.add(particle);
            
            // Animate upward spiral
            const animateParticle = () => {
                particle.position.y += 0.05;
                particle.position.x = enemy.position.x + Math.cos(angle + particle.position.y) * radius;
                particle.position.z = enemy.position.z + Math.sin(angle + particle.position.y) * radius;
                particle.material.opacity *= 0.98;
                
                if (particle.material.opacity > 0.01 && particle.position.y < 10) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
        
        // Fade holy light
        const fadeLight = () => {
            holyLight.material.opacity *= 0.95;
            holyLight.scale.y *= 0.98;
            
            if (holyLight.material.opacity > 0.01) {
                requestAnimationFrame(fadeLight);
            } else {
                this.scene.remove(holyLight);
            }
        };
        fadeLight();
        
        // Grant blessing to player
        if (this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        }
        
        // Message
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("Soul redeemed. +25 Health restored.");
        }
        
        // Kill enemy peacefully
        enemy.health = 0;
        enemy.onDeath();
    }
    
    executeJudgment(enemy) {
        // Create judgment flame effect
        const flameGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.copy(enemy.position);
        flame.position.y += 1;
        this.scene.add(flame);
        
        // Burning particles
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xff3300,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(enemy.position);
            particle.position.y += Math.random() * 2;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            
            // Animate burning
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.05;
                particle.material.opacity *= 0.96;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
        
        // Fade flame
        const fadeFlame = () => {
            flame.scale.multiplyScalar(1.05);
            flame.material.opacity *= 0.92;
            
            if (flame.material.opacity > 0.01) {
                requestAnimationFrame(fadeFlame);
            } else {
                this.scene.remove(flame);
            }
        };
        fadeFlame();
        
        // Message
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("Judgment delivered. Intel extracted.");
        }
        
        // Kill enemy
        enemy.health = 0;
        enemy.onDeath();
    }
    
    createConfessionEffect(enemy) {
        // Create holy circle on ground
        const circleGeometry = new THREE.RingGeometry(1.5, 2, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.copy(enemy.position);
        circle.position.y = 0.1;
        circle.rotation.x = -Math.PI / 2;
        this.scene.add(circle);
        
        // Latin symbols floating
        const symbolCount = 8;
        for (let i = 0; i < symbolCount; i++) {
            const angle = (i / symbolCount) * Math.PI * 2;
            const symbol = this.createLatinSymbol();
            symbol.position.set(
                enemy.position.x + Math.cos(angle) * 1.5,
                enemy.position.y + 0.5,
                enemy.position.z + Math.sin(angle) * 1.5
            );
            
            this.scene.add(symbol);
            this.holySymbols.push(symbol);
            
            // Rotate around enemy
            const rotateSymbol = () => {
                if (this.activeConfession && this.activeConfession.enemy === enemy) {
                    const time = Date.now() * 0.001;
                    symbol.position.x = enemy.position.x + Math.cos(angle + time) * 1.5;
                    symbol.position.z = enemy.position.z + Math.sin(angle + time) * 1.5;
                    symbol.position.y = enemy.position.y + 0.5 + Math.sin(time * 2) * 0.2;
                    symbol.lookAt(enemy.position);
                    requestAnimationFrame(rotateSymbol);
                } else {
                    // Fade out when confession ends
                    symbol.material.opacity *= 0.9;
                    if (symbol.material.opacity > 0.01) {
                        requestAnimationFrame(rotateSymbol);
                    } else {
                        this.scene.remove(symbol);
                    }
                }
            };
            rotateSymbol();
        }
        
        // Store circle for cleanup
        this.activeConfession.circle = circle;
    }
    
    createLatinSymbol() {
        // Create a cross or other holy symbol
        const group = new THREE.Group();
        
        // Vertical bar
        const vBarGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.01);
        const symbolMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.7
        });
        const vBar = new THREE.Mesh(vBarGeometry, symbolMaterial);
        group.add(vBar);
        
        // Horizontal bar
        const hBarGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.01);
        const hBar = new THREE.Mesh(hBarGeometry, symbolMaterial);
        hBar.position.y = 0.05;
        group.add(hBar);
        
        return group;
    }
    
    startExtractionAnimation(enemy) {
        // Create energy tendrils from player to enemy
        const points = [];
        points.push(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)));
        points.push(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
        
        const extractGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const extractMaterial = new THREE.LineBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.5
        });
        
        const extractLine = new THREE.Line(extractGeometry, extractMaterial);
        this.scene.add(extractLine);
        
        // Pulse animation
        const pulseLine = () => {
            if (this.activeConfession && this.activeConfession.enemy === enemy) {
                extractMaterial.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.3;
                
                // Update line positions
                const positions = extractLine.geometry.attributes.position.array;
                positions[0] = this.player.position.x;
                positions[1] = this.player.position.y + 1;
                positions[2] = this.player.position.z;
                positions[3] = enemy.position.x;
                positions[4] = enemy.position.y + 1;
                positions[5] = enemy.position.z;
                extractLine.geometry.attributes.position.needsUpdate = true;
                
                requestAnimationFrame(pulseLine);
            } else {
                this.scene.remove(extractLine);
            }
        };
        pulseLine();
    }
    
    cancelConfession() {
        if (!this.activeConfession) return;
        
        // Clean up visual effects
        if (this.activeConfession.circle) {
            this.scene.remove(this.activeConfession.circle);
        }
        
        // Reset enemy state
        if (this.activeConfession.enemy) {
            this.activeConfession.enemy.state = 'hostile';
        }
        
        this.activeConfession = null;
        
        // Notification
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("Confession interrupted.");
        }
    }
    
    update(deltaTime) {
        // Check for confession timeout
        if (this.activeConfession && !this.activeConfession.completed) {
            if (Date.now() - this.confessionStartTime > this.confessionDuration) {
                this.completeConfession();
            }
            
            // Check if enemy died during confession
            if (this.activeConfession.enemy.isDead) {
                this.cancelConfession();
            }
            
            // Check if player moved too far
            const distance = this.activeConfession.enemy.position.distanceTo(this.player.position);
            if (distance > this.confessionRange * 1.5) {
                this.cancelConfession();
            }
        }
        
        // Check for new dying enemies
        if (!this.activeConfession) {
            const dyingEnemy = this.checkForDyingEnemies();
            if (dyingEnemy) {
                // Show prompt to start confession
                if (this.player.game && this.player.game.narrativeSystem) {
                    this.player.game.narrativeSystem.displaySubtitle(
                        "[E] Extract Confession"
                    );
                }
            }
        }
    }
    
    // Handle input
    onKeyPress(key) {
        if (this.activeConfession && !this.activeConfession.completed) {
            // Number keys for prompt selection
            if (key >= '1' && key <= '4') {
                const index = parseInt(key) - 1;
                this.selectPrompt(index);
            }
        } else if (key === 'e' || key === 'E') {
            // Start confession if enemy nearby
            const dyingEnemy = this.checkForDyingEnemies();
            if (dyingEnemy) {
                this.startConfession(dyingEnemy);
            }
        }
    }
}