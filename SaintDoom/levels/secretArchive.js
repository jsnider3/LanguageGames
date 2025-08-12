import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';

export class SecretArchive extends BaseLevel {
    constructor(game) {
        // Handle both old and new constructor signatures
        if (arguments.length === 3) {
            // Old signature: (scene, camera, player)
            super(arguments[0], arguments[1], arguments[2]);
        } else {
            // New signature: (game)
            super(game);
        }
        
        this.name = 'The Forbidden Archive';
        this.description = 'Ancient Vatican archives containing dangerous knowledge and sealed artifacts';
        
        // Level properties
        this.isSecret = true;
        this.unlockRequirement = 'Find all 3 hidden tomes in main campaign';
        
        // Archive specific mechanics
        this.knowledge = {
            forbidden: 0,
            maxForbidden: 100,
            texts: [],
            readingSpeed: 10,
            corruptionRate: 0.5
        };
        
        // Sealed sections
        this.sealedSections = {
            heresy: { unlocked: false, keyRequired: 'Seal of Solomon' },
            prophecy: { unlocked: false, keyRequired: 'Eye of Providence' },
            demonology: { unlocked: false, keyRequired: 'Black Key' },
            reliquary: { unlocked: false, keyRequired: 'Saint\'s Blood' }
        };
        
        // Archive hazards
        this.ghostlyLibrarians = [];
        this.maxLibrarians = 3;
        this.cursedBooks = [];
        this.possessedStatues = [];
        
        // Special items
        this.ancientTomes = [];
        this.forbiddenRelics = [];
        this.secretPassages = [];
        
        // Atmosphere
        this.candleLight = [];
        this.dustParticles = null;
        this.whisperingSounds = [];
        
        this.currentSection = 'entrance';
        this.sectionsVisited = new Set();
        
        // Initialize arrays that were missing
        this.rooms = [];
        this.doors = [];
        this.items = [];
        this.enemies = [];
        this.walls = [];
    }
    
    create() {
        // Wrapper for generate to match expected interface
        return this.generate();
    }

    generate() {
        this.createArchiveStructure();
        this.createMainHall();
        this.createReadingRooms();
        this.createSealedSections();
        this.createReliquary();
        this.createSecretVault();
        this.placeAncientTomes();
        this.createGhostlyLibrarians();
        this.setupAtmosphere();
        this.createHiddenPassages();
        
        return {
            walls: this.walls || [],
            enemies: this.enemies || []
        };
    }

    createArchiveStructure() {
        // Create massive library structure
        const archiveGroup = new THREE.Group();
        
        // Stone floor with pentagram patterns
        const floorGeometry = new THREE.BoxGeometry(100, 1, 100);
        const floorTexture = this.createAncientFloorTexture();
        const floorMaterial = new THREE.MeshPhongMaterial({
            map: floorTexture,
            color: 0x4a3829
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        archiveGroup.add(floor);
        
        // Vaulted ceiling
        const ceilingHeight = 20;
        for (let i = 0; i < 10; i++) {
            const archGeometry = new THREE.TorusGeometry(10, 2, 8, 12, Math.PI);
            const archMaterial = new THREE.MeshPhongMaterial({
                color: 0x3a2817
            });
            const arch = new THREE.Mesh(archGeometry, archMaterial);
            arch.position.set(0, ceilingHeight, -40 + i * 10);
            arch.rotation.z = Math.PI / 2;
            archiveGroup.add(arch);
        }
        
        this.scene.add(archiveGroup);
        this.structure = archiveGroup;
    }

    createMainHall() {
        const hallGroup = new THREE.Group();
        
        // Towering bookshelves
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 8; i++) {
                const shelfGroup = this.createBookshelf(15, 3);
                shelfGroup.position.set(side * 20, 0, -35 + i * 10);
                shelfGroup.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
                hallGroup.add(shelfGroup);
                
                // Add floating books effect
                if (Math.random() < 0.3) {
                    this.createFloatingBooks(shelfGroup.position);
                }
            }
        }
        
        // Central reading podiums
        for (let i = 0; i < 4; i++) {
            const podium = this.createReadingPodium();
            podium.position.set(
                (Math.random() - 0.5) * 10,
                0,
                -30 + i * 20
            );
            hallGroup.add(podium);
            
            // Place ancient tome on some podiums
            if (Math.random() < 0.5) {
                this.placeAncientTome(podium.position);
            }
        }
        
        // Grand entrance
        const entranceGroup = new THREE.Group();
        
        // Ornate doors
        const doorGeometry = new THREE.BoxGeometry(8, 12, 1);
        const doorMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a1810,
            metalness: 0.3,
            roughness: 0.7
        });
        
        for (let i = -1; i <= 1; i += 2) {
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(i * 4, 6, 45);
            entranceGroup.add(door);
            
            // Add mystical symbols
            this.createMysticalSymbols(door);
        }
        
        hallGroup.add(entranceGroup);
        
        this.scene.add(hallGroup);
        this.rooms.push({
            name: 'Main Hall',
            group: hallGroup,
            bounds: { min: { x: -25, z: -40 }, max: { x: 25, z: 45 } }
        });
    }

    createReadingRooms() {
        const readingRooms = [
            { name: 'Theology Study', position: { x: -30, z: 0 }, danger: 'low' },
            { name: 'Occult Research', position: { x: 30, z: 0 }, danger: 'high' },
            { name: 'Prophecy Chamber', position: { x: 0, z: -50 }, danger: 'medium' },
            { name: 'Scripture Vault', position: { x: 0, z: 50 }, danger: 'low' }
        ];
        
        readingRooms.forEach(roomData => {
            const roomGroup = new THREE.Group();
            
            // Room walls
            const wallMaterial = new THREE.MeshPhongMaterial({
                color: roomData.danger === 'high' ? 0x330000 : 0x3a2817
            });
            
            // Create room structure
            this.createRoomWalls(roomGroup, 20, 15, wallMaterial);
            
            // Reading furniture
            const tableCount = roomData.danger === 'high' ? 1 : 3;
            for (let i = 0; i < tableCount; i++) {
                const table = this.createStudyTable();
                table.position.set(
                    (Math.random() - 0.5) * 10,
                    0,
                    (Math.random() - 0.5) * 10
                );
                roomGroup.add(table);
            }
            
            // Dangerous rooms have cursed books
            if (roomData.danger === 'high') {
                this.createCursedBookSection(roomGroup);
            }
            
            // Knowledge scrolls
            const scrollCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < scrollCount; i++) {
                const scroll = this.createKnowledgeScroll(roomData.danger);
                scroll.position.set(
                    (Math.random() - 0.5) * 15,
                    1,
                    (Math.random() - 0.5) * 15
                );
                roomGroup.add(scroll);
                this.knowledge.texts.push(scroll);
            }
            
            roomGroup.position.set(roomData.position.x, 0, roomData.position.z);
            this.scene.add(roomGroup);
            
            this.rooms.push({
                name: roomData.name,
                group: roomGroup,
                danger: roomData.danger,
                bounds: {
                    min: { x: roomData.position.x - 10, z: roomData.position.z - 10 },
                    max: { x: roomData.position.x + 10, z: roomData.position.z + 10 }
                }
            });
        });
    }

    createSealedSections() {
        Object.keys(this.sealedSections).forEach((sectionName, index) => {
            const section = this.sealedSections[sectionName];
            const sectionGroup = new THREE.Group();
            
            // Sealed door
            const sealedDoorGeometry = new THREE.BoxGeometry(6, 10, 2);
            const sealedDoorMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                emissive: 0x220022,
                emissiveIntensity: 0.3
            });
            const sealedDoor = new THREE.Mesh(sealedDoorGeometry, sealedDoorMaterial);
            sealedDoor.position.y = 5;
            
            // Magical seal
            const sealGeometry = new THREE.TorusGeometry(3, 0.3, 8, 16);
            const sealMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.7
            });
            const seal = new THREE.Mesh(sealGeometry, sealMaterial);
            seal.position.z = 1.1;
            seal.position.y = 5;
            sealedDoor.add(seal);
            
            // Runes around seal
            this.createSealRunes(seal);
            
            sectionGroup.add(sealedDoor);
            
            // Hidden chamber behind
            const chamberGroup = new THREE.Group();
            
            switch(sectionName) {
                case 'heresy':
                    this.createHeresySection(chamberGroup);
                    break;
                case 'prophecy':
                    this.createProphecySection(chamberGroup);
                    break;
                case 'demonology':
                    this.createDemonologySection(chamberGroup);
                    break;
                case 'reliquary':
                    this.createReliquarySection(chamberGroup);
                    break;
            }
            
            chamberGroup.position.z = -20;
            chamberGroup.visible = false; // Initially hidden
            sectionGroup.add(chamberGroup);
            
            // Position sealed sections
            const angle = (index / 4) * Math.PI * 2;
            const radius = 60;
            sectionGroup.position.x = Math.cos(angle) * radius;
            sectionGroup.position.z = Math.sin(angle) * radius;
            sectionGroup.rotation.y = -angle;
            
            this.scene.add(sectionGroup);
            
            section.door = sealedDoor;
            section.chamber = chamberGroup;
            section.seal = seal;
        });
    }

    createHeresySection(group) {
        // Banned religious texts and heretical artifacts
        const heresyItems = [
            { name: 'Gospel of Judas', power: 'betrayal', corruption: 20 },
            { name: 'Black Bible', power: 'dark_wisdom', corruption: 30 },
            { name: 'Apostate\'s Crown', power: 'false_prophet', corruption: 25 }
        ];
        
        heresyItems.forEach((item, index) => {
            const pedestal = this.createPedestal();
            pedestal.position.set(
                (index - 1) * 5,
                0,
                0
            );
            
            const artifact = this.createForbiddenArtifact(item);
            artifact.position.y = 2;
            pedestal.add(artifact);
            
            group.add(pedestal);
            this.forbiddenRelics.push({ mesh: artifact, data: item });
        });
        
        // Inverted crosses on walls
        this.createInvertedCrosses(group);
    }

    createProphecySection(group) {
        // Crystal ball and prophecy scrolls
        const crystalBall = this.createCrystalBall();
        crystalBall.position.set(0, 1.5, 0);
        group.add(crystalBall);
        
        // Floating prophecy pages
        for (let i = 0; i < 10; i++) {
            const page = this.createFloatingProphecy();
            page.position.set(
                (Math.random() - 0.5) * 10,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 10
            );
            group.add(page);
        }
        
        // Timeline mural
        this.createTimelineMural(group);
    }

    createDemonologySection(group) {
        // Summoning circle
        const circleGeometry = new THREE.RingGeometry(4, 5, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0x440000,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        group.add(circle);
        
        // Demon names on the walls
        this.createDemonNames(group);
        
        // Trapped demon essence
        const essenceContainer = this.createEssenceContainer();
        essenceContainer.position.set(0, 3, -5);
        group.add(essenceContainer);
        
        // Grimoires
        for (let i = 0; i < 3; i++) {
            const grimoire = this.createGrimoire();
            grimoire.position.set(
                (i - 1) * 4,
                0.5,
                5
            );
            group.add(grimoire);
        }
    }

    createReliquarySection(group) {
        // Holy relics display
        const relics = [
            { name: 'Fragment of True Cross', holy: 100, healing: 50 },
            { name: 'Vial of Holy Water', holy: 80, damage: 30 },
            { name: 'Saint\'s Bone', holy: 90, protection: 40 },
            { name: 'Blessed Shroud', holy: 85, resurrection: true }
        ];
        
        relics.forEach((relic, index) => {
            const display = this.createRelicDisplay(relic);
            const angle = (index / relics.length) * Math.PI * 2;
            display.position.x = Math.cos(angle) * 5;
            display.position.z = Math.sin(angle) * 5;
            group.add(display);
        });
        
        // Central altar
        const altar = this.createHolyAltar();
        altar.position.set(0, 0, 0);
        group.add(altar);
    }

    createReliquary() {
        // Main reliquary chamber with holy artifacts
        const reliquaryGroup = new THREE.Group();
        reliquaryGroup.position.set(40, 0, -60);
        
        // Reliquary chamber walls
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b7355,
            emissive: 0x2a1f15,
            emissiveIntensity: 0.1
        });
        
        this.createRoomWalls(reliquaryGroup, 25, 20, wallMaterial);
        
        // Add golden glow
        const holyLight = new THREE.PointLight(0xffd700, 0.8, 30);
        holyLight.position.set(0, 8, 0);
        reliquaryGroup.add(holyLight);
        
        // Create multiple reliquary sections
        const sections = [
            { position: new THREE.Vector3(-8, 0, -5), type: 'holy' },
            { position: new THREE.Vector3(8, 0, -5), type: 'blessed' },
            { position: new THREE.Vector3(-8, 0, 5), type: 'sacred' },
            { position: new THREE.Vector3(8, 0, 5), type: 'divine' }
        ];
        
        sections.forEach(section => {
            const sectionGroup = new THREE.Group();
            sectionGroup.position.copy(section.position);
            this.createReliquarySection(sectionGroup);
            reliquaryGroup.add(sectionGroup);
        });
        
        // Add protective barriers
        const barrierGeometry = new THREE.TorusGeometry(15, 0.3, 8, 32);
        const barrierMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            opacity: 0.5,
            transparent: true
        });
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.rotation.x = Math.PI / 2;
        barrier.position.y = 3;
        reliquaryGroup.add(barrier);
        
        this.rooms.push(reliquaryGroup);
        this.scene.add(reliquaryGroup);
    }
    
    createSecretVault() {
        // Ultimate secret room with the most powerful artifacts
        const vaultGroup = new THREE.Group();
        
        // Requires all seals to be broken
        const vaultDoor = this.createVaultDoor();
        vaultDoor.position.set(0, 0, -80);
        vaultGroup.add(vaultDoor);
        
        // The vault interior
        const vaultInterior = new THREE.Group();
        
        // The Necronomicon
        const necronomicon = this.createNecronomicon();
        necronomicon.position.set(0, 1, -100);
        vaultInterior.add(necronomicon);
        
        // Ark of the Covenant replica
        const ark = this.createArkReplica();
        ark.position.set(-10, 0, -100);
        vaultInterior.add(ark);
        
        // Spear of Destiny
        const spear = this.createSpearOfDestiny();
        spear.position.set(10, 0, -100);
        vaultInterior.add(spear);
        
        // Warning inscriptions
        this.createWarningInscriptions(vaultInterior);
        
        vaultGroup.add(vaultInterior);
        this.scene.add(vaultGroup);
        
        this.secretVault = vaultGroup;
    }

    createBookshelf(height, width) {
        const shelfGroup = new THREE.Group();
        
        // Shelf structure
        const shelfGeometry = new THREE.BoxGeometry(width, height, 0.5);
        const shelfMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a3520
        });
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.y = height / 2;
        shelfGroup.add(shelf);
        
        // Books
        const bookColors = [0x330000, 0x003300, 0x000033, 0x333300, 0x330033];
        const rows = Math.floor(height);
        const booksPerRow = Math.floor(width * 3);
        
        for (let row = 0; row < rows; row++) {
            for (let i = 0; i < booksPerRow; i++) {
                const bookHeight = 0.8 + Math.random() * 0.4;
                const bookWidth = 0.2 + Math.random() * 0.2;
                const bookGeometry = new THREE.BoxGeometry(bookWidth, bookHeight, 0.4);
                const bookMaterial = new THREE.MeshPhongMaterial({
                    color: bookColors[Math.floor(Math.random() * bookColors.length)]
                });
                const book = new THREE.Mesh(bookGeometry, bookMaterial);
                
                book.position.x = -width / 2 + (i / booksPerRow) * width + bookWidth / 2;
                book.position.y = row + bookHeight / 2;
                book.position.z = 0.25;
                
                // Some books are slightly pulled out
                if (Math.random() < 0.1) {
                    book.position.z += 0.2;
                    book.rotation.y = (Math.random() - 0.5) * 0.2;
                }
                
                shelfGroup.add(book);
            }
        }
        
        return shelfGroup;
    }

    createFloatingBooks(position) {
        const bookCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < bookCount; i++) {
            const bookGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
            const bookMaterial = new THREE.MeshPhongMaterial({
                color: 0x442211,
                emissive: 0x110011,
                emissiveIntensity: 0.3
            });
            const book = new THREE.Mesh(bookGeometry, bookMaterial);
            
            book.position.copy(position);
            book.position.x += (Math.random() - 0.5) * 5;
            book.position.y += Math.random() * 8 + 2;
            book.position.z += (Math.random() - 0.5) * 5;
            
            this.scene.add(book);
            
            // Animate floating
            const floatAnimation = () => {
                book.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
                book.rotation.y += 0.01;
                book.rotation.z = Math.sin(Date.now() * 0.002 + i) * 0.1;
                
                requestAnimationFrame(floatAnimation);
            };
            floatAnimation();
            
            this.cursedBooks.push(book);
        }
    }

    createReadingPodium() {
        const podiumGroup = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a2817
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        podiumGroup.add(base);
        
        // Reading surface
        const surfaceGeometry = new THREE.BoxGeometry(2.5, 0.1, 2);
        const surfaceMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a1810
        });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.position.y = 1.05;
        surface.rotation.x = -Math.PI / 12;
        podiumGroup.add(surface);
        
        // Candle
        const candle = this.createCandle();
        candle.position.set(1, 1.2, 0);
        podiumGroup.add(candle);
        
        return podiumGroup;
    }

    createCandle() {
        const candleGroup = new THREE.Group();
        
        // Candle body
        const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const candleMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffcc
        });
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candleGroup.add(candle);
        
        // Flame
        const flameGeometry = new THREE.ConeGeometry(0.03, 0.1, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 1
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.2;
        candleGroup.add(flame);
        
        // Light source
        const light = new THREE.PointLight(0xffaa00, 0.5, 5);
        light.position.y = 0.2;
        candleGroup.add(light);
        
        this.candleLight.push(light);
        
        // Animate flame
        const animateFlame = () => {
            flame.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            flame.position.x = Math.sin(Date.now() * 0.005) * 0.01;
            light.intensity = 0.5 + Math.sin(Date.now() * 0.008) * 0.1;
            
            requestAnimationFrame(animateFlame);
        };
        animateFlame();
        
        return candleGroup;
    }

    createGhostlyLibrarians() {
        for (let i = 0; i < this.maxLibrarians; i++) {
            const librarianGroup = new THREE.Group();
            
            // Ghostly figure
            const bodyGeometry = new THREE.ConeGeometry(0.8, 3, 8);
            const bodyMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaaaff,
                transparent: true,
                opacity: 0.3,
                emissive: 0x000044,
                emissiveIntensity: 0.5
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.5;
            librarianGroup.add(body);
            
            // Hooded head
            const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const headMaterial = new THREE.MeshPhongMaterial({
                color: 0x000033,
                transparent: true,
                opacity: 0.5
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 3.5;
            librarianGroup.add(head);
            
            // Glowing eyes
            for (let eye = -1; eye <= 1; eye += 2) {
                const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
                const eyeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 1
                });
                const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
                eyeMesh.position.set(eye * 0.15, 3.5, 0.4);
                librarianGroup.add(eyeMesh);
            }
            
            // Starting position
            librarianGroup.position.set(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            );
            
            this.scene.add(librarianGroup);
            
            const librarian = {
                mesh: librarianGroup,
                position: librarianGroup.position,  // Reference to mesh position
                velocity: new THREE.Vector3(0, 0, 0),  // Add velocity for collision system
                path: [],
                currentTarget: null,
                speed: 1,
                state: 'patrol',
                alertRadius: 15,
                attackRadius: 3,
                damage: 20,
                lastAttack: 0,
                health: 30,
                maxHealth: 30,
                radius: 0.8,  // Add collision radius
                floatingBooks: librarianGroup.children.filter(child => 
                    child.geometry instanceof THREE.BoxGeometry),
                // Add required update method
                update: function(deltaTime, playerPosition) {
                    if (!this.mesh) return;
                    
                    // Rotate floating books
                    if (this.floatingBooks) {
                        this.floatingBooks.forEach((book, index) => {
                            const time = Date.now() * 0.001;
                            const angle = (index / 3) * Math.PI * 2 + time;
                            book.position.x = Math.cos(angle) * 1.5;
                            book.position.z = Math.sin(angle) * 1.5;
                            book.rotation.y += deltaTime * 2;
                        });
                    }
                    
                    // Reset velocity
                    this.velocity.set(0, 0, 0);
                    
                    // Basic patrol/chase behavior
                    if (playerPosition) {
                        const dx = playerPosition.x - this.position.x;
                        const dz = playerPosition.z - this.position.z;
                        const distToPlayer = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distToPlayer < this.alertRadius) {
                            this.state = 'chase';
                            // Set velocity towards player
                            if (distToPlayer > this.attackRadius) {
                                this.velocity.x = (dx / distToPlayer) * this.speed;
                                this.velocity.z = (dz / distToPlayer) * this.speed;
                            }
                            // Face player
                            this.mesh.rotation.y = Math.atan2(dx, dz);
                        } else {
                            this.state = 'patrol';
                        }
                    }
                    
                    // Apply velocity (collision system will handle wall collisions)
                    this.position.x += this.velocity.x * deltaTime;
                    this.position.z += this.velocity.z * deltaTime;
                    
                    // Update attack cooldown
                    if (this.lastAttack > 0) {
                        this.lastAttack -= deltaTime;
                    }
                },
                // Add takeDamage method
                takeDamage: function(amount) {
                    this.health = (this.health || 30) - amount;
                    if (this.health <= 0 && this.mesh) {
                        if (this.mesh.parent) {
                            this.mesh.parent.remove(this.mesh);
                        }
                        this.mesh = null;
                        return true; // Enemy died
                    }
                    return false;
                },
                // Add applyKnockback method
                applyKnockback: function(force) {
                    if (this.velocity && force) {
                        // Apply knockback by adding force to velocity
                        this.velocity.x += force.x;
                        this.velocity.z += force.z;
                    }
                },
                // Add onDeath method
                onDeath: function() {
                    this.isDead = true;
                    // Create death effect - ghostly dissipation
                    if (this.mesh && this.mesh.parent) {
                        // Fade out effect could be added here
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh = null;
                }
            };
            
            this.ghostlyLibrarians.push(librarian);
            this.enemies.push(librarian);
            
            // AI behavior
            this.setupLibrarianAI(librarian);
        }
    }

    setupLibrarianAI(librarian) {
        const updateInterval = setInterval(() => {
            if (!this.player) return;
            
            const playerPos = this.player.position || this.player.mesh.position;
            const librarianPos = librarian.mesh.position;
            const distance = librarianPos.distanceTo(playerPos);
            
            switch(librarian.state) {
                case 'patrol':
                    // Patrol between bookshelves
                    if (!librarian.currentTarget || librarianPos.distanceTo(librarian.currentTarget) < 2) {
                        librarian.currentTarget = new THREE.Vector3(
                            (Math.random() - 0.5) * 60,
                            0,
                            (Math.random() - 0.5) * 60
                        );
                    }
                    
                    // Move toward target
                    const patrolDir = new THREE.Vector3()
                        .subVectors(librarian.currentTarget, librarianPos)
                        .normalize();
                    librarian.mesh.position.add(patrolDir.multiplyScalar(librarian.speed * 0.016));
                    
                    // Check for player
                    if (distance < librarian.alertRadius) {
                        librarian.state = 'chase';
                        console.log('Librarian alerted!');
                    }
                    break;
                    
                case 'chase':
                    // Chase player
                    const chaseDir = new THREE.Vector3()
                        .subVectors(playerPos, librarianPos)
                        .normalize();
                    librarian.mesh.position.add(chaseDir.multiplyScalar(librarian.speed * 2 * 0.016));
                    
                    // Attack if close
                    if (distance < librarian.attackRadius) {
                        const now = Date.now();
                        if (now - librarian.lastAttack > 2000) {
                            if (this.player.takeDamage) {
                                this.player.takeDamage(librarian.damage);
                            }
                            librarian.lastAttack = now;
                            
                            // Whisper attack
                            this.playWhisperSound(librarianPos);
                        }
                    }
                    
                    // Lose interest if far
                    if (distance > librarian.alertRadius * 2) {
                        librarian.state = 'patrol';
                    }
                    break;
            }
            
            // Float animation
            librarian.mesh.position.y = Math.sin(Date.now() * 0.002) * 0.5 + 1;
            librarian.mesh.rotation.y += 0.01;
            
        }, 50);
        
        librarian.updateInterval = updateInterval;
    }

    placeAncientTome(position) {
        // Place a single ancient tome at the given position
        const tomeGroup = new THREE.Group();
        
        // Book mesh
        const bookGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.8);
        const bookMaterial = new THREE.MeshPhongMaterial({
            color: 0x331100,
            emissive: 0x110000,
            emissiveIntensity: 0.2
        });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.y = 0.1;
        tomeGroup.add(book);
        
        // Small glow effect
        const glowLight = new THREE.PointLight(0xff4400, 0.5, 3);
        glowLight.position.y = 0.5;
        tomeGroup.add(glowLight);
        
        tomeGroup.position.copy(position);
        tomeGroup.position.y += 1;
        this.scene.add(tomeGroup);
        
        this.ancientTomes.push({
            mesh: tomeGroup,
            name: 'Ancient Tome',
            power: 'knowledge',
            collected: false
        });
        
        return tomeGroup;
    }
    
    placeAncientTomes() {
        const tomeLocations = [
            { pos: { x: 0, z: 0 }, name: 'Codex Gigas', power: 'demon_knowledge' },
            { pos: { x: -40, z: -40 }, name: 'Book of Shadows', power: 'dark_magic' },
            { pos: { x: 40, z: -40 }, name: 'Dead Sea Scrolls', power: 'prophecy' },
            { pos: { x: 0, z: -100 }, name: 'Voynich Manuscript', power: 'unknown' }
        ];
        
        tomeLocations.forEach(tome => {
            const tomeGroup = new THREE.Group();
            
            // Book mesh
            const bookGeometry = new THREE.BoxGeometry(0.8, 0.2, 1);
            const bookMaterial = new THREE.MeshPhongMaterial({
                color: 0x220000,
                emissive: 0x110000,
                emissiveIntensity: 0.3
            });
            const book = new THREE.Mesh(bookGeometry, bookMaterial);
            tomeGroup.add(book);
            
            // Glowing aura
            const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const auraMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.2
            });
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            tomeGroup.add(aura);
            
            tomeGroup.position.set(tome.pos.x, 1, tome.pos.z);
            this.scene.add(tomeGroup);
            
            this.ancientTomes.push({
                mesh: tomeGroup,
                name: tome.name,
                power: tome.power,
                collected: false
            });
        });
    }

    createHiddenPassages() {
        // Secret passages between sections
        const passages = [
            { from: { x: -20, z: 0 }, to: { x: 20, z: 0 }, trigger: 'bookshelf' },
            { from: { x: 0, z: -40 }, to: { x: 0, z: -80 }, trigger: 'statue' },
            { from: { x: -60, z: 0 }, to: { x: 0, z: -100 }, trigger: 'painting' }
        ];
        
        passages.forEach(passage => {
            // Hidden door
            const doorGeometry = new THREE.BoxGeometry(3, 8, 0.5);
            const doorMaterial = new THREE.MeshPhongMaterial({
                color: 0x3a2817,
                map: this.createSecretDoorTexture()
            });
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(passage.from.x, 4, passage.from.z);
            this.scene.add(door);
            
            // Trigger mechanism
            const trigger = this.createSecretTrigger(passage.trigger);
            trigger.position.set(passage.from.x + 5, 0, passage.from.z);
            this.scene.add(trigger);
            
            this.secretPassages.push({
                door: door,
                trigger: trigger,
                destination: passage.to,
                activated: false
            });
        });
    }

    setupAtmosphere() {
        // Dust particles
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xcccccc,
            size: 0.05,
            transparent: true,
            opacity: 0.5
        });
        
        this.dustParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.dustParticles);
        
        // Animate dust
        const animateDust = () => {
            this.dustParticles.rotation.y += 0.0001;
            
            requestAnimationFrame(animateDust);
        };
        animateDust();
        
        // Ambient fog
        this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 80);
        
        // Ambient sounds setup (would connect to audio system)
        this.whisperingSounds = [
            'ancient_whispers.mp3',
            'turning_pages.mp3',
            'creaking_wood.mp3'
        ];
    }

    // Helper methods for creating specific elements
    createAncientFloorTexture() {
        // Procedural texture generation (simplified)
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Stone texture
        ctx.fillStyle = '#4a3829';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add pentagram pattern
        ctx.strokeStyle = '#2a1810';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw pentagram
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
            const x = 256 + Math.cos(angle) * 200;
            const y = 256 + Math.sin(angle) * 200;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        return new THREE.CanvasTexture(canvas);
    }

    createKnowledgeScroll(danger) {
        const scrollGroup = new THREE.Group();
        
        // Scroll mesh
        const scrollGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const scrollMaterial = new THREE.MeshPhongMaterial({
            color: danger === 'high' ? 0x660000 : 0xccaa88
        });
        const scroll = new THREE.Mesh(scrollGeometry, scrollMaterial);
        scroll.rotation.z = Math.PI / 2;
        scrollGroup.add(scroll);
        
        // Knowledge value
        const knowledge = {
            value: danger === 'high' ? 20 : 10,
            corruption: danger === 'high' ? 10 : 0,
            type: danger === 'high' ? 'forbidden' : 'sacred'
        };
        
        scrollGroup.userData = knowledge;
        
        return scrollGroup;
    }

    // Update and interaction methods
    update(deltaTime) {
        // Update ghostly librarians
        this.ghostlyLibrarians.forEach(librarian => {
            // Already handled in AI setup
        });
        
        // Update floating books
        this.cursedBooks.forEach((book, index) => {
            // Already animated in creation
        });
        
        // Check for tome collection
        this.ancientTomes.forEach(tome => {
            if (!tome.collected && this.player) {
                const distance = tome.mesh.position.distanceTo(
                    this.player.position || this.player.mesh.position
                );
                
                if (distance < 2) {
                    tome.collected = true;
                    tome.mesh.visible = false;
                    this.onTomeCollected(tome);
                }
            }
        });
        
        // Update knowledge corruption
        if (this.knowledge.forbidden > 50) {
            this.applyCorruption();
        }
    }

    onTomeCollected(tome) {
        console.log(`Collected ${tome.name} - Power: ${tome.power}`);
        
        // Grant power based on tome
        if (this.player) {
            switch(tome.power) {
                case 'demon_knowledge':
                    // Reveal demon weaknesses
                    this.player.demonKnowledge = true;
                    break;
                case 'dark_magic':
                    // Unlock dark spells
                    this.player.darkMagicEnabled = true;
                    break;
                case 'prophecy':
                    // Reveal future events
                    this.player.prophecyVision = true;
                    break;
                case 'unknown':
                    // Random effect
                    this.knowledge.forbidden += 30;
                    break;
            }
        }
        
        // Check for completion
        const allCollected = this.ancientTomes.every(t => t.collected);
        if (allCollected) {
            this.unlockSecretVault();
        }
    }

    unlockSeal(sectionName, key) {
        const section = this.sealedSections[sectionName];
        if (!section || section.unlocked) return false;
        
        if (key === section.keyRequired) {
            section.unlocked = true;
            section.seal.visible = false;
            section.chamber.visible = true;
            
            // Open door animation
            const openAnimation = () => {
                section.door.position.y += 0.1;
                section.door.material.opacity -= 0.01;
                
                if (section.door.material.opacity > 0) {
                    requestAnimationFrame(openAnimation);
                } else {
                    section.door.visible = false;
                }
            };
            openAnimation();
            
            return true;
        }
        
        return false;
    }

    unlockSecretVault() {
        console.log('Secret Vault Unlocked!');
        
        if (this.secretVault) {
            // Dramatic reveal
            const vaultDoor = this.secretVault.children[0];
            if (vaultDoor) {
                // Door opening animation
                const openVault = () => {
                    vaultDoor.rotation.y += 0.02;
                    
                    if (vaultDoor.rotation.y < Math.PI / 2) {
                        requestAnimationFrame(openVault);
                    }
                };
                openVault();
            }
        }
    }

    applyCorruption() {
        // Visual corruption effects
        if (this.scene.fog) {
            this.scene.fog.color.setHex(0x330000);
        }
        
        // Spawn additional enemies
        if (this.ghostlyLibrarians.length < this.maxLibrarians * 2) {
            this.createGhostlyLibrarians();
        }
    }

    createObjectives() {
        return [
            {
                id: 'collect_tomes',
                description: 'Collect all 4 Ancient Tomes',
                completed: false,
                progress: 0,
                total: 4
            },
            {
                id: 'unlock_seals',
                description: 'Unlock all Sealed Sections',
                completed: false,
                progress: 0,
                total: 4
            },
            {
                id: 'access_vault',
                description: 'Access the Secret Vault',
                completed: false,
                hidden: true
            },
            {
                id: 'survive_corruption',
                description: 'Survive without full corruption',
                completed: false,
                optional: true
            }
        ];
    }

    // Additional helper methods for sealed sections
    createPedestal() {
        const pedestalGroup = new THREE.Group();
        
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            metalness: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.75;
        pedestalGroup.add(base);
        
        return pedestalGroup;
    }

    createForbiddenArtifact(item) {
        const artifactGroup = new THREE.Group();
        
        // Different artifact types
        let geometry, material;
        
        switch(item.name) {
            case 'Gospel of Judas':
                geometry = new THREE.BoxGeometry(0.6, 0.15, 0.8);
                material = new THREE.MeshPhongMaterial({
                    color: 0x000000,
                    emissive: 0x220000
                });
                break;
            case 'Black Bible':
                geometry = new THREE.BoxGeometry(0.7, 0.2, 0.9);
                material = new THREE.MeshPhongMaterial({
                    color: 0x000000,
                    emissive: 0x440044
                });
                break;
            case 'Apostate\'s Crown':
                geometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
                material = new THREE.MeshPhongMaterial({
                    color: 0x444444,
                    metalness: 0.8,
                    emissive: 0x660000
                });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.3, 8, 8);
                material = new THREE.MeshPhongMaterial({
                    color: 0x660066
                });
        }
        
        const artifact = new THREE.Mesh(geometry, material);
        artifactGroup.add(artifact);
        
        return artifactGroup;
    }

    createCrystalBall() {
        const crystalGroup = new THREE.Group();
        
        const ballGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x000044,
            emissiveIntensity: 0.3
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        crystalGroup.add(ball);
        
        // Swirling mist inside
        const mistGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const mistMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.3
        });
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        crystalGroup.add(mist);
        
        // Animate mist
        const animateMist = () => {
            mist.rotation.y += 0.01;
            mist.scale.set(
                1 + Math.sin(Date.now() * 0.001) * 0.1,
                1 + Math.cos(Date.now() * 0.001) * 0.1,
                1 + Math.sin(Date.now() * 0.001) * 0.1
            );
            
            requestAnimationFrame(animateMist);
        };
        animateMist();
        
        return crystalGroup;
    }

    createVaultDoor() {
        const doorGroup = new THREE.Group();
        
        const doorGeometry = new THREE.BoxGeometry(10, 15, 2);
        const doorMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.1
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.y = 7.5;
        doorGroup.add(door);
        
        // Complex lock mechanism
        for (let i = 0; i < 4; i++) {
            const lockGeometry = new THREE.TorusGeometry(1, 0.2, 8, 16);
            const lockMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8
            });
            const lock = new THREE.Mesh(lockGeometry, lockMaterial);
            lock.position.set((i - 1.5) * 2, 7.5, 1.1);
            doorGroup.add(lock);
        }
        
        return doorGroup;
    }

    playWhisperSound(position) {
        // Would connect to audio system
        console.log('Whisper at', position);
    }

    // Stub methods for additional artifacts
    createInvertedCrosses(group) {
        // Implementation for inverted crosses
    }

    createFloatingProphecy() {
        const pageGeometry = new THREE.PlaneGeometry(0.5, 0.7);
        const pageMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        return new THREE.Mesh(pageGeometry, pageMaterial);
    }

    createTimelineMural(group) {
        // Implementation for timeline mural
    }

    createDemonNames(group) {
        // Implementation for demon names on walls
    }

    createEssenceContainer() {
        const containerGroup = new THREE.Group();
        
        const jarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
        const jarMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5
        });
        const jar = new THREE.Mesh(jarGeometry, jarMaterial);
        containerGroup.add(jar);
        
        return containerGroup;
    }

    createGrimoire() {
        const bookGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.7);
        const bookMaterial = new THREE.MeshPhongMaterial({
            color: 0x110011,
            emissive: 0x220022
        });
        return new THREE.Mesh(bookGeometry, bookMaterial);
    }

    createRelicDisplay(relic) {
        const displayGroup = new THREE.Group();
        
        // Glass case
        const caseGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
        const caseMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        const glassCase = new THREE.Mesh(caseGeometry, caseMaterial);
        glassCase.position.y = 1;
        displayGroup.add(glassCase);
        
        return displayGroup;
    }

    createHolyAltar() {
        const altarGroup = new THREE.Group();
        
        const altarGeometry = new THREE.BoxGeometry(3, 1, 2);
        const altarMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.1
        });
        const altar = new THREE.Mesh(altarGeometry, altarMaterial);
        altar.position.y = 0.5;
        altarGroup.add(altar);
        
        return altarGroup;
    }

    createNecronomicon() {
        const bookGroup = new THREE.Group();
        
        const bookGeometry = new THREE.BoxGeometry(1, 0.3, 1.2);
        const bookMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x440044,
            emissiveIntensity: 0.5
        });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        bookGroup.add(book);
        
        return bookGroup;
    }

    createArkReplica() {
        const arkGroup = new THREE.Group();
        
        const arkGeometry = new THREE.BoxGeometry(2.5, 1.5, 1.5);
        const arkMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            metalness: 0.9,
            emissive: 0xffaa00,
            emissiveIntensity: 0.2
        });
        const ark = new THREE.Mesh(arkGeometry, arkMaterial);
        ark.position.y = 0.75;
        arkGroup.add(ark);
        
        return arkGroup;
    }

    createSpearOfDestiny() {
        const spearGroup = new THREE.Group();
        
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const shaftMaterial = new THREE.MeshPhongMaterial({
            color: 0x442211
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = 1.5;
        spearGroup.add(shaft);
        
        const tipGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            metalness: 0.9,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.y = 3.25;
        spearGroup.add(tip);
        
        return spearGroup;
    }

    createWarningInscriptions(group) {
        // Would add warning text meshes
    }

    createRoomWalls(group, width, height, material) {
        // Create four walls
        const wallThickness = 0.5;
        
        // Front and back walls
        const frontBackGeometry = new THREE.BoxGeometry(width, height, wallThickness);
        const frontWall = new THREE.Mesh(frontBackGeometry, material);
        frontWall.position.z = width / 2;
        frontWall.position.y = height / 2;
        group.add(frontWall);
        
        const backWall = new THREE.Mesh(frontBackGeometry, material);
        backWall.position.z = -width / 2;
        backWall.position.y = height / 2;
        group.add(backWall);
        
        // Side walls
        const sideGeometry = new THREE.BoxGeometry(wallThickness, height, width);
        const leftWall = new THREE.Mesh(sideGeometry, material);
        leftWall.position.x = -width / 2;
        leftWall.position.y = height / 2;
        group.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideGeometry, material);
        rightWall.position.x = width / 2;
        rightWall.position.y = height / 2;
        group.add(rightWall);
    }

    createStudyTable() {
        const tableGroup = new THREE.Group();
        
        const tableGeometry = new THREE.BoxGeometry(3, 0.1, 2);
        const tableMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a2817
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = 1;
        tableGroup.add(table);
        
        // Legs
        for (let x = -1; x <= 1; x += 2) {
            for (let z = -0.8; z <= 0.8; z += 1.6) {
                const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
                const leg = new THREE.Mesh(legGeometry, tableMaterial);
                leg.position.set(x * 1.4, 0.5, z);
                tableGroup.add(leg);
            }
        }
        
        return tableGroup;
    }

    createCursedBookSection(group) {
        // Implementation for cursed book section
    }

    createMysticalSymbols(door) {
        // Implementation for mystical symbols on doors
    }

    createSealRunes(seal) {
        // Implementation for seal runes
    }

    createSecretDoorTexture() {
        // Implementation for secret door texture
        return null; // Placeholder
    }

    createSecretTrigger(type) {
        const triggerGroup = new THREE.Group();
        
        // Different trigger types
        switch(type) {
            case 'bookshelf':
                // Specific book to pull
                break;
            case 'statue':
                // Statue to rotate
                break;
            case 'painting':
                // Painting to press
                break;
        }
        
        return triggerGroup;
    }
}