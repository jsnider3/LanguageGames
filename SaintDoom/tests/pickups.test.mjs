import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Pickup } from '../modules/Pickup.js';
import { AudioManager } from '../modules/Utils.js';
import { GAME_CONFIG } from '../modules/GameConfig.js';
import { ArmoryLevel } from '../levels/armoryLevel.js';

function watchDisposals(group) {
    const counts = new Map();
    group.traverse(child => {
        for (const resource of [child.geometry, ...[].concat(child.material || [])]) {
            if (!resource || counts.has(resource)) continue;
            counts.set(resource, 0);
            resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
        }
    });
    return counts;
}

for (const type of ['health', 'shells', 'armor']) {
    test(`${type} collects once and releases only its owned resources`, t => {
        t.mock.method(AudioManager, 'playPickupSound', () => {});
        const scene = new THREE.Scene();
        const pickup = new Pickup(scene, new THREE.Vector3(), type);
        const neighbor = new Pickup(scene, new THREE.Vector3(10, 0, 0), type);
        const resources = watchDisposals(pickup.group);
        const sharedGeometry = pickup.group.children[0].geometry;
        assert.equal(sharedGeometry, neighbor.group.children[0].geometry);
        const reward = [];
        const player = {
            position: new THREE.Vector3(5, 0, 0),
            heal: value => reward.push(['health', value]),
            addAmmo: (kind, value) => reward.push([kind, value]),
            addArmor: value => reward.push(['armor', value])
        };
        let score = 0;
        const game = { addScore: value => { score += value; } };
        pickup.update(1 / 60, player, game);
        assert.equal(pickup.collected, false);
        player.position.set(0, 0, 0);
        pickup.update(1 / 60, player, game);
        pickup.collect(player, game);
        pickup.destroy();
        assert.equal(pickup.collected, true);
        assert.equal(pickup.group, null);
        assert.deepEqual(reward, [[type, GAME_CONFIG.PICKUPS[type.toUpperCase()].VALUE]]);
        assert.equal(score, GAME_CONFIG.PICKUPS[type.toUpperCase()].SCORE);
        assert.equal(AudioManager.playPickupSound.mock.callCount(), 1);
        assert.deepEqual(scene.children, [neighbor.group]);
        for (const [resource, count] of resources) {
            assert.equal(count, resource.isMaterial || resource === pickup.glow.geometry ? 1 : 0);
        }
        neighbor.destroy();
        assert.equal(resources.get(sharedGeometry), 0, 'cached geometry must survive both pickups');
    });
}

test('armory cleanup releases collected pickups once and keeps uncollected pickups usable', t => {
    const scene = new THREE.Scene();
    const game = { scene, player: { weapons: [], ammo: { bullets: 0, shells: 0 } } };
    const level = new ArmoryLevel(scene, game);
    // Include every rack model and its materials.
    for (let i = 0; i < 4; i++) {
        const random = t.mock.method(Math, 'random', () => (i + 0.5) / 4);
        level.createWeaponPickup(i * 10, 1, 0);
        random.mock.restore();
    }
    const pickups = [...level.pickups];
    const resources = pickups.map(watchDisposals);
    for (let i = 0; i < pickups.length; i++) {
        const pickup = pickups[i];
        level.lastCollectionCheck = 0;
        level.checkWeaponCollection(pickup.position);
        level.lastCollectionCheck = 0;
        level.checkWeaponCollection(pickup.position);
        assert.equal(level.weaponsCollected, i + 1);
        assert.equal(pickup.visible, false);
        level.cleanupRemovedPickups();
        level.cleanupRemovedPickups();
        assert.equal(pickup.parent, null);
        assert.equal(level.pickups.length, 3 - i);
        for (let j = 0; j < pickups.length; j++) {
            for (const count of resources[j].values()) assert.equal(count, j <= i ? 1 : 0);
        }
    }
    assert.deepEqual(game.player.weapons, ['shotgun', 'rifle']);
    assert.deepEqual(game.player.ammo, { bullets: 15, shells: 10 });
    level.clearLevel();
    for (const counts of resources) {
        for (const count of counts.values()) assert.equal(count, 1);
    }
});
