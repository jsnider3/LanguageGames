import { Simulation } from "./simulation.js";
import { PADS, CORE, TOWERS } from "./data.js";
import { BASES, RELAYS, validateBlueprint } from "./blueprints.js";
import { NavigationGrid } from "./navigation.js";

export const SQUAD_TYPES = {
  rifle: {
    name: "Rifleman",
    hp: 170,
    damage: 17,
    interval: 0.48,
    range: 24,
    speed: 6.3,
    armor: 0.1,
  },
  heavy: {
    name: "Heavy gunner",
    hp: 300,
    damage: 42,
    interval: 1,
    range: 27,
    speed: 5.5,
    armor: 0.25,
  },
  medic: {
    name: "Combat medic",
    hp: 150,
    damage: 10,
    interval: 0.65,
    range: 20,
    speed: 6.3,
    armor: 0.08,
  },
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export class RaidSimulation extends Simulation {
  constructor(base = BASES[0], difficulty = "normal") {
    super(difficulty);
    this.isRaid = true;
    this.base = validateBlueprint(base);
    this.phase = "wave";
    this.wave = 1;
    this.credits = 240;
    this.order = "follow";
    this.holdPoint = { x: -38, z: -16 };
    this.focusId = null;
    this.allies = [];
    this.tickets = 3;
    this.reinforceCooldown = 0;
    this.enemyReserve = 12;
    this.guardTimer = 25;
    this.alliesLost = 0;
    this.structuresDestroyed = 0;
    this.navigation = new NavigationGrid();
    this.player.x = -40;
    this.player.z = -16;
    this.player.yaw = -Math.PI / 2;
    this.player.active = true;
    this.player.shield = 75;
    this.player.maxShield = 75;
    const factor = { relaxed: 0.75, normal: 1, veteran: 1.3 }[difficulty] || 1;
    for (const t of this.base.towers) {
      const p = PADS[t.padId],
        hp = (300 + t.level * 110) * factor;
      this.enemies.push({
        ...p,
        id: ++this.serial,
        kind: "turret",
        type: t.type,
        level: t.level,
        padId: t.padId,
        hp,
        maxHp: hp,
        armor: 0.2,
        size: 1.55,
        speed: 0,
        angle: -Math.PI / 2,
        reward: 55,
        dead: false,
        cooldown: 1 + t.padId * 0.1,
        slowTimer: 0,
      });
    }
    for (const p of RELAYS) {
      const hp = 620 * factor;
      this.enemies.push({
        id: ++this.serial,
        ...p,
        kind: "relay",
        type: "relay",
        hp,
        maxHp: hp,
        armor: 0.1,
        size: 1.7,
        speed: 0,
        angle: 0,
        reward: 100,
        dead: false,
        slowTimer: 0,
      });
    }
    const hp = 2600 * factor;
    this.reactor = {
      id: ++this.serial,
      x: CORE.x,
      z: CORE.z,
      kind: "reactor",
      type: "reactor",
      hp,
      maxHp: hp,
      armor: 0.12,
      size: 4.1,
      speed: 0,
      angle: 0,
      reward: 0,
      dead: false,
      slowTimer: 0,
    };
    this.enemies.push(this.reactor);
    this.coreHp = hp;
    for (const [x, z] of [
      [-22, -10],
      [-16, 11],
      [-7, -18],
      [6, 7],
      [19, -3],
      [26, 14],
    ])
      this.spawnGuard(x, z);
    for (const [i, type] of [
      "rifle",
      "rifle",
      "heavy",
      "rifle",
      "rifle",
      "medic",
    ].entries())
      this.spawnAlly(type, -43 + (i % 2) * 2, -13 + Math.floor(i / 2) * 2.2);
    this.events = [];
  }
  get relays() {
    return this.enemies.filter((e) => e.kind === "relay" && !e.dead);
  }
  get objective() {
    return this.relays[0] || this.reactor;
  }
  build() {
    return false;
  }
  upgrade() {
    return false;
  }
  sell() {
    return false;
  }
  startWave() {
    return false;
  }
  checkpoint() {
    return null;
  }
  setTerrain(blocked, visible) {
    this.navigation = new NavigationGrid(blocked);
    this.visibility = visible;
    // A shared layout can obstruct an insertion point. Put every infantry unit on walkable ground.
    for (const unit of [
      ...this.allies,
      ...this.enemies.filter((e) => e.kind === "trooper"),
    ]) {
      if (blocked(unit.x, unit.z)) {
        const id = this.navigation.nearest(unit.x, unit.z);
        if (id >= 0) Object.assign(unit, this.navigation.point(id));
      }
      unit.path = [];
      unit.repath = 0;
    }
  }
  spawnAlly(type, x, z) {
    const spec = SQUAD_TYPES[type];
    const p = this.navigation.point(this.navigation.nearest(x, z));
    const unit = {
      ...spec,
      id: ++this.serial,
      type,
      kind: "trooper",
      team: "ally",
      ...p,
      maxHp: spec.hp,
      size: 1,
      angle: -Math.PI / 2,
      dead: false,
      cooldown: 0.3,
      slowTimer: 0,
      repath: 0,
      path: [],
      moving: false,
    };
    this.allies.push(unit);
    this.emit("reinforced", { unit });
    return unit;
  }
  spawnGuard(x, z) {
    const factor = { relaxed: 0.75, normal: 1, veteran: 1.3 }[this.difficulty];
    const hp = 120 * factor;
    const unit = {
      id: ++this.serial,
      kind: "trooper",
      type: "guard",
      team: "enemy",
      x,
      z,
      home: { x, z },
      hp,
      maxHp: hp,
      armor: 0.12,
      damage: 9 * factor,
      range: 24,
      speed: 3.4,
      interval: 0.8,
      cooldown: 1.5,
      size: 1,
      angle: -Math.PI / 2,
      reward: 22,
      dead: false,
      slowTimer: 0,
      repath: 0,
      path: [],
    };
    this.enemies.push(unit);
    return unit;
  }
  command(order) {
    if (!["follow", "advance", "hold"].includes(order) || this.phase !== "wave")
      return false;
    this.order = order;
    this.holdPoint = { x: this.player.x, z: this.player.z };
    for (const unit of this.allies) unit.repath = 0;
    this.emit("notice", {
      text: {
        follow: "Squad: on your six. Move and your troops will follow.",
        advance: "Squad: advancing on the next objective.",
        hold: "Squad: holding this position.",
      }[order],
    });
    return true;
  }
  focus(id) {
    const target = this.enemies.find((e) => e.id === id && !e.dead);
    if (!target) return false;
    this.focusId = id;
    this.emit("notice", {
      text: `Focus fire: ${target.name || TOWERS[target.type]?.name || "hostile infantry"}`,
    });
    return true;
  }
  reinforce() {
    if (this.phase !== "wave" || this.player.respawn > 0) return false;
    if (this.reinforceCooldown > 0) {
      this.emit("notice", {
        text: `Reinforcements available in ${Math.ceil(this.reinforceCooldown)}s.`,
      });
      return false;
    }
    if (this.allies.length >= 10) {
      this.emit("notice", { text: "Squad is at full strength (10 troopers)." });
      return false;
    }
    if (this.credits < 120) {
      this.emit("notice", {
        text: "Reinforcements cost 120 support. Destroy defenses to earn support.",
      });
      return false;
    }
    this.credits -= 120;
    this.reinforceCooldown = 22;
    const count = Math.min(4, 10 - this.allies.length);
    for (let i = 0; i < count; i++)
      this.spawnAlly(
        i === count - 1 ? "heavy" : "rifle",
        this.player.x - 3 + (i % 2) * 2,
        this.player.z + 3 + Math.floor(i / 2) * 2,
      );
    this.emit("notice", {
      text: `${count} reinforcement${count === 1 ? "" : "s"} deployed at your position.`,
    });
    return true;
  }
  damage(enemy, amount, source = "player", pierce = false) {
    if (enemy.dead || this.phase !== "wave") return 0;
    if (enemy.kind === "reactor" && this.relays.length) {
      if (source === "player" && this.time > (this.shieldNotice || 0)) {
        this.shieldNotice = this.time + 3;
        this.emit("notice", {
          text: "Reactor shielded. Destroy both shield relays first.",
          urgent: true,
        });
      }
      return 0;
    }
    const dealt = super.damage(enemy, amount, source, pierce);
    if (enemy.dead && enemy.kind !== "trooper") {
      this.structuresDestroyed++;
      if (enemy.kind === "relay")
        this.emit("relayDown", { remaining: this.relays.length });
    }
    this.coreHp = Math.max(0, this.reactor.hp);
    return dealt;
  }
  hurtPlayer(amount) {
    const p = this.player;
    if (!p.active || p.respawn > 0 || this.phase !== "wave") return;
    const absorbed = Math.min(p.shield, amount);
    p.shield -= absorbed;
    amount -= absorbed;
    p.hp = Math.max(0, p.hp - amount);
    p.hurtTimer = 4;
    this.emit("playerHit", { amount });
    if (p.hp <= 0) {
      this.tickets--;
      p.active = false;
      if (this.tickets <= 0) {
        this.phase = "defeat";
        this.emit("defeat");
      } else {
        p.respawn = 6;
        this.emit("playerDown");
      }
    }
  }
  hurtAlly(unit, amount) {
    if (unit.dead) return;
    unit.hp -= amount * (1 - unit.armor);
    unit.hurtUntil = this.time + 0.1;
    if (unit.hp <= 0) {
      unit.dead = true;
      this.alliesLost++;
      this.emit("allyDown", { unit });
    }
  }
  fire(attacker, target, team, damage) {
    attacker.angle = Math.atan2(target.x - attacker.x, target.z - attacker.z);
    this.emit("raidShot", {
      from: {
        x: attacker.x,
        y: attacker.kind === "turret" ? 2.3 : 1.55,
        z: attacker.z,
      },
      to: {
        x: target.x,
        y: target.kind === "reactor" ? 5 : target.kind === "relay" ? 2 : 1.5,
        z: target.z,
      },
      team,
      weapon: attacker.type,
    });
    if (team === "ally")
      this.damage(target, damage, attacker.id, attacker.type === "heavy");
    else if (target === this.player) this.hurtPlayer(damage);
    else this.hurtAlly(target, damage);
  }
  move(unit, target, dt, stop = 1.4) {
    unit.moving = false;
    if (distance(unit, target) < stop) return;
    unit.repath -= dt;
    if (unit.repath <= 0 || !unit.path.length) {
      unit.path = this.navigation.path(unit, target);
      unit.repath = 0.9 + (unit.id % 5) * 0.13;
    }
    let next = unit.path[0];
    if (!next) return;
    if (distance(unit, next) < 0.55) {
      unit.path.shift();
      next = unit.path[0];
      if (!next) return;
    }
    const dx = next.x - unit.x,
      dz = next.z - unit.z,
      len = Math.hypot(dx, dz) || 1,
      step = Math.min(len, unit.speed * dt * (unit.slowTimer > 0 ? 0.5 : 1));
    const x = unit.x + (dx / len) * step,
      z = unit.z + (dz / len) * step;
    if (!this.navigation.blocked(x, unit.z)) unit.x = x;
    if (!this.navigation.blocked(unit.x, z)) unit.z = z;
    unit.angle = Math.atan2(dx, dz);
    unit.moving = true;
  }
  canSee(a, b) {
    // The endpoint may itself be a solid reactor or turret; stop before its hull.
    const d = distance(a, b),
      margin =
        b.kind === "reactor"
          ? 5
          : b.kind === "relay"
            ? 2.2
            : b.kind === "turret"
              ? 2.4
              : 0.4;
    if (d <= margin) return true;
    const t = Math.max(0, (d - margin) / d);
    const start = { x: a.x, y: a.kind === "turret" ? 2.3 : 1.55, z: a.z },
      end = {
        x: a.x + (b.x - a.x) * t,
        y:
          b === this.player
            ? b.y - 0.15
            : b.kind === "relay"
              ? 2
              : b.kind === "reactor"
                ? 5
                : 1.5,
        z: a.z + (b.z - a.z) * t,
      };
    return this.visibility
      ? this.visibility(start, end)
      : this.navigation.visible(start, end);
  }
  update(dt) {
    if (this.phase !== "wave") return;
    this.time += dt;
    const p = this.player;
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    p.slowTimer = Math.max(0, (p.slowTimer || 0) - dt);
    this.reinforceCooldown = Math.max(0, this.reinforceCooldown - dt);
    if (p.respawn > 0) {
      p.respawn = Math.max(0, p.respawn - dt);
      if (!p.respawn) {
        p.hp = 100;
        p.shield = 75;
        p.x = -40;
        p.z = -16;
        p.y = 1.8;
        this.emit("respawn");
      }
    } else if (!p.hurtTimer) {
      p.shield = Math.min(75, p.shield + dt * 22);
      p.hp = Math.min(100, p.hp + dt * 3);
    }
    if (this.reactor.dead) {
      this.phase = "victory";
      this.emit("victory");
      return;
    }
    const objective = this.objective;
    for (let i = 0; i < this.allies.length; i++) {
      const unit = this.allies[i];
      if (unit.dead) continue;
      unit.cooldown -= dt;
      unit.slowTimer = Math.max(0, unit.slowTimer - dt);
      let target = null,
        best = Infinity;
      for (const enemy of this.enemies) {
        if (enemy.dead || (enemy.kind === "reactor" && this.relays.length))
          continue;
        const d = distance(unit, enemy);
        if (d > unit.range || !this.canSee(unit, enemy)) continue;
        const priority = d - (enemy.id === this.focusId ? 40 : 0);
        if (priority < best) {
          best = priority;
          target = enemy;
        }
      }
      const anchor =
        this.order === "follow"
          ? p
          : this.order === "hold"
            ? this.holdPoint
            : objective;
      const offset =
        this.order === "advance"
          ? {
              x: anchor.x - 6 - (i % 3) * 1.7,
              z: anchor.z + (Math.floor(i / 3) - 1) * 2.6,
            }
          : {
              x: anchor.x - 3 - (i % 3) * 1.8,
              z: anchor.z + (Math.floor(i / 3) - 0.5) * 3,
            };
      if (target && unit.cooldown <= 0) {
        unit.cooldown = unit.interval;
        this.fire(unit, target, "ally", unit.damage);
      }
      // Following troops keep pace with the operator even while firing.
      if (
        this.order === "follow" ||
        !target ||
        distance(unit, anchor) > unit.range * 0.7
      )
        this.move(unit, offset, dt, 1.2);
      else unit.moving = false;
      if (target) unit.angle = Math.atan2(target.x - unit.x, target.z - unit.z);
      if (unit.type === "medic") {
        for (const ally of this.allies)
          if (!ally.dead && distance(unit, ally) < 9)
            ally.hp = Math.min(ally.maxHp, ally.hp + dt * 7);
        if (p.active && distance(unit, p) < 9 && p.hp > 0)
          p.hp = Math.min(100, p.hp + dt * 6);
      }
    }
    const targets = [
      ...this.allies.filter((u) => !u.dead),
      ...(p.active && p.hp > 0 ? [p] : []),
    ];
    for (const enemy of this.enemies) {
      if (enemy.dead || !["trooper", "turret"].includes(enemy.kind)) continue;
      enemy.cooldown -= dt;
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      const spec = enemy.kind === "turret" ? TOWERS[enemy.type] : enemy,
        range =
          enemy.kind === "turret"
            ? Math.min(spec.range, 25) + enemy.level
            : enemy.range;
      let target = null,
        nearest = Infinity;
      for (const candidate of targets) {
        const d = distance(enemy, candidate);
        if (d < nearest && d < range + 8 && this.canSee(enemy, candidate)) {
          target = candidate;
          nearest = d;
        }
      }
      if (enemy.kind === "trooper") {
        if (target && nearest > 16) this.move(enemy, target, dt, 14);
        else if (!target) this.move(enemy, enemy.home, dt, 2);
        else enemy.moving = false;
      }
      if (target && nearest < range && enemy.cooldown <= 0) {
        const damage =
          enemy.kind === "turret"
            ? { sentry: 10, mortar: 28, frost: 6, rail: 32 }[enemy.type] *
              (1 + (enemy.level - 1) * 0.25)
            : enemy.damage;
        enemy.cooldown =
          enemy.kind === "turret"
            ? Math.max(0.55, spec.interval * 1.2)
            : enemy.interval;
        this.fire(enemy, target, "enemy", damage);
        if (enemy.type === "frost") target.slowTimer = 1.5;
        if (enemy.type === "mortar")
          for (const other of targets)
            if (other !== target && distance(other, target) < 3.5) {
              if (other === p) this.hurtPlayer(damage * 0.55);
              else this.hurtAlly(other, damage * 0.55);
            }
      }
    }
    this.allies = this.allies.filter((u) => !u.dead);
    this.enemies = this.enemies.filter((e) => !e.dead || e.kind === "reactor");
    this.guardTimer -= dt;
    if (
      this.guardTimer <= 0 &&
      this.enemyReserve > 0 &&
      this.enemies.filter((e) => e.kind === "trooper").length < 7
    ) {
      this.guardTimer = 30;
      this.enemyReserve--;
      this.spawnGuard(36, -14);
      this.emit("notice", {
        text: "Enemy reserves deploying from the barracks.",
      });
    }
    this.coreHp = Math.max(0, this.reactor.hp);
  }
}
