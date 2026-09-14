import { PADS, TOWERS } from "./data.js";

export const BASE_BUDGET = 4800;
export const RELAYS = [
  { x: -12, z: -24, name: "North relay" },
  { x: 22, z: 23, name: "South relay" },
];
export const BASES = [
  {
    name: "Outpost Cerberus",
    description: "A forward garrison. Light defenses and open approaches.",
    towers: [
      [4, "sentry", 1],
      [7, "sentry", 1],
      [11, "mortar", 1],
      [13, "rail", 1],
      [16, "sentry", 1],
    ],
  },
  {
    name: "Iron Citadel",
    description:
      "Layered crossfire. Bring your squad and use the concrete cover.",
    towers: [
      [1, "sentry", 1],
      [4, "sentry", 2],
      [7, "mortar", 1],
      [9, "frost", 1],
      [11, "rail", 1],
      [13, "rail", 2],
      [16, "sentry", 2],
      [15, "mortar", 1],
    ],
  },
  {
    name: "Obsidian Keep",
    description:
      "An armored fortress. Coordinate focus fire and reinforcement drops.",
    towers: [
      [1, "rail", 1],
      [4, "sentry", 2],
      [7, "mortar", 2],
      [9, "frost", 2],
      [10, "sentry", 1],
      [11, "rail", 2],
      [13, "rail", 2],
      [14, "frost", 1],
      [16, "sentry", 2],
      [17, "mortar", 2],
    ],
  },
].map((base) => ({
  ...base,
  version: 1,
  towers: base.towers.map(([padId, type, level]) => ({ padId, type, level })),
}));

export function towerInvestment(t) {
  return (
    TOWERS[t.type].cost +
    (t.level > 1 ? Math.round(TOWERS[t.type].cost * 0.8) : 0) +
    (t.level > 2 ? Math.round(TOWERS[t.type].cost * 1.3) : 0)
  );
}
export function validateBlueprint(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.towers) ||
    input.towers.length > PADS.length ||
    typeof input.name !== "string"
  )
    throw new Error("This is not a Last Light base code.");
  const name =
    input.name
      .replace(/[<>\x00-\x1f]/g, "")
      .trim()
      .slice(0, 40) || "Shared stronghold";
  const seen = new Set();
  const towers = input.towers.map((t) => {
    if (
      !t ||
      !Number.isInteger(t.padId) ||
      !PADS[t.padId] ||
      seen.has(t.padId) ||
      !Object.hasOwn(TOWERS, t.type) ||
      ![1, 2, 3].includes(t.level)
    )
      throw new Error("Base contains an invalid or duplicate defense.");
    seen.add(t.padId);
    return { padId: t.padId, type: t.type, level: t.level };
  });
  if (towers.reduce((sum, t) => sum + towerInvestment(t), 0) > BASE_BUDGET)
    throw new Error(`Base exceeds the ${BASE_BUDGET} alloy limit.`);
  return { version: 1, name, towers };
}
export function encodeBlueprint(base) {
  const json = JSON.stringify(validateBlueprint(base));
  return "LLB1." + btoa(String.fromCharCode(...new TextEncoder().encode(json)));
}
export function decodeBlueprint(code) {
  if (
    typeof code !== "string" ||
    code.length > 12000 ||
    !code.trim().startsWith("LLB1.")
  )
    throw new Error("Paste a base code beginning with LLB1.");
  try {
    return validateBlueprint(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(atob(code.trim().slice(5)), (c) => c.charCodeAt(0)),
        ),
      ),
    );
  } catch (error) {
    throw new Error(
      error.message.startsWith("Base ")
        ? error.message
        : "The base code is incomplete or invalid.",
    );
  }
}
