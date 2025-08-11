// Tutorial Level - Vatican Inquisition Chamber
// Player learns controls while being evaluated by the Inquisition

export class TutorialLevel {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.walls = [];
        this.tutorialStep = 0;
        this.inquisitorSpoken = {};
        this.missileReady = false;
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials for Vatican chamber
        const marbleFloorMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0e8,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const stoneWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a8a7a,
            roughness: 0.9,
            metalness: 0.0
        });
        
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.4,
            metalness: 0.8,
            emissive: 0xffd700,
            emissiveIntensity: 0.1
        });
        
        // Create main chamber (20x30 room)
        this.createInquisitionChamber(marbleFloorMaterial, stoneWallMaterial, goldMaterial);
        
        // Create missile launch area at the end
        this.createMissileBay(15, stoneWallMaterial);
        
        // Add lighting
        this.addLighting();
        
        // Add decorative elements
        this.addVaticanDecorations(goldMaterial);
        
        // Start tutorial
        if (this.game.narrativeSystem) {
            this.startTutorial();
        }
        
        return this.walls;
    }
    
    createInquisitionChamber(floorMaterial, wallMaterial, goldMaterial) {
        // Main chamber floor
        const chamberFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 30),
            floorMaterial
        );
        chamberFloor.rotation.x = -Math.PI / 2;
        chamberFloor.position.set(0, 0, 0);
        chamberFloor.receiveShadow = true;
        this.scene.add(chamberFloor);
        
        // Chamber ceiling (higher, cathedral-like)
        const chamberCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 30),
            wallMaterial
        );
        chamberCeiling.rotation.x = Math.PI / 2;
        chamberCeiling.position.set(0, 8, 0);
        chamberCeiling.receiveShadow = true;
        this.scene.add(chamberCeiling);
        
        // Walls
        this.createWall(-10, 4, 0, 0.5, 8, 30, wallMaterial); // Left wall
        this.createWall(10, 4, 0, 0.5, 8, 30, wallMaterial);  // Right wall
        this.createWall(0, 4, -15, 20, 8, 0.5, wallMaterial); // Back wall
        
        // Front wall with doorway to missile bay
        this.createWall(-7.5, 4, 15, 5, 8, 0.5, wallMaterial); // Left of door
        this.createWall(7.5, 4, 15, 5, 8, 0.5, wallMaterial);  // Right of door
        this.createWall(0, 7, 15, 5, 2, 0.5, wallMaterial);    // Above door
        
        // Inquisitor's platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.5, 4),
            goldMaterial
        );
        platform.position.set(0, 0.25, -10);
        platform.castShadow = true;
        platform.receiveShadow = true;
        this.scene.add(platform);
        
        // Inquisitor figure (simple representation) - standing on platform
        this.createInquisitor(0, 0.5, -10);  // Adjusted Y to stand on platform
    }
    
    createInquisitor(x, y, z) {
        // Create a simple inquisitor figure
        const inquisitorGroup = new THREE.Group();
        
        // Robe (red cylinder)
        const robeGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
        const robeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b0000,
            emissive: 0x400000,
            emissiveIntensity: 0.2
        });
        const robe = new THREE.Mesh(robeGeometry, robeMaterial);
        robe.position.y = 1;
        inquisitorGroup.add(robe);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf4e4d4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.2;
        inquisitorGroup.add(head);
        
        // Hat (cardinal's hat)
        const hatGeometry = new THREE.ConeGeometry(0.3, 0.4, 8);
        const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 2.5;
        inquisitorGroup.add(hat);
        
        inquisitorGroup.position.set(x, y, z);
        inquisitorGroup.userData = { isInquisitor: true };
        this.scene.add(inquisitorGroup);
    }
    
    createMissileBay(z, wallMaterial) {
        // Missile bay floor
        const bayFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x404040,
                roughness: 0.9,
                metalness: 0.2
            })
        );
        bayFloor.rotation.x = -Math.PI / 2;
        bayFloor.position.set(0, 0, z + 10);
        bayFloor.receiveShadow = true;
        this.scene.add(bayFloor);
        
        // Missile bay ceiling with launch tube
        const bayCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            wallMaterial
        );
        bayCeiling.rotation.x = Math.PI / 2;
        bayCeiling.position.set(0, 8, z + 10);
        this.scene.add(bayCeiling);
        
        // Launch tube hole in ceiling
        const holeGeometry = new THREE.RingGeometry(0, 2, 16);
        const holeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(0, 7.99, z + 10);
        this.scene.add(hole);
        
        // Bay walls
        this.createWall(-5, 4, z + 10, 0.5, 8, 10, wallMaterial); // Left
        this.createWall(5, 4, z + 10, 0.5, 8, 10, wallMaterial);  // Right
        this.createWall(0, 4, z + 15, 10, 8, 0.5, wallMaterial);  // Back
        
        // Create missile
        this.createMissile(0, 1, z + 10);
    }
    
    createMissile(x, y, z) {
        const missileGroup = new THREE.Group();
        
        // Missile body (metallic cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.2,
            metalness: 0.95
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        missileGroup.add(body);
        
        // Nose cone (sharper)
        const noseGeometry = new THREE.ConeGeometry(1.2, 3, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.3,
            metalness: 0.9
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 6;
        missileGroup.add(nose);
        
        // Fins at base
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.1, 1.5, 1);
            const fin = new THREE.Mesh(finGeometry, bodyMaterial);
            const angle = (i / 4) * Math.PI * 2;
            fin.position.set(
                Math.cos(angle) * 1.2,
                0.5,
                Math.sin(angle) * 1.2
            );
            fin.rotation.y = angle;
            missileGroup.add(fin);
        }
        
        // Landing legs
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4; // Offset 45 degrees from fins
            
            // Leg strut
            const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
            const legMaterial = new THREE.MeshStandardMaterial({
                color: 0x606060,
                roughness: 0.4,
                metalness: 0.8
            });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                Math.cos(angle) * 1.5,
                -0.5,
                Math.sin(angle) * 1.5
            );
            leg.rotation.z = -Math.PI / 6; // Angle outward
            leg.rotation.y = angle;
            missileGroup.add(leg);
            
            // Foot pad
            const footGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
            const foot = new THREE.Mesh(footGeometry, legMaterial);
            foot.position.set(
                Math.cos(angle) * 1.8,
                -1.3,
                Math.sin(angle) * 1.8
            );
            missileGroup.add(foot);
        }
        
        // Vatican emblem on side (smaller, more subtle)
        const emblemGeometry = new THREE.CircleGeometry(0.4, 16);
        const emblemMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.1,
            metalness: 0.8
        });
        const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem.position.set(1.21, 3, 0);
        emblem.rotation.y = Math.PI / 2;
        missileGroup.add(emblem);
        
        // Entry hatch (more integrated into body)
        const hatchGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.05);
        const hatchMaterial = new THREE.MeshStandardMaterial({
            color: 0x505050,
            emissive: 0x00ff00,
            emissiveIntensity: 0,
            metalness: 0.9,
            roughness: 0.3
        });
        const hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
        hatch.position.set(1.18, 2.5, 0);
        hatch.rotation.y = Math.PI / 2;
        hatch.userData = { isMissileHatch: true };
        missileGroup.add(hatch);
        
        // Hatch outline
        const outlineGeometry = new THREE.BoxGeometry(0.7, 1.3, 0.02);
        const outlineMaterial = new THREE.MeshStandardMaterial({
            color: 0x303030,
            metalness: 0.9
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.position.set(1.19, 2.5, 0);
        outline.rotation.y = Math.PI / 2;
        missileGroup.add(outline);
        
        missileGroup.position.set(x, y, z);
        missileGroup.userData = { isMissile: true };
        this.missileGroup = missileGroup;
        this.missileHatch = hatch;
        this.scene.add(missileGroup);
    }
    
    createWall(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        
        // Store wall bounds for collision
        this.walls.push({
            mesh: wall,
            min: new THREE.Vector3(
                x - width/2,
                y - height/2,
                z - depth/2
            ),
            max: new THREE.Vector3(
                x + width/2,
                y + height/2,
                z + depth/2
            )
        });
    }
    
    addLighting() {
        // Warm cathedral lighting
        const warmLight = new THREE.PointLight(0xffeeaa, 1, 20);
        warmLight.position.set(0, 6, -10);
        warmLight.castShadow = true;
        this.scene.add(warmLight);
        
        // Ambient light from stained glass windows
        const ambientLight = new THREE.AmbientLight(0xffffee, 0.3);
        this.scene.add(ambientLight);
        
        // Dramatic spotlight on inquisitor
        const spotlight = new THREE.SpotLight(0xffffff, 1);
        spotlight.position.set(0, 7, -5);
        spotlight.target.position.set(0, 0, -10);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.2;
        spotlight.castShadow = true;
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);
        
        // Red warning light in missile bay
        const warningLight = new THREE.PointLight(0xff0000, 0.5, 10);
        warningLight.position.set(0, 4, 25);
        this.scene.add(warningLight);
        
        // Flashing effect for warning light
        setInterval(() => {
            warningLight.intensity = warningLight.intensity === 0.5 ? 0.1 : 0.5;
        }, 1000);
    }
    
    addVaticanDecorations(goldMaterial) {
        // Cross on back wall
        const crossVertical = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 4, 0.2),
            goldMaterial
        );
        crossVertical.position.set(0, 5, -14.8);
        this.scene.add(crossVertical);
        
        const crossHorizontal = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.5, 0.2),
            goldMaterial
        );
        crossHorizontal.position.set(0, 6, -14.8);
        this.scene.add(crossHorizontal);
        
        // Pillars
        for (let i = -1; i <= 1; i += 2) {
            const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            const pillarMaterial = new THREE.MeshStandardMaterial({
                color: 0xf0f0e8,
                roughness: 0.5
            });
            
            const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar1.position.set(i * 7, 4, -5);
            pillar1.castShadow = true;
            this.scene.add(pillar1);
            
            const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar2.position.set(i * 7, 4, 5);
            pillar2.castShadow = true;
            this.scene.add(pillar2);
        }
    }
    
    startTutorial() {
        this.tutorialStep = 0;
        this.game.narrativeSystem.displaySubtitle("Cardinal Torretti: \"Giovanni, you have been summoned once more.\"");
        this.game.narrativeSystem.setObjective("Listen to the Inquisitor's instructions");
        
        // Start tutorial sequence after a delay
        setTimeout(() => this.nextTutorialStep(), 3000);
    }
    
    showTutorialControls(controls) {
        // Create or update tutorial controls display
        let tutorialControls = document.getElementById('tutorialControls');
        if (!tutorialControls) {
            tutorialControls = document.createElement('div');
            tutorialControls.id = 'tutorialControls';
            tutorialControls.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                font-family: monospace;
                font-size: 14px;
                border: 1px solid #666;
                z-index: 10000;
            `;
            document.body.appendChild(tutorialControls);
        }
        
        tutorialControls.innerHTML = controls.join('<br>');
    }
    
    nextTutorialStep() {
        this.tutorialStep++;
        const ns = this.game.narrativeSystem;
        
        switch(this.tutorialStep) {
            case 1:
                ns.displaySubtitle("\"First, prove you retain motor function. Use WASD to move.\"");
                ns.setObjective("Move using W, A, S, D keys");
                this.waitForMovement = true;
                // Show movement controls
                this.showTutorialControls(['WASD - Move']);
                break;
                
            case 2:
                ns.displaySubtitle("\"Good. Now demonstrate visual acuity. Move your mouse to look around.\"");
                ns.setObjective("Look around using the mouse");
                this.waitForLook = true;
                this.showTutorialControls(['WASD - Move', 'Mouse - Look']);
                break;
                
            case 3:
                ns.displaySubtitle("\"Your sanctified blade awaits. Press 1 to equip your sword.\"");
                ns.setObjective("Press 1 to equip sword");
                this.waitForWeapon = true;
                // Give the player the sword now
                if (this.game && this.game.weaponSystem) {
                    // Enable weapon switching for sword only
                    this.game.player.weapons = ['sword'];
                    this.game.player.currentWeaponIndex = 0;
                    this.game.player.currentWeapon = 'sword';
                }
                this.showTutorialControls(['WASD - Move', 'Mouse - Look', '1 - Holy Sword']);
                break;
                
            case 4:
                ns.displaySubtitle("\"Strike with left click. Block with right click. The demons will test both.\"");
                ns.setObjective("Left click to attack, Right click to block");
                this.waitForCombat = true;
                this.showTutorialControls(['WASD - Move', 'Mouse - Look', '1 - Holy Sword', 'Left Click - Attack', 'Right Click - Block']);
                break;
                
            case 5:
                ns.displaySubtitle("\"Hold Shift to sprint. You'll need speed where you're going.\"");
                ns.setObjective("Hold Shift to sprint");
                this.waitForSprint = true;
                this.showTutorialControls(['WASD - Move', 'Mouse - Look', 'Shift - Sprint', 'Left Click - Attack', 'Right Click - Block']);
                break;
                
            case 6:
                ns.displaySubtitle("\"Remember: holy water heals, ammunition is blessed, and death is temporary.\"");
                ns.setObjective("Listen to final instructions");
                setTimeout(() => this.nextTutorialStep(), 4000);
                break;
                
            case 7:
                ns.displaySubtitle("\"The Americans have opened a portal. Area 51. You know what to do.\"");
                ns.setObjective("Proceed to the missile");
                setTimeout(() => this.nextTutorialStep(), 4000);
                break;
                
            case 8:
                ns.displaySubtitle("\"Enter the missile. Press E when ready. May God have mercy on us all.\"");
                ns.setObjective("Approach the missile and press E to enter");
                this.missileReady = true;
                // Make hatch glow
                if (this.missileHatch) {
                    this.missileHatch.material.emissiveIntensity = 0.5;
                }
                break;
                
            case 9:
                // Launch sequence
                this.launchMissile();
                break;
        }
    }
    
    checkTutorialProgress(input, player) {
        if (!this.game.narrativeSystem) return;
        
        // Check movement
        if (this.waitForMovement && (input.forward || input.backward || input.left || input.right)) {
            this.waitForMovement = false;
            setTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check mouse look (always true after first move since mouse moves constantly)
        if (this.waitForLook && (Math.abs(input.mouseDeltaX) > 0 || Math.abs(input.mouseDeltaY) > 0)) {
            this.waitForLook = false;
            setTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check weapon switch
        if (this.waitForWeapon && input.weapon1) {
            this.waitForWeapon = false;
            setTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check combat
        if (this.waitForCombat && (input.attack || input.block)) {
            this.waitForCombat = false;
            setTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check sprint
        if (this.waitForSprint && input.sprint) {
            this.waitForSprint = false;
            setTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check missile interaction
        if (this.missileReady && input.interact) {
            const missilePos = new THREE.Vector3(0, 1, 25);
            const distance = player.position.distanceTo(missilePos);
            if (distance < 3) {
                this.nextTutorialStep();
            }
        }
    }
    
    launchMissile() {
        const ns = this.game.narrativeSystem;
        ns.displaySubtitle("\"Initiating launch sequence. Godspeed, Saint Giovanni.\"");
        ns.setObjective("Launching...");
        
        // Move player into missile (teleport to missile position)
        if (this.game.player) {
            this.game.player.position.set(0, 2, 25);
            this.game.player.velocity.set(0, 0, 0);
            
            // Lock player controls during launch
            this.game.playerControlsLocked = true;
        }
        
        // Shake effect
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
            if (this.missileGroup) {
                this.missileGroup.position.x = Math.random() * 0.2 - 0.1;
                this.missileGroup.position.z = 25 + Math.random() * 0.2 - 0.1;
            }
            
            // Also shake the player with the missile
            if (this.game.player) {
                this.game.player.position.x = this.missileGroup.position.x;
                this.game.player.position.z = this.missileGroup.position.z;
            }
            
            shakeTime += 50;
            
            if (shakeTime > 3000) {
                clearInterval(shakeInterval);
                // Launch animation
                this.animateLaunch();
            }
        }, 50);
        
        // Add smoke particles
        this.createLaunchSmoke();
    }
    
    animateLaunch() {
        let launchSpeed = 0.1;
        const launchInterval = setInterval(() => {
            if (this.missileGroup) {
                this.missileGroup.position.y += launchSpeed;
                launchSpeed *= 1.1; // Accelerate
                
                // Move player with missile
                if (this.game.player) {
                    this.game.player.position.y = this.missileGroup.position.y + 1;
                }
                
                if (this.missileGroup.position.y > 20) {
                    clearInterval(launchInterval);
                    // Transition to Chapter 1
                    this.completeTutorial();
                }
            }
        }, 16);
    }
    
    createLaunchSmoke() {
        // Create simple smoke effect
        const smokeCount = 20;
        for (let i = 0; i < smokeCount; i++) {
            const smoke = new THREE.Mesh(
                new THREE.SphereGeometry(Math.random() * 2 + 1, 8, 6),
                new THREE.MeshBasicMaterial({
                    color: 0xaaaaaa,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            smoke.position.set(
                Math.random() * 4 - 2,
                Math.random() * 2,
                25 + Math.random() * 4 - 2
            );
            
            this.scene.add(smoke);
            
            // Animate smoke rising and fading
            const animateSmoke = setInterval(() => {
                smoke.position.y += 0.1;
                smoke.material.opacity -= 0.01;
                smoke.scale.multiplyScalar(1.02);
                
                if (smoke.material.opacity <= 0) {
                    clearInterval(animateSmoke);
                    this.scene.remove(smoke);
                }
            }, 50);
        }
    }
    
    completeTutorial() {
        // Save tutorial completion
        localStorage.setItem('tutorialCompleted', 'true');
        
        // Transition to Chapter 1
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Seven times called, seven times I answer...");
        }
        
        // Load Chapter 1
        setTimeout(() => {
            this.game.loadLevel('chapter1');
        }, 2000);
    }
    
    clearLevel() {
        // Remove all level geometry
        this.walls.forEach(wall => {
            if (wall.mesh) {
                this.scene.remove(wall.mesh);
            }
        });
        this.walls = [];
        
        // Clean up missile and decorations
        if (this.missileGroup) {
            this.scene.remove(this.missileGroup);
        }
        
        // Remove all tutorial-specific objects
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            // Remove all meshes except player-related ones
            if (child.isMesh && !child.userData.isPlayer) {
                // Check if it's a tutorial-specific object
                if (child.userData.isInquisitor || 
                    child.userData.isMissile || 
                    child.userData.isMissileHatch ||
                    child.parent?.userData?.isInquisitor ||
                    child.parent?.userData?.isMissile) {
                    objectsToRemove.push(child);
                }
            }
        });
        
        // Remove collected objects
        objectsToRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            } else {
                this.scene.remove(obj);
            }
        });
    }
}