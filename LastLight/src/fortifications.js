import * as THREE from "three";
import {
  materials as m,
  box,
  rounded,
  cylinder,
  group,
  mesh,
} from "./models.js";

function sign(parent, text, x, y, z, width = 6) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#b9d2e3";
  ctx.font = "bold 58px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 82);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const o = mesh(
    parent,
    new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
    x,
    y,
    z,
  );
  o.castShadow = false;
  return o;
}
export function fortifications(root, obstacles) {
  // Continuous fortified perimeter with repeated buttresses and recessed armor panels.
  for (const z of [-34, 34])
    for (let x = -46; x <= 42; x += 8) {
      box(root, m.concrete, x, 2, z, 7.8, 4, 1.7);
      box(root, m.metal, x, 4.2, z, 8.1, 0.4, 2.1);
      for (const side of [-1, 1]) {
        box(root, m.dark, x, 2, z + side * 0.89, 6.4, 2.5, 0.15);
        box(root, m.panel, x, 2, z + side * 0.99, 6, 2.15, 0.08);
        box(root, m.amber, x, 3.3, z + side * 1.06, 2, 0.035, 0.02);
      }
      box(root, m.concrete, x - 3.8, 2.5, z, 1, 5, 2.9);
      box(root, m.dark, x - 3.8, 5.1, z, 1.3, 0.2, 3);
    }
  for (const z of [-25, -15, -5, 5, 15, 25]) {
    box(root, m.concrete, 46, 2.5, z, 2, 5, 9.7);
    box(root, m.metal, 46, 5.2, z, 2.5, 0.4, 10);
    box(root, m.amber, 44.9, 3.6, z, 0.04, 0.12, 4);
  }
  const cover = [
    [-37, -3, 4.8, 1.2],
    [-16, -5, 3.6, 1.2],
    [-14, 26, 4.8, 1.3],
    [3, 21, 4, 1.3],
    [3, -19, 4.8, 1.3],
    [25, -17, 5, 1.3],
    [36, 19, 4, 1.4],
  ];
  for (const [x, z, width, height] of cover) {
    box(root, m.concrete, x, height / 2, z, width, height, 1);
    box(root, m.metal, x, height + 0.06, z, width + 0.15, 0.12, 1.1);
    for (let i = 0; i < 3; i++) {
      const stripe = box(
        root,
        m.brass,
        x - width * 0.3 + i * width * 0.3,
        height * 0.55,
        z + 0.52,
        0.3,
        height * 0.7,
        0.03,
      );
      stripe.rotation.z = -0.28;
    }
    obstacles.push({ x, z, halfX: width / 2, halfZ: 0.5, height });
  }
  // Bunkers outside the traversable play area give the outpost a substantial silhouette.
  for (const [x, z, turn] of [
    [-40, -32, 0],
    [34, 32, Math.PI],
    [46, -25, -Math.PI / 2],
  ]) {
    const g = group(root, x, 0, z);
    g.rotation.y = turn;
    obstacles.push({
      x,
      z,
      halfX: Math.abs(turn) === Math.PI / 2 ? 4 : 5,
      halfZ: Math.abs(turn) === Math.PI / 2 ? 5 : 4,
      height: 7,
    });
    box(g, m.concrete, 0, 3.3, 0, 10, 6.6, 8);
    box(g, m.dark, 0, 6.7, 0, 10.6, 0.5, 8.5);
    box(g, m.metal, 0, 3.5, 4.1, 8.5, 3.8, 0.3);
    box(g, m.dark, 0, 2.8, 4.3, 5.8, 3, 0.2);
    box(g, m.glass, 0, 3.4, 4.43, 5.4, 0.52, 0.08);
    box(g, m.amber, 0, 5, 4.3, 5, 0.08, 0.09);
    for (const side of [-1, 1]) {
      box(g, m.concrete, side * 4.2, 3.4, 4.1, 1, 7, 2);
      box(g, m.dark, side * 3.5, 6.9, 0, 1.7, 0.4, 7);
    }
    cylinder(g, m.dark, 0, 7.4, 0, 1.4, 1.8, 0.8, 16);
    cylinder(g, m.panel, 0, 8, 0, 0.7, 1.1, 0.7, 12);
    sign(g, "09 / BASTION", 0, 5.75, 4.45, 6.5);
  }
  // Engineered intake towers and skybridge beyond the base, instead of tree silhouettes.
  for (let i = 0; i < 6; i++) {
    const x = -70 + i * 27,
      z = -90 - (i % 2) * 26,
      h = 28 + (i % 3) * 13;
    box(root, m.concrete, x, h / 2 - 7, z, 14, h, 19);
    box(root, m.dark, x, h - 6, z, 16, 2, 21);
    for (const side of [-1, 1])
      box(root, m.metal, x + side * 6, h / 2 - 7, z, 2, h + 5, 22);
    for (let j = 0; j < 5; j++)
      box(root, m.teal, x - 4 + j * 2, h * 0.65, z + 9.6, 0.18, 8, 0.07);
    box(root, m.dark, x, h * 0.75, z + 10.2, 14, 1, 2);
    cylinder(root, m.panel, x, h + 3, z, 0.4, 0.65, 17, 8);
    box(root, m.red, x, h + 11.6, z, 0.35, 0.15, 0.35);
  }
  box(root, m.metal, -8, 20, -101, 120, 2.5, 5);
  box(root, m.dark, -8, 22, -101, 120, 0.5, 6);
  // A large parked orbital lander reads as a military silhouette on the skyline.
  const ship = group(root, -75, 35, -118);
  ship.rotation.y = -0.4;
  rounded(ship, m.metal, 0, 0, 0, 12, 5, 38);
  rounded(ship, m.panel, 0, 1, -15, 9, 4, 10);
  for (const side of [-1, 1]) {
    rounded(ship, m.dark, side * 12, -0.5, 2, 17, 2, 17);
    rounded(ship, m.panel, side * 17, -0.5, 9, 5, 4, 16);
    cylinder(ship, m.teal, side * 17, -1, 17, 1.2, 1.2, 0.4, 16).rotation.x =
      Math.PI / 2;
  }
  box(ship, m.dark, 0, 3, 0, 3, 2, 22);
  box(ship, m.glass, 0, 2, -20, 5, 0.9, 0.2);
  sign(root, "FORTRESS / KEPLER", 23, 7, -31.8, 15);
}

export function atmosphere(scene) {
  const smokeGeometry = new THREE.BufferGeometry(),
    positions = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    positions[i * 3] = -55 + (i % 6) * 22 + Math.sin(i * 13) * 4;
    positions[i * 3 + 1] = 25 + (i % 30) * 1.8;
    positions[i * 3 + 2] = -90 - (i % 2) * 26;
  }
  smokeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, "rgba(130,150,170,.3)");
  gradient.addColorStop(0.5, "rgba(130,150,170,.15)");
  gradient.addColorStop(1, "rgba(130,150,170,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const smoke = new THREE.Points(
    smokeGeometry,
    new THREE.PointsMaterial({
      map: new THREE.CanvasTexture(canvas),
      size: 12,
      color: 0x8c9db2,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  scene.add(smoke);
  return smoke;
}
