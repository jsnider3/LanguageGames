import * as THREE from "three";
import { BunkerSimulation } from "./bunker-simulation.js";
import { BunkerWorld } from "./bunker-world.js";
import { BunkerUI } from "./bunker-ui.js";
import { BUNKER_SAVE, BUNKER_WAVES } from "./bunker-data.js";
import { WEAPONS } from "./data.js";
import { makeWeapon, box, group, materials, disposeModel } from "./models.js";
import { Effects } from "./effects.js";
import "./bunker.css";
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function readBunkerCheckpoint() {
  try { const data = JSON.parse(localStorage.getItem(BUNKER_SAVE)); return BunkerSimulation.restore(data) ? data : null; } catch { return null; }
}
export class BunkerGame {
  constructor(host, checkpoint = null) {
    this.host = host; this.sim = BunkerSimulation.restore(checkpoint) || new BunkerSimulation(host.settings.difficulty);
    this.abort = new AbortController(); this.keys = new Set(); this.mode = "fps"; this.paused = false;
    this.yaw = 0; this.pitch = 0; this.weapon = "rifle"; this.ammo = { rifle: 32, shotgun: 8 }; this.reloads = { rifle: 0, shotgun: 0 };
    this.firing = false; this.aiming = false; this.aimBlend = 0; this.fireTimer = 0; this.hitTimer = 0; this.hurtTimer = 0; this.recoil = 0; this.flash = 0;
    this.grenadeCooldown = 0; this.grenades = []; this.bob = 0; this.jump = 0; this.verticalSpeed = 0; this.saveTimer = 0; this.uiTimer = 0; this.sparkTimer = 0; this.briefUntil = 12;
    this.world = new BunkerWorld(host.world.environment.texture); this.camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, .06, 90);
    this.weaponCamera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .01, 8); this.weaponScene = new THREE.Scene();
    this.weaponScene.environment = host.world.environment.texture; this.weaponScene.environmentIntensity = .3;
    this.weaponScene.add(new THREE.HemisphereLight(0xc6e0eb, 0x364652, 2)); const key = new THREE.DirectionalLight(0xffd0a1, 2); key.position.set(-2, 4, 1); this.weaponScene.add(key);
    this.weapons = { rifle: makeWeapon("rifle"), shotgun: makeWeapon("shotgun") }; Object.values(this.weapons).forEach(m => this.weaponScene.add(m));
    this.welder = group(this.weaponScene); box(this.welder, materials.dark, 0, 0, 0, .16, .19, .3); box(this.welder, materials.brass, 0, .015, -.21, .08, .08, .25); box(this.welder, materials.teal, 0, .015, -.35, .045, .045, .03); box(this.welder, materials.rubber, .015, -.13, .04, .16, .17, .2); box(this.welder, materials.panel, .08, -.23, .16, .17, .18, .35);
    this.effects = new Effects(this.world.scene);
    this.ui = new BunkerUI(this); document.querySelector("#interface").classList.add("hidden");
    document.body.classList.remove("field-mode", "raid-mode", "workshop-mode", "aiming", "sighted");
    this.bindInput(); this.save(); this.capture(); this.ui.update();
    this.ui.notice("BUNKER 09 · Hold E at a damaged panel to weld. F operates a working door.");
  }
  inspect() {
    const s = this.sim;
    return { started: true, operation: "defense", scenario: "bunker", mode: this.mode, paused: this.paused, phase: s.phase, wave: s.wave, coreHp: s.coreHp, credits: s.credits, enemies: s.enemies.length, remaining: s.queue.length, player: { ...s.player }, lives: s.lives, weapon: this.weapon, ammo: { ...this.ammo }, kills: s.kills, playerKills: s.playerKills, barriers: s.barriers.map(b => ({ id: b.id, hp: b.hp, open: b.open, progress: b.progress })), towers: s.turrets.map(t => ({ id: t.id, level: t.level })), maintenance: s.work, saved: !!readBunkerCheckpoint() };
  }
  capture() {
    if (this.paused || this.mode !== "fps") return;
    this.host.audio.unlock();
    this.host.canvas.requestPointerLock()?.catch(() => this.ui.notice("Click the battlefield to capture the mouse."));
  }
  save() { const data = this.sim.checkpoint(); if (data) try { localStorage.setItem(BUNKER_SAVE, JSON.stringify(data)); } catch { this.ui.notice("Browser storage is unavailable. This operation cannot be saved."); } }
  startWave() { if (this.paused || this.sim.phase !== "build") return; this.save(); if (this.sim.startWave()) { this.briefUntil = this.sim.time + 8; this.host.audio.play("wave"); this.ui.notice(BUNKER_WAVES[this.sim.wave - 1].briefing); } }
  pause() { if (this.paused) return; this.paused = true; this.keys.clear(); this.firing = this.aiming = false; this.sim.work = null; this.save(); if (document.pointerLockElement) document.exitPointerLock(); this.ui.pause(); }
  resume() { if (["victory", "defeat"].includes(this.sim.phase)) return; this.paused = false; this.ui.e.overlay.classList.add("hidden"); this.capture(); }
  action(action) {
    if (action === "pause") this.pause();
    if (action === "resume") this.resume();
    if (action === "wave") this.startWave();
    if (action === "map") this.toggleMap();
    if (action === "manual" || action === "settings") { this.pause(); this.ui[action](); }
    if (action === "menu") this.exit();
    if (action === "retry" || action === "new") { const host = this.host, data = action === "retry" ? readBunkerCheckpoint() : null; this.dispose(); host.bunker = new BunkerGame(host, data); }
  }
  toggleMap() {
    if (this.paused || this.sim.player.respawn) return;
    this.mode = this.mode === "map" ? "fps" : "map"; this.firing = this.aiming = false; this.keys.clear(); this.sim.work = null;
    if (this.mode === "map") { if (document.pointerLockElement) document.exitPointerLock(); } else this.capture();
    this.ui.update();
  }
  bindInput() {
    const on = (target, type, callback) => target.addEventListener(type, callback, { signal: this.abort.signal });
    on(window, "keydown", e => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (["Tab", "Space", "Enter", "KeyE", "KeyF", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
      if (e.code === "Escape") { if (this.paused) this.resume(); else this.pause(); return; }
      if (this.paused) return;
      this.keys.add(e.code); if (e.repeat) return;
      if (e.code === "Tab") this.toggleMap();
      if (e.code === "Enter") this.startWave();
      if (e.code === "KeyH") this.action("manual");
      if (this.mode !== "fps" || this.sim.player.respawn) return;
      if (e.code === "KeyF" && this.target) this.sim.toggleDoor(this.target.id);
      if (e.code === "KeyR") this.reload();
      if (e.code === "KeyQ") { this.weapon = this.weapon === "rifle" ? "shotgun" : "rifle"; this.aimBlend = 0; this.fireTimer = Math.max(this.fireTimer, .15); }
      if (e.code === "KeyG") this.throwGrenade();
      if (e.code === "Space" && this.jump <= 0 && !this.sim.work) this.verticalSpeed = 5;
    });
    on(window, "keyup", e => { this.keys.delete(e.code); if (e.code === "KeyE") this.save(); });
    on(this.host.canvas, "mousedown", e => {
      if (this.paused || this.mode !== "fps") return;
      if (document.pointerLockElement !== this.host.canvas) { this.capture(); return; }
      if (e.button === 0) this.firing = true; if (e.button === 2) this.aiming = true;
    });
    on(window, "mouseup", e => { if (e.button === 0) this.firing = false; if (e.button === 2) this.aiming = false; });
    on(window, "mousemove", e => {
      if (this.paused || this.mode !== "fps" || document.pointerLockElement !== this.host.canvas) return;
      const speed = .002 * this.host.settings.sensitivity * (this.aiming ? .6 : 1);
      this.yaw -= e.movementX * speed; this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * speed, -1.4, 1.4);
    });
    on(document, "pointerlockchange", () => { if (!document.pointerLockElement && this.mode === "fps" && !this.paused) this.pause(); });
    on(window, "blur", () => this.pause());
    on(document, "visibilitychange", () => { if (document.hidden) this.pause(); });
  }
  reload() { const w = WEAPONS[this.weapon]; if (!this.reloads[this.weapon] && this.ammo[this.weapon] < w.magazine && !this.sim.work) { this.reloads[this.weapon] = w.reload; this.host.audio.play("reload"); } }
  obstruction(ray, range) {
    let nearest = range; const hit = v3();
    for (const b of this.sim.blockers()) {
      const bounds = new THREE.Box3(v3(b.x - b.halfX, 0, b.z - b.halfZ), v3(b.x + b.halfX, b.height, b.z + b.halfZ));
      if (ray.intersectBox(bounds, hit)) nearest = Math.min(nearest, hit.distanceTo(ray.origin));
    }
    for (const plane of [new THREE.Plane(v3(0, 1, 0), 0), new THREE.Plane(v3(0, -1, 0), 4.65)]) if (ray.intersectPlane(plane, hit)) nearest = Math.min(nearest, hit.distanceTo(ray.origin));
    return nearest;
  }
  shoot() {
    if (this.fireTimer > 0 || this.reloads[this.weapon] > 0 || this.sim.work || this.sim.player.respawn || this.keys.has("KeyE")) return;
    if (!this.ammo[this.weapon]) { this.reload(); return; }
    const w = WEAPONS[this.weapon]; this.ammo[this.weapon]--; this.fireTimer = w.interval; this.flash = .06; this.recoil = this.weapon === "rifle" ? .4 : 1;
    this.host.audio.play(this.weapon); const forward = this.camera.getWorldDirection(v3()), from = this.camera.position.clone();
    for (let i = 0; i < w.pellets; i++) {
      const spread = w.spread * (this.aiming ? .38 : 1), direction = forward.clone().add(v3((Math.random() - .5) * spread, (Math.random() - .5) * spread, (Math.random() - .5) * spread)).normalize();
      const ray = new THREE.Ray(from, direction); let length = this.obstruction(ray, w.range), target = null, point = v3(), impact = from.clone().addScaledVector(direction, length);
      for (const enemy of this.sim.enemies) {
        if (enemy.dead) continue;
        const height = enemy.type === "runner" ? 2.05 : 2.45;
        if (ray.intersectBox(new THREE.Box3(v3(enemy.x - .5, .15, enemy.z - .5), v3(enemy.x + .5, height, enemy.z + .5)), point) && point.distanceTo(from) < length) { length = point.distanceTo(from); target = enemy; impact.copy(point); }
      }
      this.effects.beam(from.clone().addScaledVector(direction, .7).add(v3(0, -.08, 0)), impact, 0xffce91, .055, .012);
      this.effects.burst(impact.x, Math.max(.1, impact.y), impact.z, 0xffcb89, target ? 5 : 2, 2);
      if (target) { this.sim.damage(target, w.damage * (impact.y > (target.type === "runner" ? 1.65 : 1.95) ? 1.6 : 1) * (this.weapon === "shotgun" ? Math.max(.3, 1 - length / 32) : 1)); this.hitTimer = .14; this.host.audio.play("hit"); }
    }
  }
  throwGrenade() {
    if (this.grenadeCooldown > 0 || this.sim.work || this.keys.has("KeyE")) return;
    this.grenadeCooldown = 12; const direction = this.camera.getWorldDirection(v3()), position = this.camera.position.clone();
    const model = new THREE.Mesh(new THREE.IcosahedronGeometry(.12), materials.brass); model.position.copy(position); this.world.scene.add(model);
    this.grenades.push({ model, velocity: direction.multiplyScalar(10).add(v3(0, 3, 0)), timer: 1.6 });
  }
  updateGrenades(dt) {
    for (const g of this.grenades) {
      g.timer -= dt; g.velocity.y -= 15 * dt;
      const p = g.model.position, next = p.clone().addScaledVector(g.velocity, dt);
      if (this.sim.collides(next.x, p.z, .12)) g.velocity.x *= -.5; else p.x = next.x;
      if (this.sim.collides(p.x, next.z, .12)) g.velocity.z *= -.5; else p.z = next.z;
      p.y = Math.max(.12, Math.min(4.45, next.y)); if (p.y === .12 || p.y === 4.45) { g.velocity.y *= -.4; g.velocity.x *= .8; g.velocity.z *= .8; }
      g.model.rotation.x += dt * 5;
      if (g.timer <= 0) {
        this.effects.burst(p.x, p.y, p.z, 0xffae58, 45, 6); this.effects.shockwave(p.x, p.z, 4.5); this.host.audio.play("explosion");
        for (const e of this.sim.enemies) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < 4.5 && this.sim.visible(p, e)) this.sim.damage(e, 220 * (1 - d / 6)); }
        g.model.removeFromParent(); g.model.geometry.dispose();
      }
    }
    this.grenades = this.grenades.filter(g => g.timer > 0);
  }
  move(dt) {
    const p = this.sim.player;
    if (this.mode !== "fps" || p.respawn) return;
    const forward = Number(this.keys.has("KeyW")) - Number(this.keys.has("KeyS")), side = Number(this.keys.has("KeyD")) - Number(this.keys.has("KeyA"));
    const speed = this.keys.has("KeyC") ? 2.4 : this.sim.work ? 1.6 : this.aiming ? 3 : this.keys.has("ShiftLeft") ? 7 : 4.5, length = Math.hypot(forward, side) || 1;
    this.sim.move(p, p.x + (-Math.sin(this.yaw) * forward + Math.cos(this.yaw) * side) * speed * dt / length, p.z + (-Math.cos(this.yaw) * forward - Math.sin(this.yaw) * side) * speed * dt / length);
    if (forward || side) this.bob += dt * speed * 2;
    this.verticalSpeed -= 19 * dt; this.jump = Math.max(0, this.jump + this.verticalSpeed * dt); if (!this.jump) this.verticalSpeed = 0;
  }
  updateCamera(dt) {
    const p = this.sim.player;
    this.camera.position.set(p.x, (this.keys.has("KeyC") ? 1.05 : 1.8) + this.jump, p.z); this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    const busy = !!this.sim.work, aim = this.aiming && !busy && !this.reloads[this.weapon] ? 1 : 0;
    this.aimBlend = THREE.MathUtils.damp(this.aimBlend, aim, 18, dt); if (Math.abs(this.aimBlend - aim) < .001) this.aimBlend = aim;
    this.camera.fov = 78 - this.aimBlend * 27; this.camera.updateProjectionMatrix();
    this.recoil *= Math.exp(-dt * 13);
    for (const [type, model] of Object.entries(this.weapons)) {
      model.visible = type === this.weapon && !busy && !p.respawn;
      const reload = Math.sin(this.reloads[type] / WEAPONS[type].reload * Math.PI), bob = this.host.settings.shake ? Math.sin(this.bob) * .004 : 0;
      model.position.set((.26 + bob) * (1 - this.aimBlend), THREE.MathUtils.lerp(-.26, -model.userData.sight.position.y, this.aimBlend) - reload * .3, -.88 + this.aimBlend * .1 + this.recoil * .055);
      model.rotation.set(-reload * .5 + this.recoil * .03 * (1 - this.aimBlend), reload * .3, -reload * .5);
      model.userData.flash.visible = this.flash > 0 && type === this.weapon;
      if (model.userData.reticle) model.userData.reticle.visible = this.aimBlend === 1;
    }
    this.welder.visible = busy; this.welder.position.set(.26, -.28 + Math.sin(this.sim.time * 20) * .004, -.6); this.welder.rotation.y = -.2;
  }
  events() {
    for (const e of this.sim.drainEvents()) {
      if (e.type === "notice") this.ui.notice(e.text);
      if (e.type === "door") { this.host.audio.play("reload"); this.ui.notice(`${e.barrier.name} ${e.barrier.open ? "open" : "sealed"}.`); }
      if (e.type === "restored") { this.host.audio.play("build"); this.ui.notice(`${e.item.name} ${e.item.kind ? "restored" : "online"}.`); this.save(); }
      if (e.type === "impact") { this.effects.burst(e.x, 1.5, e.z, 0xffb16a, 5, 3); this.host.audio.play("sentry", Math.hypot(e.x - this.sim.player.x, e.z - this.sim.player.z)); }
      if (e.type === "breach") { this.effects.burst(e.barrier.x, 1.4, e.barrier.z, 0xffaf62, 30, 5); this.host.audio.play("explosion", 5); this.ui.notice(`${e.barrier.name.toUpperCase()} ${e.barrier.kind === "door" ? "JAMMED OPEN — reset the motor by hand." : "BREACHED — a route to the reactor is open."}`); }
      if (e.type === "shot") { this.effects.beam({ x: e.from.x, y: 1.5, z: e.from.z }, { x: e.to.x, y: 1.3, z: e.to.z }, e.enemy ? 0xff7048 : 0x8bd5df, .08, .025); this.host.audio.play("sentry", Math.hypot(e.from.x - this.sim.player.x, e.from.z - this.sim.player.z)); }
      if (e.type === "hurt") { this.hurtTimer = .35; this.host.audio.play("hurt"); }
      if (e.type === "coreHit") { if (this.sim.time > (this.coreWarning || 0)) { this.ui.notice("HOSTILES IN THE REACTOR ROOM — core taking damage!"); this.coreWarning = this.sim.time + 4; this.host.audio.play("wave"); } }
      if (e.type === "kill") this.effects.burst(e.enemy.x, 1, e.enemy.z, 0xffa77b, 8, 3);
      if (e.type === "clear") { this.host.audio.play("clear"); this.save(); this.ui.notice("ASSAULT CLEARED · +55 scrap. Repair the bunker before the next attack."); }
      if (e.type === "respawn") { this.mode = "fps"; this.yaw = this.pitch = 0; this.jump = 0; this.ui.notice("Redeployed in CONTROL. Damage to the bunker persists."); }
      if (e.type === "defeat" || e.type === "victory") { this.paused = true; this.keys.clear(); this.firing = false; if (document.pointerLockElement) document.exitPointerLock(); if (e.type === "victory") try { localStorage.removeItem(BUNKER_SAVE); } catch {} this.ui.result(e.type === "victory"); }
    }
  }
  frame(dt) {
    if (!this.paused) {
      this.fireTimer = Math.max(0, this.fireTimer - dt); this.flash = Math.max(0, this.flash - dt); this.hitTimer -= dt; this.hurtTimer = Math.max(0, this.hurtTimer - dt); this.grenadeCooldown = Math.max(0, this.grenadeCooldown - dt);
      for (const type of Object.keys(this.reloads)) if (this.reloads[type] > 0) { this.reloads[type] = Math.max(0, this.reloads[type] - dt); if (!this.reloads[type]) this.ammo[type] = WEAPONS[type].magazine; }
      this.move(dt); this.target = this.mode === "fps" ? this.sim.nearest(this.yaw) : null;
      const work = this.keys.has("KeyE") && this.target && !this.reloads[this.weapon] && this.jump === 0 ? this.target.id : null;
      this.sim.update(dt, work); this.updateCamera(dt);
      if (this.firing && this.mode === "fps" && document.pointerLockElement === this.host.canvas && ["build", "wave"].includes(this.sim.phase)) this.shoot();
      this.updateGrenades(dt); this.events(); this.effects.update(dt); this.host.audio.update(dt, this.sim.phase === "wave");
      this.sparkTimer -= dt;
      if (this.sim.work && this.target && this.sparkTimer <= 0) {
        this.sparkTimer = .1; const a = this.sim.anchors(this.target).sort((a, b) => Math.hypot(a.x - this.sim.player.x, a.z - this.sim.player.z) - Math.hypot(b.x - this.sim.player.x, b.z - this.sim.player.z))[0];
        const x = this.target.kind ? this.target.x + Math.sign(this.sim.player.x - this.target.x) * .2 : a.x;
        this.effects.burst(x, 1.45, a.z, 0x92dbff, 5, .6);
        for (const p of this.effects.particles.slice(-5)) p.scale = .22;
        this.host.audio.noise(.07, .045, 4500);
      }
      this.saveTimer += dt; if (this.saveTimer > 1) { if (this.sim.work) this.save(); this.saveTimer = 0; }
    }
    this.updateCamera(this.paused ? 0 : dt); this.world.update(this.sim, this.paused ? 0 : dt, this.camera);
    this.uiTimer += dt; if (this.uiTimer > .08) { this.ui.update(); this.uiTimer = 0; }
    const r = this.host.renderer; r.autoClear = true; r.render(this.world.scene, this.camera);
    if (this.mode === "fps") { r.autoClear = false; r.clearDepth(); r.render(this.weaponScene, this.weaponCamera); r.autoClear = true; }
  }
  resize() { for (const camera of [this.camera, this.weaponCamera]) { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); } }
  dispose() {
    this.abort.abort(); this.keys.clear(); this.firing = false; if (document.pointerLockElement) document.exitPointerLock();
    this.world.dispose(); Object.values(this.weapons).forEach(disposeModel); this.effects.clear(); this.effects.mesh.geometry.dispose(); this.effects.mesh.material.dispose(); this.effects.ringGeometry.dispose();
    this.grenades.forEach(g => g.model.geometry.dispose()); this.ui.root.remove();
  }
  exit() { this.save(); this.dispose(); this.host.bunker = null; document.querySelector("#interface").classList.remove("hidden"); this.host.goToMenu(); }
}
