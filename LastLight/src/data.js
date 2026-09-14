export const VERSION = 1;
export const CORE = { x: 31, z: 0, maxHp: 1000 };
export const BOUNDS = { minX: -47, maxX: 43, minZ: -30, maxZ: 29 };
export const ROUTES = [
  [
    [-46, -16],
    [-24, -16],
    [-24, 12],
    [-4, 12],
    [-4, -7],
    [16, -7],
    [16, 7],
    [31, 7],
    [31, 0],
  ],
  [
    [-46, 23],
    [-24, 23],
    [-24, 12],
    [-4, 12],
    [-4, -7],
    [16, -7],
    [16, 7],
    [31, 7],
    [31, 0],
  ],
];
export const PADS = [
  [-35, -22],
  [-34, -9],
  [-17, -17],
  [-31, 1],
  [-17, 3],
  [-31, 17],
  [-15, 18],
  [-10, 5],
  [3, 13],
  [3, 0],
  [-10, -9],
  [5, -14],
  [21, -14],
  [23, -2],
  [10, 2],
  [10, 15],
  [23, 15],
  [37, 9],
].map(([x, z], id) => ({ id, x, z }));

export const TOWERS = {
  sentry: {
    name: "Sentry",
    role: "Rapid fire",
    desc: "Reliable twin-barrel fire. Excels against scouts and runners.",
    cost: 100,
    damage: 19,
    interval: 0.36,
    range: 17,
    color: "#efb86c",
    icon: "sentry",
  },
  mortar: {
    name: "Howitzer",
    role: "Area damage",
    desc: "Explosive shells break up groups. Blast radius: 5 meters.",
    cost: 180,
    damage: 76,
    interval: 1.9,
    range: 23,
    splash: 5,
    color: "#ee8c62",
    icon: "mortar",
  },
  frost: {
    name: "Cryo array",
    role: "Crowd control",
    desc: "Chills nearby targets, slowing movement by 58% for 2 seconds.",
    cost: 140,
    damage: 12,
    interval: 0.8,
    range: 15,
    splash: 3.5,
    slow: 0.42,
    color: "#8bdcd8",
    icon: "frost",
  },
  rail: {
    name: "Railgun",
    role: "Armor piercing",
    desc: "Long-range precision shots ignore armor. Built to stop heavy units.",
    cost: 240,
    damage: 145,
    interval: 2.0,
    range: 30,
    pierce: true,
    color: "#bdd695",
    icon: "rail",
  },
};
export const ENEMIES = {
  scout: {
    name: "Vanguard",
    hp: 80,
    speed: 4.7,
    reward: 11,
    coreDamage: 35,
    size: 0.8,
    color: 0xb35942,
    armor: 0,
  },
  runner: {
    name: "Stalker",
    hp: 55,
    speed: 8,
    reward: 10,
    coreDamage: 25,
    size: 0.6,
    color: 0xc8995d,
    armor: 0,
  },
  brute: {
    name: "Bulwark",
    hp: 310,
    speed: 2.9,
    reward: 23,
    coreDamage: 75,
    size: 1.25,
    color: 0x6d7970,
    armor: 0.35,
  },
  spitter: {
    name: "Reaver",
    hp: 160,
    speed: 3.9,
    reward: 18,
    coreDamage: 50,
    size: 0.95,
    color: 0x98657d,
    armor: 0.1,
    ranged: true,
  },
  boss: {
    name: "Colossus",
    hp: 2600,
    speed: 2.05,
    reward: 240,
    coreDamage: 350,
    size: 2.5,
    color: 0x655b4b,
    armor: 0.4,
    ranged: true,
  },
};
export const WAVES = [
  {
    name: "First contact",
    briefing:
      "Vanguards approaching the northern breach. Establish your firing line.",
    units: { scout: 10 },
    interval: 1.8,
  },
  {
    name: "Fast movers",
    briefing: "Stalkers are fast but fragile. Sentries will cut them down.",
    units: { scout: 10, runner: 6 },
    interval: 1.4,
  },
  {
    name: "Iron tide",
    briefing:
      "Armored Bulwarks detected. Railguns punch through their plating.",
    units: { scout: 12, brute: 4 },
    interval: 1.4,
  },
  {
    name: "A second front",
    briefing:
      "The southern breach is active. Both routes converge at the western bend.",
    units: { scout: 10, runner: 10, spitter: 4 },
    interval: 1.15,
    split: true,
  },
  {
    name: "Cold steel",
    briefing: "Dense groups incoming. Combine a Cryo array with a Howitzer.",
    units: { runner: 14, brute: 6, spitter: 5 },
    interval: 1.0,
    split: true,
  },
  {
    name: "The Colossus",
    briefing:
      "A siege walker leads the assault. Focus your railguns and keep moving.",
    units: { scout: 14, brute: 5, spitter: 5, boss: 1 },
    interval: 1.1,
    split: true,
    boss: true,
  },
  {
    name: "Aftershock",
    briefing:
      "The swarm is regrouping. Reinforce your towers before deploying.",
    units: { scout: 12, runner: 16, spitter: 6 },
    interval: 0.85,
    split: true,
  },
  {
    name: "Heavy weather",
    briefing:
      "An armored column is approaching. Upgrade your armor-piercing weapons.",
    units: { brute: 14, spitter: 8, runner: 10 },
    interval: 0.9,
    split: true,
  },
  {
    name: "The long night",
    briefing:
      "Reavers will fire on you in the field. Use cover and your grenades.",
    units: { scout: 14, spitter: 16, brute: 8 },
    interval: 0.8,
    split: true,
  },
  {
    name: "Breaking point",
    briefing:
      "A full-speed assault on both breaches. Slow them before the reactor.",
    units: { runner: 26, brute: 10, spitter: 8 },
    interval: 0.65,
    split: true,
  },
  {
    name: "Last line",
    briefing:
      "One final defense before the siege. Spend your reserves and hold.",
    units: { brute: 18, spitter: 12, scout: 16 },
    interval: 0.7,
    split: true,
  },
  {
    name: "Hold the light",
    briefing:
      "Two Colossi. Every weapon counts. Keep the reactor alive until extraction.",
    units: { scout: 16, runner: 12, brute: 12, spitter: 10, boss: 2 },
    interval: 0.7,
    split: true,
    boss: true,
  },
];
export const WEAPONS = {
  rifle: {
    name: "AR-9 / PULSE RIFLE",
    short: "Pulse rifle",
    damage: 30,
    interval: 0.12,
    magazine: 32,
    reload: 1.6,
    spread: 0.009,
    pellets: 1,
    range: 100,
  },
  shotgun: {
    name: "SG-4 / BREACHER",
    short: "Breacher",
    damage: 25,
    interval: 0.75,
    magazine: 8,
    reload: 2.1,
    spread: 0.065,
    pellets: 8,
    range: 36,
  },
};
export function towerStats(type, level = 1) {
  const t = TOWERS[type];
  return {
    ...t,
    damage: t.damage * (1 + (level - 1) * 0.65),
    range: t.range + (level - 1) * 2,
    interval: t.interval / (1 + (level - 1) * 0.12),
  };
}
export function upgradeCost(tower) {
  return Math.round(TOWERS[tower.type].cost * (tower.level === 1 ? 0.8 : 1.3));
}
export function refund(tower) {
  return Math.floor(tower.invested * 0.65);
}
export function routeLength(route) {
  return route
    .slice(1)
    .reduce(
      (n, p, i) => n + Math.hypot(p[0] - route[i][0], p[1] - route[i][1]),
      0,
    );
}
export function routePosition(route, distance) {
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i],
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (distance <= length)
      return {
        x: a[0] + ((b[0] - a[0]) * distance) / length,
        z: a[1] + ((b[1] - a[1]) * distance) / length,
        angle: Math.atan2(b[0] - a[0], b[1] - a[1]),
      };
    distance -= length;
  }
  const end = route.at(-1);
  return { x: end[0], z: end[1], angle: 0 };
}
export function waveQueue(index) {
  const entries = Object.entries(WAVES[index].units).map(([type, count]) => ({
    type,
    count,
  }));
  const queue = [];
  while (entries.some((e) => e.count > 0))
    for (const entry of entries) if (entry.count-- > 0) queue.push(entry.type);
  // Siege walkers appear after the first escort, giving the player a readable warning.
  const bosses = queue.filter((t) => t === "boss"),
    others = queue.filter((t) => t !== "boss");
  if (bosses.length)
    others.splice(Math.floor(others.length * 0.3), 0, ...bosses);
  return others;
}

export function breachActive(sim, routeIndex) {
  if (sim.isRaid) return true;
  const wave = WAVES[sim.wave - 1];
  return sim.phase === "wave" && !!wave && (routeIndex === 0 || !!wave.split);
}
