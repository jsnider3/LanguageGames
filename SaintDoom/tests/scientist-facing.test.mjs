import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PossessedScientist } from '../enemies/possessedScientist.js';

for (const state of ['chasing', 'attacking']) {
    test(`scientist's eyes face the player while ${state}, in every direction`, () => {
        const scene = new THREE.Scene();
        const origin = new THREE.Vector3(3, 0.1, -7);
        const scientist = new PossessedScientist(scene, origin);
        try {
            // Reuse the model through several turns to catch accumulating rotations.
            for (let turn = 0; turn < 16; turn++) {
                const angle = turn * Math.PI / 4;
                const distance = state === 'chasing' ? 5 : 1;
                const target = {
                    position: origin.clone().add(new THREE.Vector3(
                        Math.sin(angle) * distance, 0.5, Math.cos(angle) * distance
                    )),
                    takeDamage() {}
                };
                scientist.position.copy(origin);
                scientist.velocity.set(0, 0, 0);
                scientist.state = state;
                scientist.lastAttackTime = Date.now() / 1000;
                scientist.update(1 / 60, target);
                scene.updateMatrixWorld(true);

                // Check the actual eye geometry relative to the head, not an
                // assumed model-forward vector or a duplicate yaw calculation.
                const eyeCenter = scientist.leftEye.getWorldPosition(new THREE.Vector3())
                    .add(scientist.rightEye.getWorldPosition(new THREE.Vector3()))
                    .multiplyScalar(0.5);
                const faceDirection = eyeCenter
                    .sub(scientist.headMesh.getWorldPosition(new THREE.Vector3()))
                    .setY(0).normalize();
                const toPlayer = target.position.clone().sub(scientist.position).setY(0).normalize();
                assert.ok(faceDirection.dot(toPlayer) > 0.999,
                    `${state}, turn ${turn}: the eyes must point toward the player`);
                assert.equal(scientist.mesh.rotation.x, 0);
                assert.equal(scientist.mesh.rotation.z, 0);
                if (state === 'chasing') {
                    assert.ok(scientist.position.clone().sub(origin).dot(toPlayer) > 0,
                        'the scientist must still advance toward the player');
                }
            }
        } finally {
            scientist.destroy();
        }
    });
}
