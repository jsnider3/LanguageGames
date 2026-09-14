import { RaidSimulation } from "./raid.js";
import { Simulation } from "./simulation.js";
import {
  BASES,
  BASE_BUDGET,
  validateBlueprint,
  encodeBlueprint,
  decodeBlueprint,
  towerInvestment,
} from "./blueprints.js";
import { makeTrooper, makeRaidStructure, animateTrooper } from "./infantry.js";
import { disposeModel } from "./models.js";
const BLUEPRINT_KEY = "last-light.blueprint.v1";

export function installRaids(Game) {
  Object.assign(Game.prototype, {
    startRaid(base = this.raidBase || BASES[0]) {
      try {
        base = validateBlueprint(base);
      } catch (error) {
        this.ui.notice(error.message);
        return;
      }
      this.raidBase = base;
      this.resetVisuals();
      this.operation = "raid";
      this.sim = new RaidSimulation(base, this.settings.difficulty);
      this.world.updateGates(this.time, this.sim, true);
      this.rebuildRaidNavigation();
      this.begin();
      this.yaw = -Math.PI / 2;
      this.pitch = 0;
      this.switchMode("fps");
      this.ui.banner(
        "ASSAULT INSERTION",
        base.name,
        "Your squad is on your six. Destroy both relays, then breach the reactor.",
      );
    },
    startWorkshop() {
      this.resetVisuals();
      this.operation = "workshop";
      this.sim = new Simulation(this.settings.difficulty);
      this.sim.credits = BASE_BUDGET;
      this.baseName = "My stronghold";
      try {
        const saved = validateBlueprint(
          JSON.parse(localStorage.getItem(BLUEPRINT_KEY)),
        );
        this.baseName = saved.name;
        for (const tower of saved.towers) {
          this.sim.build(tower.padId, tower.type);
          for (let l = 1; l < tower.level; l++) this.sim.upgrade(tower.padId);
        }
      } catch {}
      this.sim.drainEvents();
      this.begin();
      this.ui.banner(
        "BASE WORKSHOP",
        "Build your stronghold.",
        `${BASE_BUDGET} alloy budget. Design a base, then share its code or test it in an assault.`,
      );
    },
    currentBlueprint() {
      return validateBlueprint({
        version: 1,
        name: this.baseName || "My stronghold",
        towers: this.sim.towers.map((t) => ({
          padId: t.padId,
          type: t.type,
          level: t.level,
        })),
      });
    },
    saveBlueprint() {
      this.sim.credits =
        BASE_BUDGET -
        this.sim.towers.reduce((n, t) => n + towerInvestment(t), 0);
      try {
        localStorage.setItem(
          BLUEPRINT_KEY,
          JSON.stringify(this.currentBlueprint()),
        );
      } catch {
        this.ui.notice(
          "This browser cannot save your base. Export its code to keep a copy.",
        );
      }
    },
    importRaidBase(code) {
      try {
        this.raidBase = decodeBlueprint(code);
        this.ui.raidMenu(this.raidBase);
      } catch (error) {
        document.querySelector("#base-error").textContent = error.message;
      }
    },
    prepareBaseCode() {
      this.baseName =
        document.querySelector("#base-name")?.value || this.baseName;
      const code = encodeBlueprint(this.currentBlueprint());
      document.querySelector("#base-code").value = code;
      this.saveBlueprint();
      return code;
    },
    async copyBase() {
      const code = this.prepareBaseCode();
      try {
        await navigator.clipboard.writeText(code);
        document.querySelector("#copy-status").textContent =
          "Copied. Send this code to another player to let them raid your base.";
      } catch {
        document.querySelector("#base-code").select();
        document.querySelector("#copy-status").textContent =
          "Select the base code and copy it with Ctrl+C.";
      }
    },
    rebuildRaidNavigation() {
      const blockers = this.sim.enemies.filter(
        (e) => !e.dead && ["turret", "relay"].includes(e.kind),
      );
      this.sim.setTerrain(
        (x, z) => this.world.collides(x, z, blockers),
        (a, b) => this.world.lineOfSight(a, b),
      );
    },
    syncRaidModels() {
      this.allyModels ||= new Map();
      for (const enemy of this.sim.enemies) {
        if (enemy.dead) continue;
        let model = this.enemyModels.get(enemy.id);
        if (!model) {
          model =
            enemy.kind === "trooper"
              ? makeTrooper(enemy)
              : makeRaidStructure(enemy);
          this.scene.add(model);
          this.enemyModels.set(enemy.id, model);
        }
        animateTrooper(model, enemy, this.sim.time, this.camera);
      }
      for (const unit of this.sim.allies) {
        let model = this.allyModels.get(unit.id);
        if (!model) {
          model = makeTrooper(unit);
          this.scene.add(model);
          this.allyModels.set(unit.id, model);
        }
        animateTrooper(model, unit, this.sim.time, this.camera);
      }
      for (const [id, model] of this.allyModels)
        if (!this.sim.allies.some((u) => u.id === id && !u.dead)) {
          disposeModel(model);
          this.allyModels.delete(id);
        }
    },
    focusRaidTarget() {
      this.camera.getWorldDirection(this.cameraDirection);
      const p = this.sim.player;
      let target = null,
        score = 0.9;
      for (const enemy of this.sim.enemies) {
        if (enemy.dead) continue;
        const x = enemy.x - p.x,
          z = enemy.z - p.z,
          length = Math.hypot(x, z) || 1;
        const dot =
          (x * this.cameraDirection.x + z * this.cameraDirection.z) / length;
        if (dot > score) {
          score = dot;
          target = enemy;
        }
      }
      if (target) this.sim.focus(target.id);
      else
        this.ui.notice(
          "Aim toward an enemy or structure, then press F to focus fire.",
        );
    },
    raidEvent(event) {
      if (event.type === "raidShot") {
        this.effects.beam(
          event.from,
          event.to,
          event.team === "ally" ? 0x92d9ff : 0xff7d49,
          0.09,
          event.weapon === "heavy" || event.weapon === "rail" ? 0.04 : 0.022,
        );
        this.effects.burst(
          event.to.x,
          event.to.y,
          event.to.z,
          event.team === "ally" ? 0x9fd4ed : 0xef8d54,
          2,
          2,
        );
        if (this.time - (this.lastRaidSound || 0) > 0.065) {
          this.audio.play(
            event.weapon === "heavy" ? "rail" : "sentry",
            Math.hypot(
              this.sim.player.x - event.from.x,
              this.sim.player.z - event.from.z,
            ),
          );
          this.lastRaidSound = this.time;
        }
      }
      if (event.type === "reinforced")
        this.effects.shockwave(event.unit.x, event.unit.z, 2.5, 0x75c8ff);
      if (event.type === "allyDown") {
        const u = event.unit;
        this.effects.burst(u.x, 1, u.z, 0x68a8c8, 8, 3);
        this.ui.notice(
          `${u.name} down. ${this.sim.allies.length} squad members remaining.`,
          true,
        );
      }
      if (event.type === "relayDown") {
        this.audio.play("clear");
        this.ui.banner(
          event.remaining ? "SHIELD RELAY DESTROYED" : "REACTOR EXPOSED",
          event.remaining ? "One relay remains." : "Bring it down.",
          event.remaining
            ? "Advance to the other relay. Your squad will follow your orders."
            : "The shield is offline. Attack the red reactor to win the assault.",
        );
      }
      if (event.type === "killed" && event.enemy.kind !== "trooper")
        this.rebuildRaidNavigation();
    },
  });
}
