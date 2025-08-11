import { BaseLevel } from './baseLevel.js';
import * as THREE from 'three';

export class FinalArenaLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.name = "Final Arena";
        this.description = "Face the ultimate evil in the depths of Hell itself";
        this.backgroundColor = new THREE.Color(0x1a0000);
        
        this.arenaRadius = 50;
        this.currentPhase = 0;
        this.maxPhases = 5;
        this.phaseTransitions = [];
        
        // Arena components
        this.centralPlatform = null;
        this.outerRings = [];
        this.bridgePlatforms = [];
        this.lavaFields = [];
        this.hellPortals = [];
        this.sacrificialAltars = [];
        this.demoniPillars = [];
        
        // Environmental effects
        this.hellfire = [];
        this.soulOrbs = [];
        this.corruptionZones = [];
        this.realityRifts = [];
        
        // Boss battle mechanics
        this.bossSpawnPoint = null;
        this.playerSafeZones = [];
        this.weaponUpgradeStations = [];
        this.holyRelicPedestals = [];
        
        // Phase-specific features
        this.movingPlatforms = [];
        this.fallingDebris = [];
        this.energyBarriers = [];
        this.temporalDistortions = [];
        
        this.arenaDestroyed = false;
        this.finalBossDefeated = false;
        this.apocalypseStarted = false;
        
        this.init();
    }

    init() {
        this.createGeometry();
        this.createLighting();
        this.createCentralPlatform();
        this.createOuterRings();
        this.createBridgePlatforms();
        this.createLavaFields();
        this.createHellPortals();
        this.createSacrificialAltars();
        this.createDemonicPillars();
        this.createEnvironmentalEffects();
        this.createBossSpawnPoint();
        this.createPlayerUtilities();
        this.setupObjectives();
        this.createEnvironmentalDetails();
    }

    createGeometry() {
        // Hell bedrock foundation
        const foundationGeometry = new THREE.CylinderGeometry(this.arenaRadius + 20, this.arenaRadius + 20, 5);
        const foundationMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a0a0a,
            emissive: 0x110000
        });
        const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
        foundation.position.y = -2.5;
        this.scene.add(foundation);
        
        // Outer rim with jagged edges
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const variation = 0.8 + Math.random() * 0.4; // Random jagged edge
            const radius = (this.arenaRadius + 15) * variation;
            
            const spikeGeometry = new THREE.ConeGeometry(2, 8 + Math.random() * 6, 6);
            const spikeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a1a1a,
                emissive: 0x221111
            });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(
                Math.cos(angle) * radius,
                4 + Math.random() * 4,
                Math.sin(angle) * radius
            );
            spike.rotation.z = (Math.random() - 0.5) * 0.5;
            this.scene.add(spike);
        }
        
        // Abyssal depths beyond arena
        this.createAbyssalDepths();
    }

    createAbyssalDepths() {
        // Create the illusion of infinite depth
        for (let depth = 1; depth <= 10; depth++) {
            const depthRadius = this.arenaRadius + 20 + depth * 10;
            const depthY = -depth * 15;
            
            const depthRingGeometry = new THREE.RingGeometry(depthRadius - 5, depthRadius, 16);
            const depthRingMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0, 0.8, Math.max(0.1, 0.5 - depth * 0.04)),
                transparent: true,
                opacity: Math.max(0.1, 0.6 - depth * 0.05),
                side: THREE.DoubleSide
            });
            const depthRing = new THREE.Mesh(depthRingGeometry, depthRingMaterial);
            depthRing.rotation.x = -Math.PI / 2;
            depthRing.position.y = depthY;
            this.scene.add(depthRing);
            
            // Add occasional demonic structures in the abyss
            if (depth % 3 === 0) {
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const structureGeometry = new THREE.ConeGeometry(3, 20, 6);
                    const structureMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0x1a0000,
                        transparent: true,
                        opacity: 0.3
                    });
                    const structure = new THREE.Mesh(structureGeometry, structureMaterial);
                    structure.position.set(
                        Math.cos(angle) * depthRadius,
                        depthY - 10,
                        Math.sin(angle) * depthRadius
                    );
                    this.scene.add(structure);
                }
            }
        }
    }

    createLighting() {
        // Hellish ambient lighting
        const ambientLight = new THREE.AmbientLight(0x660000, 0.4);
        this.scene.add(ambientLight);

        // Central hellfire light source
        const hellfireLight = new THREE.PointLight(0xff2200, 4, 80);
        hellfireLight.position.set(0, 15, 0);
        this.scene.add(hellfireLight);
        
        // Flickering hellfire animation
        this.animateHellfire(hellfireLight);
        
        // Perimeter fires
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const fireLight = new THREE.PointLight(0xff4400, 2, 25);
            fireLight.position.set(
                Math.cos(angle) * (this.arenaRadius - 5),
                3,
                Math.sin(angle) * (this.arenaRadius - 5)
            );
            this.scene.add(fireLight);
            this.hellfire.push(fireLight);
            
            // Animate each fire independently
            this.animatePerimeterFire(fireLight);
        }
    }

    animateHellfire(light) {
        const originalIntensity = light.intensity;
        setInterval(() => {
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.01) * 0.5 + Math.random() * 0.3;
            light.color.setRGB(
                1.0,
                0.1 + Math.random() * 0.2,
                Math.random() * 0.1
            );
        }, 100);
    }

    animatePerimeterFire(light) {
        const originalIntensity = light.intensity;
        const phase = Math.random() * Math.PI * 2;
        setInterval(() => {
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.008 + phase) * 0.3;
        }, 150);
    }

    createCentralPlatform() {
        const centralGroup = new THREE.Group();
        
        // Main platform
        const platformGeometry = new THREE.CylinderGeometry(12, 12, 3, 16);
        const platformMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a2a2a,
            emissive: 0x221111
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 1.5;
        centralGroup.add(platform);
        
        // Demonic runes around the edge
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const runeGeometry = new THREE.BoxGeometry(0.8, 0.2, 2);
            const runeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                emissive: 0x880000
            });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                Math.cos(angle) * 11,
                2.8,
                Math.sin(angle) * 11
            );
            rune.rotation.y = angle + Math.PI/2;
            centralGroup.add(rune);
        }
        
        // Central summoning circle
        const circleGeometry = new THREE.RingGeometry(4, 5, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4444,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 3.1;
        centralGroup.add(circle);
        
        // Animate the summoning circle
        this.animateSummoningCircle(circle);
        
        centralGroup.position.set(0, 0, 0);
        this.centralPlatform = centralGroup;
        this.scene.add(centralGroup);
    }

    animateSummoningCircle(circle) {
        setInterval(() => {
            circle.rotation.z += 0.01;
            circle.material.opacity = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
        }, 16);
    }

    createOuterRings() {
        const ringRadii = [20, 30, 40];
        const ringHeights = [0, -3, -6];
        
        ringRadii.forEach((radius, index) => {
            const ring = this.createOuterRing(radius, ringHeights[index], index);
            this.outerRings.push(ring);
            this.scene.add(ring);
        });
    }

    createOuterRing(radius, height, index) {
        const ringGroup = new THREE.Group();
        
        // Ring platform sections (not complete rings, broken for gaps)
        const sectionCount = 12;
        const gapProbability = 0.2; // 20% chance of gap
        
        for (let i = 0; i < sectionCount; i++) {
            if (Math.random() > gapProbability) {
                const angle = (i / sectionCount) * Math.PI * 2;
                const sectionAngle = (Math.PI * 2 / sectionCount) * 0.8; // Leave gaps
                
                const sectionGeometry = new THREE.RingGeometry(radius - 3, radius + 3, 4, 1, angle - sectionAngle/2, sectionAngle);
                const sectionMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x3a1a1a,
                    emissive: 0x110000
                });
                const section = new THREE.Mesh(sectionGeometry, sectionMaterial);
                section.rotation.x = -Math.PI / 2;
                section.position.y = height + 1;
                ringGroup.add(section);
                
                // Add supports underneath
                const supportGeometry = new THREE.CylinderGeometry(1, 1.5, Math.abs(height) + 2);
                const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x2a1a1a });
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(
                    Math.cos(angle) * radius,
                    height / 2,
                    Math.sin(angle) * radius
                );
                ringGroup.add(support);
            }
        }
        
        ringGroup.userData.radius = radius;
        ringGroup.userData.height = height;
        ringGroup.userData.index = index;
        
        return ringGroup;
    }

    createBridgePlatforms() {
        // Bridges connecting central platform to outer rings
        const bridgeAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
        
        bridgeAngles.forEach(angle => {
            const bridge = this.createBridge(angle);
            this.bridgePlatforms.push(bridge);
            this.scene.add(bridge);
        });
    }

    createBridge(angle) {
        const bridgeGroup = new THREE.Group();
        
        // Bridge span from central platform (radius 12) to first ring (radius 17)
        const bridgeLength = 8;
        const bridgeWidth = 4;
        
        const bridgeGeometry = new THREE.BoxGeometry(bridgeLength, 1, bridgeWidth);
        const bridgeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a3a3a,
            emissive: 0x221111
        });
        const bridgePlatform = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridgePlatform.position.set(
            Math.cos(angle) * 16,
            2,
            Math.sin(angle) * 16
        );
        bridgePlatform.rotation.y = angle + Math.PI/2;
        bridgeGroup.add(bridgePlatform);
        
        // Bridge supports
        for (let i = 0; i < 3; i++) {
            const supportGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8);
            const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a2a });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(
                Math.cos(angle) * (14 + i * 4),
                -2,
                Math.sin(angle) * (14 + i * 4)
            );
            bridgeGroup.add(support);
        }
        
        // Side railings
        for (let side = -1; side <= 1; side += 2) {
            const railingGeometry = new THREE.BoxGeometry(bridgeLength, 2, 0.2);
            const railingMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a4a });
            const railing = new THREE.Mesh(railingGeometry, railingMaterial);
            railing.position.set(
                Math.cos(angle) * 16,
                3,
                Math.sin(angle) * 16 + side * bridgeWidth/2
            );
            railing.rotation.y = angle + Math.PI/2;
            bridgeGroup.add(railing);
        }
        
        bridgeGroup.userData.angle = angle;
        bridgeGroup.userData.destructible = true;
        bridgeGroup.userData.platform = bridgePlatform;
        
        return bridgeGroup;
    }

    createLavaFields() {
        // Lava pools between the rings
        const lavaPositions = [
            { x: 25, z: 25, radius: 8 },
            { x: -25, z: -25, radius: 8 },
            { x: 25, z: -25, radius: 6 },
            { x: -25, z: 25, radius: 6 },
            { x: 35, z: 0, radius: 5 },
            { x: -35, z: 0, radius: 5 },
            { x: 0, z: 35, radius: 5 },
            { x: 0, z: -35, radius: 5 }
        ];
        
        lavaPositions.forEach(pos => {
            const lava = this.createLavaField(pos.x, pos.z, pos.radius);
            this.lavaFields.push(lava);
            this.scene.add(lava);
        });
    }

    createLavaField(x, z, radius) {
        const lavaGroup = new THREE.Group();
        
        // Lava surface
        const lavaGeometry = new THREE.CircleGeometry(radius, 16);
        const lavaMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            emissive: 0xff2200,
            transparent: true,
            opacity: 0.9
        });
        const lavaSurface = new THREE.Mesh(lavaGeometry, lavaMaterial);
        lavaSurface.rotation.x = -Math.PI / 2;
        lavaSurface.position.y = -1;
        lavaGroup.add(lavaSurface);
        
        // Lava glow
        const lavaLight = new THREE.PointLight(0xff4400, 2, radius * 3);
        lavaLight.position.set(0, 2, 0);
        lavaGroup.add(lavaLight);
        
        // Lava bubbles/particles
        this.createLavaParticles(lavaGroup, radius);
        
        // Animate lava surface
        this.animateLava(lavaSurface, lavaLight);
        
        lavaGroup.position.set(x, 0, z);
        lavaGroup.userData.radius = radius;
        lavaGroup.userData.surface = lavaSurface;
        lavaGroup.userData.light = lavaLight;
        
        return lavaGroup;
    }

    createLavaParticles(lavaGroup, radius) {
        const particleCount = 30;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 0.8;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = Math.random() * 5;
            positions[i * 3 + 2] = Math.sin(angle) * distance;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.3 + Math.random() * 0.4;
            colors[i * 3 + 2] = 0;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.002;
            velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        lavaGroup.add(particleSystem);
        lavaGroup.userData.particles = particleSystem;
    }

    animateLava(surface, light) {
        const originalIntensity = light.intensity;
        setInterval(() => {
            surface.rotation.z += 0.005;
            surface.material.emissive.setRGB(
                1.0,
                0.2 + Math.sin(Date.now() * 0.003) * 0.1,
                Math.sin(Date.now() * 0.007) * 0.1
            );
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.004) * 0.5;
        }, 50);
    }

    createHellPortals() {
        // Hell portals for spawning enemies and phase transitions
        const portalPositions = [
            { x: 0, y: 8, z: 45, type: 'spawn' },
            { x: 45, y: 8, z: 0, type: 'spawn' },
            { x: 0, y: 8, z: -45, type: 'spawn' },
            { x: -45, y: 8, z: 0, type: 'spawn' },
            { x: 32, y: 12, z: 32, type: 'boss' },
            { x: -32, y: 12, z: -32, type: 'boss' }
        ];
        
        portalPositions.forEach(pos => {
            const portal = this.createHellPortal(pos.x, pos.y, pos.z, pos.type);
            this.hellPortals.push(portal);
            this.scene.add(portal);
        });
    }

    createHellPortal(x, y, z, type) {
        const portalGroup = new THREE.Group();
        
        // Portal frame
        const frameRadius = type === 'boss' ? 6 : 4;
        const frameGeometry = new THREE.TorusGeometry(frameRadius, 0.8, 8, 16);
        const frameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x880000,
            emissive: 0x440000
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        portalGroup.add(frame);
        
        // Portal energy
        const energyGeometry = new THREE.CircleGeometry(frameRadius * 0.9, 32);
        const energyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const energy = new THREE.Mesh(energyGeometry, energyMaterial);
        portalGroup.add(energy);
        
        // Portal light
        const portalLight = new THREE.PointLight(0xff2200, 2, frameRadius * 4);
        portalGroup.add(portalLight);
        
        // Portal particles
        this.createPortalParticles(portalGroup, frameRadius);
        
        // Animate portal
        this.animatePortal(frame, energy, portalLight);
        
        portalGroup.position.set(x, y, z);
        portalGroup.userData.type = type;
        portalGroup.userData.radius = frameRadius;
        portalGroup.userData.active = false;
        portalGroup.userData.frame = frame;
        portalGroup.userData.energy = energy;
        
        return portalGroup;
    }

    createPortalParticles(portalGroup, radius) {
        const particleCount = 60;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 1.2;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = Math.sin(angle) * distance;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = Math.random() * 0.3;
            colors[i * 3 + 2] = Math.random() * 0.2;
            
            velocities[i * 3] = -Math.cos(angle) * 0.01;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 2] = -Math.sin(angle) * 0.01;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        portalGroup.add(particleSystem);
        portalGroup.userData.particles = particleSystem;
    }

    animatePortal(frame, energy, light) {
        const originalIntensity = light.intensity;
        setInterval(() => {
            frame.rotation.x += 0.01;
            frame.rotation.z += 0.008;
            energy.rotation.z -= 0.02;
            energy.material.opacity = 0.5 + Math.sin(Date.now() * 0.006) * 0.2;
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.004) * 0.3;
        }, 16);
    }

    createSacrificialAltars() {
        // Altars that can provide power-ups or trigger events
        const altarPositions = [
            { x: 28, z: 0, type: 'power' },
            { x: -28, z: 0, type: 'health' },
            { x: 0, z: 28, type: 'weapon' },
            { x: 0, z: -28, type: 'relic' }
        ];
        
        altarPositions.forEach(pos => {
            const altar = this.createSacrificialAltar(pos.x, pos.z, pos.type);
            this.sacrificialAltars.push(altar);
            this.scene.add(altar);
        });
    }

    createSacrificialAltar(x, z, type) {
        const altarGroup = new THREE.Group();
        
        // Altar base
        const baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a1a1a,
            emissive: 0x111100
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        altarGroup.add(base);
        
        // Altar top
        const topGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
        const topMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a2a2a,
            emissive: 0x221111
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 2.25;
        altarGroup.add(top);
        
        // Type-specific altar piece
        let altarPiece;
        const pieceColor = this.getAltarColor(type);
        
        switch (type) {
            case 'power':
                altarPiece = new THREE.Mesh(
                    new THREE.SphereGeometry(0.8, 16, 16),
                    new THREE.MeshBasicMaterial({ 
                        color: pieceColor,
                        emissive: pieceColor,
                        transparent: true,
                        opacity: 0.8
                    })
                );
                break;
            case 'health':
                altarPiece = new THREE.Mesh(
                    new THREE.ConeGeometry(0.8, 1.5, 4),
                    new THREE.MeshBasicMaterial({ 
                        color: pieceColor,
                        emissive: pieceColor
                    })
                );
                break;
            case 'weapon':
                altarPiece = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 2, 0.3),
                    new THREE.MeshBasicMaterial({ 
                        color: pieceColor,
                        emissive: pieceColor
                    })
                );
                break;
            case 'relic':
                altarPiece = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.6, 0.6, 1, 6),
                    new THREE.MeshBasicMaterial({ 
                        color: pieceColor,
                        emissive: pieceColor
                    })
                );
                break;
        }
        
        altarPiece.position.y = 3;
        altarGroup.add(altarPiece);
        
        // Altar flames
        const flameLight = new THREE.PointLight(pieceColor, 1.5, 15);
        flameLight.position.y = 4;
        altarGroup.add(flameLight);
        
        // Animate altar piece
        this.animateAltarPiece(altarPiece, flameLight);
        
        altarGroup.position.set(x, 0, z);
        altarGroup.userData.type = type;
        altarGroup.userData.piece = altarPiece;
        altarGroup.userData.used = false;
        
        return altarGroup;
    }

    getAltarColor(type) {
        const colors = {
            power: 0x0088ff,
            health: 0x00ff00,
            weapon: 0xff8800,
            relic: 0xff00ff
        };
        return colors[type] || 0xffffff;
    }

    animateAltarPiece(piece, light) {
        const originalY = piece.position.y;
        const originalIntensity = light.intensity;
        setInterval(() => {
            piece.position.y = originalY + Math.sin(Date.now() * 0.003) * 0.3;
            piece.rotation.y += 0.02;
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.005) * 0.3;
        }, 16);
    }

    createDemonicPillars() {
        // Towering pillars around the arena
        const pillarPositions = [
            { x: 50, z: 0, height: 25 },
            { x: -50, z: 0, height: 25 },
            { x: 0, z: 50, height: 25 },
            { x: 0, z: -50, height: 25 },
            { x: 35, z: 35, height: 30 },
            { x: -35, z: -35, height: 30 },
            { x: 35, z: -35, height: 30 },
            { x: -35, z: 35, height: 30 }
        ];
        
        pillarPositions.forEach(pos => {
            const pillar = this.createDemonicPillar(pos.x, pos.z, pos.height);
            this.demoniPillars.push(pillar);
            this.scene.add(pillar);
        });
    }

    createDemonicPillar(x, z, height) {
        const pillarGroup = new THREE.Group();
        
        // Main pillar structure - tapering upward
        const pillarGeometry = new THREE.CylinderGeometry(2, 4, height, 6);
        const pillarMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a1a1a,
            emissive: 0x111100
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = height / 2;
        pillarGroup.add(pillar);
        
        // Demonic carvings/runes
        for (let i = 0; i < 6; i++) {
            const runeHeight = (height / 6) * i + 2;
            const angle = (i / 6) * Math.PI * 2;
            
            const runeGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.2);
            const runeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff2200,
                emissive: 0x880000
            });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                Math.cos(angle) * 3,
                runeHeight,
                Math.sin(angle) * 3
            );
            rune.rotation.y = angle + Math.PI;
            pillarGroup.add(rune);
        }
        
        // Top flame
        const flameGeometry = new THREE.ConeGeometry(1.5, 4, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            emissive: 0xff2200,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = height + 2;
        pillarGroup.add(flame);
        
        // Flame light
        const flameLight = new THREE.PointLight(0xff4400, 2, 30);
        flameLight.position.y = height + 3;
        pillarGroup.add(flameLight);
        
        // Animate flame
        this.animatePillarFlame(flame, flameLight);
        
        pillarGroup.position.set(x, 0, z);
        pillarGroup.userData.height = height;
        pillarGroup.userData.flame = flame;
        pillarGroup.userData.destructible = true;
        
        return pillarGroup;
    }

    animatePillarFlame(flame, light) {
        const originalIntensity = light.intensity;
        setInterval(() => {
            flame.rotation.y += 0.03;
            flame.scale.y = 1 + Math.sin(Date.now() * 0.008) * 0.2;
            flame.material.opacity = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
            light.intensity = originalIntensity + Math.sin(Date.now() * 0.006) * 0.4;
        }, 16);
    }

    createEnvironmentalEffects() {
        this.createSoulOrbs();
        this.createCorruptionZones();
        this.createRealityRifts();
        this.createAtmosphericParticles();
    }

    createSoulOrbs() {
        // Floating soul orbs that provide atmosphere and can be collected
        for (let i = 0; i < 15; i++) {
            const soulOrb = this.createSoulOrb();
            this.soulOrbs.push(soulOrb);
            this.scene.add(soulOrb);
        }
    }

    createSoulOrb() {
        const orbGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const orbMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x88ffff,
            emissive: 0x4488aa,
            transparent: true,
            opacity: 0.6
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        // Random position within arena bounds
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 30;
        orb.position.set(
            Math.cos(angle) * radius,
            5 + Math.random() * 15,
            Math.sin(angle) * radius
        );
        
        // Movement pattern
        orb.userData.basePosition = orb.position.clone();
        orb.userData.driftSpeed = 0.5 + Math.random() * 1;
        orb.userData.driftRadius = 3 + Math.random() * 5;
        orb.userData.phase = Math.random() * Math.PI * 2;
        
        this.animateSoulOrb(orb);
        
        return orb;
    }

    animateSoulOrb(orb) {
        setInterval(() => {
            const time = Date.now() * 0.001;
            orb.position.x = orb.userData.basePosition.x + 
                Math.cos(time * orb.userData.driftSpeed + orb.userData.phase) * orb.userData.driftRadius;
            orb.position.y = orb.userData.basePosition.y + 
                Math.sin(time * orb.userData.driftSpeed * 0.7 + orb.userData.phase) * 2;
            orb.position.z = orb.userData.basePosition.z + 
                Math.sin(time * orb.userData.driftSpeed + orb.userData.phase) * orb.userData.driftRadius;
                
            orb.rotation.x += 0.01;
            orb.rotation.y += 0.02;
        }, 16);
    }

    createCorruptionZones() {
        // Areas of reality corruption that affect gameplay
        const zonePositions = [
            { x: 22, z: 22, radius: 6 },
            { x: -22, z: -22, radius: 6 },
            { x: 22, z: -22, radius: 5 },
            { x: -22, z: 22, radius: 5 }
        ];
        
        zonePositions.forEach(pos => {
            const zone = this.createCorruptionZone(pos.x, pos.z, pos.radius);
            this.corruptionZones.push(zone);
            this.scene.add(zone);
        });
    }

    createCorruptionZone(x, z, radius) {
        const zoneGroup = new THREE.Group();
        
        // Corruption field
        const fieldGeometry = new THREE.CylinderGeometry(radius, radius, 10, 16);
        const fieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x440088,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.y = 5;
        zoneGroup.add(field);
        
        // Corruption particles
        this.createCorruptionParticles(zoneGroup, radius);
        
        // Animate corruption field
        setInterval(() => {
            field.rotation.y += 0.01;
            field.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            field.material.opacity = 0.1 + Math.sin(Date.now() * 0.004) * 0.05;
        }, 16);
        
        zoneGroup.position.set(x, 0, z);
        zoneGroup.userData.radius = radius;
        zoneGroup.userData.field = field;
        
        return zoneGroup;
    }

    createCorruptionParticles(zoneGroup, radius) {
        const particleCount = 40;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = Math.sin(angle) * distance;
            
            colors[i * 3] = 0.3 + Math.random() * 0.3;
            colors[i * 3 + 1] = 0.1;
            colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        zoneGroup.add(particleSystem);
    }

    createRealityRifts() {
        // Tears in reality that can transport player or create hazards
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const rift = this.createRealityRift(
                Math.cos(angle) * 38,
                12,
                Math.sin(angle) * 38
            );
            this.realityRifts.push(rift);
            this.scene.add(rift);
        }
    }

    createRealityRift(x, y, z) {
        const riftGroup = new THREE.Group();
        
        // Rift geometry - jagged tear
        const riftShape = new THREE.Shape();
        riftShape.moveTo(0, -3);
        riftShape.lineTo(1, -2);
        riftShape.lineTo(0.5, -1);
        riftShape.lineTo(2, 0);
        riftShape.lineTo(0.8, 1);
        riftShape.lineTo(1.5, 2);
        riftShape.lineTo(0, 3);
        riftShape.lineTo(-1.5, 2);
        riftShape.lineTo(-0.8, 1);
        riftShape.lineTo(-2, 0);
        riftShape.lineTo(-0.5, -1);
        riftShape.lineTo(-1, -2);
        riftShape.lineTo(0, -3);
        
        const riftGeometry = new THREE.ShapeGeometry(riftShape);
        const riftMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const rift = new THREE.Mesh(riftGeometry, riftMaterial);
        riftGroup.add(rift);
        
        // Rift energy border
        const borderMaterial = new THREE.LineBasicMaterial({ 
            color: 0x8800ff,
            linewidth: 3
        });
        const borderGeometry = new THREE.EdgesGeometry(riftGeometry);
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        riftGroup.add(border);
        
        // Rift particles
        this.createRiftParticles(riftGroup);
        
        // Animate rift
        setInterval(() => {
            rift.rotation.z += 0.005;
            border.material.opacity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
        }, 16);
        
        riftGroup.position.set(x, y, z);
        riftGroup.userData.isRift = true;
        
        return riftGroup;
    }

    createRiftParticles(riftGroup) {
        const particleCount = 25;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            
            colors[i * 3] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 1] = 0.2;
            colors[i * 3 + 2] = 1.0;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        riftGroup.add(particleSystem);
        riftGroup.userData.particles = particleSystem;
    }

    createAtmosphericParticles() {
        // Ambient particles for atmosphere
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            
            colors[i * 3] = 0.3 + Math.random() * 0.4;
            colors[i * 3 + 1] = 0.1 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.1 + Math.random() * 0.2;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 1] = Math.random() * 0.01;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.4
        });
        
        this.atmosphericParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.atmosphericParticles);
    }

    createBossSpawnPoint() {
        // Central spawn point for the final boss
        const spawnGroup = new THREE.Group();
        
        // Spawn circle
        const spawnGeometry = new THREE.RingGeometry(6, 8, 32);
        const spawnMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.0, // Initially invisible
            side: THREE.DoubleSide
        });
        const spawnCircle = new THREE.Mesh(spawnGeometry, spawnMaterial);
        spawnCircle.rotation.x = -Math.PI / 2;
        spawnCircle.position.y = 3.5;
        spawnGroup.add(spawnCircle);
        
        spawnGroup.position.set(0, 0, 0);
        spawnGroup.userData.circle = spawnCircle;
        spawnGroup.userData.activated = false;
        
        this.bossSpawnPoint = spawnGroup;
        this.scene.add(spawnGroup);
    }

    createPlayerUtilities() {
        this.createPlayerSafeZones();
        this.createWeaponUpgradeStations();
        this.createHolyRelicPedestals();
    }

    createPlayerSafeZones() {
        // Safe zones that provide temporary protection
        const safeZonePositions = [
            { x: 15, z: 0 }, { x: -15, z: 0 },
            { x: 0, z: 15 }, { x: 0, z: -15 }
        ];
        
        safeZonePositions.forEach(pos => {
            const safeZone = this.createSafeZone(pos.x, pos.z);
            this.playerSafeZones.push(safeZone);
            this.scene.add(safeZone);
        });
    }

    createSafeZone(x, z) {
        const zoneGroup = new THREE.Group();
        
        // Safe zone field
        const fieldGeometry = new THREE.CylinderGeometry(4, 4, 6, 16);
        const fieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.y = 3;
        zoneGroup.add(field);
        
        // Safe zone light
        const zoneLight = new THREE.PointLight(0x00aaff, 1, 12);
        zoneLight.position.y = 3;
        zoneGroup.add(zoneLight);
        
        // Animate safe zone
        setInterval(() => {
            field.rotation.y += 0.02;
            field.material.opacity = 0.08 + Math.sin(Date.now() * 0.005) * 0.03;
            zoneLight.intensity = 0.8 + Math.sin(Date.now() * 0.006) * 0.2;
        }, 16);
        
        zoneGroup.position.set(x, 0, z);
        zoneGroup.userData.radius = 4;
        zoneGroup.userData.isSafeZone = true;
        
        return zoneGroup;
    }

    createWeaponUpgradeStations() {
        // Stations for upgrading weapons during boss fight
        const stationPositions = [
            { x: 25, z: 15 }, { x: -25, z: -15 }
        ];
        
        stationPositions.forEach(pos => {
            const station = this.createUpgradeStation(pos.x, pos.z);
            this.weaponUpgradeStations.push(station);
            this.scene.add(station);
        });
    }

    createUpgradeStation(x, z) {
        const stationGroup = new THREE.Group();
        
        // Station base
        const baseGeometry = new THREE.BoxGeometry(3, 4, 3);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a8a,
            emissive: 0x222244
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 2;
        stationGroup.add(base);
        
        // Upgrade hologram
        const holoGeometry = new THREE.SphereGeometry(1, 16, 16);
        const holoMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const holo = new THREE.Mesh(holoGeometry, holoMaterial);
        holo.position.y = 5;
        stationGroup.add(holo);
        
        // Animate hologram
        setInterval(() => {
            holo.rotation.y += 0.03;
            holo.scale.setScalar(1 + Math.sin(Date.now() * 0.007) * 0.1);
        }, 16);
        
        stationGroup.position.set(x, 0, z);
        stationGroup.userData.holo = holo;
        stationGroup.userData.isUpgradeStation = true;
        
        return stationGroup;
    }

    createHolyRelicPedestals() {
        // Pedestals holding powerful holy relics
        const relicPositions = [
            { x: 18, z: 18, relic: 'crown' },
            { x: -18, z: -18, relic: 'chalice' }
        ];
        
        relicPositions.forEach(pos => {
            const pedestal = this.createRelicPedestal(pos.x, pos.z, pos.relic);
            this.holyRelicPedestals.push(pedestal);
            this.scene.add(pedestal);
        });
    }

    createRelicPedestal(x, z, relicType) {
        const pedestalGroup = new THREE.Group();
        
        // Pedestal base
        const baseGeometry = new THREE.CylinderGeometry(2, 2.5, 3, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8a8a4a,
            emissive: 0x444422
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1.5;
        pedestalGroup.add(base);
        
        // Relic
        let relic;
        switch (relicType) {
            case 'crown':
                relic = new THREE.Mesh(
                    new THREE.ConeGeometry(0.8, 1.2, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: 0xffff00,
                        emissive: 0x888800
                    })
                );
                break;
            case 'chalice':
                relic = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: 0xffaa00,
                        emissive: 0x884400
                    })
                );
                break;
        }
        
        relic.position.y = 4;
        pedestalGroup.add(relic);
        
        // Relic aura
        const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.y = 4;
        pedestalGroup.add(aura);
        
        // Animate relic
        setInterval(() => {
            relic.rotation.y += 0.02;
            relic.position.y = 4 + Math.sin(Date.now() * 0.004) * 0.2;
            aura.rotation.x += 0.01;
            aura.rotation.y -= 0.015;
        }, 16);
        
        pedestalGroup.position.set(x, 0, z);
        pedestalGroup.userData.relicType = relicType;
        pedestalGroup.userData.relic = relic;
        pedestalGroup.userData.taken = false;
        
        return pedestalGroup;
    }

    setupObjectives() {
        this.objectives = [
            {
                id: 'survive_phases',
                description: `Survive boss phases (${this.currentPhase}/${this.maxPhases})`,
                completed: false,
                type: 'survival'
            },
            {
                id: 'defeat_final_boss',
                description: 'Defeat the ultimate evil',
                completed: false,
                type: 'boss'
            },
            {
                id: 'prevent_apocalypse',
                description: 'Prevent the final apocalypse',
                completed: false,
                type: 'world'
            }
        ];
    }

    createEnvironmentalDetails() {
        this.createDebris();
        this.createBonePiles();
        this.createDemonicSymbols();
    }

    createDebris() {
        // Scattered debris from previous battles
        for (let i = 0; i < 30; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 2,
                Math.random() * 1,
                Math.random() * 2
            );
            const debrisMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x3a2a2a
            });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 30;
            debris.position.set(
                Math.cos(angle) * radius,
                Math.random() * 2,
                Math.sin(angle) * radius
            );
            
            debris.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(debris);
        }
    }

    createBonePiles() {
        // Bone piles throughout the arena
        for (let i = 0; i < 12; i++) {
            const boneGeometry = new THREE.ConeGeometry(1, 3, 6);
            const boneMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
            const bone = new THREE.Mesh(boneGeometry, boneMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 25;
            bone.position.set(
                Math.cos(angle) * radius,
                1.5,
                Math.sin(angle) * radius
            );
            
            bone.rotation.z = Math.random() * Math.PI;
            this.scene.add(bone);
        }
    }

    createDemonicSymbols() {
        // Large demonic symbols on the ground
        const symbolPositions = [
            { x: 0, z: 25 }, { x: 25, z: 0 },
            { x: 0, z: -25 }, { x: -25, z: 0 }
        ];
        
        symbolPositions.forEach(pos => {
            const symbolGeometry = new THREE.RingGeometry(3, 5, 6);
            const symbolMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x880000,
                transparent: true,
                opacity: 0.6
            });
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            symbol.rotation.x = -Math.PI / 2;
            symbol.position.set(pos.x, 0.1, pos.z);
            this.scene.add(symbol);
        });
    }

    // Phase management methods
    advancePhase() {
        if (this.currentPhase < this.maxPhases) {
            this.currentPhase++;
            this.executePhaseTransition();
            
            // Update objective
            this.objectives[0].description = `Survive boss phases (${this.currentPhase}/${this.maxPhases})`;
            
            if (this.currentPhase >= this.maxPhases) {
                this.objectives[0].completed = true;
            }
        }
    }

    executePhaseTransition() {
        switch (this.currentPhase) {
            case 1:
                this.activateHellPortals();
                break;
            case 2:
                this.createMovingPlatforms();
                break;
            case 3:
                this.increaseLavaActivity();
                break;
            case 4:
                this.activateRealityRifts();
                break;
            case 5:
                this.finalPhaseTransformation();
                break;
        }
    }

    activateHellPortals() {
        this.hellPortals.forEach(portal => {
            if (portal.userData.type === 'spawn') {
                portal.userData.active = true;
                const energy = portal.userData.energy;
                if (energy) {
                    energy.material.opacity = 1.0;
                }
            }
        });
    }

    createMovingPlatforms() {
        // Create platforms that move during the fight
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const platform = this.createMovingPlatform(
                Math.cos(angle) * 30,
                Math.sin(angle) * 30
            );
            this.movingPlatforms.push(platform);
            this.scene.add(platform);
        }
    }

    createMovingPlatform(x, z) {
        const platformGeometry = new THREE.CylinderGeometry(4, 4, 1, 8);
        const platformMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5a4a4a,
            emissive: 0x221111
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, 3, z);
        
        platform.userData.basePosition = new THREE.Vector3(x, 3, z);
        platform.userData.movementRadius = 10;
        platform.userData.movementSpeed = 0.02;
        platform.userData.phase = Math.random() * Math.PI * 2;
        
        return platform;
    }

    increaseLavaActivity() {
        this.lavaFields.forEach(lava => {
            const light = lava.userData.light;
            const surface = lava.userData.surface;
            if (light) light.intensity *= 1.5;
            if (surface) surface.material.emissive.multiplyScalar(1.2);
        });
    }

    activateRealityRifts() {
        this.realityRifts.forEach(rift => {
            rift.userData.active = true;
            // Rifts become interactive portals
        });
    }

    finalPhaseTransformation() {
        // Arena begins to collapse
        this.apocalypseStarted = true;
        this.createApocalypseEffects();
    }

    createApocalypseEffects() {
        // Screen shaking, particle effects, lighting changes
        this.createFallingDebris();
        this.intensifyAllEffects();
    }

    createFallingDebris() {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const debris = this.createFallingDebrisPiece();
                this.fallingDebris.push(debris);
                this.scene.add(debris);
            }, i * 500);
        }
    }

    createFallingDebrisPiece() {
        const debrisGeometry = new THREE.BoxGeometry(
            2 + Math.random() * 3,
            2 + Math.random() * 3,
            2 + Math.random() * 3
        );
        const debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a3a });
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        debris.position.set(
            Math.cos(angle) * (30 + Math.random() * 20),
            25 + Math.random() * 15,
            Math.sin(angle) * (30 + Math.random() * 20)
        );
        
        debris.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            -0.2,
            (Math.random() - 0.5) * 0.1
        );
        debris.userData.angularVelocity = new THREE.Vector3(
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1
        );
        
        return debris;
    }

    intensifyAllEffects() {
        // Increase intensity of all environmental effects
        this.hellfire.forEach(fire => {
            fire.intensity *= 2;
        });
        
        this.lavaFields.forEach(lava => {
            const light = lava.userData.light;
            if (light) light.intensity *= 2;
        });
        
        // Change background color to more intense red
        this.backgroundColor = new THREE.Color(0x4a0000);
        this.scene.background = this.backgroundColor;
    }

    defeatFinalBoss() {
        this.finalBossDefeated = true;
        this.objectives[1].completed = true;
        this.objectives[2].completed = true;
        
        this.createVictoryEffects();
    }

    createVictoryEffects() {
        // Victory light beam
        const beamGeometry = new THREE.CylinderGeometry(5, 5, 100);
        const beamMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, 50, 0);
        this.scene.add(beam);
        
        // Stop all hellish effects
        this.hellfire.forEach(fire => {
            fire.intensity = 0;
        });
        
        // Change to holy lighting
        const holyLight = new THREE.PointLight(0xffffaa, 3, 100);
        holyLight.position.set(0, 20, 0);
        this.scene.add(holyLight);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update lava particles
        this.lavaFields.forEach(lava => {
            const particles = lava.userData.particles;
            if (particles) {
                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    if (positions[i + 1] > 15) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * lava.userData.radius * 0.8;
                        positions[i] = Math.cos(angle) * distance;
                        positions[i + 1] = -1;
                        positions[i + 2] = Math.sin(angle) * distance;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update portal particles
        this.hellPortals.forEach(portal => {
            const particles = portal.userData.particles;
            if (particles && portal.userData.active) {
                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
                    if (distance > portal.userData.radius * 1.2) {
                        const angle = Math.random() * Math.PI * 2;
                        const newDistance = Math.random() * portal.userData.radius;
                        positions[i] = Math.cos(angle) * newDistance;
                        positions[i + 2] = Math.sin(angle) * newDistance;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update rift particles
        this.realityRifts.forEach(rift => {
            const particles = rift.userData.particles;
            if (particles) {
                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    if (Math.abs(positions[i]) > 4 || Math.abs(positions[i + 1]) > 6) {
                        positions[i] = (Math.random() - 0.5) * 4;
                        positions[i + 1] = (Math.random() - 0.5) * 6;
                        positions[i + 2] = (Math.random() - 0.5) * 0.5;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update atmospheric particles
        if (this.atmosphericParticles) {
            const positions = this.atmosphericParticles.geometry.attributes.position.array;
            const velocities = this.atmosphericParticles.geometry.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * deltaTime;
                positions[i + 1] += velocities[i + 1] * deltaTime;
                positions[i + 2] += velocities[i + 2] * deltaTime;
                
                if (positions[i + 1] > 40) {
                    positions[i] = (Math.random() - 0.5) * 120;
                    positions[i + 1] = 0;
                    positions[i + 2] = (Math.random() - 0.5) * 120;
                }
            }
            
            this.atmosphericParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update moving platforms
        this.movingPlatforms.forEach(platform => {
            const time = Date.now() * 0.001;
            const base = platform.userData.basePosition;
            const radius = platform.userData.movementRadius;
            const speed = platform.userData.movementSpeed;
            const phase = platform.userData.phase;
            
            platform.position.x = base.x + Math.cos(time * speed + phase) * radius;
            platform.position.z = base.z + Math.sin(time * speed + phase) * radius;
            platform.position.y = base.y + Math.sin(time * speed * 2 + phase) * 2;
        });
        
        // Update falling debris
        this.fallingDebris.forEach((debris, index) => {
            debris.position.add(debris.userData.velocity.clone().multiplyScalar(deltaTime));
            debris.rotation.x += debris.userData.angularVelocity.x * deltaTime;
            debris.rotation.y += debris.userData.angularVelocity.y * deltaTime;
            debris.rotation.z += debris.userData.angularVelocity.z * deltaTime;
            
            // Remove if hits ground
            if (debris.position.y < -5) {
                this.scene.remove(debris);
                this.fallingDebris.splice(index, 1);
            }
        });
    }

    getSpawnPosition() {
        return new THREE.Vector3(0, 4, 10);
    }

    isComplete() {
        return this.finalBossDefeated;
    }

    cleanup() {
        super.cleanup();
        
        this.outerRings = [];
        this.bridgePlatforms = [];
        this.lavaFields = [];
        this.hellPortals = [];
        this.sacrificialAltars = [];
        this.demoniPillars = [];
        this.hellfire = [];
        this.soulOrbs = [];
        this.corruptionZones = [];
        this.realityRifts = [];
        this.playerSafeZones = [];
        this.weaponUpgradeStations = [];
        this.holyRelicPedestals = [];
        this.movingPlatforms = [];
        this.fallingDebris = [];
        
        if (this.atmosphericParticles) {
            this.scene.remove(this.atmosphericParticles);
        }
    }
}