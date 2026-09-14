import test from "node:test";
import assert from "node:assert/strict";
import { Simulation } from "../src/simulation.js";
import {
  CORE,
  PADS,
  TOWERS,
  ENEMIES,
  WAVES,
  ROUTES,
  towerStats,
  upgradeCost,
  refund,
  routeLength,
  routePosition,
  waveQueue,
} from "../src/data.js";

function advance(sim, seconds, step = 1 / 30) {
  for (let t = 0; t < seconds; t += step) {
    sim.update(step);
    sim.drainEvents();
  }
}
function finishWave(sim) {
  for (let i = 0; i < 30 * 240 && sim.phase === "wave"; i++) {
    sim.update(1 / 30);
    sim.drainEvents();
  }
  assert.notEqual(sim.phase, "wave", "wave should resolve within 240 seconds");
}

test("both approach routes terminate at the reactor and interpolate around bends", () => {
  for (const route of ROUTES) {
    const length = routeLength(route);
    assert.deepEqual(routePosition(route, 0), {
      x: route[0][0],
      z: route[0][1],
      angle: Math.PI / 2,
    });
    assert.deepEqual(routePosition(route, length + 10), {
      x: CORE.x,
      z: CORE.z,
      angle: 0,
    });
    for (let distance = 0; distance <= length; distance += 0.5) {
      const p = routePosition(route, distance);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z));
    }
  }
});

test("every campaign wave spawns the exact declared roster including bosses", () => {
  WAVES.forEach((wave, i) => {
    const queue = waveQueue(i);
    for (const [type, count] of Object.entries(wave.units))
      assert.equal(queue.filter((t) => t === type).length, count);
    assert.equal(
      queue.length,
      Object.values(wave.units).reduce((a, b) => a + b, 0),
    );
  });
  assert.equal(waveQueue(5).filter((t) => t === "boss").length, 1);
  assert.equal(waveQueue(11).filter((t) => t === "boss").length, 2);
});

test("building, upgrading and salvaging enforce a finite economy and exclusive pads", () => {
  const s = new Simulation();
  assert.equal(s.build(-1, "sentry"), false);
  assert.equal(s.build(0, "invalid"), false);
  const tower = s.build(0, "rail");
  assert.equal(s.credits, 240);
  assert.equal(s.build(0, "sentry"), false);
  assert.equal(s.upgrade(0), true);
  assert.equal(s.credits, 48);
  assert.equal(tower.level, 2);
  assert.equal(s.upgrade(0), false);
  assert.equal(s.build(1, "sentry"), false);
  const payout = refund(tower);
  assert.ok(payout < tower.invested);
  assert.equal(s.sell(0), true);
  assert.equal(s.credits, 48 + payout);
  assert.equal(s.sell(0), false);
  assert.equal(s.towers.length, 0);
});

test("MK III is the upgrade cap and upgrades increase range and damage output", () => {
  const s = new Simulation();
  s.credits = 10000;
  for (const [i, type] of Object.keys(TOWERS).entries()) {
    s.build(i, type);
    assert.equal(s.upgrade(i), true);
    assert.equal(s.upgrade(i), true);
    assert.equal(s.upgrade(i), false);
    assert.ok(towerStats(type, 3).damage > towerStats(type, 1).damage);
    assert.ok(towerStats(type, 3).range > towerStats(type, 1).range);
  }
});

test("armor reduces standard fire and piercing damage bypasses it", () => {
  const s = new Simulation();
  const enemy = s.spawn("brute");
  const hp = enemy.hp;
  s.damage(enemy, 100, "player");
  assert.equal(enemy.hp, hp - 65);
  s.damage(enemy, 100, "player", true);
  assert.equal(enemy.hp, hp - 165);
});

test("a kill pays out and increments statistics exactly once", () => {
  const s = new Simulation(),
    e = s.spawn("scout"),
    credits = s.credits;
  s.damage(e, 1000);
  s.damage(e, 1000);
  assert.equal(s.credits, credits + ENEMIES.scout.reward);
  assert.equal(s.kills, 1);
  assert.equal(s.playerKills, 1);
});

test("splash reaches nearby units but respects blast radius", () => {
  const s = new Simulation();
  const a = s.spawn("scout"),
    b = s.spawn("scout"),
    c = s.spawn("scout");
  a.x = 0;
  a.z = 0;
  b.x = 2;
  b.z = 0;
  c.x = 20;
  c.z = 0;
  s.blast(0, 0, 5, 200);
  assert.ok(a.dead);
  assert.ok(b.dead);
  assert.equal(c.hp, c.maxHp);
});

test("cryo slows movement and its debuff expires", () => {
  const s = new Simulation();
  s.startWave();
  s.queue = [];
  const e = s.spawn("brute");
  e.slowTimer = 2;
  const initial = e.distance;
  advance(s, 0.5);
  assert.ok(e.distance - initial < e.speed * 0.6);
  advance(s, 2);
  assert.equal(e.slowTimer, 0);
});

test("a tower fires only at enemies within its range", () => {
  const s = new Simulation();
  s.build(1, "sentry");
  s.startWave();
  s.queue = [];
  const enemy = s.spawn("scout");
  enemy.distance = 0;
  advance(s, 12);
  assert.equal(s.kills, 1);
  assert.equal(s.coreHp, CORE.maxHp);
});

test("an undefended breach damages the core and the next wave stays manual", () => {
  const s = new Simulation();
  s.startWave();
  finishWave(s);
  assert.equal(s.phase, "build");
  assert.equal(s.wave, 1);
  assert.equal(s.coreHp, CORE.maxHp - 10 * ENEMIES.scout.coreDamage + 40);
  assert.equal(s.credits, 480 + 122);
  advance(s, 60);
  assert.equal(s.wave, 1);
  assert.equal(s.enemies.length, 0);
});

test("defeat ends simulation and blocks building and wave launches", () => {
  const s = new Simulation();
  s.coreHp = 10;
  s.startWave();
  finishWave(s);
  assert.equal(s.phase, "defeat");
  assert.equal(s.coreHp, 0);
  assert.equal(s.build(0, "sentry"), false);
  assert.equal(s.startWave(), false);
  const time = s.time;
  advance(s, 2);
  assert.equal(s.time, time);
});

test("field operator damage, regeneration, downing and recovery", () => {
  const s = new Simulation();
  s.startWave();
  s.player.active = true;
  s.hurtPlayer(35);
  assert.equal(s.player.hp, 65);
  advance(s, 3);
  assert.equal(s.player.hp, 65);
  advance(s, 2);
  assert.ok(s.player.hp > 65);
  s.hurtPlayer(200);
  assert.equal(s.player.hp, 0);
  assert.equal(s.player.active, false);
  assert.equal(s.coreHp, 950);
  advance(s, 6.2);
  assert.equal(s.player.respawn, 0);
  assert.equal(s.player.hp, 100);
  assert.equal(s.player.x, 25);
});

test("checkpoints round-trip defenses and reject malformed or incompatible saves", () => {
  const s = new Simulation("veteran");
  s.build(1, "sentry");
  s.upgrade(1);
  const checkpoint = s.checkpoint(),
    restored = Simulation.restore(JSON.parse(JSON.stringify(checkpoint)));
  assert.equal(restored.difficulty, "veteran");
  assert.equal(restored.credits, s.credits);
  assert.equal(restored.towers[0].level, 2);
  assert.equal(restored.phase, "build");
  assert.equal(restored.enemies.length, 0);
  for (const bad of [
    null,
    {},
    { ...checkpoint, version: 90 },
    { ...checkpoint, credits: -10 },
    { ...checkpoint, wave: 99 },
    { ...checkpoint, coreHp: 0 },
    { ...checkpoint, towers: [...checkpoint.towers, checkpoint.towers[0]] },
    { ...checkpoint, towers: [{ ...checkpoint.towers[0], type: "__proto__" }] },
  ])
    assert.equal(Simulation.restore(bad), null);
  s.startWave();
  assert.equal(s.checkpoint(), null);
});

test("the full standard campaign is winnable with the real starting budget and earned alloy", () => {
  const s = new Simulation();
  const plan = [
    [1, "sentry"],
    [4, "sentry"],
    [7, "mortar"],
    [9, "sentry"],
    [8, "frost"],
    [11, "rail"],
    [14, "mortar"],
    [10, "frost"],
    [12, "rail"],
    [13, "rail"],
    [0, "sentry"],
    [3, "mortar"],
    [6, "rail"],
    [15, "frost"],
    [16, "rail"],
    [5, "sentry"],
    [2, "rail"],
    [17, "rail"],
  ];
  let next = 0;
  for (let wave = 0; wave < 12; wave++) {
    while (next < plan.length && s.credits >= TOWERS[plan[next][1]].cost) {
      s.build(...plan[next]);
      next++;
    }
    const priority = [...s.towers].sort(
      (a, b) => a.level - b.level || (a.type === "rail" ? -1 : 1),
    );
    for (const tower of priority)
      while (tower.level < 3 && s.credits >= upgradeCost(tower))
        s.upgrade(tower.padId);
    assert.equal(s.startWave(), true);
    finishWave(s);
    assert.notEqual(
      s.phase,
      "defeat",
      `defeated on wave ${s.wave} with ${s.towers.length} towers`,
    );
  }
  assert.equal(s.phase, "victory");
  assert.ok(s.coreHp > 0);
  assert.equal(s.wave, 12);
  assert.ok(s.kills > 300);
  assert.equal(s.playerKills, 0);
});

test("ranged projectiles damage a field operator along their swept segment", () => {
  const s = new Simulation();
  s.startWave();
  s.player.active = true;
  s.player.x = 0;
  s.player.z = 0;
  s.projectiles.push({
    x: -5,
    y: 1.3,
    z: 0,
    vx: 100,
    vy: 0,
    vz: 0,
    life: 2,
    damage: 20,
  });
  s.update(0.1);
  assert.equal(s.player.hp, 80);
});
