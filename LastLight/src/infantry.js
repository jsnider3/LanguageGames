import * as THREE from "three";
import {
  materials as m,
  box,
  rounded,
  cylinder,
  mesh,
  group,
  ring,
  makeTower,
  fuseRigid,
} from "./models.js";
import { steel } from "./surfaces.js";
const armorShell = new THREE.SphereGeometry(1, 20, 14);
const visorShell = new THREE.SphereGeometry(
  1,
  24,
  8,
  0,
  Math.PI,
  Math.PI * 0.37,
  Math.PI * 0.2,
);

function healthBar(root, y, ally = false) {
  const bar = group(root, 0, y, 0),
    back = box(bar, m.dark, 0, 0, 0, 1.6, 0.12, 0.06),
    health = box(bar, ally ? m.teal : m.red, 0, 0, 0.05, 1.55, 0.075, 0.02);
  back.castShadow = health.castShadow = false;
  root.userData.healthBar = bar;
  root.userData.health = health;
  bar.visible = false;
}
function objectiveMarker(root, text, y) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#142338dc";
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = "#f1a66b";
  ctx.fillRect(0, 0, 5, 96);
  ctx.font = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), 256, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const marker = new THREE.Sprite(material);
  marker.position.y = y;
  marker.scale.set(5.4, 1, 1);
  root.add(marker);
  root.userData.ownedMaterials.push(material);
  root.userData.ownedTextures = [texture];
}
export function makeTrooper(unit) {
  const root = group(),
    ally = unit.team === "ally",
    heavy = unit.type === "heavy";
  const armor = new THREE.MeshStandardMaterial({
    color: ally
      ? heavy
        ? 0x667d89
        : unit.type === "medic"
          ? 0xb2bbc0
          : 0x708c95
      : 0x9a7270,
    map: steel,
    bumpMap: steel,
    bumpScale: 0.018,
    metalness: 0.55,
    roughness: 0.6,
  });
  const visor = new THREE.MeshStandardMaterial({
    color: ally ? 0xffc276 : 0xff673c,
    emissive: ally ? 0xffa340 : 0xff3618,
    emissiveIntensity: 1.25,
    metalness: 0.75,
    roughness: 0.16,
  });
  armor.color.multiplyScalar(3);
  root.userData.ownedMaterials = [armor, visor];
  root.userData.armor = armor;
  root.userData.infantry = true;
  const body = group(root, 0, 1.08, 0);
  root.userData.body = body;
  rounded(body, m.rubber, 0, 0.08, 0, 0.61, 0.61, 0.36);
  rounded(body, armor, 0, 0.36, 0.015, heavy ? 0.98 : 0.82, 0.49, 0.47);
  rounded(body, m.dark, 0, 0.38, 0.29, 0.62, 0.28, 0.12);
  rounded(body, armor, 0, 0.4, 0.35, 0.54, 0.18, 0.06);
  box(body, ally ? m.teal : m.red, -0.17, 0.45, 0.39, 0.16, 0.028, 0.015);
  for (let i = 0; i < 3; i++)
    rounded(
      body,
      armor,
      0,
      -0.01 - i * 0.095,
      0.21,
      0.49 - i * 0.04,
      0.075,
      0.095,
    );
  rounded(body, m.dark, 0, -0.29, 0, 0.59, 0.15, 0.35);
  for (const x of [-0.24, 0.24]) {
    rounded(body, m.panel, x, -0.23, 0.24, 0.14, 0.24, 0.14);
    box(body, m.white, x, -0.23, 0.315, 0.09, 0.02, 0.01);
  }
  cylinder(body, m.dark, 0, 0.67, 0, 0.15, 0.18, 0.14, 12);
  mesh(body, armorShell, armor, 0, 0.94, 0, 0.265, 0.27, 0.285);
  rounded(body, m.dark, 0, 0.92, 0.235, 0.4, 0.18, 0.07);
  mesh(body, visorShell, visor, 0, 0.96, 0.004, 0.248, 0.22, 0.295);
  rounded(body, armor, 0, 1.1, 0.18, 0.37, 0.075, 0.19).rotation.x = -0.18;
  rounded(body, m.dark, 0, 1.14, 0.15, 0.055, 0.035, 0.25);
  rounded(body, armor, 0, 0.76, 0.255, 0.32, 0.11, 0.105);
  for (const side of [-1, 1])
    rounded(body, armor, side * 0.18, 0.82, 0.22, 0.13, 0.16, 0.17).rotation.z =
      side * 0.25;
  for (const x of [-0.24, 0.24]) {
    rounded(body, m.dark, x, 0.9, 0, 0.075, 0.2, 0.2);
    box(body, m.panel, x, 0.9, 0.1, 0.08, 0.05, 0.12);
  }
  box(body, m.dark, -0.21, 1.17, -0.11, 0.028, 0.37, 0.028);
  rounded(body, m.dark, 0, 0.27, -0.35, 0.59, 0.53, 0.24);
  for (const x of [-0.19, 0.19]) {
    rounded(body, armor, x, 0.27, -0.5, 0.2, 0.44, 0.13);
    for (let i = 0; i < 4; i++)
      box(body, m.dark, x, 0.12 + i * 0.09, -0.58, 0.14, 0.035, 0.015);
  }
  for (const side of [-1, 1]) {
    const arm = group(body, side * 0.51, 0.42, 0);
    mesh(arm, armorShell, armor, side * 0.04, -0.035, 0, 0.24, 0.21, 0.265);
    rounded(arm, m.rubber, 0, -0.26, 0.02, 0.23, 0.33, 0.24);
    rounded(arm, armor, 0, -0.29, 0.15, 0.24, 0.26, 0.11);
    const fore = group(arm, 0, -0.44, 0.03);
    fore.rotation.x = -1.12;
    cylinder(fore, armor, 0, -0.16, 0, 0.15, 0.125, 0.33, 12);
    rounded(fore, m.rubber, 0, -0.36, 0, 0.2, 0.17, 0.22);
    box(
      arm,
      ally ? m.teal : m.red,
      side * 0.23,
      -0.02,
      0.14,
      0.025,
      0.12,
      0.055,
    );
    fuseRigid(fore, root);
    fuseRigid(arm, root);
  }
  const gun = group(body, 0.14, -0.04, 0.45);
  rounded(gun, m.dark, 0, 0, 0, heavy ? 0.28 : 0.16, 0.18, 0.62);
  rounded(gun, m.panel, 0, 0.09, -0.08, 0.14, 0.06, 0.3);
  const barrel = cylinder(gun, m.dark, 0, 0, 0.44, 0.035, 0.045, 0.4, 12);
  barrel.rotation.x = Math.PI / 2;
  box(gun, ally ? m.teal : m.red, 0, 0.08, 0.26, 0.05, 0.025, 0.06);
  rounded(gun, m.dark, 0, -0.15, -0.02, 0.105, 0.23, 0.13);
  fuseRigid(gun, root);
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = group(root, side * 0.22, 0.85, 0);
    rounded(hip, m.rubber, 0, -0.16, 0, 0.25, 0.4, 0.26);
    rounded(hip, armor, 0, -0.17, 0.13, 0.3, 0.34, 0.12);
    rounded(hip, armor, 0, -0.38, 0.15, 0.3, 0.18, 0.15);
    rounded(hip, m.dark, 0, -0.57, 0, 0.23, 0.35, 0.22);
    rounded(hip, armor, 0, -0.58, 0.12, 0.25, 0.28, 0.1);
    rounded(hip, m.rubber, 0, -0.76, 0.075, 0.3, 0.18, 0.45);
    box(hip, armor, 0, -0.69, 0.24, 0.31, 0.1, 0.1);
    fuseRigid(hip, root);
    legs.push(hip);
  }
  root.userData.legs = legs;
  if (heavy) {
    rounded(body, armor, 0, 0.6, -0.37, 0.8, 0.32, 0.4);
    body.scale.x = 1.13;
  }
  if (unit.type === "medic") {
    box(body, m.white, 0.55, 0.42, 0.23, 0.18, 0.045, 0.015);
    box(body, m.white, 0.55, 0.42, 0.24, 0.045, 0.18, 0.015);
  }
  fuseRigid(body, root);
  healthBar(root, 2.35, ally);
  return root;
}

export function makeRaidStructure(enemy) {
  if (enemy.kind === "turret") {
    const root = makeTower(enemy.type, enemy.level);
    root.userData.structure = true;
    root.userData.ownedMaterials[0].color.set(0xb27867).multiplyScalar(3);
    root.userData.ownedMaterials[1].color.set(0xff9a65);
    root.userData.ownedMaterials[1].emissive.set(0xff6033);
    healthBar(root, 3.9);
    return root;
  }
  const root = group();
  root.userData.structure = true;
  root.userData.ownedMaterials = [];
  if (enemy.kind === "relay") {
    cylinder(root, m.dark, 0, 0.2, 0, 2, 2.3, 0.4, 8);
    cylinder(root, m.panel, 0, 0.55, 0, 1.35, 1.8, 0.4, 8);
    for (const side of [-1, 1]) {
      rounded(root, m.metal, side * 0.85, 1.6, 0, 0.5, 2.4, 0.8);
      box(root, m.red, side * 0.85, 1.6, 0.43, 0.14, 1.7, 0.035);
    }
    const orb = mesh(
      root,
      new THREE.IcosahedronGeometry(0.72, 3),
      new THREE.MeshStandardMaterial({
        color: 0x91bfff,
        emissive: 0x447cff,
        emissiveIntensity: 2.2,
        metalness: 0.1,
        roughness: 0.15,
      }),
      0,
      2,
      0,
    );
    root.userData.ownedMaterials.push(orb.material);
    root.userData.ownedGeometries = [orb.geometry];
    ring(root, m.brass, 1.18, 0.08, 0, 2, 0).rotation.x = Math.PI / 3;
    rounded(root, m.dark, 0, 3, 0, 2.4, 0.3, 1.1);
    healthBar(root, 3.65);
    objectiveMarker(root, enemy.name, 4.5);
  } else {
    healthBar(root, 11);
    objectiveMarker(root, "Enemy reactor", 12);
  }
  return root;
}

export function animateTrooper(model, unit, time, camera) {
  model.position.set(unit.x, 0.12, unit.z);
  model.rotation.y = unit.angle || 0;
  if (model.userData.infantry) {
    const stride = unit.moving ? Math.sin(time * 10 + unit.id) * 0.55 : 0;
    model.userData.legs[0].rotation.x = stride;
    model.userData.legs[1].rotation.x = -stride;
    model.userData.body.position.y =
      1.08 +
      (unit.moving
        ? Math.abs(Math.sin(time * 10)) * 0.035
        : Math.sin(time * 2 + unit.id) * 0.008);
  }
  if (model.userData.head)
    model.userData.head.rotation.y = (unit.angle || 0) - model.rotation.y;
  if (model.userData.rotor) model.userData.rotor.rotation.y = time;
  if (model.userData.armor) {
    model.userData.armor.emissive.set(unit.hurtUntil > time ? 0x934f32 : 0);
  }
  const bar = model.userData.healthBar;
  if (bar) {
    bar.visible = unit.hp < unit.maxHp && unit.hp > 0;
    bar.quaternion
      .copy(camera.quaternion)
      .premultiply(model.quaternion.clone().invert());
    model.userData.health.scale.x = Math.max(0.001, unit.hp / unit.maxHp);
    model.userData.health.position.x = -0.775 * (1 - unit.hp / unit.maxHp);
  }
}
