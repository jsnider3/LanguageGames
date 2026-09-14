import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BaseLevel } from '../levels/baseLevel.js';
import { CommunicationsLevel } from '../levels/communicationsLevel.js';
import { LaboratoryLevel } from '../levels/laboratoryLevel.js';
import { SecretArchive } from '../levels/secretArchive.js';
import { PossessedScientist } from '../enemies/possessedScientist.js';
import { BrimstoneGolem } from '../enemies/brimstoneGolem.js';
import { Imp } from '../enemies/imp.js';
import { createArchiveShelf } from '../utils/ArchiveShelf.js';

function lightCount(scene) {
    let count = 0;
    scene.traverseVisible(object => { if (object.isLight) count++; });
    return count;
}

test('decorative archive books use four draws per shelf with all books and gilding present', () => {
    const shelf = createArchiveShelf(15, 3);
    assert.equal(shelf.children.length, 4);
    assert.equal(shelf.getObjectByName('archive-books').count, 135);
    assert.equal(shelf.getObjectByName('archive-book-gilding').count, 270);
    const books = shelf.getObjectByName('archive-books');
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    for (let i = 0; i < books.count; i++) {
        books.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        assert.ok(Math.abs(position.x) < 1.5 && position.y > 0 && position.y < 15);
    }
});

test('scientists, golems, and imp fireballs do not change the room light count', () => {
    const scene = new THREE.Scene();
    scene.add(new THREE.PointLight());
    new PossessedScientist(scene, new THREE.Vector3());
    new BrimstoneGolem(scene, new THREE.Vector3());
    const imp = new Imp(scene, new THREE.Vector3());
    imp.target = { position: new THREE.Vector3(5, 1, 0) };
    for (let i = 0; i < 8; i++) imp.createFireball();
    assert.equal(lightCount(scene), 1);
    while (imp.projectiles.length) imp.removeProjectile(0);
    assert.equal(lightCount(scene), 1);
    assert.equal(scene.children.filter(o => o.isPoints).length, 0, 'fireball trails are released');
});

test('lightning reuses three lights and bolt buffers; level exit cleans them up', () => {
    const scene = new THREE.Scene();
    const level = new CommunicationsLevel(scene, { scene });
    level.createLightningStorms();
    const original = [...scene.children];
    for (let i = 0; i < 100; i++) {
        level.createLightning(level.lightningStorms[0]);
        level.updateLightning(0.21);
        assert.deepEqual(scene.children, original);
        assert.equal(lightCount(scene), 3);
        assert.equal(level.lightningStorms[0].light.intensity, 0);
    }
    level.clearLevel();
    assert.equal(scene.children.length, 0);
    assert.equal(level.lightningStorms.length, 0);
});

test('chapter clearLevel dispatches to its specialized cleanup', () => {
    class Chapter extends BaseLevel {
        cleanup() { this.didCleanup = true; super.cleanup(); }
    }
    const chapter = new Chapter({ scene: new THREE.Scene() });
    chapter.clearLevel();
    assert.equal(chapter.didCleanup, true);
});

test('archive ambience advances through update and releases callbacks on exit', () => {
    const scene = new THREE.Scene();
    const level = new SecretArchive(scene, { scene });
    level.createFloatingBooks(new THREE.Vector3());
    const book = level.cursedBooks[0];
    const angle = book.rotation.y;
    level.update(0.5);
    assert.equal(book.rotation.y, angle + 0.3);
    assert.ok(level.ambientAnimations.length > 0);
    level.clearLevel();
    const stoppedAngle = book.rotation.y;
    level.update(0.5);
    assert.equal(book.rotation.y, stoppedAngle);
    assert.equal(level.ambientAnimations.length, 0);
});

test('lab keycards and exit activation preserve the light count and progression', () => {
    const scene = new THREE.Scene();
    const game = { scene, narrativeSystem: { setObjective() {}, displaySubtitle() {} } };
    const level = new LaboratoryLevel(scene, game);
    level.createLaboratoryLighting();
    const baseline = lightCount(scene);
    for (const color of ['blue', 'yellow', 'red']) level.createKeycard(0, 0.5, 0, color);
    assert.equal(lightCount(scene), baseline);
    level.checkKeycardCollection(new THREE.Vector3(0, 0.5, 0));
    assert.deepEqual(level.keycards, { red: true, blue: true, yellow: true });
    assert.equal(level.pickups.length, 0);
    assert.ok(level.exitPortal);
    assert.equal(level.portalLight.intensity, 2);
    assert.equal(lightCount(scene), baseline);
    level.clearLevel();
});
