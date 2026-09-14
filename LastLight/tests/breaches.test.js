import test from "node:test";
import assert from "node:assert/strict";
import { Simulation } from "../src/simulation.js";
import { WAVES, breachActive } from "../src/data.js";

test("active breaches match the lanes actually used by every campaign wave", () => {
  for (let index = 0; index < WAVES.length; index++) {
    const sim = new Simulation();
    sim.wave = index;
    assert.equal(breachActive(sim, 0), false);
    assert.equal(breachActive(sim, 1), false);
    sim.startWave();
    while (sim.spawned < 2) sim.update(1 / 60);
    for (const route of [0, 1]) {
      assert.equal(
        breachActive(sim, route),
        sim.enemies.some((e) => e.routeIndex === route),
        `Wave ${index + 1}, breach ${route + 1}`,
      );
    }
  }
});

test("preparation and ended defense operations seal the breaches; raids keep their entrances open", () => {
  for (const phase of ["build", "victory", "defeat"]) {
    for (const route of [0, 1])
      assert.equal(breachActive({ wave: 12, phase }, route), false);
  }
  for (const route of [0, 1])
    assert.equal(breachActive({ isRaid: true, phase: "wave" }, route), true);
});
