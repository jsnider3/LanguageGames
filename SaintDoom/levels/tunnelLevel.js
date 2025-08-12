import * as THREE from 'three';
// Tunnel Network Level
// Narrow passages designed for intense close-quarters combat

import { BaseLevel } from './baseLevel.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import { DemonKnight } from '../enemies/demonKnight.js';
import { Imp } from '../enemies/imp.js';
import { PossessedScientist } from '../enemies/possessedScientist.js';

export class TunnelLevel extends BaseLevel {
    constructor(scene, game) {
        // Handle both old and new constructor signatures
        if (arguments.length === 1 && arguments[0].scene) {
            // New signature: (game)
            super(arguments[0]);
            this.game = arguments[0];
            this.scene = arguments[0].scene;
        } else {
            // Old signature: (scene, game)
            super(game);
            this.scene = scene;
            this.game = game;
        }
        
        this.levelName = 'Tunnel Network';
        this.levelNumber = 5;
        this.ambientColor = 0x000011;
        this.fogColor = 0x111111;
        this.fogDensity = 0.05;
        
        // Tunnel system properties
        this.tunnelWidth = 3;
        this.tunnelHeight = 4;
        this.mainPaths = [];
        this.secretPaths = [];
        this.ambushPoints = [];
        this.chokePoints = [];
        
        // Close-quarters mechanics
        this.crammedSpaces = true;
        this.echoingFootsteps = true;
        this.limitedVisibility = true;
        
        // Tunnel features
        this.ventilationShafts = [];
        this.waterPipes = [];
        this.electricalConduits = [];
        this.emergencyLights = [];
    }
    
    create() {
        // Initialize base level properties
        this.init();
        
        // Build tunnel network
        this.createMainTunnelSystem();
        this.createSecretPassages();
        this.createVerticalShafts();
        this.createUtilityTunnels();
        
        // Add infrastructure
        this.createTunnelInfrastructure();
        this.createVentilationSystem();
        this.createEmergencyLighting();
        
        // Create combat scenarios
        this.setupAmbushPoints();
        this.createChokePoints();
        this.setupFlankingRoutes();
        
        // Environmental effects
        this.createTunnelAtmosphere();
        
        // Spawn enemies for close combat
        this.spawnTunnelEnemies();
        
        // Objectives
        this.setupTunnelObjectives();
        
        // Return required data structure for Game.js
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }
    
    createMainTunnelSystem() {
        // Create interconnected tunnel network
        const tunnelSegments = [
            // Main thoroughfare
            { start: new THREE.Vector3(0, 0, -30), end: new THREE.Vector3(0, 0, 30), type: 'main' },
            // Cross passages
            { start: new THREE.Vector3(-30, 0, 0), end: new THREE.Vector3(30, 0, 0), type: 'main' },
            // Branch tunnels
            { start: new THREE.Vector3(-15, 0, -15), end: new THREE.Vector3(-15, 0, 15), type: 'branch' },
            { start: new THREE.Vector3(15, 0, -15), end: new THREE.Vector3(15, 0, 15), type: 'branch' },
            // Connecting passages
            { start: new THREE.Vector3(-15, 0, -15), end: new THREE.Vector3(0, 0, -15), type: 'connector' },
            { start: new THREE.Vector3(15, 0, -15), end: new THREE.Vector3(0, 0, -15), type: 'connector' },
            { start: new THREE.Vector3(-15, 0, 15), end: new THREE.Vector3(0, 0, 15), type: 'connector' },
            { start: new THREE.Vector3(15, 0, 15), end: new THREE.Vector3(0, 0, 15), type: 'connector' }
        ];
        
        tunnelSegments.forEach(segment => {
            this.createTunnelSegment(segment.start, segment.end, segment.type);
        });
        
        // Junction rooms
        this.createJunction(new THREE.Vector3(0, 0, 0), 'central');
        this.createJunction(new THREE.Vector3(-15, 0, -15), 'northwest');
        this.createJunction(new THREE.Vector3(15, 0, -15), 'northeast');
        this.createJunction(new THREE.Vector3(-15, 0, 15), 'southwest');
        this.createJunction(new THREE.Vector3(15, 0, 15), 'southeast');
    }
    
    createTunnelSegment(start, end, type) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        
        // Determine dimensions based on type
        let width = this.tunnelWidth;
        let height = this.tunnelHeight;
        
        if (type === 'main') {
            width *= 1.5;
            height *= 1.2;
        } else if (type === 'connector') {
            width *= 0.8;
            height *= 0.9;
        }
        
        // Create tunnel geometry
        const tunnelGeometry = new THREE.CylinderGeometry(width, width, length, 8);
        const tunnelMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x001111,
            emissiveIntensity: 0.1
        });
        
        const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel.position.copy(center);
        
        // Orient tunnel
        if (direction.z !== 0) {
            tunnel.rotation.x = Math.PI / 2;
        } else if (direction.x !== 0) {
            tunnel.rotation.z = Math.PI / 2;
        }
        
        this.scene.add(tunnel);
        
        // Add tunnel details
        this.addTunnelDetails(start, end, width, height, type);
        
        this.mainPaths.push({
            start: start,
            end: end,
            center: center,
            width: width,
            height: height,
            type: type,
            mesh: tunnel
        });
    }
    
    addTunnelDetails(start, end, width, height, type) {
        const segments = 10;
        const direction = new THREE.Vector3().subVectors(end, start);
        const segmentLength = direction.length() / segments;
        direction.normalize();
        
        // Add supports, pipes, and lighting along tunnel
        for (let i = 0; i <= segments; i++) {
            const position = new THREE.Vector3()
                .copy(start)
                .add(direction.clone().multiplyScalar(i * segmentLength));
            
            if (i % 2 === 0) {
                this.createTunnelSupport(position, width, height);
            }
            
            if (i % 3 === 0) {
                this.createPipeWork(position, direction);
            }
            
            if (i % 4 === 1) {
                this.addTunnelLighting(position, type);
            }
        }
        
        // Random details
        if (Math.random() < 0.3) {
            const detailPos = new THREE.Vector3()
                .copy(start)
                .add(direction.clone().multiplyScalar(Math.random() * direction.length()));
            this.addTunnelClutter(detailPos);
        }
    }
    
    createTunnelSupport(position, width, height) {
        const supportGroup = new THREE.Group();
        
        // Vertical supports
        const supportGeometry = new THREE.CylinderGeometry(0.1, 0.1, height, 6);
        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8
        });
        
        const leftSupport = new THREE.Mesh(supportGeometry, supportMaterial);
        leftSupport.position.set(-width * 0.8, height / 2, 0);
        supportGroup.add(leftSupport);
        
        const rightSupport = new THREE.Mesh(supportGeometry, supportMaterial);
        rightSupport.position.set(width * 0.8, height / 2, 0);
        supportGroup.add(rightSupport);
        
        // Cross beam
        const beamGeometry = new THREE.BoxGeometry(width * 1.6, 0.1, 0.2);
        const beam = new THREE.Mesh(beamGeometry, supportMaterial);
        beam.position.y = height * 0.9;
        supportGroup.add(beam);
        
        // Rust stains
        if (Math.random() < 0.4) {
            const rustGeometry = new THREE.PlaneGeometry(0.3, height * 0.5);
            const rustMaterial = new THREE.MeshBasicMaterial({
                color: 0x443322,
                transparent: true,
                opacity: 0.6
            });
            const rust = new THREE.Mesh(rustGeometry, rustMaterial);
            rust.position.x = (Math.random() - 0.5) * width;
            rust.position.y = height * 0.3;
            supportGroup.add(rust);
        }
        
        supportGroup.position.copy(position);
        this.scene.add(supportGroup);
    }
    
    createPipeWork(position, direction) {
        const pipeGroup = new THREE.Group();
        
        // Main pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.7
        });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        
        // Orient pipe
        if (Math.abs(direction.x) > Math.abs(direction.z)) {
            pipe.rotation.z = Math.PI / 2;
        } else {
            pipe.rotation.x = Math.PI / 2;
        }
        
        pipe.position.y = this.tunnelHeight * 0.8;
        pipeGroup.add(pipe);
        
        // Pipe joints
        const jointGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const joint1 = new THREE.Mesh(jointGeometry, pipeMaterial);
        joint1.position.copy(pipe.position);
        joint1.position.add(direction.clone().multiplyScalar(-0.8));
        pipeGroup.add(joint1);
        
        const joint2 = new THREE.Mesh(jointGeometry, pipeMaterial);
        joint2.position.copy(pipe.position);
        joint2.position.add(direction.clone().multiplyScalar(0.8));
        pipeGroup.add(joint2);
        
        // Leaking water effect
        if (Math.random() < 0.2) {
            this.createWaterLeak(joint1.position);
        }
        
        pipeGroup.position.copy(position);
        this.scene.add(pipeGroup);
        this.waterPipes.push(pipeGroup);
    }
    
    createWaterLeak(position) {
        const dropCount = 50;
        const drops = [];
        
        const createDrop = () => {
            const dropGeometry = new THREE.SphereGeometry(0.02, 4, 4);
            const dropMaterial = new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.8
            });
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            
            drop.position.copy(position);
            drop.position.y += Math.random() * 0.2 - 0.1;
            
            const velocity = new THREE.Vector3(0, -2, 0);
            velocity.x += (Math.random() - 0.5) * 0.2;
            
            this.scene.add(drop);
            drops.push({ mesh: drop, velocity: velocity, life: 0 });
        };
        
        // Create initial drops
        for (let i = 0; i < 5; i++) {
            setTimeout(createDrop, i * 200);
        }
        
        // Continuous dripping
        const dripInterval = setInterval(() => {
            if (drops.length < 10) {
                createDrop();
            }
        }, 500 + Math.random() * 1000);
        
        // Update drops
        const updateDrops = () => {
            for (let i = drops.length - 1; i >= 0; i--) {
                const drop = drops[i];
                drop.mesh.position.add(drop.velocity.clone().multiplyScalar(0.016));
                drop.life++;
                
                // Remove when hits ground or too old
                if (drop.mesh.position.y < 0 || drop.life > 300) {
                    this.scene.remove(drop.mesh);
                    drops.splice(i, 1);
                    
                    // Splash effect when hits ground
                    if (drop.mesh.position.y <= 0) {
                        this.createWaterSplash(drop.mesh.position);
                    }
                }
            }
            
            if (drops.length > 0) {
                requestAnimationFrame(updateDrops);
            }
        };
        updateDrops();
    }
    
    createWaterSplash(position) {
        const splashParticles = 10;
        
        for (let i = 0; i < splashParticles; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 3, 3),
                new THREE.MeshBasicMaterial({
                    color: 0x4488ff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            particle.position.copy(position);
            particle.position.y = 0.01;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 1
            );
            
            this.scene.add(particle);
            
            // Animate splash
            const animateSplash = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.02;
                particle.material.opacity *= 0.95;
                
                if (particle.material.opacity > 0.01 && particle.position.y > 0) {
                    requestAnimationFrame(animateSplash);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateSplash();
        }
    }
    
    createJunction(position, name) {
        // Larger room where tunnels meet
        const junctionSize = 6;
        const junctionGeometry = new THREE.CylinderGeometry(junctionSize, junctionSize, this.tunnelHeight, 8);
        const junctionMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            emissive: 0x002222,
            emissiveIntensity: 0.1
        });
        
        const junction = new THREE.Mesh(junctionGeometry, junctionMaterial);
        junction.position.copy(position);
        junction.position.y = this.tunnelHeight / 2;
        this.scene.add(junction);
        
        // Central pillar with directional signs
        this.createDirectionalSigns(position, name);
        
        // Crates and cover
        this.createJunctionCover(position, junctionSize);
        
        // Stronger lighting
        const junctionLight = new THREE.PointLight(0xffffff, 1, junctionSize * 2);
        junctionLight.position.copy(position);
        junctionLight.position.y = this.tunnelHeight * 0.8;
        this.scene.add(junctionLight);
        
        return {
            position: position,
            name: name,
            radius: junctionSize,
            mesh: junction
        };
    }
    
    createDirectionalSigns(position, junctionName) {
        const signGroup = new THREE.Group();
        
        // Central post
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, this.tunnelHeight * 0.8, 8);
        const postMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.7
        });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = this.tunnelHeight * 0.4;
        signGroup.add(post);
        
        // Direction signs
        const directions = [
            { text: 'LAB COMPLEX', angle: 0 },
            { text: 'CONTAINMENT', angle: Math.PI / 2 },
            { text: 'SURFACE', angle: Math.PI },
            { text: 'REACTOR', angle: -Math.PI / 2 }
        ];
        
        directions.forEach(dir => {
            const signGeometry = new THREE.BoxGeometry(2, 0.3, 0.05);
            const signMaterial = new THREE.MeshPhongMaterial({
                color: 0x222222,
                emissive: 0x004400,
                emissiveIntensity: 0.2
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            
            sign.position.set(
                Math.cos(dir.angle) * 1.2,
                this.tunnelHeight * 0.6,
                Math.sin(dir.angle) * 1.2
            );
            sign.rotation.y = dir.angle + Math.PI / 2;
            
            signGroup.add(sign);
        });
        
        signGroup.position.copy(position);
        this.scene.add(signGroup);
    }
    
    createJunctionCover(position, radius) {
        // Add crates and obstacles for cover
        const coverCount = 4;
        
        for (let i = 0; i < coverCount; i++) {
            const angle = (i / coverCount) * Math.PI * 2;
            const distance = radius * 0.6;
            
            const crateGeometry = new THREE.BoxGeometry(1, 1.5, 1);
            const crateMaterial = new THREE.MeshPhongMaterial({
                color: 0x8b4513,
                roughness: 0.8
            });
            const crate = new THREE.Mesh(crateGeometry, crateMaterial);
            
            crate.position.set(
                position.x + Math.cos(angle) * distance,
                0.75,
                position.z + Math.sin(angle) * distance
            );
            
            crate.rotation.y = Math.random() * Math.PI * 2;
            
            this.scene.add(crate);
            
            // Random damage
            if (Math.random() < 0.3) {
                this.addCrateDamage(crate);
            }
        }
    }
    
    createSecretPassages() {
        // Hidden maintenance tunnels
        const secretTunnels = [
            { start: new THREE.Vector3(-25, -2, -10), end: new THREE.Vector3(-10, -2, -25), hidden: true },
            { start: new THREE.Vector3(10, -2, 25), end: new THREE.Vector3(25, -2, 10), hidden: true },
            { start: new THREE.Vector3(-5, 3, 0), end: new THREE.Vector3(5, 3, 0), type: 'vent' }
        ];
        
        secretTunnels.forEach(tunnel => {
            this.createSecretTunnel(tunnel.start, tunnel.end, tunnel);
        });
    }
    
    createSecretTunnel(start, end, options) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        
        // Smaller dimensions for secret passages
        const width = options.type === 'vent' ? 0.8 : 1.5;
        const height = options.type === 'vent' ? 0.8 : 2;
        
        let tunnelGeometry;
        let tunnelMaterial;
        
        if (options.type === 'vent') {
            // Square vent shaft
            tunnelGeometry = new THREE.BoxGeometry(width, height, length);
            tunnelMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8
            });
        } else {
            // Round maintenance tunnel
            tunnelGeometry = new THREE.CylinderGeometry(width, width, length, 8);
            tunnelMaterial = new THREE.MeshPhongMaterial({
                color: 0x222222,
                emissive: 0x110000,
                emissiveIntensity: 0.1
            });
        }
        
        const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel.position.copy(center);
        
        // Orient tunnel
        if (direction.z !== 0) {
            tunnel.rotation.x = Math.PI / 2;
        } else if (direction.x !== 0) {
            tunnel.rotation.z = Math.PI / 2;
        }
        
        this.scene.add(tunnel);
        
        // Add secret entrances
        this.createSecretEntrance(start, options);
        this.createSecretEntrance(end, options);
        
        this.secretPaths.push({
            start: start,
            end: end,
            center: center,
            width: width,
            height: height,
            options: options,
            mesh: tunnel
        });
    }
    
    createSecretEntrance(position, options) {
        if (options.type === 'vent') {
            // Vent grate
            const grateGeometry = new THREE.BoxGeometry(1, 1, 0.05);
            const grateMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8
            });
            const grate = new THREE.Mesh(grateGeometry, grateMaterial);
            grate.position.copy(position);
            grate.position.y += 0.5;
            
            // Grate pattern
            for (let x = -0.4; x <= 0.4; x += 0.2) {
                for (let y = -0.4; y <= 0.4; y += 0.2) {
                    const holeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
                    const hole = new THREE.Mesh(holeGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
                    hole.position.set(x, y, 0);
                    grate.add(hole);
                }
            }
            
            grate.userData = { isBreakable: true, type: 'vent_grate' };
            this.scene.add(grate);
        } else {
            // Hidden panel
            const panelGeometry = new THREE.BoxGeometry(2, 2, 0.1);
            const panelMaterial = new THREE.MeshPhongMaterial({
                color: 0x444444,
                emissive: 0x001100,
                emissiveIntensity: 0.1
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.copy(position);
            panel.position.y += 1;
            
            panel.userData = { isSecret: true, type: 'hidden_panel' };
            this.scene.add(panel);
        }
    }
    
    createVerticalShafts() {
        // Vertical access shafts
        const shaftPositions = [
            new THREE.Vector3(-20, 0, -20),
            new THREE.Vector3(20, 0, 20),
            new THREE.Vector3(0, 0, -25)
        ];
        
        shaftPositions.forEach(pos => {
            this.createVerticalShaft(pos);
        });
    }
    
    createVerticalShaft(position) {
        const shaftHeight = 15;
        const shaftRadius = 2;
        
        // Shaft cylinder
        const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 8);
        const shaftMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            side: THREE.BackSide
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.copy(position);
        shaft.position.y = shaftHeight / 2;
        this.scene.add(shaft);
        
        // Ladder
        this.createLadder(position, shaftHeight);
        
        // Platforms at intervals
        for (let height = 3; height < shaftHeight; height += 5) {
            this.createShaftPlatform(position, height, shaftRadius);
        }
        
        // Shaft lighting
        for (let height = 2; height < shaftHeight; height += 4) {
            const shaftLight = new THREE.PointLight(0xffffaa, 0.3, shaftRadius * 3);
            shaftLight.position.copy(position);
            shaftLight.position.y = height;
            this.scene.add(shaftLight);
        }
    }
    
    createLadder(position, height) {
        const ladderGroup = new THREE.Group();
        
        // Ladder rails
        const railGeometry = new THREE.CylinderGeometry(0.02, 0.02, height, 4);
        const railMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        leftRail.position.set(-0.3, height / 2, 0);
        ladderGroup.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        rightRail.position.set(0.3, height / 2, 0);
        ladderGroup.add(rightRail);
        
        // Ladder rungs
        const rungGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);
        for (let y = 0.5; y < height; y += 0.4) {
            const rung = new THREE.Mesh(rungGeometry, railMaterial);
            rung.position.set(0, y, 0);
            rung.rotation.z = Math.PI / 2;
            ladderGroup.add(rung);
        }
        
        ladderGroup.position.copy(position);
        this.scene.add(ladderGroup);
    }
    
    createShaftPlatform(position, height, radius) {
        const platformGeometry = new THREE.CylinderGeometry(radius * 0.8, radius * 0.8, 0.1, 8);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.7
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.copy(position);
        platform.position.y = height;
        this.scene.add(platform);
        
        // Safety railing
        this.createPlatformRailing(position, height, radius * 0.8);
    }
    
    createPlatformRailing(position, height, radius) {
        const railingGroup = new THREE.Group();
        
        const postCount = 8;
        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            
            // Post
            const postGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
            const postMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8
            });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(
                Math.cos(angle) * radius,
                0.5,
                Math.sin(angle) * radius
            );
            railingGroup.add(post);
        }
        
        railingGroup.position.copy(position);
        railingGroup.position.y = height;
        this.scene.add(railingGroup);
    }
    
    addTunnelLighting(position, type) {
        let lightColor = 0xffaa44;
        let intensity = 0.3;
        let range = 5;
        
        if (type === 'main') {
            intensity = 0.5;
            range = 8;
        } else if (type === 'emergency') {
            lightColor = 0xff4444;
            intensity = 0.2;
            range = 4;
        }
        
        const light = new THREE.PointLight(lightColor, intensity, range);
        light.position.copy(position);
        light.position.y = this.tunnelHeight * 0.8;
        this.scene.add(light);
        
        // Light fixture
        const fixtureGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const fixtureMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: lightColor,
            emissiveIntensity: 0.2
        });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.copy(light.position);
        fixture.position.y -= 0.1;
        this.scene.add(fixture);
        
        // Flickering effect
        if (Math.random() < 0.3) {
            const flicker = () => {
                if (Math.random() < 0.1) {
                    light.visible = !light.visible;
                    fixture.material.emissiveIntensity = light.visible ? 0.2 : 0;
                }
                setTimeout(flicker, 100 + Math.random() * 500);
            };
            flicker();
        }
        
        this.emergencyLights.push({ light: light, fixture: fixture });
    }
    
    setupAmbushPoints() {
        // Strategic positions for enemy ambushes
        const ambushPositions = [
            // Around corners
            new THREE.Vector3(-12, 0, -12),
            new THREE.Vector3(12, 0, 12),
            // In dark sections
            new THREE.Vector3(-8, 0, 8),
            new THREE.Vector3(8, 0, -8),
            // Near choke points
            new THREE.Vector3(0, 0, -20),
            new THREE.Vector3(0, 0, 20)
        ];
        
        ambushPositions.forEach(pos => {
            this.createAmbushPoint(pos);
        });
    }
    
    createAmbushPoint(position) {
        // Hidden alcoves
        const alcoveGeometry = new THREE.BoxGeometry(2, this.tunnelHeight, 1);
        const alcoveMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            side: THREE.BackSide
        });
        const alcove = new THREE.Mesh(alcoveGeometry, alcoveMaterial);
        alcove.position.copy(position);
        alcove.position.y = this.tunnelHeight / 2;
        this.scene.add(alcove);
        
        // Cover objects
        this.createAmbushCover(position);
        
        // Motion sensor (triggers ambush)
        const sensor = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.1),
            new THREE.MeshPhongMaterial({
                color: 0x444444,
                emissive: 0xff0000,
                emissiveIntensity: 0.3
            })
        );
        sensor.position.copy(position);
        sensor.position.y = this.tunnelHeight * 0.8;
        sensor.position.z += 0.8;
        this.scene.add(sensor);
        
        this.ambushPoints.push({
            position: position,
            alcove: alcove,
            sensor: sensor,
            triggered: false
        });
    }
    
    createAmbushCover(position) {
        // Stacked crates or barrels
        const coverType = Math.random() < 0.5 ? 'crates' : 'barrels';
        
        if (coverType === 'crates') {
            for (let i = 0; i < 3; i++) {
                const crate = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.8, 0.8),
                    new THREE.MeshPhongMaterial({ color: 0x8b4513 })
                );
                crate.position.set(
                    position.x + (Math.random() - 0.5) * 1,
                    0.4 + i * 0.8,
                    position.z + (Math.random() - 0.5) * 0.5
                );
                this.scene.add(crate);
            }
        } else {
            for (let i = 0; i < 2; i++) {
                const barrel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 1, 8),
                    new THREE.MeshPhongMaterial({ color: 0x444444 })
                );
                barrel.position.set(
                    position.x + i * 0.6 - 0.3,
                    0.5,
                    position.z
                );
                this.scene.add(barrel);
            }
        }
    }
    
    createChokePoints() {
        // Narrow sections that force close combat
        const chokePositions = [
            new THREE.Vector3(-7.5, 0, 0),
            new THREE.Vector3(7.5, 0, 0),
            new THREE.Vector3(0, 0, -7.5),
            new THREE.Vector3(0, 0, 7.5)
        ];
        
        chokePositions.forEach(pos => {
            this.createChokePoint(pos);
        });
    }
    
    createChokePoint(position) {
        // Debris blocking part of tunnel
        const debrisGroup = new THREE.Group();
        
        // Fallen ceiling
        const debrisGeometry = new THREE.BoxGeometry(2, 1, 1);
        const debrisMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            roughness: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * 1,
                0.5 + i * 0.3,
                (Math.random() - 0.5) * 0.5
            );
            debris.rotation.set(
                Math.random() * 0.5,
                Math.random() * Math.PI,
                Math.random() * 0.5
            );
            debrisGroup.add(debris);
        }
        
        // Exposed rebar
        for (let i = 0; i < 5; i++) {
            const rebarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1 + Math.random(), 4);
            const rebar = new THREE.Mesh(rebarGeometry, new THREE.MeshPhongMaterial({
                color: 0x444444,
                metalness: 0.9
            }));
            rebar.position.set(
                (Math.random() - 0.5) * 1.5,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 1
            );
            rebar.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            debrisGroup.add(rebar);
        }
        
        debrisGroup.position.copy(position);
        this.scene.add(debrisGroup);
        
        this.chokePoints.push({
            position: position,
            debris: debrisGroup
        });
    }
    
    createTunnelAtmosphere() {
        // Steam vents
        this.createSteamVents();
        
        // Dust motes in air
        this.createDustParticles();
        
        // Ambient sound sources
        this.createAmbientSources();
        
        // Water puddles
        this.createWaterPuddles();
    }
    
    createSteamVents() {
        const ventPositions = [
            new THREE.Vector3(-10, 2, 5),
            new THREE.Vector3(15, 3, -8),
            new THREE.Vector3(-5, 1, -15),
            new THREE.Vector3(8, 2.5, 12)
        ];
        
        ventPositions.forEach(pos => {
            this.createSteamVent(pos);
        });
    }
    
    createSteamVent(position) {
        // Vent opening
        const ventGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 6);
        const ventMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8
        });
        const vent = new THREE.Mesh(ventGeometry, ventMaterial);
        vent.position.copy(position);
        this.scene.add(vent);
        
        // Steam particles
        const steamParticles = [];
        
        const createSteamParticle = () => {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3
                })
            );
            
            particle.position.copy(position);
            particle.position.y += 0.2;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                1 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            this.scene.add(particle);
            steamParticles.push({ mesh: particle, velocity: velocity, life: 0 });
        };
        
        // Continuous steam
        const steamInterval = setInterval(() => {
            if (steamParticles.length < 10) {
                createSteamParticle();
            }
        }, 200);
        
        // Update steam
        const updateSteam = () => {
            for (let i = steamParticles.length - 1; i >= 0; i--) {
                const steam = steamParticles[i];
                steam.mesh.position.add(steam.velocity.clone().multiplyScalar(0.02));
                steam.mesh.scale.multiplyScalar(1.005);
                steam.mesh.material.opacity *= 0.995;
                steam.life++;
                
                if (steam.mesh.material.opacity < 0.05 || steam.life > 500) {
                    this.scene.remove(steam.mesh);
                    steamParticles.splice(i, 1);
                }
            }
            
            requestAnimationFrame(updateSteam);
        };
        updateSteam();
    }
    
    createDustParticles() {
        // Floating dust motes
        const dustCount = 100;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 60;
            dustPositions[i * 3 + 1] = Math.random() * this.tunnelHeight;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        
        const dustMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.02,
            transparent: true,
            opacity: 0.3
        });
        
        const dustSystem = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(dustSystem);
        
        // Animate dust
        const animateDust = () => {
            const positions = dustSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += Math.sin(Date.now() * 0.0001 + i) * 0.001;
                positions[i * 3 + 1] += 0.002;
                positions[i * 3 + 2] += Math.cos(Date.now() * 0.0001 + i) * 0.001;
                
                // Reset particles that float too high
                if (positions[i * 3 + 1] > this.tunnelHeight + 2) {
                    positions[i * 3 + 1] = -1;
                }
            }
            
            dustSystem.geometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(animateDust);
        };
        animateDust();
    }
    
    spawnTunnelEnemies() {
        // Shadow wraiths in dark corners
        const wraithPositions = [
            new THREE.Vector3(-25, 0, -15),
            new THREE.Vector3(20, 0, 18),
            new THREE.Vector3(-8, 0, 22)
        ];
        
        wraithPositions.forEach(pos => {
            const wraith = new ShadowWraith(this.scene, pos);
            this.game.enemies.push(wraith);
        });
        
        // Demon knight patrolling main tunnel
        const knight = new DemonKnight(this.scene, new THREE.Vector3(0, 0, 10));
        this.game.enemies.push(knight);
        
        // Imps in vertical shafts
        const imp1 = new Imp(this.scene, new THREE.Vector3(-20, 5, -20));
        const imp2 = new Imp(this.scene, new THREE.Vector3(20, 3, 20));
        this.game.enemies.push(imp1);
        this.game.enemies.push(imp2);
        
        // Ambush enemies (spawn when triggered)
        this.setupAmbushEnemies();
    }
    
    setupAmbushEnemies() {
        this.ambushPoints.forEach((ambush, index) => {
            // Store enemy data for spawning when triggered
            ambush.enemyData = {
                type: index % 2 === 0 ? PossessedScientist : ShadowWraith,
                count: 1 + Math.floor(Math.random() * 2)
            };
        });
    }
    
    setupTunnelObjectives() {
        this.objectives = [
            { id: 'navigate_tunnels', text: 'Navigate the tunnel network', completed: false },
            { id: 'find_exit', text: 'Find the surface access', completed: false },
            { id: 'survive_ambushes', text: 'Survive enemy ambushes (0/3)', completed: false }
        ];
        
        this.ambushesCleared = 0;
        this.exitFound = false;
        this.createSurfaceAccessPoint();
    }
    
    createSurfaceAccessPoint() {
        // Create the exit at the end of the main tunnel
        const exitPosition = new THREE.Vector3(0, 0, 150);
        
        // Exit ladder/stairs
        const ladderGeometry = new THREE.BoxGeometry(2, 10, 0.5);
        const ladderMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444
        });
        const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
        ladder.position.copy(exitPosition);
        ladder.position.y = 5;
        ladder.rotation.x = Math.PI * 0.1;
        this.scene.add(ladder);
        
        // Exit light shaft
        const lightShaftGeometry = new THREE.CylinderGeometry(3, 3, 20, 16, 1, true);
        const lightShaftMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const lightShaft = new THREE.Mesh(lightShaftGeometry, lightShaftMaterial);
        lightShaft.position.copy(exitPosition);
        lightShaft.position.y = 10;
        this.scene.add(lightShaft);
        
        // Surface light
        const surfaceLight = new THREE.PointLight(0xffffaa, 2, 30);
        surfaceLight.position.copy(exitPosition);
        surfaceLight.position.y = 15;
        this.scene.add(surfaceLight);
        
        // Exit trigger zone
        this.exitZone = {
            position: exitPosition,
            radius: 5,
            active: false
        };
        
        // Add sign
        const signGeometry = new THREE.PlaneGeometry(3, 1);
        const signMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.copy(exitPosition);
        sign.position.y = 3;
        sign.position.z -= 5;
        this.scene.add(sign);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Check ambush triggers
        this.checkAmbushTriggers();
        
        // Update choke point combat
        this.updateChokePoints();
        
        // Check secret passages
        this.checkSecretPassages();
        
        // Check ambush completion
        this.checkAmbushCompletion();
        
        // Check exit zone
        this.checkExitZone();
        
        // Update objectives
        this.updateObjectives();
    }
    
    checkAmbushCompletion() {
        this.ambushPoints.forEach(ambush => {
            if (ambush.triggered && !ambush.cleared && ambush.spawnedEnemies) {
                // Check if all enemies from this ambush are defeated
                const allDefeated = ambush.spawnedEnemies.every(enemy => 
                    !enemy || enemy.health <= 0 || enemy.isDead
                );
                
                if (allDefeated) {
                    ambush.cleared = true;
                    this.ambushesCleared++;
                    
                    // Update objective text
                    const ambushObj = this.objectives.find(o => o.id === 'survive_ambushes');
                    if (ambushObj) {
                        ambushObj.text = `Survive enemy ambushes (${this.ambushesCleared}/3)`;
                        if (this.ambushesCleared >= 3) {
                            ambushObj.completed = true;
                        }
                    }
                    
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle(`Ambush cleared! (${this.ambushesCleared}/3)`);
                    }
                }
            }
        });
    }
    
    checkExitZone() {
        if (!this.exitZone || !this.game.player) return;
        
        const distance = this.game.player.position.distanceTo(this.exitZone.position);
        
        // Check if player found the exit
        if (distance < 30 && !this.exitFound) {
            this.exitFound = true;
            const findExitObj = this.objectives.find(o => o.id === 'find_exit');
            if (findExitObj) {
                findExitObj.completed = true;
            }
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle("Surface access found!");
            }
        }
        
        // Check if player can use the exit
        if (distance < this.exitZone.radius && this.exitZone.active) {
            this.completeLevel();
        }
    }
    
    updateObjectives() {
        // Navigation objective completes when player reaches certain depth
        if (this.game.player && this.game.player.position.z > 100) {
            const navObj = this.objectives.find(o => o.id === 'navigate_tunnels');
            if (navObj && !navObj.completed) {
                navObj.completed = true;
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Tunnel network navigated!");
                }
            }
        }
        
        // Check if all objectives are complete
        const allComplete = this.objectives.every(o => o.completed);
        if (allComplete && !this.exitZone.active) {
            this.activateExit();
        }
    }
    
    activateExit() {
        this.exitZone.active = true;
        
        // Create exit portal effect
        const portalGeometry = new THREE.TorusGeometry(3, 0.5, 16, 32);
        const portalMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.copy(this.exitZone.position);
        portal.position.y = 2;
        this.scene.add(portal);
        
        // Animate portal
        this.addInterval(setInterval(() => {
            if (portal) {
                portal.rotation.z += 0.02;
            }
        }, 16));
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("All objectives complete! Surface exit activated!");
        }
    }
    
    completeLevel() {
        if (this.completed) return;
        
        this.completed = true;
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Tunnel Level Complete! Reaching surface...");
        }
        
        // Load next level
        setTimeout(() => {
            if (this.game.loadNextLevel) {
                this.game.loadNextLevel();
            }
        }, 2000);
    }
    
    checkAmbushTriggers() {
        if (!this.game.player) return;
        
        this.ambushPoints.forEach(ambush => {
            if (!ambush.triggered) {
                const distance = this.game.player.position.distanceTo(ambush.position);
                
                if (distance < 5) {
                    this.triggerAmbush(ambush);
                }
            }
        });
    }
    
    triggerAmbush(ambush) {
        ambush.triggered = true;
        
        // Flash sensor red
        ambush.sensor.material.emissiveIntensity = 1;
        
        // Track spawned enemies for this ambush
        ambush.spawnedEnemies = [];
        
        // Spawn enemies
        for (let i = 0; i < ambush.enemyData.count; i++) {
            const spawnPos = ambush.position.clone();
            spawnPos.x += (Math.random() - 0.5) * 2;
            spawnPos.z += (Math.random() - 0.5) * 2;
            
            const enemy = new ambush.enemyData.type(this.scene, spawnPos);
            this.game.enemies.push(enemy);
            ambush.spawnedEnemies.push(enemy);
        }
        
        // Alarm sound effect would play here
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("AMBUSH!");
        }
        
        // Dim lights for dramatic effect
        this.emergencyLights.forEach(light => {
            light.light.intensity *= 0.3;
        });
        
        // Restore lighting after ambush
        setTimeout(() => {
            this.emergencyLights.forEach(light => {
                light.light.intensity /= 0.3;
            });
        }, 5000);
    }
    
    updateChokePoints() {
        // Monitor combat at choke points
        // Could implement special combat mechanics here
    }
    
    checkSecretPassages() {
        // Check if player discovers secret entrances
        if (!this.game.player) return;
        
        this.secretPaths.forEach(secret => {
            const startDistance = this.game.player.position.distanceTo(secret.start);
            const endDistance = this.game.player.position.distanceTo(secret.end);
            
            if ((startDistance < 2 || endDistance < 2) && !secret.discovered) {
                secret.discovered = true;
                
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Secret passage discovered!");
                }
            }
        });
    }
    
    // Helper methods
    addTunnelClutter(position) {
        // Random tunnel debris and equipment
        const clutterTypes = ['pipes', 'cables', 'debris', 'equipment'];
        const type = clutterTypes[Math.floor(Math.random() * clutterTypes.length)];
        
        switch(type) {
            case 'pipes':
                this.addPipeClutter(position);
                break;
            case 'cables':
                this.addCableClutter(position);
                break;
            case 'debris':
                this.addDebrisClutter(position);
                break;
            case 'equipment':
                this.addEquipmentClutter(position);
                break;
        }
    }
    
    addPipeClutter(position) {
        // Scattered pipes
    }
    
    addCableClutter(position) {
        // Hanging cables
    }
    
    addDebrisClutter(position) {
        // Rubble and debris
    }
    
    addEquipmentClutter(position) {
        // Abandoned equipment
    }
    
    addCrateDamage(crate) {
        // Bullet holes, scorch marks
    }
    
    createWaterPuddles() {
        // Standing water puddles
    }
    
    createAmbientSources() {
        // Ambient sound source positions
    }
    
    createUtilityTunnels() {
        // Create utility tunnels with pipes and conduits
        const utilityPositions = [
            { pos: new THREE.Vector3(-25, -2, 0), length: 20 },
            { pos: new THREE.Vector3(25, -2, 0), length: 20 },
            { pos: new THREE.Vector3(0, -2, -25), length: 15 },
            { pos: new THREE.Vector3(0, -2, 25), length: 15 }
        ];
        
        utilityPositions.forEach(util => {
            // Utility tunnel structure
            const tunnelGeometry = new THREE.BoxGeometry(2, 2, util.length);
            const tunnelMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x333333 
            });
            const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
            tunnel.position.copy(util.pos);
            this.scene.add(tunnel);
            
            // Add pipes
            const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, util.length);
            const pipeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x444444 
            });
            
            for (let i = 0; i < 3; i++) {
                const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
                pipe.position.copy(util.pos);
                pipe.position.x += (i - 1) * 0.5;
                pipe.position.y += 0.7;
                pipe.rotation.z = Math.PI / 2;
                this.scene.add(pipe);
            }
        });
    }
    
    createTunnelInfrastructure() {
        // Add infrastructure elements to tunnels
        const infrastructurePoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-15, 0, 0),
            new THREE.Vector3(15, 0, 0),
            new THREE.Vector3(0, 0, -15),
            new THREE.Vector3(0, 0, 15)
        ];
        
        infrastructurePoints.forEach(point => {
            // Junction boxes
            const boxGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.3);
            const boxMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x555555 
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.copy(point);
            box.position.y = 2;
            box.position.x += (Math.random() - 0.5) * 2;
            this.scene.add(box);
            
            // Warning signs
            const signGeometry = new THREE.PlaneGeometry(0.6, 0.4);
            const signMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00 
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.copy(box.position);
            sign.position.z += 0.2;
            this.scene.add(sign);
        });
    }
    
    createVentilationSystem() {
        // Create ventilation shafts and grates
        const ventPositions = [
            new THREE.Vector3(-10, 3, -10),
            new THREE.Vector3(10, 3, -10),
            new THREE.Vector3(-10, 3, 10),
            new THREE.Vector3(10, 3, 10),
            new THREE.Vector3(0, 3, 0)
        ];
        
        ventPositions.forEach(pos => {
            // Ventilation grate
            const grateGeometry = new THREE.BoxGeometry(2, 0.3, 2);
            const grateMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x444444,
                transparent: true,
                opacity: 0.8
            });
            const grate = new THREE.Mesh(grateGeometry, grateMaterial);
            grate.position.copy(pos);
            this.scene.add(grate);
            
            // Ventilation shaft above
            const shaftGeometry = new THREE.BoxGeometry(1.8, 2, 1.8);
            const shaftMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x222222 
            });
            const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
            shaft.position.copy(pos);
            shaft.position.y += 1.5;
            this.scene.add(shaft);
            
            this.ventilationShafts.push(shaft);
        });
    }
    
    createEmergencyLighting() {
        // Create emergency lights along tunnels
        const lightPositions = [
            // Main corridor lights
            ...Array(6).fill(0).map((_, i) => new THREE.Vector3(0, 3, -25 + i * 10)),
            // Cross corridor lights
            ...Array(6).fill(0).map((_, i) => new THREE.Vector3(-25 + i * 10, 3, 0))
        ];
        
        lightPositions.forEach((pos, index) => {
            // Light fixture
            const fixtureGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);
            const fixtureMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x666666 
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.copy(pos);
            this.scene.add(fixture);
            
            // Emergency light (red)
            const light = new THREE.PointLight(0xff0000, 0.5, 5);
            light.position.copy(pos);
            light.position.y -= 0.3;
            this.scene.add(light);
            
            // Flicker some lights
            if (Math.random() > 0.7) {
                this.emergencyLights.push({
                    light: light,
                    fixture: fixture,
                    flickerRate: Math.random() * 0.5 + 0.1
                });
            }
        });
    }
    
    setupFlankingRoutes() {
        // Create alternative paths for flanking maneuvers
        const flankingRoutes = [
            {
                start: new THREE.Vector3(-20, 0, -20),
                end: new THREE.Vector3(-20, 0, 20),
                width: 2
            },
            {
                start: new THREE.Vector3(20, 0, -20),
                end: new THREE.Vector3(20, 0, 20),
                width: 2
            },
            {
                start: new THREE.Vector3(-20, 0, 0),
                end: new THREE.Vector3(-10, 0, 0),
                width: 2
            },
            {
                start: new THREE.Vector3(20, 0, 0),
                end: new THREE.Vector3(10, 0, 0),
                width: 2
            }
        ];
        
        flankingRoutes.forEach(route => {
            const direction = new THREE.Vector3().subVectors(route.end, route.start);
            const length = direction.length();
            direction.normalize();
            
            // Create narrow flanking tunnel
            const tunnelGeometry = new THREE.BoxGeometry(route.width, 3, length);
            const tunnelMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x2a2a2a 
            });
            const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
            
            // Position and orient tunnel
            const midpoint = new THREE.Vector3().addVectors(route.start, route.end).multiplyScalar(0.5);
            tunnel.position.copy(midpoint);
            tunnel.position.y = 1.5;
            
            // Rotate to align with direction
            if (Math.abs(direction.x) > Math.abs(direction.z)) {
                tunnel.rotation.y = 0;
            } else {
                tunnel.rotation.y = Math.PI / 2;
            }
            
            this.scene.add(tunnel);
            
            // Add cover points along the route
            const coverCount = Math.floor(length / 5);
            for (let i = 1; i < coverCount; i++) {
                const t = i / coverCount;
                const coverPos = new THREE.Vector3().lerpVectors(route.start, route.end, t);
                
                const coverGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
                const coverMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x444444 
                });
                const cover = new THREE.Mesh(coverGeometry, coverMaterial);
                cover.position.copy(coverPos);
                cover.position.y = 1;
                this.scene.add(cover);
            }
        });
    }
}