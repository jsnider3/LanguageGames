export const BUNKER_SAVE = "last-light.bunker.v1";
export const REACTOR = { x: 0, z: -7, maxHp: 500 };
export const ROOMS = [
  { name: "WEST INTAKE", x: -12, z: -8, w: 12, d: 12, color: "#d99757" },
  { name: "EAST COOLANT", x: 12, z: -8, w: 12, d: 12, color: "#69b9ce" },
  { name: "REACTOR", x: 0, z: -5, w: 12, d: 18, color: "#91c7ac" },
  { name: "WORKSHOP", x: -12, z: 6, w: 12, d: 16, color: "#d99757" },
  { name: "SERVICE LOOP", x: 12, z: 6, w: 12, d: 16, color: "#69b9ce" },
  { name: "CONTROL", x: 0, z: 9, w: 12, d: 10, color: "#91c7ac" },
];
const wall = (x, z, w, d) => ({ x, z, halfX: w / 2, halfZ: d / 2, height: 4.6 });
export const WALLS = [wall(-18, 0, .6, 28), wall(18, 0, .6, 28), wall(0, 14, 36, .6)];
for (const [a, b] of [[-18, -14], [-10, 10], [14, 18]]) WALLS.push(wall((a + b) / 2, -14, b - a, .6));
for (const x of [-6, 6])
  for (const [a, b] of [[-14, -9], [-5, -1.7], [1.7, 7], [11, 14]]) WALLS.push(wall(x, (a + b) / 2, .5, b - a));
for (const [a, b] of [[-18, -14], [-10, -6], [6, 10], [14, 18]]) WALLS.push(wall((a + b) / 2, -2, b - a, .5));
for (const x of [-4, 4]) WALLS.push(wall(x, 4, 4, .5));
export const BARRIERS = [
  { id: "west-door", name: "West bulkhead", kind: "door", x: -6, z: -7, width: 4, maxHp: 180 },
  { id: "east-door", name: "East bulkhead", kind: "door", x: 6, z: -7, width: 4, maxHp: 180 },
  { id: "west-wall", name: "Workshop wall", kind: "wall", x: -6, z: 0, width: 3.4, maxHp: 150 },
  { id: "east-wall", name: "Service wall", kind: "wall", x: 6, z: 0, width: 3.4, maxHp: 150 },
];
export const EMPLACEMENTS = [{ id: "west-turret", x: -3, z: -10, name: "West sentry" }, { id: "east-turret", x: 3, z: -10, name: "East sentry" }];
export const FURNITURE = [
  ...[-16.5, 16.5].map(x => ({ x, z: 7, halfX: .68, halfZ: 3.6, height: 1.7 })),
  ...[-4, 4].map(x => ({ x, z: 12.5, halfX: 1.5, halfZ: .5, height: 1.8 })),
];
export const HOSTILES = {
  grunt: { name: "Raider", hp: 95, speed: 2.5, damage: 10, interval: .95, reward: 7, armor: 0 },
  runner: { name: "Rusher", hp: 65, speed: 4, damage: 8, interval: .7, reward: 6, armor: 0 },
  gunner: { name: "Gunner", hp: 125, speed: 2.1, damage: 10, interval: 1.3, reward: 9, armor: .1, ranged: true },
  breacher: { name: "Breacher", hp: 310, speed: 1.8, damage: 18, barrierDamage: 38, interval: 1.3, reward: 16, armor: .3 },
};
const wave = (name, briefing, units, lanes, interval = 1.7) => ({ name, briefing, units, lanes, interval });
export const BUNKER_WAVES = [
  wave("Knocking at the door", "Raiders at WEST INTAKE. The bulkhead buys time. Open it to fire, then seal it to reload.", { grunt: 6 }, ["west-door"], 2.5),
  wave("A weak seam", "Rushers are targeting the damaged WORKSHOP WALL. Weld it or intercept them in the workshop.", { runner: 5, grunt: 3 }, ["west-wall"], 2),
  wave("Coolant alarm", "EAST COOLANT is compromised. Gunners will engage you across the room. Use the service loop.", { grunt: 5, gunner: 3 }, ["east-door"], 2),
  wave("Split attention", "Both bulkheads are under attack. A support sentry can cover you while you reset a door.", { grunt: 8, runner: 4 }, ["west-door", "east-door"]),
  wave("Through the walls", "They are cutting through BOTH WALL PANELS. Repairs hold off small groups; clear larger groups first.", { runner: 6, gunner: 4 }, ["west-wall", "east-wall"]),
  wave("The ram", "An armored BREACHER is advancing on the west bulkhead. Its heavy strikes overwhelm your welder.", { breacher: 2, grunt: 6 }, ["west-door"], 2),
  wave("Crossfire", "East-side gunners and workshop rushers. Watch your rear when working on a panel.", { gunner: 6, runner: 6 }, ["east-door", "west-wall"]),
  wave("Structural failure", "Breachers are attacking the wall seams. Rebuilding a wall blocks the route again, but the opening must be clear.", { breacher: 3, runner: 7 }, ["east-wall", "west-wall"], 1.8),
  wave("Room by room", "Assault teams are coming through both bulkheads. Retreat through the service loop and retake the rooms.", { grunt: 8, gunner: 5, breacher: 2 }, ["west-door", "east-door"], 1.5),
  wave("Four alarms", "All four approaches are active. Choose what to seal, what to abandon, and where to fight.", { runner: 10, gunner: 5, breacher: 2 }, BARRIERS.map(b => b.id), 1.4),
  wave("Last reserves", "Heavy teams at the doors; rushers at the seams. Spend your scrap and keep a retreat route open.", { breacher: 4, runner: 8, gunner: 4 }, BARRIERS.map(b => b.id), 1.4),
  wave("Keep the light on", "The final assault. Hold the reactor until the extraction uplink completes.", { breacher: 5, gunner: 6, runner: 10 }, BARRIERS.map(b => b.id), 1.3),
];
export function approach(id) {
  const b = BARRIERS.find(b => b.id === id), side = Math.sign(b.x);
  return b.kind === "door"
    ? [[side * 12, -13], [side * 12, -7], [side * 7.1, -7], [side * 4.6, -7], [side * 2.6, -7]]
    : [[side * 12, -13], [side * 12, 0], [side * 7.1, 0], [side * 4.6, 0], [side * 3, -3], [side * 2.6, -7]];
}
export function segmentBox(a, b, box) {
  let low = 0, high = 1;
  for (const [v, d, min, max] of [[a.x, b.x - a.x, box.x - box.halfX, box.x + box.halfX], [a.z, b.z - a.z, box.z - box.halfZ, box.z + box.halfZ]]) {
    if (Math.abs(d) < 1e-8) { if (v < min || v > max) return false; }
    else { let u = (min - v) / d, w = (max - v) / d; if (u > w) [u, w] = [w, u]; low = Math.max(low, u); high = Math.min(high, w); if (low > high) return false; }
  }
  return high > .001 && low < .999;
}
