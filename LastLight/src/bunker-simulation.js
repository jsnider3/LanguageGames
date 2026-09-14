import { WALLS, FURNITURE, BARRIERS, EMPLACEMENTS, REACTOR, HOSTILES, BUNKER_WAVES, approach, segmentBox } from "./bunker-data.js";
import { NavigationGrid } from "./navigation.js";
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const live = phase => phase === "build" || phase === "wave";
export class BunkerSimulation {
  constructor(difficulty = "normal") {
    this.difficulty = ["relaxed", "normal", "veteran"].includes(difficulty) ? difficulty : "normal";
    this.phase = "build"; this.wave = 0; this.time = 0; this.credits = 180; this.coreHp = REACTOR.maxHp;
    this.player = { x: 0, z: 8, hp: 100, hurt: 0, respawn: 0 }; this.lives = 3;
    this.barriers = BARRIERS.map(b => ({ ...b, hp: b.id === "west-wall" ? 85 : b.maxHp, open: false, progress: 0 }));
    this.turrets = EMPLACEMENTS.map(t => ({ ...t, level: 0, cooldown: 0, progress: 0 }));
    this.enemies = []; this.events = []; this.queue = []; this.spawnTimer = 0; this.serial = 0;
    this.kills = 0; this.playerKills = 0; this.repairs = 0; this.resets = 0; this.work = null;
  }
  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { return this.events.splice(0); }
  blockers() {
    return [...WALLS, ...FURNITURE, ...this.barriers.filter(b => b.hp > 0 && !b.open).map(b => ({ x: b.x, z: b.z, halfX: .25, halfZ: b.width / 2, height: 3.6 })),
      { x: REACTOR.x, z: REACTOR.z, halfX: 1.4, halfZ: 1.4, height: 3.8 },
      ...this.turrets.filter(t => t.level).map(t => ({ x: t.x, z: t.z, halfX: .6, halfZ: .6, height: 1.8 }))];
  }
  collides(x, z, radius = .35) {
    return x < -17.6 || x > 17.6 || z < -13.6 || z > 13.6 || this.blockers().some(b => Math.abs(x - b.x) < b.halfX + radius && Math.abs(z - b.z) < b.halfZ + radius);
  }
  visible(a, b) { return !this.blockers().some(o => segmentBox(a, b, o)); }
  navigation() {
    const key = this.barriers.map(b => Number(b.hp > 0 && !b.open)).join("") + this.turrets.map(t => Number(t.level > 0)).join("");
    if (this.navKey !== key) {
      this.navKey = key; const blockers = this.blockers();
      this.nav = new NavigationGrid((x, z) => x < -17.6 || x > 17.6 || z < -13.6 || z > 13.6 || blockers.some(b => Math.abs(x - b.x) < b.halfX + .34 && Math.abs(z - b.z) < b.halfZ + .34), .7);
    }
    return this.nav;
  }
  move(unit, x, z, radius = .35) {
    if (!this.collides(x, unit.z, radius)) unit.x = x;
    if (!this.collides(unit.x, z, radius)) unit.z = z;
  }
  anchors(item) {
    if (item.kind) return [-1, 1].map(side => ({ x: item.x + side * .85, z: item.z + (item.kind === "door" ? 1.7 : 0) }));
    return [{ x: item.x, z: item.z + 1.2 }];
  }
  reachable(item, player = this.player) {
    return this.anchors(item).some(a => distance(player, a) < 2.7 && this.visible(player, a));
  }
  nearest(yaw) {
    let best = null, score = Infinity;
    for (const item of [...this.barriers, ...this.turrets]) for (const a of this.anchors(item)) {
      const d = distance(this.player, a), dot = ((a.x - this.player.x) * -Math.sin(yaw) + (a.z - this.player.z) * -Math.cos(yaw)) / (d || 1);
      if (d < 2.7 && (dot > .45 || d < .7) && this.visible(this.player, a) && d - dot < score) { best = item; score = d - dot; }
    }
    return best;
  }
  occupied(b) {
    return [this.player, ...this.enemies.filter(e => !e.dead)].some(e => Math.abs(e.x - b.x) < .85 && Math.abs(e.z - b.z) < b.width / 2 + .4);
  }
  toggleDoor(id) {
    const b = this.barriers.find(b => b.id === id);
    if (!live(this.phase) || this.player.respawn || !b || b.kind !== "door" || !this.reachable(b)) return false;
    if (b.hp <= 0) { this.emit("notice", { text: "Motor jammed. Hold E at the control box to reset." }); return false; }
    if (b.open && this.occupied(b)) { this.emit("notice", { text: "Doorway obstructed. Clear it before sealing." }); return false; }
    b.open = !b.open; this.emit("door", { barrier: b }); return true;
  }
  maintain(id, dt) {
    if (!live(this.phase) || this.player.respawn) return false;
    const b = [...this.barriers, ...this.turrets].find(b => b.id === id);
    if (!b || !this.reachable(b)) return false;
    if (b.kind && b.hp > 0 && b.hp < b.maxHp) {
      const hp = Math.min(38 * dt, b.maxHp - b.hp, this.credits / .12);
      if (hp <= 0) return false;
      this.credits -= hp * .12; b.hp += hp; this.repairs += hp; this.work = b.id;
      return true;
    }
    const cost = !b.kind ? (b.level ? 60 : 70) : b.kind === "door" ? 20 : 25;
    if ((b.kind && b.hp > 0) || (!b.kind && b.level >= 2) || this.credits + 1e-6 < cost || (b.kind && this.occupied(b))) return false;
    this.work = b.id; b.progress += dt;
    if (b.progress >= (b.kind === "wall" ? 2.4 : 2)) {
      this.credits = Math.max(0, this.credits - cost); b.progress = 0;
      if (b.kind) { b.hp = b.kind === "door" ? 90 : 75; b.open = false; this.resets++; }
      else b.level++;
      this.emit("restored", { item: b });
    }
    return true;
  }
  damageBarrier(b, amount) {
    if (b.hp <= 0 || !live(this.phase)) return;
    const old = b.hp; b.hp = Math.max(0, b.hp - amount);
    this.emit("impact", { x: b.x, z: b.z });
    if (b.hp === 0) { b.open = true; b.progress = 0; this.emit("breach", { barrier: b }); }
    else if (old >= b.maxHp * .3 && b.hp < b.maxHp * .3) this.emit("notice", { text: `${b.name.toUpperCase()} CRITICAL — repair or fall back.` });
  }
  hurtPlayer(amount) {
    if (this.player.respawn || !live(this.phase)) return;
    const p = this.player; p.hp = Math.max(0, p.hp - amount); p.hurt = 5; this.emit("hurt");
    if (!p.hp) {
      this.lives--; this.coreHp = Math.max(0, this.coreHp - 60); p.respawn = 4; this.emit("down");
      if (!this.lives || !this.coreHp) this.finish(false);
    }
  }
  damage(enemy, amount, source = "player") {
    if (enemy.dead || !live(this.phase)) return;
    enemy.hp -= amount * (1 - enemy.armor); enemy.hitUntil = this.time + .12;
    if (enemy.hp <= 0) {
      enemy.dead = true; this.kills++; this.credits += enemy.reward;
      if (source === "player") this.playerKills++;
      this.emit("kill", { enemy });
    }
  }
  startWave() {
    if (this.phase !== "build" || this.wave >= BUNKER_WAVES.length) return false;
    const w = BUNKER_WAVES[this.wave++], roster = Object.entries(w.units).flatMap(([type, count]) => Array(count).fill(type));
    // Deterministic interleaving puts specialist enemies throughout each encounter.
    this.queue = []; let i = 0;
    while (roster.length) { const index = (i * 7) % roster.length; this.queue.push({ type: roster.splice(index, 1)[0], lane: w.lanes[i++ % w.lanes.length] }); }
    this.phase = "wave"; this.spawnTimer = 0; this.emit("wave"); return true;
  }
  spawn(type, lane) {
    const definition = HOSTILES[type], path = approach(lane), mult = this.difficulty === "veteran" ? 1.25 : this.difficulty === "relaxed" ? .75 : 1;
    const enemy = { ...definition, id: ++this.serial, type, lane, path, step: 1, x: path[0][0], z: path[0][1], hp: definition.hp * mult, maxHp: definition.hp * mult, cooldown: 1, angle: 0, moving: false, team: "enemy", kind: "trooper", size: .65 };
    this.enemies.push(enemy); return enemy;
  }
  finish(won) { this.phase = won ? "victory" : "defeat"; this.work = null; this.emit(this.phase); }
  update(dt, workId = null) {
    if (!live(this.phase)) return;
    this.time += dt; this.work = null;
    const p = this.player;
    p.hurt = Math.max(0, p.hurt - dt);
    if (p.respawn > 0) {
      p.respawn = Math.max(0, p.respawn - dt);
      if (!p.respawn) { Object.assign(p, { x: 0, z: 8, hp: 100, hurt: 3 }); this.emit("respawn"); }
    } else if (!p.hurt) p.hp = Math.min(100, p.hp + 8 * dt);
    if (workId) this.maintain(workId, dt);
    for (const item of [...this.barriers, ...this.turrets]) if (item.id !== this.work) item.progress = 0;
    if (this.phase !== "wave") return;
    this.spawnTimer -= dt;
    if (this.queue.length && this.spawnTimer <= 0) { const q = this.queue.shift(); this.spawn(q.type, q.lane); this.spawnTimer += BUNKER_WAVES[this.wave - 1].interval; }
    const attackMultiplier = this.difficulty === "veteran" ? 1.2 : this.difficulty === "relaxed" ? .65 : 1;
    for (const e of this.enemies) {
      if (e.dead || this.phase !== "wave") continue;
      e.cooldown -= dt; e.moving = false;
      const b = this.barriers.find(b => b.id === e.lane), d = distance(e, p);
      let target = null;
      if (!p.respawn && d < (e.ranged ? 13 : 6.5) && this.visible(e, p)) target = p;
      if (target && d <= (e.ranged ? 13 : 1.5)) {
        e.angle = Math.atan2(p.x - e.x, p.z - e.z);
        if (e.cooldown <= 0) { e.cooldown = e.interval; this.hurtPlayer(e.damage * attackMultiplier); this.emit("shot", { from: e, to: { ...p }, enemy: true }); }
        continue;
      }
      if (!target && e.step >= 2 && e.step <= 3 && b.hp > 0 && !b.open && distance(e, { x: b.x + Math.sign(b.x) * 1.1, z: b.z }) < 1.5) {
        if (e.cooldown <= 0) { e.cooldown = e.interval; this.damageBarrier(b, (e.barrierDamage || e.damage) * attackMultiplier); }
        continue;
      }
      if (!target && e.step >= e.path.length) {
        if (e.cooldown <= 0) { e.cooldown = e.interval; this.coreHp = Math.max(0, this.coreHp - e.damage * attackMultiplier); this.emit("coreHit"); }
        continue;
      }
      let next = target || { x: e.path[e.step][0], z: e.path[e.step][1] };
      if (distance(e, next) < .25 && !target) { e.step++; continue; }
      // An operator can draw a raider off its authored approach. Route it back around
      // room walls instead of letting it walk indefinitely into the nearest partition.
      e.detourTimer = (e.detourTimer || 0) - dt;
      if (!this.visible(e, next)) {
        const nav = this.navigation(), goal = `${e.step}:${next.x.toFixed(1)}:${next.z.toFixed(1)}:${this.navKey}`;
        if (e.detourTimer <= 0 || e.detourGoal !== goal) { e.detour = nav.path(e, next); e.detourTimer = .8; e.detourGoal = goal; }
        while (e.detour?.length && distance(e, e.detour[0]) < .25) e.detour.shift();
        if (e.detour?.length) next = e.detour[0];
      }
      const length = distance(e, next);
      const speed = Math.min(e.speed * dt, length), dx = (next.x - e.x) / (length || 1), dz = (next.z - e.z) / (length || 1);
      const oldX = e.x, oldZ = e.z;
      this.move(e, e.x + dx * speed, e.z + dz * speed, .3);
      e.angle = Math.atan2(dx, dz); e.moving = distance(e, { x: oldX, z: oldZ }) > .001;
    }
    for (const t of this.turrets) {
      if (!t.level) continue; t.cooldown -= dt;
      const target = this.enemies.find(e => !e.dead && distance(t, e) < 12 && this.visible({ x: t.x, z: t.z + .85 }, e));
      if (target && t.cooldown <= 0) { t.cooldown = .7; this.damage(target, t.level === 1 ? 12 : 19, "turret"); this.emit("shot", { from: t, to: { ...target } }); }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.coreHp <= 0 && this.phase === "wave") this.finish(false);
    else if (this.phase === "wave" && !this.queue.length && !this.enemies.length) {
      if (this.wave === BUNKER_WAVES.length) this.finish(true);
      else { this.phase = "build"; this.credits += 55; p.hp = 100; p.respawn = 0; this.emit("clear"); }
    }
  }
  checkpoint() {
    if (this.phase !== "build") return null;
    return { version: 1, difficulty: this.difficulty, wave: this.wave, credits: this.credits, coreHp: this.coreHp, lives: this.lives, kills: this.kills, playerKills: this.playerKills, repairs: this.repairs, resets: this.resets, time: this.time,
      barriers: this.barriers.map(({ id, hp, open }) => ({ id, hp, open })), turrets: this.turrets.map(({ id, level }) => ({ id, level })) };
  }
  static restore(data) {
    if (!data || data.version !== 1 || !Number.isInteger(data.wave) || data.wave < 0 || data.wave >= BUNKER_WAVES.length || !Number.isFinite(data.credits) || data.credits < 0 || data.credits > 100000 || !Number.isFinite(data.coreHp) || data.coreHp <= 0 || data.coreHp > REACTOR.maxHp || !Number.isInteger(data.lives) || data.lives < 1 || data.lives > 3 || !Array.isArray(data.barriers) || data.barriers.length !== BARRIERS.length || !Array.isArray(data.turrets) || data.turrets.length !== EMPLACEMENTS.length) return null;
    const s = new BunkerSimulation(data.difficulty);
    for (const key of ["wave", "credits", "coreHp", "lives", "kills", "playerKills", "repairs", "resets", "time"]) { if (!Number.isFinite(data[key]) || data[key] < 0) return null; s[key] = data[key]; }
    for (let i = 0; i < s.barriers.length; i++) { const b = data.barriers[i], t = s.barriers[i]; if (!b || b.id !== t.id || !Number.isFinite(b.hp) || b.hp < 0 || b.hp > t.maxHp || typeof b.open !== "boolean" || (b.hp === 0 && !b.open) || (t.kind === "wall" && b.hp > 0 && b.open)) return null; t.hp = b.hp; t.open = b.open; }
    for (let i = 0; i < s.turrets.length; i++) { const t = data.turrets[i]; if (!t || t.id !== s.turrets[i].id || ![0, 1, 2].includes(t.level)) return null; s.turrets[i].level = t.level; }
    return s;
  }
}
