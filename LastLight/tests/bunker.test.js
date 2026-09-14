import test from "node:test";
import assert from "node:assert/strict";
import { BunkerSimulation } from "../src/bunker-simulation.js";
import { BARRIERS, BUNKER_WAVES, REACTOR } from "../src/bunker-data.js";
const tick = (s, seconds, work = null) => { for (let t = 0; t < seconds; t += 1 / 60) { s.update(1 / 60, work); s.drainEvents(); } };
function approachControl(s, b) { s.player.x = b.x - Math.sign(b.x) * 1.5; s.player.z = b.z + (b.kind === "door" ? 1.7 : 0); }

test("bunker boundaries block movement and fire; the service loop connects both sides", () => {
  const s = new BunkerSimulation();
  assert.ok(s.collides(-6, -7));
  assert.equal(s.visible({ x: -8, z: -7 }, { x: -4, z: -7 }), false);
  assert.equal(s.collides(-6, 9), false); assert.equal(s.collides(6, 9), false);
  assert.equal(s.collides(0, 4), false); assert.ok(s.collides(4, 4));
  assert.ok(s.collides(0, REACTOR.z));
});
test("door controls require proximity, clear openings and a functioning motor", () => {
  const s = new BunkerSimulation(), b = s.barriers[0];
  assert.equal(s.toggleDoor(b.id), false);
  approachControl(s, b); assert.equal(s.toggleDoor(b.id), true);
  assert.equal(s.collides(b.x, b.z), false);
  s.player.x = b.x; s.player.z = b.z; assert.equal(s.toggleDoor(b.id), false);
  approachControl(s, b); assert.equal(s.toggleDoor(b.id), true);
  s.damageBarrier(b, 999); assert.equal(s.toggleDoor(b.id), false); assert.equal(s.collides(b.x, b.z), false);
});
test("manual welding consumes scrap, persists damage and stops when out of reach", () => {
  const s = new BunkerSimulation(), b = s.barriers[2], old = b.hp, credits = s.credits;
  assert.equal(s.maintain(b.id, 1), false); approachControl(s, b);
  tick(s, 1, b.id); assert.ok(b.hp > old); assert.ok(s.credits < credits);
  assert.ok(Math.abs(credits - s.credits - (b.hp - old) * .12) < .001);
  s.player.x = 0; s.player.z = 8; const hp = b.hp; tick(s, 1, b.id); assert.equal(b.hp, hp);
  approachControl(s, b); s.credits = 0; assert.equal(s.maintain(b.id, 1), false);
});
test("jammed motors and destroyed walls need uninterrupted local work and cannot close on occupants", () => {
  for (const index of [0, 2]) {
    const s = new BunkerSimulation(), b = s.barriers[index]; s.damageBarrier(b, 999); approachControl(s, b);
    tick(s, 1, b.id); assert.equal(b.hp, 0); assert.ok(b.progress > .9);
    tick(s, .1); assert.equal(b.progress, 0);
    const e = s.spawn("grunt", b.id); e.x = b.x; e.z = b.z;
    tick(s, 3, b.id); assert.equal(b.hp, 0);
    s.enemies = []; const credits = s.credits; tick(s, index === 0 ? 2.01 : 2.41, b.id);
    assert.ok(b.hp > 0); assert.equal(b.open, false); assert.equal(s.resets, 1);
    assert.ok(s.credits <= credits - (index === 0 ? 20 : 25)); assert.ok(s.collides(b.x, b.z));
  }
});
test("support sentries build only in person, spend scrap once and cap at level two", () => {
  const s = new BunkerSimulation(), t = s.turrets[0];
  assert.equal(s.maintain(t.id, 3), false); s.player.x = t.x; s.player.z = t.z + 2;
  tick(s, 2.05, t.id); assert.equal(t.level, 1); assert.equal(s.credits, 110);
  tick(s, 2.05, t.id); assert.equal(t.level, 2); assert.equal(s.credits, 50);
  tick(s, 3, t.id); assert.equal(t.level, 2); assert.equal(s.credits, 50);
});
test("hostiles stop at a bulkhead, batter it open and damage the reactor", () => {
  const s = new BunkerSimulation(); s.startWave(); s.queue = []; const e = s.spawn("breacher", "west-door");
  tick(s, 8); assert.ok(s.barriers[0].hp < s.barriers[0].maxHp); assert.ok(e.x < -6);
  tick(s, 30); assert.equal(s.barriers[0].hp, 0); assert.ok(s.coreHp < REACTOR.maxHp);
});
test("a concentrated assault outdamages continuous welding", () => {
  const s = new BunkerSimulation(), b = s.barriers[0]; s.startWave(); s.queue = []; s.credits = 5000; approachControl(s, b);
  for (let i = 0; i < 3; i++) { const e = s.spawn("breacher", b.id); e.x = -7.1; e.z = -7; e.step = 2; }
  tick(s, 10, b.id); assert.equal(b.hp, 0);
});
test("a raider displaced into the workshop finds its approach again around the partition", () => {
  const s = new BunkerSimulation(); s.startWave(); s.queue = [];
  const e = s.spawn("grunt", "west-door"); e.x = -12; e.z = 4; e.step = 2;
  tick(s, 45);
  assert.ok(s.barriers[0].hp < 180 || s.coreHp < REACTOR.maxHp, "the raider must resume its attack rather than stick at the room wall");
});
test("damage, doors, sentries and the finite economy round-trip at preparation checkpoints", () => {
  const s = new BunkerSimulation(); s.barriers[0].open = true; s.barriers[2].hp = 0; s.barriers[2].open = true; s.turrets[0].level = 1;
  const data = s.checkpoint(), copy = BunkerSimulation.restore(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(copy.checkpoint(), data);
  for (const alter of [d => d.barriers[0].hp = -1, d => d.barriers[0].id = "east-door", d => d.turrets[0].level = 99, d => d.coreHp = Infinity, d => d.credits = -20, d => d.wave = 12]) {
    const broken = structuredClone(data); alter(broken); assert.equal(BunkerSimulation.restore(broken), null);
  }
  s.startWave(); assert.equal(s.checkpoint(), null);
});
test("floor-plan observation does not make the operator invulnerable; defeat freezes combat", () => {
  const s = new BunkerSimulation(); s.hurtPlayer(100); assert.equal(s.lives, 2); assert.equal(s.coreHp, 440);
  tick(s, 4.1); assert.equal(s.player.hp, 100); assert.equal(s.player.z, 8);
  s.hurtPlayer(100); tick(s, 4.1); s.hurtPlayer(100); assert.equal(s.phase, "defeat");
  const time = s.time; tick(s, 10); assert.equal(s.time, time); assert.equal(s.startWave(), false);
});
test("a moving operator can finish twelve assaults with real magazines, headshots, scrap and local preparation repairs", () => {
  const s = new BunkerSimulation(), lanes = new Set();
  let ammo = 32, reload = 0, fire = 0;
  for (let wave = 0; wave < 12; wave++) {
    // Preparation has no time limit: visit each control and use the real repair economy.
    for (const b of s.barriers) {
      approachControl(s, b);
      for (let i = 0; i < 800 && b.hp < b.maxHp; i++) s.update(.05, b.id);
      if (b.kind === "door" && b.open) s.toggleDoor(b.id);
    }
    for (const t of s.turrets) {
      s.player.x = t.x; s.player.z = t.z + 2;
      for (let i = 0; i < 41 && s.credits >= (t.level ? 60 : 70) && t.level < 2; i++) s.update(.05, t.id);
    }
    s.player.x = 0; s.player.z = 8; assert.equal(s.startWave(), true);
    s.queue.forEach(q => lanes.add(q.lane));
    let seconds = 0, navTimer = 0, path = [];
    while (s.phase === "wave" && seconds < 240) {
      const dt = .05; s.update(dt); s.drainEvents(); seconds += dt; fire -= dt; navTimer -= dt;
      if (s.player.respawn) continue;
      if (reload > 0) { reload -= dt; if (reload <= 0) ammo = 32; }
      const enemy = [...s.enemies].sort((a, b) => Math.hypot(a.x - s.player.x, a.z - s.player.z) - Math.hypot(b.x - s.player.x, b.z - s.player.z))[0];
      if (!enemy) continue;
      const d = Math.hypot(enemy.x - s.player.x, enemy.z - s.player.z), visible = s.visible(s.player, enemy);
      if (visible && d < 18 && fire <= 0 && reload <= 0) {
        if (ammo) { s.damage(enemy, 30 * 1.6); ammo--; fire = .12; } else reload = 1.6;
      }
      if (!visible || d > 12) {
        if (navTimer <= 0) { path = s.navigation().path(s.player, enemy); navTimer = .4; }
        while (path.length && Math.hypot(path[0].x - s.player.x, path[0].z - s.player.z) < .3) path.shift();
        if (path.length) {
          const next = path[0], length = Math.hypot(next.x - s.player.x, next.z - s.player.z);
          s.move(s.player, s.player.x + (next.x - s.player.x) / length * 6 * dt, s.player.z + (next.z - s.player.z) / length * 6 * dt);
        }
      }
    }
    assert.notEqual(s.phase, "wave", `wave ${wave + 1} stalled`);
    assert.notEqual(s.phase, "defeat", `operator lost on wave ${wave + 1}`);
  }
  assert.equal(s.phase, "victory"); assert.ok(s.playerKills > 100);
  assert.deepEqual([...lanes].sort(), BARRIERS.map(b => b.id).sort());
});
test("fully upgraded sentries cannot clear the whole campaign without operator intervention", () => {
  const s = new BunkerSimulation(); s.turrets.forEach(t => t.level = 2); s.barriers.forEach(b => b.hp = b.maxHp);
  for (let wave = 0; wave < 12 && s.phase === "build"; wave++) {
    s.startWave(); tick(s, 240); assert.notEqual(s.phase, "wave", "unattended encounter must resolve");
  }
  assert.equal(s.phase, "defeat");
});
