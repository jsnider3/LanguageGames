import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { WALLS, ROOMS, BARRIERS, EMPLACEMENTS, REACTOR } from "./bunker-data.js";
import { box, cylinder, group, makeTower, disposeModel } from "./models.js";
import { makeTrooper, animateTrooper } from "./infantry.js";
import { concrete, steel } from "./surfaces.js";

export class BunkerWorld {
  constructor(environment) {
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x0c1620);
    this.scene.environment = environment; this.scene.environmentIntensity = .2;
    this.scene.fog = new THREE.Fog(0x15212a, 25, 65);
    this.materials = []; this.textures = []; this.batches = []; this.enemies = new Map(); this.towers = new Map();
    const mat = (color, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .8, ...extra }); this.materials.push(m); return m; };
    this.m = { wall: mat(0x778592, { map: concrete }), dark: mat(0x152633), floor: mat(0x354a55), trim: mat(0x8c9da8, { map: steel, metalness: .5 }), orange: mat(0xca8248), blue: mat(0x57aebc), light: mat(0xdce7df, { emissive: 0xc5dbd9, emissiveIntensity: 2 }), teal: mat(0x87cabb, { emissive: 0x459f9f, emissiveIntensity: 1.6 }) };
    const ambient = new THREE.HemisphereLight(0xd0e3e9, 0x566778, 1.6); this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xd3e8ff, 1.5); sun.position.set(5, 15, 5); this.scene.add(sun);
    const staticRoot = group(this.scene), m = this.m;
    box(staticRoot, m.floor, 0, -.18, 0, 36, .35, 28);
    for (let x = -16; x <= 16; x += 4) box(staticRoot, m.dark, x, .002, 0, .035, .008, 28);
    for (let z = -12; z <= 12; z += 4) box(staticRoot, m.dark, 0, .002, z, 36, .008, .035);
    this.ceiling = box(this.scene, m.dark, 0, 4.75, 0, 36, .2, 28);
    for (const w of WALLS) {
      box(staticRoot, m.wall, w.x, 2.3, w.z, w.halfX * 2, 4.6, w.halfZ * 2);
      box(staticRoot, m.dark, w.x, .2, w.z, w.halfX * 2 + .04, .4, w.halfZ * 2 + .04);
      box(staticRoot, m.trim, w.x, 3.6, w.z, w.halfX * 2 + .045, .09, w.halfZ * 2 + .045);
      box(staticRoot, w.x < -5 ? m.orange : w.x > 5 ? m.blue : m.teal, w.x, 1.05, w.z, w.halfX * 2 + .055, .15, w.halfZ * 2 + .055);
    }
    for (const [i, room] of ROOMS.entries()) {
      const accent = room.x < 0 ? m.orange : room.x > 0 ? m.blue : m.teal;
      for (const side of [-1, 1]) {
        box(staticRoot, accent, room.x + side * (room.w / 2 - .55), .012, room.z, .09, .025, room.d - 1.3);
        box(staticRoot, m.trim, room.x + side * 3.6, 4.48, room.z, .12, .18, room.d - .8);
      }
      for (let z = room.z - room.d / 2 + 2; z < room.z + room.d / 2; z += 4) {
        box(staticRoot, m.dark, room.x, 4.44, z, 5.2, .18, .75);
        box(staticRoot, m.light, room.x, 4.32, z, 4.7, .06, .4);
      }
      const light = new THREE.PointLight(room.x < 0 ? 0xffcfa3 : 0xa6dbed, 24, 18, 1.4); light.position.set(room.x, 3.8, room.z); this.scene.add(light);
      const label = this.label(`${String(i + 1).padStart(2, "0")}  /  ${room.name}`, 5, room.color);
      label.rotation.x = -Math.PI / 2; label.position.set(room.x, .025, room.z + 2.8); this.scene.add(label);
    }
    // Service passages stay open, allowing the operator to circle behind either entry room.
    for (const x of [-6, 6]) for (const z of [7, 11]) box(staticRoot, m.orange, x, 2, z, .58, 4, .1);
    for (const x of [-12, 12]) {
      box(staticRoot, m.dark, x, 2.3, -14, 4, 4.6, .3);
      box(staticRoot, m.orange, x, 4.05, -13.78, 3.8, .18, .08);
      const entrance = this.label("HOSTILE ACCESS", 3, "#f8a46b"); entrance.position.set(x, 3.4, -13.77); this.scene.add(entrance);
      for (const side of [-1, 1]) box(staticRoot, m.trim, x + side * 2, 2.2, -13.9, .16, 4.4, .4);
    }
    // Workbench, storage racks, coolant piping and control consoles sit outside combat lanes.
    for (const x of [-16.5, 16.5]) {
      box(staticRoot, m.dark, x, .5, 7, 1.2, 1, 7);
      box(staticRoot, m.trim, x, 1.08, 7, 1.35, .14, 7.2);
      for (let z = 5; z <= 9; z += 2) {
        box(staticRoot, x < 0 ? m.orange : m.blue, x, 1.4, z, .7, .55, 1.3);
        box(staticRoot, m.dark, x, 2.4, z, 1.2, .1, 1.8);
      }
    }
    for (let x = -16; x <= 16; x += 4) {
      box(staticRoot, m.trim, x, 3.95, 13.6, .22, .22, .5);
      const pipe = cylinder(staticRoot, m.blue, x, 4.05, 0, .08, .08, 27, 8); pipe.rotation.x = Math.PI / 2;
    }
    for (const x of [-4, 4]) {
      box(staticRoot, m.dark, x, .6, 12.5, 3, 1.2, 1);
      const screen = box(staticRoot, m.teal, x, 1.4, 12.3, 2.6, .8, .15); screen.rotation.x = -.25;
    }
    const sign = this.label("REACTOR  /  01", 3.6, "#a5dfcb"); sign.position.set(0, 3.5, 4.3); this.scene.add(sign);
    const backSign = this.label("CONTROL / SERVICE LOOP", 4.5, "#a5dfcb"); backSign.position.set(0, 3.5, 3.7); backSign.rotation.y = Math.PI; this.scene.add(backSign);
    this.barriers = BARRIERS.map(b => {
      const root = group(this.scene, b.x, 0, b.z); root.rotation.y = Math.PI / 2;
      const signal = mat(0x76cdca, { emissive: 0x408b92, emissiveIntensity: 1 });
      const face = mat(b.kind === "door" ? 0x4c6876 : 0x8b755c, { map: steel, metalness: .35 });
      for (const side of [-1, 1]) box(root, m.trim, side * (b.width / 2 + .05), 1.85, 0, .18, 3.7, .6);
      box(root, m.dark, 0, 3.8, 0, b.width + .5, .35, .65);
      const panel = group(root);
      for (let i = 0; i < 5; i++) {
        box(panel, face, 0, .36 + i * .69, 0, b.width - .12, .66, .28);
        for (const side of [-1, 1]) box(panel, m.dark, side * (b.width / 2 - .25), .36 + i * .69, 0, .08, .55, .31);
      }
      for (const side of [-1, 1]) {
        box(panel, signal, 0, 1.6, side * .16, .055, 2.7, .025);
        const controlX = b.kind === "door" ? -1.7 : 0;
        box(root, m.dark, controlX, 1.4, side * .76, .5, .75, .22);
        box(root, signal, controlX, 1.5, side * .89, .34, .35, .025);
        const label = this.label(b.name.toUpperCase(), b.width - .3, "#d8e7e8"); label.position.set(0, 3.8, side * .35); if (side < 0) label.rotation.y = Math.PI; root.add(label);
      }
      const debris = group(root);
      for (let i = 0; i < 4; i++) { const piece = box(debris, face, (i - 1.5) * .7, .13, (i % 2 ? 1 : -1) * .7, .8, .15, .45); piece.rotation.y = i * 2; }
      debris.visible = false;
      return { root, panel, signal, debris, face, openAmount: 0 };
    });
    for (const t of EMPLACEMENTS) {
      cylinder(staticRoot, m.dark, t.x, .08, t.z, .8, .85, .16, 12);
      const label = this.label("E / SUPPORT SENTRY", 2.5, "#a3cbd8"); label.rotation.x = -Math.PI / 2; label.position.set(t.x, .025, t.z + 1.3); this.scene.add(label);
    }
    const reactor = group(this.scene, REACTOR.x, 0, REACTOR.z);
    cylinder(reactor, m.dark, 0, .2, 0, 1.5, 1.7, .4, 12);
    cylinder(reactor, m.trim, 0, 1.7, 0, 1, 1.2, 2.8, 12);
    this.core = cylinder(reactor, m.teal, 0, 2.2, 0, .75, .75, 2.5, 12);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; box(reactor, m.dark, Math.sin(a) * 1.12, 1.9, Math.cos(a) * 1.12, .16, 3.1, .16); }
    cylinder(reactor, m.dark, 0, 3.55, 0, 1.35, 1.35, .25, 12);
    this.bake(staticRoot);
  }
  label(text, width, color) {
    const c = document.createElement("canvas"); c.width = 768; c.height = 100;
    const ctx = c.getContext("2d"); ctx.font = "bold 38px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color; ctx.fillText(text, 384, 50);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; this.textures.push(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }); this.materials.push(material);
    const geometry = new THREE.PlaneGeometry(width, width * 100 / 768); this.batches.push(geometry);
    return new THREE.Mesh(geometry, material);
  }
  bake(root) {
    root.updateMatrixWorld(true); const groups = new Map();
    root.traverse(o => { if (!o.isMesh) return; let g = o.geometry.clone().applyMatrix4(o.matrixWorld); if (g.index) { const old = g; g = g.toNonIndexed(); old.dispose(); } if (!groups.has(o.material)) groups.set(o.material, []); groups.get(o.material).push(g); });
    for (const [material, geometries] of groups) {
      const geometry = mergeGeometries(geometries); geometries.forEach(g => g.dispose()); this.batches.push(geometry);
      const mesh = new THREE.Mesh(geometry, material); mesh.receiveShadow = true; this.scene.add(mesh);
    }
    root.removeFromParent();
  }
  update(sim, dt, camera) {
    this.barriers.forEach((m, i) => {
      const b = sim.barriers[i], open = b.open || b.hp <= 0;
      m.openAmount = THREE.MathUtils.damp(m.openAmount, open ? 1 : 0, 12, dt);
      m.panel.position.y = m.openAmount * 3.4; m.panel.scale.y = 1 - m.openAmount * .95;
      m.panel.visible = b.kind === "door" || b.hp > 0; m.debris.visible = b.hp <= 0;
      m.signal.color.set(b.hp <= 0 ? 0xff7045 : b.hp < b.maxHp * .35 ? 0xffb359 : 0x78d7c8);
      m.signal.emissive.copy(m.signal.color); m.signal.emissiveIntensity = b.hp <= 0 ? 1 + Math.sin(sim.time * 6) * .5 : .7;
      m.face.color.set(b.kind === "door" ? 0x4c6876 : 0x8b755c).multiplyScalar(.5 + .5 * b.hp / b.maxHp);
    });
    for (const e of sim.enemies) {
      if (!this.enemies.has(e.id)) { const model = makeTrooper({ ...e, type: e.type === "breacher" ? "heavy" : "rifle" }); if (e.type === "runner") model.scale.setScalar(.85); this.enemies.set(e.id, model); this.scene.add(model); }
      const model = this.enemies.get(e.id); animateTrooper(model, e, sim.time, camera);
    }
    for (const [id, m] of this.enemies) if (!sim.enemies.some(e => e.id === id)) { disposeModel(m); this.enemies.delete(id); }
    for (const t of sim.turrets) {
      if (!t.level) continue;
      if (!this.towers.has(t.id)) { const m = makeTower("sentry", t.level); m.scale.setScalar(.46); m.position.set(t.x, .16, t.z); this.scene.add(m); this.towers.set(t.id, m); }
      const target = sim.enemies.find(e => Math.hypot(e.x - t.x, e.z - t.z) < 12);
      if (target) this.towers.get(t.id).userData.head.rotation.y = Math.atan2(target.x - t.x, target.z - t.z);
    }
    this.core.rotation.y = sim.time * .2;
  }
  dispose() {
    for (const m of [...this.enemies.values(), ...this.towers.values()]) disposeModel(m);
    this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); this.batches.forEach(g => g.dispose());
  }
}
