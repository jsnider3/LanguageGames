import test from "node:test";
import assert from "node:assert/strict";
import { RaidSimulation } from "../src/raid.js";
import {
  BASES,
  BASE_BUDGET,
  encodeBlueprint,
  decodeBlueprint,
  validateBlueprint,
  towerInvestment,
} from "../src/blueprints.js";
import { NavigationGrid } from "../src/navigation.js";
import { PADS } from "../src/data.js";

function advance(s, seconds) {
  for (let i = 0; i < seconds * 30; i++) {
    s.update(1 / 30);
    s.drainEvents();
  }
}
function quiet(s) {
  s.enemies = s.enemies.filter((e) => ["relay", "reactor"].includes(e.kind));
  s.guardTimer = 1000;
}

test("all preset bases are valid and shared codes round-trip Unicode names and upgraded defenses", () => {
  for (const b of BASES) {
    assert.ok(
      b.towers.reduce((n, t) => n + towerInvestment(t), 0) <= BASE_BUDGET,
    );
    assert.deepEqual(decodeBlueprint(encodeBlueprint(b)), validateBlueprint(b));
  }
  const base = {
    version: 1,
    name: 'Josh’s 城堡 & "Citadel"',
    towers: [{ padId: 17, type: "rail", level: 3 }],
  };
  assert.deepEqual(decodeBlueprint(encodeBlueprint(base)), base);
});
test("import rejects corrupted codes, oversized data, duplicates, unknown types and impossible budgets", () => {
  for (const code of ["", "wrong", "LLB1.bad", "LLB1." + "a".repeat(12000)])
    assert.throws(() => decodeBlueprint(code));
  const base = validateBlueprint(BASES[0]);
  for (const towers of [
    [...base.towers, base.towers[0]],
    [{ padId: -1, type: "sentry", level: 1 }],
    [{ padId: 1, type: "__proto__", level: 1 }],
    [{ padId: 1, type: "rail", level: 4 }],
    PADS.map((p) => ({ padId: p.id, type: "rail", level: 3 })),
  ])
    assert.throws(() => validateBlueprint({ ...base, towers }));
});
test("the imported defense layout is instantiated exactly and entity IDs are unique", () => {
  const s = new RaidSimulation(BASES[2]);
  assert.deepEqual(
    s.enemies
      .filter((e) => e.kind === "turret")
      .map(({ padId, type, level }) => ({ padId, type, level })),
    BASES[2].towers,
  );
  const entities = [...s.enemies, ...s.allies];
  assert.equal(new Set(entities.map((e) => e.id)).size, entities.length);
  assert.equal(s.allies.length, 6);
  assert.ok(s.allies.some((u) => u.type === "medic"));
  assert.ok(s.allies.some((u) => u.type === "heavy"));
  assert.equal(s.checkpoint(), null);
  assert.equal(s.build(0, "rail"), false);
  assert.equal(s.startWave(), false);
});
test("the reactor is invulnerable until both relays are destroyed and victory ends combat", () => {
  const s = new RaidSimulation();
  const hp = s.reactor.hp;
  assert.equal(s.damage(s.reactor, 10000), 0);
  assert.equal(s.reactor.hp, hp);
  s.damage(s.relays[0], 10000);
  assert.equal(s.damage(s.reactor, 10000), 0);
  s.damage(s.relays[0], 10000);
  assert.equal(s.relays.length, 0);
  s.damage(s.reactor, 10000);
  s.update(1 / 30);
  assert.equal(s.phase, "victory");
  assert.equal(s.structuresDestroyed, 3);
  const time = s.time;
  s.update(3);
  assert.equal(s.time, time);
});
test("shield absorbs damage, regenerates after the delay, and three deaths exhaust deployment lives", () => {
  const s = new RaidSimulation();
  quiet(s);
  s.allies = [];
  s.hurtPlayer(50);
  assert.equal(s.player.hp, 100);
  assert.equal(s.player.shield, 25);
  advance(s, 3);
  assert.equal(s.player.shield, 25);
  advance(s, 2);
  assert.ok(s.player.shield > 25);
  for (let i = 0; i < 3; i++) {
    s.player.active = true;
    s.hurtPlayer(500);
    assert.equal(s.tickets, 2 - i);
    if (i < 2) {
      assert.equal(s.player.respawn, 6);
      advance(s, 6.1);
      assert.equal(s.player.hp, 100);
      assert.equal(s.player.shield, 75);
    }
  }
  assert.equal(s.phase, "defeat");
  assert.equal(s.reinforce(), false);
});
test("reinforcements charge support, respect cooldown and squad cap, and replace casualties", () => {
  const s = new RaidSimulation();
  quiet(s);
  assert.equal(s.reinforce(), true);
  assert.equal(s.allies.length, 10);
  assert.equal(s.credits, 120);
  assert.equal(s.reinforce(), false);
  const dead = s.allies[0];
  s.hurtAlly(dead, 1000);
  s.update(1 / 30);
  assert.equal(s.allies.length, 9);
  assert.equal(s.alliesLost, 1);
  s.reinforceCooldown = 0;
  assert.equal(s.reinforce(), true);
  assert.equal(s.allies.length, 10);
  assert.equal(s.credits, 0);
});
test("squad follows a moving operator, holds at its order point, and medics heal nearby allies", () => {
  const s = new RaidSimulation();
  quiet(s);
  s.player.x = -25;
  s.player.z = -15;
  const initial = s.allies[0].x;
  advance(s, 2);
  assert.ok(s.allies[0].x > initial + 3);
  s.command("hold");
  const anchor = { ...s.holdPoint };
  s.player.x = 30;
  s.player.z = 22;
  advance(s, 8);
  for (const u of s.allies)
    assert.ok(Math.hypot(u.x - anchor.x, u.z - anchor.z) < 12);
  const medic = s.allies.find((u) => u.type === "medic"),
    rifle = s.allies.find((u) => u.type === "rifle");
  rifle.x = medic.x;
  rifle.z = medic.z;
  rifle.hp = 40;
  s.update(0.1);
  assert.ok(rifle.hp > 40);
});
test("cover blocks enemy fire through the line-of-sight callback", () => {
  const s = new RaidSimulation();
  s.allies = [];
  s.player.x = -23;
  s.player.z = -10;
  s.setTerrain(
    () => false,
    () => false,
  );
  advance(s, 4);
  assert.equal(s.player.hp, 100);
  assert.equal(s.player.shield, 75);
  s.visibility = () => true;
  advance(s, 3);
  assert.ok(s.player.shield < 75 || s.player.hp < 100);
});
test("infantry routes around a solid wall and an enclosed destination is unreachable", () => {
  const blocked = (x, z) => Math.abs(x) < 2 && z < 12;
  const nav = new NavigationGrid(blocked),
    from = { x: -8, z: 0 },
    to = { x: 8, z: 0 },
    path = nav.path(from, to);
  assert.ok(path.length > 0);
  assert.ok(path.some((p) => p.z >= 12));
  assert.ok(path.every((p) => !blocked(p.x, p.z)));
  const sealed = new NavigationGrid((x, z) => Math.abs(x) < 2);
  assert.deepEqual(sealed.path(from, to), []);
  const s = new RaidSimulation();
  s.setTerrain(blocked);
  const u = s.allies[0];
  u.x = from.x;
  u.z = from.z;
  for (let i = 0; i < 20 * 30; i++) s.move(u, to, 1 / 30);
  assert.ok(
    Math.hypot(u.x - to.x, u.z - to.z) < 3,
    `trooper stopped at ${u.x}, ${u.z}`,
  );
});
test("insertion positions are corrected when the actual map obstructs their initial locations", () => {
  const s = new RaidSimulation(),
    initial = s.allies.map((u) => ({ x: u.x, z: u.z }));
  const blocked = (x, z) =>
    initial.some((p) => Math.hypot(x - p.x, z - p.z) < 0.8);
  s.setTerrain(blocked);
  assert.ok(s.allies.every((u) => !blocked(u.x, u.z)));
  s.player.x = -15;
  s.player.z = -15;
  advance(s, 3);
  assert.ok(
    s.allies.some((u) => u.x > -35),
    "the relocated squad should be able to follow the operator",
  );
});
test("a standard raid can be won using squad orders and earned reinforcement support", () => {
  const s = new RaidSimulation(BASES[1]);
  s.player.active = false;
  s.command("advance");
  for (let i = 0; i < 30 * 180 && s.phase === "wave"; i++) {
    s.update(1 / 30);
    s.drainEvents();
    if (s.allies.length < 5 && s.credits >= 120) s.reinforce();
  }
  assert.equal(s.phase, "victory");
  assert.equal(s.relays.length, 0);
  assert.ok(s.kills > 10);
  assert.ok(s.credits >= 0);
  assert.equal(s.playerKills, 0);
});
