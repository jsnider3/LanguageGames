import * as THREE from 'three';
import { GAME_CONFIG } from './GameConfig.js';
import { GeometryCache, AudioManager } from './Utils.js';

export class Pickup {
    constructor(scene, position, type) {
        this.scene = scene;
        this.position = position.clone();
        this.type = type; // 'health' | 'shells' | 'armor'
        this.collected = false;
        this.radius = GAME_CONFIG.PICKUPS.RADIUS || 1.0;
        this.bobAmount = 0;
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.createMesh();
        scene.add(this.group);
    }

    createMesh() {
        const g = this.group;
        switch (this.type) {
            case 'health': {
                const box = new THREE.Mesh(
                    GeometryCache.getBox(GAME_CONFIG.PICKUPS.HEALTH.SIZE, GAME_CONFIG.PICKUPS.HEALTH.SIZE, 0.1),
                    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.15 })
                );
                const cross = new THREE.Mesh(
                    GeometryCache.getBox(GAME_CONFIG.PICKUPS.HEALTH.SIZE * 0.6, GAME_CONFIG.PICKUPS.HEALTH.SIZE * 0.2, 0.12),
                    new THREE.MeshStandardMaterial({ color: GAME_CONFIG.PICKUPS.HEALTH.COLOR, emissive: GAME_CONFIG.PICKUPS.HEALTH.COLOR })
                );
                const cross2 = new THREE.Mesh(
                    GeometryCache.getBox(GAME_CONFIG.PICKUPS.HEALTH.SIZE * 0.2, GAME_CONFIG.PICKUPS.HEALTH.SIZE * 0.6, 0.12),
                    cross.material
                );
                g.add(box);
                g.add(cross);
                g.add(cross2);
                break;
            }
            case 'shells': {
                const mat = new THREE.MeshStandardMaterial({ color: GAME_CONFIG.PICKUPS.SHELLS.COLOR, roughness: 0.6, metalness: 0.2 });
                for (let i = 0; i < (GAME_CONFIG.PICKUPS.SHELLS.COUNT || 3); i++) {
                    const cyl = new THREE.Mesh(GeometryCache.getCylinder(0.05, 0.05, 0.3, 8), mat);
                    cyl.position.set((Math.random() - 0.5) * 0.4, 0.15 + Math.random() * 0.1, (Math.random() - 0.5) * 0.4);
                    cyl.rotation.z = Math.PI / 2;
                    g.add(cyl);
                }
                break;
            }
            case 'armor': {
                const plate = new THREE.Mesh(
                    GeometryCache.getBox(GAME_CONFIG.PICKUPS.ARMOR.SIZE * 1.2, GAME_CONFIG.PICKUPS.ARMOR.SIZE, 0.12),
                    new THREE.MeshStandardMaterial({ color: GAME_CONFIG.PICKUPS.ARMOR.COLOR, metalness: 0.4, roughness: 0.4 })
                );
                g.add(plate);
                break;
            }
            default: {
                const fallback = new THREE.Mesh(GeometryCache.getBox(0.3, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
                g.add(fallback);
            }
        }
        // Glow light
        const light = new THREE.PointLight(0xffffff, 0.4, 3);
        light.userData.isPickupLight = true;
        this.group.add(light);
    }

    update(deltaTime, player, game) {
        if (this.collected) return;
        // Bobbing
        this.bobAmount += (GAME_CONFIG.PICKUPS.BOB_SPEED || 2) * deltaTime;
        const bob = Math.sin(this.bobAmount) * (GAME_CONFIG.PICKUPS.BOB_AMPLITUDE || 0.1);
        this.group.position.y = this.position.y + bob;

        // Rotate slowly for visibility
        this.group.rotation.y += deltaTime * 0.8;

        // Proximity collection
        if (player) {
            const dist = player.position.distanceTo(this.group.position);
            if (dist <= this.radius) {
                this.collect(player, game);
            }
        }
    }

    collect(player, game) {
        if (this.collected) return;
        this.collected = true;
        switch (this.type) {
            case 'health':
                player.heal(GAME_CONFIG.PICKUPS.HEALTH.VALUE);
                break;
            case 'shells':
                player.addAmmo('shells', GAME_CONFIG.PICKUPS.SHELLS.VALUE);
                break;
            case 'armor':
                player.addArmor(GAME_CONFIG.PICKUPS.ARMOR.VALUE);
                break;
        }
        // Sound
        if (AudioManager && AudioManager.playPickupSound) {
            AudioManager.playPickupSound();
        }
        // Score
        if (game && typeof game.addScore === 'function') {
            const scoreMap = { health: GAME_CONFIG.PICKUPS.HEALTH.SCORE, shells: GAME_CONFIG.PICKUPS.SHELLS.SCORE, armor: GAME_CONFIG.PICKUPS.ARMOR.SCORE };
            const pts = scoreMap[this.type] || 0;
            if (pts) game.addScore(pts);
        }
        this.destroy();
    }

    destroy() {
        if (!this.group) return;
        this.scene.remove(this.group);
        // Dispose simple materials/geometries if created here (mostly from cache)
        this.group.traverse(child => {
            if (child.isMesh) {
                // Using cached geometries; avoid disposing cache. Dispose materials we created.
                if (child.material && !child.material.isDisposed) {
                    // Some materials are reused; skip disposal to avoid side effects.
                }
            }
        });
        this.group = null;
    }
}

