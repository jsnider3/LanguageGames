import {
  VERSION,
  CORE,
  PADS,
  TOWERS,
  ENEMIES,
  WAVES,
  ROUTES,
  towerStats,
  upgradeCost,
  refund,
  routePosition,
  routeLength,
  waveQueue,
} from "./data.js";

export class Simulation {
  constructor(difficulty = "normal") {
    this.difficulty = ["relaxed", "normal", "veteran"].includes(difficulty)
      ? difficulty
      : "normal";
    this.wave = 0;
    this.phase = "build";
    this.credits = 480;
    this.coreHp = CORE.maxHp;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.events = [];
    this.queue = [];
    this.spawnTimer = 0;
    this.spawned = 0;
    this.serial = 0;
    this.time = 0;
    this.kills = 0;
    this.playerKills = 0;
    this.totalEarned = 480;
    this.totalShots = 0;
    this.hits = 0;
    this.player = {
      x: 25,
      z: -1,
      y: 1.8,
      hp: 100,
      hurtTimer: 0,
      respawn: 0,
      active: false,
    };
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  drainEvents() {
    return this.events.splice(0);
  }
  build(padId, type) {
    if (
      !["build", "wave"].includes(this.phase) ||
      !TOWERS[type] ||
      !PADS[padId] ||
      this.towers.some((t) => t.padId === padId)
    )
      return false;
    if (this.credits < TOWERS[type].cost) {
      this.emit("notice", {
        text: "Not enough alloy. Destroy enemies to earn more.",
      });
      return false;
    }
    this.credits -= TOWERS[type].cost;
    const tower = {
      id: ++this.serial,
      padId,
      type,
      level: 1,
      invested: TOWERS[type].cost,
      cooldown: 0,
      kills: 0,
      ...PADS[padId],
    };
    // Pad IDs are stable and unique; keep entity IDs independent.
    tower.id = this.serial;
    this.towers.push(tower);
    this.emit("built", { tower });
    return tower;
  }
  upgrade(padId) {
    const tower = this.towers.find((t) => t.padId === padId);
    if (!tower || tower.level >= 3 || !["build", "wave"].includes(this.phase))
      return false;
    const cost = upgradeCost(tower);
    if (this.credits < cost) {
      this.emit("notice", { text: "Not enough alloy for this upgrade." });
      return false;
    }
    this.credits -= cost;
    tower.invested += cost;
    tower.level++;
    this.emit("upgraded", { tower });
    return true;
  }
  sell(padId) {
    const index = this.towers.findIndex((t) => t.padId === padId);
    if (index < 0 || !["build", "wave"].includes(this.phase)) return false;
    const tower = this.towers[index];
    this.credits += refund(tower);
    this.towers.splice(index, 1);
    this.emit("sold", { tower });
    return true;
  }
  startWave() {
    if (this.phase !== "build" || this.wave >= WAVES.length) return false;
    this.queue = waveQueue(this.wave);
    this.wave++;
    this.phase = "wave";
    this.spawned = 0;
    this.spawnTimer = 0.7;
    this.emit("wave", { wave: this.wave, name: WAVES[this.wave - 1].name });
    return true;
  }
  spawn(type, routeIndex = 0) {
    const template = ENEMIES[type];
    const factor =
      (1 + Math.max(0, this.wave - 1) * 0.11) *
      { relaxed: 0.72, normal: 1, veteran: 1.35 }[this.difficulty];
    const enemy = {
      ...template,
      type,
      id: ++this.serial,
      hp: template.hp * factor,
      maxHp: template.hp * factor,
      distance: 0,
      routeIndex,
      length: routeLength(ROUTES[routeIndex]),
      slowTimer: 0,
      shotTimer: 2 + (this.serial % 4) * 0.3,
      attackTimer: 0,
      dead: false,
      ...routePosition(ROUTES[routeIndex], 0),
    };
    this.enemies.push(enemy);
    this.emit("spawn", { enemy });
    if (type === "boss")
      this.emit("notice", {
        text: "COLOSSUS DETECTED · Focus your heavy weapons",
        urgent: true,
      });
    return enemy;
  }
  damage(enemy, amount, source = "player", pierce = false) {
    if (enemy.dead) return 0;
    const dealt = amount * (pierce ? 1 : 1 - enemy.armor);
    enemy.hp -= dealt;
    this.emit("hit", { enemy, damage: dealt, source });
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.kills++;
      this.credits += enemy.reward;
      this.totalEarned += enemy.reward;
      if (source === "player") this.playerKills++;
      else {
        const tower = this.towers.find((t) => t.id === source);
        if (tower) tower.kills++;
      }
      this.emit("killed", { enemy, source });
    }
    return dealt;
  }
  blast(x, z, radius, damage, source = "player", pierce = false) {
    for (const enemy of this.enemies) {
      const distance = Math.hypot(enemy.x - x, enemy.z - z);
      if (!enemy.dead && distance <= radius + enemy.size * 0.5)
        this.damage(
          enemy,
          damage * (1 - Math.min(distance / radius, 1) * 0.5),
          source,
          pierce,
        );
    }
    this.emit("explosion", { x, z, radius });
  }
  hurtPlayer(amount) {
    const p = this.player;
    if (!p.active || p.respawn > 0 || this.phase !== "wave") return;
    p.hp = Math.max(0, p.hp - amount);
    p.hurtTimer = 4;
    this.emit("playerHit", { amount });
    if (p.hp === 0) {
      p.respawn = 6;
      p.active = false;
      this.coreHp = Math.max(0, this.coreHp - 50);
      this.emit("playerDown");
    }
  }
  update(dt) {
    if (!["build", "wave"].includes(this.phase)) return;
    this.time += dt;
    const p = this.player;
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    if (p.respawn > 0) {
      p.respawn = Math.max(0, p.respawn - dt);
      if (p.respawn === 0) {
        p.hp = 100;
        p.x = 25;
        p.z = -1;
        this.emit("respawn");
      }
    } else if (!p.hurtTimer) p.hp = Math.min(100, p.hp + dt * 7);
    if (this.phase === "build") return;
    const wave = WAVES[this.wave - 1];
    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0 && this.queue.length) {
      this.spawn(this.queue.shift(), wave.split && this.spawned % 2 ? 1 : 0);
      this.spawned++;
      this.spawnTimer += wave.interval;
    }
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.distance += enemy.speed * dt * (enemy.slowTimer > 0 ? 0.42 : 1);
      Object.assign(
        enemy,
        routePosition(ROUTES[enemy.routeIndex], enemy.distance),
      );
      if (enemy.distance >= enemy.length) {
        enemy.dead = true;
        this.coreHp = Math.max(0, this.coreHp - enemy.coreDamage);
        this.emit("breach", { enemy });
        continue;
      }
      enemy.attackTimer -= dt;
      enemy.shotTimer -= dt;
      if (p.active && !p.respawn) {
        const dist = Math.hypot(p.x - enemy.x, p.z - enemy.z);
        if (dist < enemy.size + 1.6 && enemy.attackTimer <= 0) {
          this.hurtPlayer(enemy.type === "boss" ? 36 : 14);
          enemy.attackTimer = 1.1;
        }
        if (enemy.ranged && dist < 28 && enemy.shotTimer <= 0) {
          enemy.shotTimer = enemy.type === "boss" ? 1.1 : 2.3;
          const originY = enemy.size * 1.8;
          const dy = p.y - originY,
            length = Math.hypot(p.x - enemy.x, p.z - enemy.z, dy);
          const speed = 18;
          this.projectiles.push({
            id: ++this.serial,
            x: enemy.x,
            z: enemy.z,
            y: originY,
            vx: ((p.x - enemy.x) / length) * speed,
            vz: ((p.z - enemy.z) / length) * speed,
            vy: (dy / length) * speed,
            life: 3,
            damage: enemy.type === "boss" ? 24 : 13,
          });
          this.emit("enemyShot", { enemy });
        }
      }
    }
    for (const tower of this.towers) {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const stats = towerStats(tower.type, tower.level);
      let target = null,
        priority = -Infinity;
      for (const enemy of this.enemies) {
        if (
          enemy.dead ||
          Math.hypot(enemy.x - tower.x, enemy.z - tower.z) > stats.range
        )
          continue;
        let score = -(enemy.length - enemy.distance);
        if (tower.type === "frost" && enemy.slowTimer > 0.6) score -= 80;
        if (tower.type === "rail") score += enemy.armor * 70;
        if (score > priority) {
          priority = score;
          target = enemy;
        }
      }
      if (!target) continue;
      tower.cooldown = stats.interval;
      this.emit("towerShot", {
        tower,
        target: { x: target.x, z: target.z, size: target.size },
        enemyId: target.id,
      });
      if (tower.type === "frost") {
        for (const enemy of this.enemies)
          if (
            !enemy.dead &&
            Math.hypot(enemy.x - target.x, enemy.z - target.z) < stats.splash
          ) {
            enemy.slowTimer = 2;
            this.damage(enemy, stats.damage, tower.id, true);
          }
      } else if (stats.splash)
        this.blast(target.x, target.z, stats.splash, stats.damage, tower.id);
      else this.damage(target, stats.damage, tower.id, stats.pierce);
    }
    for (const shot of this.projectiles) {
      // Segment collision avoids fast projectiles passing through the player at low frame rates.
      const dx = shot.vx * dt,
        dy = shot.vy * dt,
        dz = shot.vz * dt;
      const d2 = dx * dx + dy * dy + dz * dz;
      const t = d2
        ? Math.max(
            0,
            Math.min(
              1,
              ((p.x - shot.x) * dx +
                (p.y - 0.5 - shot.y) * dy +
                (p.z - shot.z) * dz) /
                d2,
            ),
          )
        : 0;
      if (
        Math.hypot(
          shot.x + dx * t - p.x,
          shot.y + dy * t - (p.y - 0.5),
          shot.z + dz * t - p.z,
        ) < 1
      ) {
        this.hurtPlayer(shot.damage);
        shot.life = 0;
      }
      shot.x += dx;
      shot.z += dz;
      shot.y += dy;
      shot.life -= dt;
    }
    this.projectiles = this.projectiles.filter((s) => s.life > 0 && s.y > 0);
    this.enemies = this.enemies.filter((e) => !e.dead);
    if (this.coreHp <= 0) {
      this.phase = "defeat";
      this.emit("defeat");
    } else if (!this.queue.length && !this.enemies.length) {
      if (this.wave === WAVES.length) {
        this.phase = "victory";
        this.emit("victory");
      } else {
        this.phase = "build";
        const bonus = 100 + this.wave * 22;
        this.credits += bonus;
        this.totalEarned += bonus;
        this.coreHp = Math.min(CORE.maxHp, this.coreHp + 40);
        this.player.hp = 100;
        this.projectiles = [];
        this.emit("waveClear", { bonus, wave: this.wave });
      }
    }
  }
  checkpoint() {
    if (this.phase !== "build") return null;
    return {
      version: VERSION,
      difficulty: this.difficulty,
      wave: this.wave,
      credits: this.credits,
      coreHp: this.coreHp,
      towers: this.towers.map((t) => ({
        padId: t.padId,
        type: t.type,
        level: t.level,
        invested: t.invested,
        kills: t.kills,
      })),
      kills: this.kills,
      playerKills: this.playerKills,
      totalEarned: this.totalEarned,
      time: this.time,
    };
  }
  static restore(data) {
    if (
      !data ||
      data.version !== VERSION ||
      !Number.isInteger(data.wave) ||
      data.wave < 0 ||
      data.wave >= WAVES.length ||
      !Number.isFinite(data.credits) ||
      data.credits < 0 ||
      data.credits > 1000000 ||
      !Number.isFinite(data.coreHp) ||
      data.coreHp <= 0 ||
      data.coreHp > CORE.maxHp ||
      !Array.isArray(data.towers) ||
      data.towers.length > PADS.length
    )
      return null;
    const ids = new Set();
    for (const t of data.towers) {
      if (
        !Number.isInteger(t.padId) ||
        !PADS[t.padId] ||
        ids.has(t.padId) ||
        !Object.hasOwn(TOWERS, t.type) ||
        ![1, 2, 3].includes(t.level) ||
        !Number.isFinite(t.invested) ||
        t.invested < TOWERS[t.type].cost ||
        t.invested > TOWERS[t.type].cost * 3.1 + 1
      )
        return null;
      ids.add(t.padId);
    }
    const game = new Simulation(data.difficulty);
    game.wave = data.wave;
    game.credits = data.credits;
    game.coreHp = data.coreHp;
    for (const key of ["kills", "playerKills", "totalEarned", "time"])
      if (Number.isFinite(data[key]) && data[key] >= 0) game[key] = data[key];
    game.towers = data.towers.map((t) => ({
      ...PADS[t.padId],
      ...t,
      id: ++game.serial,
      cooldown: 0,
      kills: Number.isFinite(t.kills) ? Math.max(0, t.kills) : 0,
    }));
    return game;
  }
}
