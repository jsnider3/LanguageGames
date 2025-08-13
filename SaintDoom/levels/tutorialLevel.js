import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { THEME } from '../modules/config/theme.js';
// Tutorial Level - Vatican Inquisition Chamber
// Player learns controls while being evaluated by the Inquisition

export class TutorialLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials for Vatican chamber
        const marbleFloorMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.floor.vatican,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const stoneWallMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.wall.stone,
            roughness: 0.9,
            metalness: 0.0
        });
        
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.gold,
            roughness: 0.4,
            metalness: 0.8,
            emissive: THEME.materials.gold,
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
        // Create a detailed Cardinal Torretti figure
        const inquisitorGroup = new THREE.Group();
        
        // Base robe material with rich fabric appearance
        const robeMaterial = new THREE.MeshStandardMaterial({ 
            color: THEME.materials.robe,
            emissive: THEME.materials.robeEmissive,
            emissiveIntensity: 0.15,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Lower robe (wider at bottom)
        const lowerRobeGeometry = new THREE.CylinderGeometry(0.35, 0.6, 1.2, 16);
        const lowerRobe = new THREE.Mesh(lowerRobeGeometry, robeMaterial);
        lowerRobe.position.y = 0.6;
        inquisitorGroup.add(lowerRobe);
        
        // Upper robe (torso)
        const upperRobeGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1, 12);
        const upperRobe = new THREE.Mesh(upperRobeGeometry, robeMaterial);
        upperRobe.position.y = 1.5;
        inquisitorGroup.add(upperRobe);
        
        // Shoulders
        const shoulderGeometry = new THREE.SphereGeometry(0.35, 8, 6);
        const shoulders = new THREE.Mesh(shoulderGeometry, robeMaterial);
        shoulders.position.y = 1.9;
        shoulders.scale.y = 0.6;
        inquisitorGroup.add(shoulders);
        
        // Arms
        for (let side of [-1, 1]) {
            // Upper arm
            const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8);
            const upperArm = new THREE.Mesh(upperArmGeometry, robeMaterial);
            upperArm.position.set(side * 0.28, 1.7, 0);
            upperArm.rotation.z = side * Math.PI / 10;
            inquisitorGroup.add(upperArm);
            
            // Elbow joint
            const elbowGeometry = new THREE.SphereGeometry(0.09, 6, 4);
            const elbow = new THREE.Mesh(elbowGeometry, robeMaterial);
            elbow.position.set(side * 0.35, 1.45, 0);
            inquisitorGroup.add(elbow);
            
            // Lower arm
            const lowerArmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.45, 8);
            const lowerArm = new THREE.Mesh(lowerArmGeometry, robeMaterial);
            lowerArm.position.set(side * 0.38, 1.25, -0.1);
            lowerArm.rotation.z = side * Math.PI / 16;
            lowerArm.rotation.x = -Math.PI / 10;
            inquisitorGroup.add(lowerArm);
            
            // Hands
            const handGeometry = new THREE.SphereGeometry(0.06, 6, 4);
            const handMaterial = new THREE.MeshStandardMaterial({ 
                color: THEME.materials.skin,
                roughness: 0.7
            });
            const hand = new THREE.Mesh(handGeometry, handMaterial);
            hand.position.set(side * 0.4, 1.05, -0.15);
            inquisitorGroup.add(hand);
        }
        
        // Neck
        const neckGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
        const neckMaterial = new THREE.MeshStandardMaterial({ 
            color: THEME.materials.skin,
            roughness: 0.7
        });
        const neck = new THREE.Mesh(neckGeometry, neckMaterial);
        neck.position.y = 2.1;
        inquisitorGroup.add(neck);
        
        // Head (more detailed)
        const headGeometry = new THREE.SphereGeometry(0.18, 12, 10);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: THEME.materials.skin,
            roughness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.3;
        head.scale.y = 1.1; // Slightly elongated
        inquisitorGroup.add(head);
        
        // Eyes (dark, judgmental)
        for (let side of [-1, 1]) {
            const eyeGeometry = new THREE.SphereGeometry(0.02, 6, 4);
            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(side * 0.06, 2.32, -0.15);
            inquisitorGroup.add(eye);
        }
        
        // Nose
        const noseGeometry = new THREE.ConeGeometry(0.02, 0.04, 4);
        const nose = new THREE.Mesh(noseGeometry, headMaterial);
        nose.position.set(0, 2.28, -0.16);
        nose.rotation.x = Math.PI / 2;
        inquisitorGroup.add(nose);
        
        // Mouth (stern expression)
        const mouthGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.02);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x4a3030 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 2.22, -0.15);
        inquisitorGroup.add(mouth);
        
        // Cardinal's zucchetto (skullcap)
        const zucchettoGeometry = new THREE.SphereGeometry(0.19, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const zucchettoMaterial = new THREE.MeshStandardMaterial({ 
            color: THEME.materials.robe,
            roughness: 0.6
        });
        const zucchetto = new THREE.Mesh(zucchettoGeometry, zucchettoMaterial);
        zucchetto.position.y = 2.4;
        inquisitorGroup.add(zucchetto);
        
        // Cardinal's biretta (square cap with ridges)
        const birettaGroup = new THREE.Group();
        
        // Base of biretta
        const birettaBase = new THREE.BoxGeometry(0.3, 0.08, 0.3);
        const birettaMaterial = new THREE.MeshStandardMaterial({ 
            color: THEME.materials.robe,
            roughness: 0.5
        });
        const biretta = new THREE.Mesh(birettaBase, birettaMaterial);
        birettaGroup.add(biretta);
        
        // Three ridges on top
        for (let i = 0; i < 3; i++) {
            const ridgeGeometry = new THREE.BoxGeometry(0.28, 0.12, 0.02);
            const ridge = new THREE.Mesh(ridgeGeometry, birettaMaterial);
            ridge.position.y = 0.08;
            ridge.position.z = (i - 1) * 0.1;
            birettaGroup.add(ridge);
        }
        
        // Tuft on top
        const tuftGeometry = new THREE.SphereGeometry(0.04, 6, 4);
        const tuft = new THREE.Mesh(tuftGeometry, birettaMaterial);
        tuft.position.y = 0.15;
        birettaGroup.add(tuft);
        
        birettaGroup.position.y = 2.55;
        birettaGroup.rotation.y = Math.PI / 8; // Slight angle for character
        inquisitorGroup.add(birettaGroup);
        
        // Golden pectoral cross
        const crossGroup = new THREE.Group();
        const crossMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.gold,
            emissive: THEME.materials.gold,
            emissiveIntensity: 0.2,
            metalness: 0.9,
            roughness: 0.3
        });
        
        // Vertical beam of cross
        const crossVertical = new THREE.BoxGeometry(0.02, 0.12, 0.01);
        const verticalBeam = new THREE.Mesh(crossVertical, crossMaterial);
        crossGroup.add(verticalBeam);
        
        // Horizontal beam of cross
        const crossHorizontal = new THREE.BoxGeometry(0.08, 0.02, 0.01);
        const horizontalBeam = new THREE.Mesh(crossHorizontal, crossMaterial);
        horizontalBeam.position.y = 0.03;
        crossGroup.add(horizontalBeam);
        
        // Chain
        const chainGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
        const chain = new THREE.Mesh(chainGeometry, crossMaterial);
        chain.position.y = 0.15;
        chain.position.z = -0.01;
        crossGroup.add(chain);
        
        crossGroup.position.set(0, 1.5, -0.32);
        inquisitorGroup.add(crossGroup);
        
        // Cincture (belt/sash)
        const cinctureGeometry = new THREE.TorusGeometry(0.36, 0.03, 4, 16);
        const cinctureMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.gold,
            metalness: 0.6,
            roughness: 0.4
        });
        const cincture = new THREE.Mesh(cinctureGeometry, cinctureMaterial);
        cincture.position.y = 1.3;
        cincture.rotation.x = Math.PI / 2;
        inquisitorGroup.add(cincture);
        
        // Add subtle idle animation
        this.inquisitorGroup = inquisitorGroup;
        this.inquisitorAnimationTime = 0;
        
        // Rotate to face forward (toward positive Z, where player starts)
        inquisitorGroup.rotation.y = Math.PI;
        
        inquisitorGroup.position.set(x, y, z);
        inquisitorGroup.userData = { isInquisitor: true };
        this.scene.add(inquisitorGroup);
        
        // Add a subtle glow beneath the Cardinal
        const glowGeometry = new THREE.CircleGeometry(1, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.gold,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, y + 0.01, z);
        glow.rotation.x = -Math.PI / 2;
        this.scene.add(glow);
    }
    
    createMissileBay(z, wallMaterial) {
        // Missile bay floor
        const bayFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({
                color: THEME.materials.floor.metal,
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
            color: THEME.materials.black,
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
            color: THEME.materials.metal.bright,
            roughness: 0.2,
            metalness: 0.95
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        missileGroup.add(body);
        
        // Nose cone (sharper)
        const noseGeometry = new THREE.ConeGeometry(1.2, 3, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.floor.metal,
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
                color: THEME.materials.metal.dark,
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
            color: THEME.materials.gold,
            emissive: THEME.materials.gold,
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
            color: THEME.materials.metal.dark,
            emissive: THEME.ui.text.success,
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
            color: THEME.materials.metal.veryDark,
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
    
    // createWall method is now inherited from BaseLevel
    
    addLighting() {
        // Warm cathedral lighting
        const warmLight = new THREE.PointLight(THEME.lights.point.warm, 1, 20);
        warmLight.position.set(0, 6, -10);
        warmLight.castShadow = true;
        this.scene.add(warmLight);
        
        // Ambient light from stained glass windows
        const ambientLight = new THREE.AmbientLight(THEME.lights.ambient.warm, 0.3);
        this.scene.add(ambientLight);
        
        // Dramatic spotlight on inquisitor
        const spotlight = new THREE.SpotLight(THEME.lights.spot.white, 1);
        spotlight.position.set(0, 7, -5);
        spotlight.target.position.set(0, 0, -10);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.2;
        spotlight.castShadow = true;
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);
        
        // Red warning light in missile bay
        const warningLight = new THREE.PointLight(THEME.lights.point.warning, 0.5, 10);
        warningLight.position.set(0, 4, 25);
        this.scene.add(warningLight);
        
        // Flashing effect for warning light
        const warningInterval = this.addInterval(() => {
            warningLight.intensity = warningLight.intensity === 0.5 ? 0.1 : 0.5;
        }, 1000);
        // Store interval for cleanup
        this.intervals = this.intervals || [];
        this.intervals.push(warningInterval);
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
                color: THEME.materials.floor.vatican,
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
        
        // Add bookshelves along the walls
        this.createBookshelf(-9, 3, -7, 0);      // Left wall, back
        this.createBookshelf(-9, 3, -2, 0);      // Left wall, middle
        this.createBookshelf(-9, 3, 3, 0);       // Left wall, front
        
        this.createBookshelf(9, 3, -7, Math.PI); // Right wall, back
        this.createBookshelf(9, 3, -2, Math.PI); // Right wall, middle
        this.createBookshelf(9, 3, 3, Math.PI);  // Right wall, front
        
        // Add reading tables with old tomes
        this.createReadingTable(-5, 0, -3);
        this.createReadingTable(5, 0, -3);
    }
    
    createBookshelf(x, y, z, rotation) {
        const bookshelfGroup = new THREE.Group();
        
        // Bookshelf frame
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3420, // Dark wood
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Back panel
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(3, 6, 0.1),
            frameMaterial
        );
        bookshelfGroup.add(backPanel);
        
        // Top and bottom
        const shelfThickness = 0.15;
        for (let i = 0; i <= 5; i++) {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(3, shelfThickness, 0.8),
                frameMaterial
            );
            shelf.position.y = -2.5 + i;
            shelf.position.z = 0.35;
            bookshelfGroup.add(shelf);
        }
        
        // Side panels
        for (let side of [-1, 1]) {
            const sidePanel = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 6, 0.8),
                frameMaterial
            );
            sidePanel.position.x = side * 1.5;
            sidePanel.position.z = 0.35;
            bookshelfGroup.add(sidePanel);
        }
        
        // Add books
        const bookColors = [
            0x8b0000, // Dark red
            0x2f4f2f, // Dark green
            0x191970, // Midnight blue
            0x4b0082, // Indigo
            0x8b4513, // Saddle brown
            0x800020, // Burgundy
        ];
        
        // Fill each shelf with books
        for (let shelf = 0; shelf < 5; shelf++) {
            const shelfY = -2 + shelf;
            let currentX = -1.3;
            
            while (currentX < 1.2) {
                const bookHeight = 0.7 + Math.random() * 0.3;
                const bookWidth = 0.1 + Math.random() * 0.15;
                const bookDepth = 0.5 + Math.random() * 0.2;
                
                const bookMaterial = new THREE.MeshStandardMaterial({
                    color: bookColors[Math.floor(Math.random() * bookColors.length)],
                    roughness: 0.9,
                    metalness: 0.05
                });
                
                const book = new THREE.Mesh(
                    new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth),
                    bookMaterial
                );
                
                book.position.set(
                    currentX + bookWidth / 2,
                    shelfY + bookHeight / 2 + shelfThickness / 2,
                    0.35
                );
                
                // Occasionally tilt a book
                if (Math.random() > 0.8) {
                    book.rotation.z = (Math.random() - 0.5) * 0.1;
                }
                
                bookshelfGroup.add(book);
                currentX += bookWidth + 0.02;
            }
        }
        
        bookshelfGroup.position.set(x, y, z);
        bookshelfGroup.rotation.y = rotation;
        bookshelfGroup.castShadow = true;
        this.scene.add(bookshelfGroup);
    }
    
    createReadingTable(x, y, z) {
        const tableGroup = new THREE.Group();
        
        // Table surface
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321, // Dark brown wood
            roughness: 0.7,
            metalness: 0.1
        });
        
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 1.2),
            tableMaterial
        );
        tableTop.position.y = 1;
        tableGroup.add(tableTop);
        
        // Table legs
        for (let legX of [-0.9, 0.9]) {
            for (let legZ of [-0.5, 0.5]) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
                    tableMaterial
                );
                leg.position.set(legX, 0.5, legZ);
                tableGroup.add(leg);
            }
        }
        
        // Open book on table
        const bookGroup = new THREE.Group();
        
        // Book pages (open)
        const pagesMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5deb3, // Wheat/parchment color
            roughness: 0.9
        });
        
        const leftPage = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.02, 0.4),
            pagesMaterial
        );
        leftPage.position.set(-0.15, 0, 0);
        leftPage.rotation.z = -0.05;
        bookGroup.add(leftPage);
        
        const rightPage = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.02, 0.4),
            pagesMaterial
        );
        rightPage.position.set(0.15, 0, 0);
        rightPage.rotation.z = 0.05;
        bookGroup.add(rightPage);
        
        // Book cover (visible edges)
        const coverMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b0000, // Dark red leather
            roughness: 0.8
        });
        
        const spine = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.05, 0.42),
            coverMaterial
        );
        spine.position.y = -0.01;
        bookGroup.add(spine);
        
        bookGroup.position.y = 1.06;
        bookGroup.rotation.y = Math.random() * 0.5 - 0.25;
        tableGroup.add(bookGroup);
        
        // Candle holder
        const candleHolderMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.brass || 0xb87333,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const candleBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.05, 12),
            candleHolderMaterial
        );
        candleBase.position.set(0.6, 1.03, 0.3);
        tableGroup.add(candleBase);
        
        const candle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
            new THREE.MeshStandardMaterial({
                color: 0xfff8dc, // Cream candle color
                roughness: 0.8
            })
        );
        candle.position.set(0.6, 1.15, 0.3);
        tableGroup.add(candle);
        
        // Candle flame (simple glow)
        const flameGeometry = new THREE.SphereGeometry(0.04, 4, 4);
        const flameMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(0.6, 1.27, 0.3);
        flame.scale.y = 1.5;
        tableGroup.add(flame);
        
        // Small point light for candle
        const candleLight = new THREE.PointLight(0xffaa66, 0.3, 3);
        candleLight.position.set(0.6, 1.3, 0.3);
        tableGroup.add(candleLight);
        
        tableGroup.position.set(x, y, z);
        this.scene.add(tableGroup);
    }
    
    startTutorial() {
        this.tutorialStep = 0;
        this.game.narrativeSystem.displaySubtitle("Cardinal Torretti: \"Giovanni, you have been summoned once more.\"");
        this.game.narrativeSystem.setObjective("Listen to the Inquisitor's instructions");
        
        // Start tutorial sequence after a delay
        this.addTimeout(() => this.nextTutorialStep(), 3000);
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
                
                // Make sure player has sword in inventory
                if (this.game && this.game.player) {
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
                this.addTimeout(() => this.nextTutorialStep(), 4000);
                break;
                
            case 7:
                ns.displaySubtitle("\"The Americans have opened a portal. Area 51. You know what to do.\"");
                ns.setObjective("Proceed to the missile");
                this.addTimeout(() => this.nextTutorialStep(), 4000);
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
    
    update(deltaTime) {
        // Call parent update
        super.update(deltaTime);
        
        // Animate the Cardinal with subtle idle movement
        if (this.inquisitorGroup) {
            this.inquisitorAnimationTime = (this.inquisitorAnimationTime || 0) + deltaTime;
            
            // Gentle breathing animation
            const breathScale = 1 + Math.sin(this.inquisitorAnimationTime * 2) * 0.02;
            if (this.inquisitorGroup.children[1]) { // Upper robe
                this.inquisitorGroup.children[1].scale.x = breathScale;
                this.inquisitorGroup.children[1].scale.z = breathScale;
            }
            
            // Subtle head movement (looking around occasionally)
            const headTurn = Math.sin(this.inquisitorAnimationTime * 0.3) * 0.1;
            this.inquisitorGroup.rotation.y = Math.PI + headTurn; // Keep facing player with subtle movement
            
            // Cross pendant swing
            const crossGroup = this.inquisitorGroup.children.find(child => 
                child.children && child.children.length === 3 && child.position.z < -0.3
            );
            if (crossGroup) {
                crossGroup.rotation.z = Math.sin(this.inquisitorAnimationTime * 1.5) * 0.05;
            }
        }
        
        // Handle camera looking at missile during shake
        if (this.cameraTransitioning && this.game.camera) {
            // Keep camera looking at the missile during shake phase
            this.game.camera.lookAt(this.cameraLookTarget);
        }
    }
    
    checkTutorialProgress(input, player) {
        if (!this.game.narrativeSystem) return;
        
        // Check movement
        if (this.waitForMovement && (input.forward || input.backward || input.left || input.right)) {
            this.waitForMovement = false;
            this.addTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check mouse look (always true after first move since mouse moves constantly)
        if (this.waitForLook && (Math.abs(input.mouseDeltaX) > 0 || Math.abs(input.mouseDeltaY) > 0)) {
            this.waitForLook = false;
            this.addTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check weapon switch
        if (this.waitForWeapon && input.weapon1) {
            this.waitForWeapon = false;
            // Now actually equip the sword
            if (this.game && this.game.weaponSystem) {
                this.game.weaponSystem.switchToWeapon('sword');
            }
            this.addTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check combat
        if (this.waitForCombat && (input.attack || input.block)) {
            this.waitForCombat = false;
            this.addTimeout(() => this.nextTutorialStep(), 1000);
        }
        
        // Check sprint
        if (this.waitForSprint && input.sprint) {
            this.waitForSprint = false;
            this.addTimeout(() => this.nextTutorialStep(), 1000);
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
        
        // Prepare for launch sequence
        if (this.game.player) {
            // Lock player controls during launch
            this.game.playerControlsLocked = true;
            
            // Store original camera settings
            this.originalCameraPosition = this.game.camera.position.clone();
            this.originalCameraRotation = this.game.camera.rotation.clone();
            
            // Move player position away to ensure we're "in" the missile
            this.originalPlayerPosition = this.game.player.position.clone();
            this.game.player.position.set(0, 2, 25); // Inside missile
            
            // Position camera to view the missile from outside
            this.cameraTargetPosition = new THREE.Vector3(5, 3, 30);
            this.cameraLookTarget = new THREE.Vector3(0, 3, 25);
            
            // Immediately set camera position for instant transition
            this.game.camera.position.copy(this.cameraTargetPosition);
            this.game.camera.lookAt(this.cameraLookTarget);
            
            // Start camera transition animation
            this.cameraTransitionTime = 0;
            this.cameraTransitioning = true;
        }
        
        // Close missile hatch with animation
        if (this.missileHatch) {
            // Hide weapons immediately when hatch starts closing
            this.hideWeapons();
            
            // Animate hatch closing
            const closeHatch = () => {
                if (this.missileHatch.material.opacity > 0.8) {
                    this.missileHatch.material.opacity -= 0.05;
                    this.missileHatch.material.transparent = true;
                    requestAnimationFrame(closeHatch);
                } else {
                    // Hatch fully closed
                    this.missileHatch.material.emissiveIntensity = 0;
                }
            };
            closeHatch();
        }
        
        // Shake effect
        let shakeTime = 0;
        const shakeInterval = this.addInterval(() => {
            if (this.missileGroup) {
                this.missileGroup.position.x = Math.random() * 0.2 - 0.1;
                this.missileGroup.position.z = 25 + Math.random() * 0.2 - 0.1;
            }
            
            // Shake camera slightly too
            if (this.game.camera && this.cameraTargetPosition) {
                this.game.camera.position.x = this.cameraTargetPosition.x + (Math.random() * 0.1 - 0.05);
                this.game.camera.position.y = this.cameraTargetPosition.y + (Math.random() * 0.1 - 0.05);
            }
            
            shakeTime += 50;
            
            if (shakeTime > 3000) {
                this.clearInterval(shakeInterval);
                // Launch animation
                this.animateLaunch();
            }
        }, 50);
        
        // Add smoke particles
        this.createLaunchSmoke();
        
        // Add engine ignition effects
        this.createEngineIgnition();
    }
    
    animateLaunch() {
        let launchSpeed = 0.1;
        const launchInterval = this.addInterval(() => {
            if (this.missileGroup) {
                this.missileGroup.position.y += launchSpeed;
                launchSpeed *= 1.1; // Accelerate
                
                // Camera follows missile upward
                if (this.game.camera) {
                    this.game.camera.position.y += launchSpeed * 0.8;
                    this.game.camera.lookAt(this.missileGroup.position);
                }
                
                if (this.missileGroup.position.y > 20) {
                    this.clearInterval(launchInterval);
                    // Transition to Chapter 1
                    this.completeTutorial();
                }
            }
        }, 16);
    }
    
    hideWeapons() {
        // Hide all weapon meshes and hands when entering missile
        if (this.game.weaponSystem) {
            // Hide the sword mesh
            if (this.game.weaponSystem.swordMesh) {
                this.game.weaponSystem.swordMesh.visible = false;
            }
            // Hide the arm groups (hands holding weapons)
            if (this.game.weaponSystem.armGroup) {
                this.game.weaponSystem.armGroup.visible = false;
            }
            if (this.game.weaponSystem.gripGroup) {
                this.game.weaponSystem.gripGroup.visible = false;
            }
            // Hide the shotgun if it exists
            if (this.game.weaponSystem.shotgunMesh) {
                this.game.weaponSystem.shotgunMesh.visible = false;
            }
            // Hide holy water if it exists
            if (this.game.weaponSystem.holyWaterMesh) {
                this.game.weaponSystem.holyWaterMesh.visible = false;
            }
            // Hide any projectile meshes
            if (this.game.weaponSystem.projectileMesh) {
                this.game.weaponSystem.projectileMesh.visible = false;
            }
        }
    }
    
    createEngineIgnition() {
        // Create engine flame effect at base of missile
        const flameGeometry = new THREE.ConeGeometry(1.5, 4, 8);
        const flameMaterial = new THREE.MeshStandardMaterial({
            color: THEME.effects.explosion.fire,
            transparent: true,
            opacity: 0.8,
            emissive: THEME.effects.explosion.fire,
            emissiveIntensity: 0.5
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(0, -1, 25);
        flame.rotation.x = Math.PI;
        this.scene.add(flame);
        
        // Animate flame
        const animateFlame = () => {
            flame.scale.x = 1 + Math.random() * 0.3;
            flame.scale.z = 1 + Math.random() * 0.3;
            flame.scale.y = 1 + Math.random() * 0.5;
            flame.material.opacity = 0.6 + Math.random() * 0.3;
            
            if (this.missileGroup && this.missileGroup.position.y < 20) {
                requestAnimationFrame(animateFlame);
            } else {
                this.scene.remove(flame);
            }
        };
        animateFlame();
        
        // Add bright light at engine
        const engineLight = new THREE.PointLight(THEME.effects.explosion.fire, 3, 20);
        engineLight.position.set(0, 0, 25);
        this.scene.add(engineLight);
        
        // Remove light after launch
        this.addTimeout(() => {
            this.scene.remove(engineLight);
        }, 5000);
    }
    
    createLaunchSmoke() {
        // Create simple smoke effect
        const smokeCount = 20;
        for (let i = 0; i < smokeCount; i++) {
            const smoke = new THREE.Mesh(
                new THREE.SphereGeometry(Math.random() * 2 + 1, 8, 6),
                new THREE.MeshStandardMaterial({
                    color: THEME.effects.smoke,
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
            const animateSmoke = this.addInterval(() => {
                smoke.position.y += 0.1;
                smoke.material.opacity -= 0.01;
                smoke.scale.multiplyScalar(1.02);
                
                if (smoke.material.opacity <= 0) {
                    this.clearInterval(animateSmoke);
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
        this.addTimeout(() => {
            this.game.loadLevel('chapel');
        }, 2000);
    }
    
    clearLevel() {
        // Call parent cleanup to handle intervals, timeouts, etc.
        if (super.cleanup) {
            super.cleanup();
        }
        
        // Store references to objects we want to keep (camera, lights that should persist)
        const objectsToKeep = [];
        
        // Traverse and collect all objects to remove
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            // Keep the camera
            if (child === this.game.camera) {
                return;
            }
            
            // Keep global lights (ambient and directional)
            if (child.isAmbientLight || child.isDirectionalLight) {
                return; // Keep global lighting
            }
            
            // Keep objects specifically marked as persistent
            if (child.userData && child.userData.persistent) {
                return;
            }
            
            // Remove everything else - all meshes, lights, groups created by tutorial
            if (child.isMesh || child.isLight || child.isGroup) {
                objectsToRemove.push(child);
            }
        });
        
        // Remove all collected objects
        objectsToRemove.forEach(obj => {
            if (obj.parent && obj.parent !== this.scene) {
                obj.parent.remove(obj);
            } else if (obj.parent === this.scene) {
                this.scene.remove(obj);
            }
        });
        
        // Clear any tutorial-specific references
        this.missileGroup = null;
        this.missileHatch = null;
        this.inquisitorGroup = null;
        
        // Remove tutorial controls UI if it exists
        const tutorialControls = document.getElementById('tutorialControls');
        if (tutorialControls) {
            tutorialControls.remove();
        }
        
        console.log(`[TutorialLevel] Cleared ${objectsToRemove.length} objects from scene`);
    }
}
