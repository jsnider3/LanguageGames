import * as THREE from 'three';
// Containment Area Level
// Dangerous environment with multiple hazards and escaped specimens

import { BaseLevel } from './baseLevel.js';
import { THEME } from '../modules/config/theme.js';
import { BrimstoneGolem } from '../enemies/brimstoneGolem.js';
import { Hellhound } from '../enemies/hellhound.js';
import { Imp } from '../enemies/imp.js';
import { Succubus } from '../enemies/succubus.js';
import { DemonKnight } from '../enemies/demonKnight.js';

export class ContainmentLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;

        this.name = 'Containment Area';
        this.description = 'Dangerous environment with multiple hazards and escaped specimens';

        // Level state used by environmental logic / save-state integration
        this.containmentStatus = {
            cellBlock_A: 'breached',
            cellBlock_B: 'compromised',
            cellBlock_C: 'sealed',
            cellBlock_D: 'critical'
        };

        this.escapedSpecimens = 0;
        this.maxSpecimens = 20;
        this.exitPortal = null;

        // Save/restore hooks used in `modules/Game.js`
        this.systemsRestored = 0;
        this.emergencyProtocolActive = false;

        // Containers used throughout level logic
        this.hazards = {
            fire: [],
            radiation: [],
            electricity: [],
            corruption: [],
            gravity: []
        };
        this.emergencySystems = {
            fireSupression: false,
            decontamination: false
        };
    }
    
    create() {
        // Initialize base level properties (since BaseLevel doesn't have create())
        this.init();
        
        // Set safe spawn position - near sealed Cell Block C (north), away from enemies
        if (this.game && this.game.player) {
            this.game.player.position.set(0, 1.7, -20); // Start in safe zone north of hub, near sealed block
        }
        
        // Create main containment structure
        this.createContainmentHub();
        this.createCellBlockA(); // Breached - fire hazards
        this.createCellBlockB(); // Compromised - radiation
        this.createCellBlockC(); // Sealed - must unlock
        this.createCellBlockD(); // Critical - corruption spreading
        
        // Central control room
        this.createControlRoom();
        
        // Emergency corridors
        this.createEmergencyCorridors();
        
        // Hazard zones
        this.createRadiationZone();
        // Fire hazards are created in createCellBlockA()
        this.createElectricalHazards();
        this.createCorruptionZone();
        this.createGravityAnomaly();
        
        // Environmental effects
        this.createEnvironmentalEffects();
        
        // Spawn enemies
        this.spawnContainmentEnemies();
        
        // Setup objectives
        this.setupContainmentObjectives();
        
        // Return required data structure for Game.js
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }
    
    createContainmentHub() {
        // Central hub connecting all cell blocks
        const hubRadius = 20;
        const hubGeometry = new THREE.CylinderGeometry(hubRadius, hubRadius, 10, 16);
        const hubMaterial = new THREE.MeshPhongMaterial({
            color: THEME.materials.wall.containment,
            emissive: THEME.lights.point.demonic,
            emissiveIntensity: 0.1
        });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.set(0, 5, 0);
        this.scene.add(hub);
        
        // Add safe corridor markers on the floor
        this.createSafePathMarkings();
        
        // Central pillar with control systems
        const pillarGeometry = new THREE.CylinderGeometry(3, 3, 10, 8);
        const pillarMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(0, 5, 0);
        this.scene.add(pillar);
        
        // Warning lights
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const warningLight = new THREE.PointLight(0xff0000, 1, 10);
            warningLight.position.set(
                Math.cos(angle) * (hubRadius - 2),
                8,
                Math.sin(angle) * (hubRadius - 2)
            );
            this.scene.add(warningLight);
            
            // Rotating animation
            const rotateLight = () => {
                warningLight.intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
                requestAnimationFrame(rotateLight);
            };
            rotateLight();
        }
        
        // Floor markings
        this.createFloorMarkings(hubRadius);
    }
    
    createCellBlockSign(text, position, color = 0xffffff, emissive = 0x000000) {
        // Create a large sign with text-like appearance
        const signGroup = new THREE.Group();
        
        // Sign backing
        const signGeometry = new THREE.BoxGeometry(8, 3, 0.2);
        const signMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            emissive: emissive,
            emissiveIntensity: 0.3
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        signGroup.add(sign);
        
        // Create letter blocks to spell out text
        const letterSize = 0.8;
        const letterSpacing = 1;
        const startX = -(text.length * letterSpacing) / 2 + letterSpacing / 2;
        
        for (let i = 0; i < text.length; i++) {
            if (text[i] !== ' ') {
                const letterGeometry = new THREE.BoxGeometry(letterSize, letterSize, 0.1);
                const letterMaterial = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                const letter = new THREE.Mesh(letterGeometry, letterMaterial);
                letter.position.x = startX + i * letterSpacing;
                letter.position.z = -0.15;
                signGroup.add(letter);
            }
        }
        
        signGroup.position.copy(position);
        this.scene.add(signGroup);
        
        // Add glow light
        const signLight = new THREE.PointLight(color, 0.5, 5);
        signLight.position.copy(position);
        signLight.position.z -= 1;
        this.scene.add(signLight);
        
        return signGroup;
    }
    
    createCellBlockA() {
        // Breached block with fire hazards
        const blockPosition = new THREE.Vector3(-30, 0, 0);
        
        // Add identification sign
        this.createCellBlockSign(
            "BLOCK A",
            new THREE.Vector3(blockPosition.x, 8, blockPosition.z + 15),
            0xff4400,  // Orange for fire
            0x440000   // Red emissive
        );
        
        // Add hazard warning sign
        this.createCellBlockSign(
            "FIRE",
            new THREE.Vector3(blockPosition.x, 5, blockPosition.z + 15),
            0xff0000,  // Red
            0x440000
        );
        
        // Main structure
        const blockGeometry = new THREE.BoxGeometry(20, 10, 30);
        const blockMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x441100,
            emissiveIntensity: 0.2
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.copy(blockPosition);
        block.position.y = 5;
        this.scene.add(block);
        
        // Damaged walls
        this.createDamagedWalls(blockPosition);
        
        // Fire hazards
        for (let i = 0; i < 5; i++) {
            const firePos = new THREE.Vector3(
                blockPosition.x + (Math.random() - 0.5) * 15,
                0,
                blockPosition.z + (Math.random() - 0.5) * 20
            );
            this.createFireHazard(firePos);
        }
        
        // Broken cells
        for (let i = 0; i < 6; i++) {
            this.createBrokenCell(
                new THREE.Vector3(
                    blockPosition.x - 8 + (i % 3) * 6,
                    0,
                    blockPosition.z - 10 + Math.floor(i / 3) * 10
                )
            );
        }
        
        // Emergency sprinkler system (broken)
        this.createBrokenSprinklers(blockPosition);
    }
    
    createCellBlockB() {
        // Compromised block with radiation
        const blockPosition = new THREE.Vector3(30, 0, 0);
        
        // Add identification sign
        this.createCellBlockSign(
            "BLOCK B",
            new THREE.Vector3(blockPosition.x, 8, blockPosition.z + 15),
            0x00ff00,  // Green for radiation
            0x004400   // Green emissive
        );
        
        // Add hazard warning sign
        this.createCellBlockSign(
            "RADIATION",
            new THREE.Vector3(blockPosition.x, 5, blockPosition.z + 15),
            0x00ff00,
            0x002200
        );
        
        // Main structure
        const blockGeometry = new THREE.BoxGeometry(20, 10, 30);
        const blockMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x004400,
            emissiveIntensity: 0.2
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.copy(blockPosition);
        block.position.y = 5;
        this.scene.add(block);
        
        // Radiation leak
        this.createRadiationLeak(blockPosition);
        
        // Contaminated cells
        for (let i = 0; i < 6; i++) {
            this.createContaminatedCell(
                new THREE.Vector3(
                    blockPosition.x - 8 + (i % 3) * 6,
                    0,
                    blockPosition.z - 10 + Math.floor(i / 3) * 10
                )
            );
        }
        
        // Hazmat equipment
        this.createHazmatStation(new THREE.Vector3(blockPosition.x, 0, blockPosition.z + 15));
    }
    
    createCellBlockC() {
        // Sealed block - requires access
        const blockPosition = new THREE.Vector3(0, 0, -30);
        
        // Add identification sign
        this.createCellBlockSign(
            "BLOCK C",
            new THREE.Vector3(blockPosition.x + 15, 8, blockPosition.z),
            0xffff00,  // Yellow for sealed/secure
            0x444400   // Yellow emissive
        );
        
        // Add status sign
        this.createCellBlockSign(
            "SEALED",
            new THREE.Vector3(blockPosition.x + 15, 5, blockPosition.z),
            0xffff00,
            0x222200
        );
        
        // Main structure (reinforced)
        const blockGeometry = new THREE.BoxGeometry(30, 10, 20);
        const blockMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.copy(blockPosition);
        block.position.y = 5;
        this.scene.add(block);
        
        // Sealed blast door
        this.createBlastDoor(new THREE.Vector3(blockPosition.x, 0, blockPosition.z + 10));
        
        // Intact cells with dangerous specimens
        for (let i = 0; i < 8; i++) {
            this.createHighSecurityCell(
                new THREE.Vector3(
                    blockPosition.x - 12 + (i % 4) * 6,
                    0,
                    blockPosition.z - 5 + Math.floor(i / 4) * 6
                )
            );
        }
        
        // Security systems
        this.createSecuritySystems(blockPosition);
    }
    
    createCellBlockD() {
        // Critical - corruption spreading
        const blockPosition = new THREE.Vector3(0, 0, 30);
        
        // Add identification sign
        this.createCellBlockSign(
            "BLOCK D",
            new THREE.Vector3(blockPosition.x - 15, 8, blockPosition.z),
            0xff00ff,  // Purple for corruption
            0x440044   // Purple emissive
        );
        
        // Add hazard warning sign
        this.createCellBlockSign(
            "PORTAL",
            new THREE.Vector3(blockPosition.x - 15, 5, blockPosition.z),
            0xff00ff,
            0x220022
        );
        
        // Main structure (corrupted)
        const blockGeometry = new THREE.BoxGeometry(30, 10, 20);
        const blockMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            emissive: 0x440044,
            emissiveIntensity: 0.3
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.copy(blockPosition);
        block.position.y = 5;
        this.scene.add(block);
        
        // Corruption spreading effect
        this.createCorruptionSpread(blockPosition);
        
        // Corrupted cells
        for (let i = 0; i < 6; i++) {
            this.createCorruptedCell(
                new THREE.Vector3(
                    blockPosition.x - 12 + (i % 3) * 8,
                    0,
                    blockPosition.z - 5 + Math.floor(i / 3) * 8
                )
            );
        }
        
        // Demonic portal (source of corruption)
        this.createDemonicPortal(new THREE.Vector3(blockPosition.x, 0, blockPosition.z));
    }
    
    createControlRoom() {
        // Elevated control room overlooking hub
        const roomPosition = new THREE.Vector3(0, 8, 0);
        
        // Glass observation deck
        const deckGeometry = new THREE.CylinderGeometry(8, 8, 3, 16);
        const deckMaterial = new THREE.MeshPhongMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.copy(roomPosition);
        this.scene.add(deck);
        
        // Control panels
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            this.createControlPanel(
                new THREE.Vector3(
                    roomPosition.x + Math.cos(angle) * 5,
                    roomPosition.y - 1,
                    roomPosition.z + Math.sin(angle) * 5
                ),
                ['Fire Suppression', 'Lockdown Override', 'Decontamination', 'Emergency Power'][i]
            );
        }
        
        // Central holographic display
        this.createHolographicDisplay(roomPosition);
    }
    
    createFireHazard(position) {
        const fireGroup = new THREE.Group();
        
        // Fire particles
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = Math.random() * 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            
            const heat = Math.random();
            colors[i * 3] = 1;
            colors[i * 3 + 1] = heat * 0.5;
            colors[i * 3 + 2] = 0;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const fireParticles = new THREE.Points(particles, particleMaterial);
        fireGroup.add(fireParticles);
        
        // Fire light
        const fireLight = new THREE.PointLight(0xff6600, 2, 8);
        fireLight.position.y = 1;
        fireGroup.add(fireLight);
        
        // Animate fire
        const animateFire = () => {
            const positions = fireParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += 0.05;
                if (positions[i * 3 + 1] > 3) {
                    positions[i * 3 + 1] = 0;
                    positions[i * 3] = (Math.random() - 0.5) * 2;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
                }
            }
            fireParticles.geometry.attributes.position.needsUpdate = true;
            
            fireLight.intensity = 1.5 + Math.random() * 0.5;
            
            requestAnimationFrame(animateFire);
        };
        animateFire();
        
        fireGroup.position.copy(position);
        fireGroup.userData = {
            isHazard: true,
            type: 'fire',
            damage: 3,  // Reduced from 10
            radius: 2  // Reduced from 3 for smaller danger zone
        };
        
        this.scene.add(fireGroup);
        this.hazards.fire.push(fireGroup);
    }
    
    createRadiationZone() {
        const zonePosition = new THREE.Vector3(30, 0, 0);
        const zoneRadius = 10;  // Reduced from 15
        
        // Radiation particles (green glow)
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * zoneRadius;
            const height = Math.random() * 10;
            
            positions[i * 3] = zonePosition.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = zonePosition.z + Math.sin(angle) * radius;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const radiationParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(radiationParticles);
        
        // Geiger counter effect
        const geigerTick = () => {
            if (this.game.player) {
                const distance = this.game.player.position.distanceTo(zonePosition);
                if (distance < zoneRadius) {
                    const intensity = 1 - (distance / zoneRadius);
                    // Faster ticking when closer
                    setTimeout(geigerTick, 100 + (1 - intensity) * 900);
                    
                    // Visual feedback
                    if (this.game.narrativeSystem && Math.random() < intensity) {
                        this.game.narrativeSystem.displaySubtitle("*click*");
                    }
                } else {
                    setTimeout(geigerTick, 1000);
                }
            } else {
                setTimeout(geigerTick, 1000);
            }
        };
        geigerTick();
        
        // Radiation warning signs
        this.createRadiationSigns(zonePosition, zoneRadius);
        
        const radiationZone = new THREE.Group();
        radiationZone.add(radiationParticles);
        radiationZone.position.copy(zonePosition);
        radiationZone.userData = {
            isHazard: true,
            type: 'radiation',
            damage: 2,  // Reduced from 3
            radius: zoneRadius
        };
        
        this.hazards.radiation.push(radiationZone);
    }
    
    createElectricalHazards() {
        // Sparking panels and exposed wires
        const positions = [
            new THREE.Vector3(-15, 3, 10),
            new THREE.Vector3(15, 3, -10),
            new THREE.Vector3(0, 5, 15),
            new THREE.Vector3(-20, 2, -20)
        ];
        
        positions.forEach(pos => {
            const hazardGroup = new THREE.Group();
            
            // Exposed panel
            const panelGeometry = new THREE.BoxGeometry(1, 1, 0.2);
            const panelMaterial = new THREE.MeshPhongMaterial({
                color: 0x222222,
                emissive: 0x0000ff,
                emissiveIntensity: 0.2
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            hazardGroup.add(panel);
            
            // Electric arcs
            const createArc = () => {
                if (Math.random() < 0.3) {
                    const arcGeometry = new THREE.BufferGeometry();
                    const arcPoints = [];
                    
                    const start = new THREE.Vector3(0, 0, 0.2);
                    const end = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        0.2
                    );
                    
                    for (let i = 0; i <= 10; i++) {
                        const t = i / 10;
                        const point = new THREE.Vector3().lerpVectors(start, end, t);
                        point.x += (Math.random() - 0.5) * 0.2;
                        point.y += (Math.random() - 0.5) * 0.2;
                        arcPoints.push(point);
                    }
                    
                    arcGeometry.setFromPoints(arcPoints);
                    const arcMaterial = new THREE.LineBasicMaterial({
                        color: 0x00aaff,
                        transparent: true,
                        opacity: 0.8
                    });
                    
                    const arc = new THREE.Line(arcGeometry, arcMaterial);
                    hazardGroup.add(arc);
                    
                    // Flash light
                    panel.material.emissiveIntensity = 1;
                    
                    // Remove arc after brief time
                    setTimeout(() => {
                        hazardGroup.remove(arc);
                        panel.material.emissiveIntensity = 0.2;
                    }, 100);
                }
                
                setTimeout(createArc, 100 + Math.random() * 2000);
            };
            createArc();
            
            hazardGroup.position.copy(pos);
            hazardGroup.userData = {
                isHazard: true,
                type: 'electricity',
                damage: 5,  // Reduced from 15
                radius: 2
            };
            
            this.scene.add(hazardGroup);
            this.hazards.electricity.push(hazardGroup);
        });
    }
    
    createCorruptionZone() {
        const zonePosition = new THREE.Vector3(0, 0, 30);
        const corruption = new THREE.Group();
        
        // Corruption tendrils
        const tendrilCount = 20;
        for (let i = 0; i < tendrilCount; i++) {
            const tendrilGeometry = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 5,
                        Math.random() * 3,
                        (Math.random() - 0.5) * 5
                    ),
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 10,
                        Math.random() * 5,
                        (Math.random() - 0.5) * 10
                    )
                ]),
                20, 0.1, 8, false
            );
            
            const tendrilMaterial = new THREE.MeshPhongMaterial({
                color: 0x440044,
                emissive: 0x880088,
                emissiveIntensity: 0.3
            });
            
            const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
            tendril.position.set(
                (Math.random() - 0.5) * 10,
                0,
                (Math.random() - 0.5) * 10
            );
            
            corruption.add(tendril);
            
            // Animate tendril
            const animateTendril = () => {
                tendril.rotation.y += 0.001;
                tendril.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.001 + i) * 0.2;
                requestAnimationFrame(animateTendril);
            };
            animateTendril();
        }
        
        // Corruption fog
        const fogGeometry = new THREE.SphereGeometry(15, 16, 16);
        const fogMaterial = new THREE.MeshBasicMaterial({
            color: 0x440044,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const fog = new THREE.Mesh(fogGeometry, fogMaterial);
        corruption.add(fog);
        
        // Pulsing effect
        const pulseFog = () => {
            fog.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.1);
            fog.material.opacity = 0.1 + Math.sin(Date.now() * 0.002) * 0.1;
            requestAnimationFrame(pulseFog);
        };
        pulseFog();
        
        corruption.position.copy(zonePosition);
        corruption.userData = {
            isHazard: true,
            type: 'corruption',
            damage: 2,  // Reduced from 5
            radius: 15,
            effect: 'madness' // Special effect - causes hallucinations
        };
        
        this.scene.add(corruption);
        this.hazards.corruption.push(corruption);
    }
    
    createGravityAnomaly() {
        const anomalyPosition = new THREE.Vector3(-30, 5, -30);
        const anomaly = new THREE.Group();
        
        // Distortion sphere
        const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x000088,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        anomaly.add(sphere);
        
        // Floating debris
        const debrisCount = 30;
        const debris = [];
        
        for (let i = 0; i < debrisCount; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 0.5 + 0.1,
                Math.random() * 0.5 + 0.1,
                Math.random() * 0.5 + 0.1
            );
            const debrisMaterial = new THREE.MeshPhongMaterial({
                color: 0x444444
            });
            const debrisPiece = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8 + 2;
            const height = (Math.random() - 0.5) * 10;
            
            debrisPiece.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            debrisPiece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            anomaly.add(debrisPiece);
            debris.push({
                mesh: debrisPiece,
                angle: angle,
                radius: radius,
                height: height,
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                )
            });
        }
        
        // Animate debris orbiting
        const animateDebris = () => {
            debris.forEach((d, i) => {
                const time = Date.now() * 0.0005;
                d.angle += 0.005;
                d.mesh.position.x = Math.cos(d.angle + time) * d.radius;
                d.mesh.position.z = Math.sin(d.angle + time) * d.radius;
                d.mesh.position.y = d.height + Math.sin(time * 2 + i) * 2;
                
                d.mesh.rotation.x += d.rotationSpeed.x;
                d.mesh.rotation.y += d.rotationSpeed.y;
                d.mesh.rotation.z += d.rotationSpeed.z;
            });
            
            sphere.material.opacity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
            
            requestAnimationFrame(animateDebris);
        };
        animateDebris();
        
        anomaly.position.copy(anomalyPosition);
        anomaly.userData = {
            isHazard: true,
            type: 'gravity',
            effect: 'reverse', // Reverses gravity in area
            radius: 10
        };
        
        this.scene.add(anomaly);
        this.hazards.gravity.push(anomaly);
    }
    
    createDemonicPortal(position) {
        const portal = new THREE.Group();
        
        // Portal ring
        const ringGeometry = new THREE.TorusGeometry(3, 0.5, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x440044,
            emissive: 0xff0044,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        portal.add(ring);
        
        // Portal surface
        const portalGeometry = new THREE.CircleGeometry(3, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const portalSurface = new THREE.Mesh(portalGeometry, portalMaterial);
        portalSurface.rotation.x = -Math.PI / 2;
        portal.add(portalSurface);
        
        // Swirling effect
        const swirlGeometry = new THREE.PlaneGeometry(6, 6);
        const swirlMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0044,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 3; i++) {
            const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
            swirl.rotation.x = -Math.PI / 2;
            swirl.position.y = 0.1 + i * 0.1;
            portal.add(swirl);
            
            // Animate swirl
            const animateSwirl = () => {
                swirl.rotation.z += 0.02 * (i + 1);
                swirl.scale.setScalar(1 + Math.sin(Date.now() * 0.001 + i) * 0.2);
                requestAnimationFrame(animateSwirl);
            };
            animateSwirl();
        }
        
        // Demon spawner (tracked for cleanup via BaseLevel interval management)
        this.addInterval(() => {
            if (this.escapedSpecimens < this.maxSpecimens) {
                this.spawnDemonFromPortal(position);
                this.escapedSpecimens++;
            }
        }, 10000); // Spawn every 10 seconds
        
        portal.position.copy(position);
        portal.position.y = 0.1;
        this.scene.add(portal);
    }
    
    spawnDemonFromPortal(portalPosition) {
        const demonTypes = [Hellhound, Imp, Succubus];
        const DemonClass = demonTypes[Math.floor(Math.random() * demonTypes.length)];
        
        const spawnPos = portalPosition.clone();
        spawnPos.x += (Math.random() - 0.5) * 4;
        spawnPos.z += (Math.random() - 0.5) * 4;
        
        const demon = new DemonClass(this.scene, spawnPos);
        
        // Spawn effect
        const spawnEffect = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xff0044,
                transparent: true,
                opacity: 0.8
            })
        );
        spawnEffect.position.copy(spawnPos);
        this.scene.add(spawnEffect);
        
        // Expand and fade
        const animateSpawn = () => {
            spawnEffect.scale.multiplyScalar(1.1);
            spawnEffect.material.opacity *= 0.9;
            
            if (spawnEffect.material.opacity > 0.01) {
                requestAnimationFrame(animateSpawn);
            } else {
                this.scene.remove(spawnEffect);
            }
        };
        animateSpawn();
        
        this.game.enemies.push(demon);
    }
    
    createEnvironmentalEffects() {
        // Alarm lights
        this.addInterval(() => {
            if (this.containmentStatus.cellBlock_A === 'breached') {
                // Flash red lights
                this.scene.traverse(child => {
                    if (child.isLight && child.color.getHex() === 0xff0000) {
                        child.visible = !child.visible;
                    }
                });
            }
        }, 500);
        
        // Smoke effects
        this.createSmoke();
        
        // Emergency announcements
        this.playEmergencyAnnouncements();
    }
    
    createSmoke() {
        // Create procedural smoke particles instead of using texture
        const particleCount = 200;
        const smokeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
            sizes[i] = Math.random() * 3 + 1;
        }
        
        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        smokeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x666666,
            size: 2,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        this.scene.add(smoke);
        
        // Animate smoke particles
        const animateSmoke = () => {
            const positions = smoke.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Move particles upward
                positions[i * 3 + 1] += 0.02;
                
                // Reset particles that go too high
                if (positions[i * 3 + 1] > 10) {
                    positions[i * 3 + 1] = 0;
                    positions[i * 3] = (Math.random() - 0.5) * 60;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
                }
            }
            
            smoke.geometry.attributes.position.needsUpdate = true;
            smoke.rotation.y += 0.001;
            
            requestAnimationFrame(animateSmoke);
        };
        animateSmoke();
    }
    
    playEmergencyAnnouncements() {
        const announcements = [
            "Warning: Containment breach in Cell Block A",
            "Radiation levels critical in Cell Block B",
            "Fire suppression systems offline",
            "Demonic presence detected in Cell Block D",
            "Emergency protocols activated"
        ];
        
        let announcementIndex = 0;
        const playAnnouncement = () => {
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle(
                    `[SYSTEM]: ${announcements[announcementIndex]}`
                );
            }
            
            announcementIndex = (announcementIndex + 1) % announcements.length;
            setTimeout(playAnnouncement, 15000); // Every 15 seconds
        };
        
        setTimeout(playAnnouncement, 5000); // Start after 5 seconds
    }
    
    spawnContainmentEnemies() {
        // Cell Block A - Fire demons
        for (let i = 0; i < 2; i++) {
            const golem = new BrimstoneGolem(
                this.scene,
                new THREE.Vector3(-30 + Math.random() * 10, 0, Math.random() * 20 - 10)
            );
            this.game.enemies.push(golem);
        }
        
        // Cell Block B - Mutated specimens
        const packPositions = [
            new THREE.Vector3(25, 0, -5),
            new THREE.Vector3(30, 0, 0),
            new THREE.Vector3(35, 0, 5)
        ];
        const hellhounds = Hellhound.createPack(this.scene, packPositions);
        hellhounds.forEach(h => this.game.enemies.push(h));
        
        // Cell Block D - Demon Knight guarding portal
        const knight = new DemonKnight(
            this.scene,
            new THREE.Vector3(0, 0, 25)
        );
        this.game.enemies.push(knight);
    }
    
    setupContainmentObjectives() {
        this.objectives = [
            { id: 'restore_fire', text: 'Activate Fire Suppression (Cell Block A)', completed: false },
            { id: 'decontaminate', text: 'Start Decontamination (Cell Block B)', completed: false },
            { id: 'seal_portal', text: 'Close Demonic Portal (Cell Block D)', completed: false },
            { id: 'evacuate', text: 'Reach Emergency Exit', completed: false }
        ];
        
        // Display initial objective
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.setObjective("Restore containment: Activate emergency systems");
            this.game.narrativeSystem.displaySubtitle("WARNING: Multiple containment breaches detected!");
        }
        
        // Create control panels for objectives
        this.createControlPanels();
    }
    
    createControlPanels() {
        // Fire suppression control panel in Cell Block A
        const firePanel = this.createInteractivePanel(
            new THREE.Vector3(-35, 2, 0),
            0xff0000,
            () => {
                this.emergencySystems.fireSupression = true;
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Fire suppression systems activating...");
                }
            }
        );
        
        // Decontamination panel in Cell Block B
        const deconPanel = this.createInteractivePanel(
            new THREE.Vector3(35, 2, 0),
            0x00ff00,
            () => {
                this.emergencySystems.decontamination = true;
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Decontamination protocol initiated...");
                }
            }
        );
        
        // Portal control in Cell Block D (requires defeating enemies first)
        this.portalControl = this.createInteractivePanel(
            new THREE.Vector3(0, 2, 30),
            0x0000ff,
            () => {
                // Check if demon knight is defeated
                const knightDefeated = !this.game.enemies.some(e => 
                    e.type === 'demonKnight' && e.health > 0
                );
                
                if (knightDefeated) {
                    this.portalSealed = true;
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle("Sealing demonic portal...");
                    }
                } else {
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle("Cannot seal portal - Demon Knight still guards it!");
                    }
                }
            }
        );
    }
    
    createInteractivePanel(position, color, onActivate) {
        const panelGroup = new THREE.Group();
        
        // Panel base
        const panelGeometry = new THREE.BoxGeometry(1, 2, 0.2);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panelGroup.add(panel);
        
        // Control button
        const buttonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const buttonMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.z = 0.15;
        button.rotation.x = Math.PI / 2;
        panelGroup.add(button);
        
        panelGroup.position.copy(position);
        this.scene.add(panelGroup);
        
        // Store for interaction
        panelGroup.userData = {
            interactive: true,
            onActivate: onActivate,
            activated: false
        };
        
        this.interactables = this.interactables || [];
        this.interactables.push(panelGroup);
        
        return panelGroup;
    }
    
    checkPanelInteractions() {
        if (!this.game.player || !this.interactables) return;
        
        this.interactables.forEach(panel => {
            if (panel.userData.activated) return;
            
            const distance = this.game.player.position.distanceTo(panel.position);
            if (distance < 3) {
                // Show interaction prompt
                if (this.game.narrativeSystem && !panel.userData.promptShown) {
                    this.game.narrativeSystem.displaySubtitle("Press E to interact");
                    panel.userData.promptShown = true;
                }
                
                // Check for interaction (would need input system)
                // For now, auto-activate when close
                if (distance < 2) {
                    panel.userData.activated = true;
                    panel.userData.onActivate();
                    
                    // Change panel appearance
                    panel.children[0].material.emissiveIntensity = 0.8;
                }
            } else {
                panel.userData.promptShown = false;
            }
        });
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Check hazard damage
        if (this.game.player) {
            this.checkAllHazards(this.game.player);
        }
        
        // Check panel interactions
        this.checkPanelInteractions();
        
        // Update containment status
        this.updateContainmentStatus();
        
        // Check exit portal interaction
        this.checkExitPortalInteraction();
    }
    
    checkAllHazards(player) {
        // Check each hazard type
        Object.keys(this.hazards).forEach(hazardType => {
            this.hazards[hazardType].forEach(hazard => {
                const distance = player.position.distanceTo(hazard.position);
                
                if (distance < hazard.userData.radius) {
                    this.applyHazardEffect(player, hazard.userData);
                }
            });
        });
    }
    
    applyHazardEffect(player, hazardData) {
        if (!player.lastHazardDamage) player.lastHazardDamage = {};
        
        const now = Date.now();
        const lastDamage = player.lastHazardDamage[hazardData.type] || 0;
        
        if (now - lastDamage > 1000) { // Damage once per second
            const hazardName = hazardData.type ? `${hazardData.type} Hazard` : "Environmental Hazard";
            player.takeDamage(hazardData.damage, hazardName);
            player.lastHazardDamage[hazardData.type] = now;
            
            // Special effects
            switch(hazardData.type) {
                case 'fire':
                    // Set on fire effect
                    break;
                case 'radiation':
                    // Green tint to vision
                    break;
                case 'electricity':
                    // Stun briefly
                    player.stunned = true;
                    setTimeout(() => player.stunned = false, 500);
                    break;
                case 'corruption':
                    // Hallucination effect
                    if (hazardData.effect === 'madness') {
                        this.createHallucination();
                    }
                    break;
                case 'gravity':
                    // Reverse controls or float
                    if (hazardData.effect === 'reverse') {
                        player.gravity = -player.gravity;
                        setTimeout(() => player.gravity = -player.gravity, 3000);
                    }
                    break;
            }
            
            // Warning message
            if (this.game.narrativeSystem) {
                const warnings = {
                    fire: "Taking fire damage!",
                    radiation: "Radiation exposure!",
                    electricity: "Electrical shock!",
                    corruption: "Mind corruption!",
                    gravity: "Gravity anomaly!"
                };
                this.game.narrativeSystem.displaySubtitle(warnings[hazardData.type]);
            }
        }
    }
    
    createHallucination() {
        // Create fake enemy that disappears
        const fakeEnemy = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.5
            })
        );
        
        fakeEnemy.position.set(
            this.game.player.position.x + (Math.random() - 0.5) * 10,
            1,
            this.game.player.position.z + (Math.random() - 0.5) * 10
        );
        
        this.scene.add(fakeEnemy);
        
        // Fade out
        const fadeHallucination = () => {
            fakeEnemy.material.opacity *= 0.95;
            if (fakeEnemy.material.opacity > 0.01) {
                requestAnimationFrame(fadeHallucination);
            } else {
                this.scene.remove(fakeEnemy);
            }
        };
        
        setTimeout(fadeHallucination, 1000);
    }
    
    updateContainmentStatus() {
        // Check if objectives are completed
        if (this.emergencySystems.fireSupression) {
            const fireObjective = this.objectives.find(o => o.id === 'restore_fire');
            if (fireObjective && !fireObjective.completed) {
                fireObjective.completed = true;
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Fire suppression activated!");
                    this.updateObjectiveDisplay();
                }
            }
            
            // Extinguish fires
            this.hazards.fire.forEach(fire => {
                fire.visible = false;
            });
        }
        
        if (this.emergencySystems.decontamination) {
            const deconObjective = this.objectives.find(o => o.id === 'decontaminate');
            if (deconObjective && !deconObjective.completed) {
                deconObjective.completed = true;
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Decontamination systems online!");
                    this.updateObjectiveDisplay();
                }
            }
            
            // Reduce radiation
            this.hazards.radiation.forEach(rad => {
                rad.userData.damage = Math.max(1, rad.userData.damage - 0.01);
            });
        }
        
        // Check for portal sealing (all enemies defeated in Cell Block D)
        const portalObjective = this.objectives.find(o => o.id === 'seal_portal');
        if (!portalObjective.completed && this.portalSealed) {
            portalObjective.completed = true;
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle("Demonic portal sealed!");
                this.updateObjectiveDisplay();
            }
        }
        
        // Check if all objectives are complete
        const allComplete = this.objectives.filter(o => o.id !== 'evacuate').every(o => o.completed);
        if (allComplete && !this.exitPortalCreated) {
            this.createExitPortal();
        }
    }
    
    updateObjectiveDisplay() {
        if (!this.game.narrativeSystem) return;
        
        // Count completed objectives
        const completed = this.objectives.filter(o => o.completed && o.id !== 'evacuate').length;
        const total = this.objectives.filter(o => o.id !== 'evacuate').length;
        
        if (completed === total) {
            this.game.narrativeSystem.setObjective("All systems restored! Head to the emergency exit!");
        } else {
            // Show next incomplete objective
            const nextObjective = this.objectives.find(o => !o.completed && o.id !== 'evacuate');
            if (nextObjective) {
                this.game.narrativeSystem.setObjective(`${nextObjective.text} (${completed}/${total} complete)`);
            }
        }
    }
    
    createExitPortal() {
        this.exitPortalCreated = true;
        
        // Create exit portal at emergency exit location
        const portalGroup = new THREE.Group();
        
        // Portal ring
        const ringGeometry = new THREE.TorusGeometry(3, 0.5, 16, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        portalGroup.add(ring);
        
        // Portal surface
        const portalGeometry = new THREE.CircleGeometry(3, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portalGroup.add(portal);
        
        // Position at emergency exit
        portalGroup.position.set(50, 2, 0);
        portalGroup.rotation.y = Math.PI / 2;
        this.scene.add(portalGroup);
        
        // Add light
        const portalLight = new THREE.PointLight(0x00ff00, 2, 10);
        portalLight.position.set(50, 2, 0);
        this.scene.add(portalLight);
        
        // Store for interaction checking
        this.exitPortal = portalGroup;
        
        // Update objective
        const evacuateObjective = this.objectives.find(o => o.id === 'evacuate');
        if (evacuateObjective) {
            evacuateObjective.text = 'Reach Emergency Exit (ACTIVE)';
        }
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.setObjective("All systems restored! Head to the emergency exit!");
            this.game.narrativeSystem.displaySubtitle("Emergency exit portal activated at the east end!");
        }
        
        // Animate portal
        this.addInterval(() => {
            if (ring) {
                ring.rotation.z += 0.02;
                portal.rotation.z -= 0.01;
            }
        }, 16);
    }
    
    checkExitPortalInteraction() {
        if (!this.exitPortal || !this.game.player) return false;
        
        const distance = this.game.player.position.distanceTo(this.exitPortal.position);
        if (distance < 4) {
            // Complete level
            const evacuateObjective = this.objectives.find(o => o.id === 'evacuate');
            if (evacuateObjective) {
                evacuateObjective.completed = true;
            }
            
            this.completed = true;
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle("Containment Level Complete!");
            }
            
            // Load next level after delay
            setTimeout(() => {
                if (this.game.loadNextLevel) {
                    this.game.loadNextLevel();
                }
            }, 2000);
            return true;
        }
        return false;
    }
    
    // Helper methods
    createFloorMarkings(radius) {
        // Create warning stripes on floor
        const stripeCount = 8;
        for (let i = 0; i < stripeCount; i++) {
            const angle = (i / stripeCount) * Math.PI * 2;
            const stripeGeometry = new THREE.PlaneGeometry(2, radius * 0.8);
            const stripeMaterial = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xffff00 : 0x000000,
                side: THREE.DoubleSide
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.rotation.z = angle;
            stripe.position.set(
                Math.cos(angle) * radius * 0.4,
                0.01,
                Math.sin(angle) * radius * 0.4
            );
            this.scene.add(stripe);
        }
    }
    
    createSafePathMarkings() {
        // Create green safe path indicators
        const pathMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Safe path to south (player spawn)
        const southPath = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 20),
            pathMaterial
        );
        southPath.rotation.x = -Math.PI / 2;
        southPath.position.set(0, 0.02, 10);
        this.scene.add(southPath);
        
        // Safe corridor to control room (avoiding hazards)
        const controlPath = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 15),
            pathMaterial
        );
        controlPath.rotation.x = -Math.PI / 2;
        controlPath.position.set(0, 0.02, -7.5);
        this.scene.add(controlPath);
        
        // Add warning text on first spawn
        if (!this.warningsShown) {
            this.warningsShown = true;
            setTimeout(() => {
                if (this.game && this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("WARNING: Hazardous areas detected. Follow green paths for safe passage.");
                }
            }, 1000);
        }
    }
    
    createDamagedWalls(position) {
        // Would create damaged wall geometry
    }
    
    createBrokenCell(position) {
        // Would create broken cell structure
    }
    
    createBrokenSprinklers(position) {
        // Would create broken sprinkler effects
    }
    
    createRadiationLeak(position) {
        // Would create radiation leak visuals
    }
    
    createContaminatedCell(position) {
        // Would create contaminated cell
    }
    
    createHazmatStation(position) {
        // Would create hazmat equipment station
    }
    
    createBlastDoor(position) {
        // Would create blast door
    }
    
    createHighSecurityCell(position) {
        // Would create high security cell
    }
    
    createSecuritySystems(position) {
        // Would create security systems
    }
    
    createCorruptedCell(position) {
        // Would create corrupted cell
    }
    
    createCorruptionSpread(position) {
        // Would create corruption spread effect
    }
    
    createEmergencyCorridors() {
        // Would create emergency corridors
    }
    
    createControlPanel(position, label) {
        // Would create control panel
    }
    
    createHolographicDisplay(position) {
        // Would create holographic display
    }
    
    createRadiationSigns(position, radius) {
        // Would create radiation warning signs
    }
}
