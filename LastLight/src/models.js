import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TOWERS } from "./data.js";
import { steel, concrete } from "./surfaces.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const materials = {
  metal: new THREE.MeshStandardMaterial({
    color: 0x273b3b,
    roughness: 0.55,
    metalness: 0.65,
  }),
  dark: new THREE.MeshStandardMaterial({
    color: 0x152126,
    roughness: 0.6,
    metalness: 0.5,
  }),
  panel: new THREE.MeshStandardMaterial({
    color: 0x64736b,
    roughness: 0.65,
    metalness: 0.35,
  }),
  cream: new THREE.MeshStandardMaterial({
    color: 0xc7c6aa,
    roughness: 0.65,
    metalness: 0.25,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: 0xcb9656,
    roughness: 0.37,
    metalness: 0.65,
  }),
  amber: new THREE.MeshStandardMaterial({
    color: 0xffc785,
    emissive: 0xffa444,
    emissiveIntensity: 2.5,
    roughness: 0.3,
  }),
  teal: new THREE.MeshStandardMaterial({
    color: 0xb9ffe0,
    emissive: 0x67e8be,
    emissiveIntensity: 2,
    roughness: 0.25,
    metalness: 0.1,
  }),
  red: new THREE.MeshStandardMaterial({
    color: 0xff7554,
    emissive: 0xff4721,
    emissiveIntensity: 2,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x83e5db,
    emissive: 0x3cafa5,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.6,
  }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x171e1d, roughness: 0.98 }),
};
const geometries = new Map();
for (const name of ["metal", "dark", "panel", "cream"]) {
  materials[name].map = steel;
  materials[name].bumpMap = steel;
  materials[name].bumpScale = 0.025;
  materials[name].color.set(
    { metal: 0x9cabbc, dark: 0x485869, panel: 0xb9c5cd, cream: 0x83949c }[name],
  );
  materials[name].roughness = 0.7;
  materials[name].color.multiplyScalar(3);
}
materials.teal.color.set(0x93d9ff);
materials.teal.emissive.set(0x278fe8);
materials.glass.color.set(0x446c96);
materials.glass.emissive.set(0x244568);
materials.glass.emissiveIntensity = 0.35;
materials.concrete = new THREE.MeshStandardMaterial({
  map: concrete,
  bumpMap: concrete,
  bumpScale: 0.07,
  color: 0x9cabb6,
  roughness: 0.95,
});
materials.white = new THREE.MeshStandardMaterial({
  color: 0xbecbd1,
  roughness: 0.65,
  metalness: 0.45,
});

export function fuseRigid(target, owner = target) {
  const batches = new Map();
  for (const object of [...target.children]) {
    if (!object.isMesh || Array.isArray(object.material)) continue;
    object.updateMatrix();
    let geometry = object.geometry.clone().applyMatrix4(object.matrix);
    if (geometry.index) {
      const old = geometry;
      geometry = geometry.toNonIndexed();
      old.dispose();
    }
    const key = object.material.uuid;
    if (!batches.has(key))
      batches.set(key, { material: object.material, geometries: [] });
    batches.get(key).geometries.push(geometry);
    target.remove(object);
  }
  owner.userData.ownedGeometries ||= [];
  for (const { material, geometries: parts } of batches.values()) {
    const geometry = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    if (!geometry) continue;
    owner.userData.ownedGeometries.push(geometry);
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;
    target.add(object);
  }
}
function geo(key, make) {
  if (!geometries.has(key)) geometries.set(key, make());
  return geometries.get(key);
}
export function mesh(
  parent,
  geometry,
  material,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
export function box(parent, material, x, y, z, sx, sy, sz) {
  return mesh(
    parent,
    geo("box", () => new THREE.BoxGeometry()),
    material,
    x,
    y,
    z,
    sx,
    sy,
    sz,
  );
}
export function rounded(parent, material, x, y, z, sx, sy, sz) {
  const key = `rounded:${sx}:${sy}:${sz}`;
  return mesh(
    parent,
    geo(
      key,
      () => new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(sx, sy, sz) * 0.18),
    ),
    material,
    x,
    y,
    z,
  );
}
export function cylinder(
  parent,
  material,
  x,
  y,
  z,
  top,
  bottom,
  height,
  segments = 8,
) {
  return mesh(
    parent,
    geo(
      `c${top},${bottom},${height},${segments}`,
      () => new THREE.CylinderGeometry(top, bottom, height, segments),
    ),
    material,
    x,
    y,
    z,
  );
}
export function sphere(parent, material, x, y, z, radius = 1) {
  return mesh(
    parent,
    geo("sphere", () => new THREE.IcosahedronGeometry(1, 1)),
    material,
    x,
    y,
    z,
    radius,
    radius,
    radius,
  );
}
export function ring(parent, material, radius, tube, x = 0, y = 0, z = 0) {
  return mesh(
    parent,
    geo(
      `r${radius},${tube}`,
      () => new THREE.TorusGeometry(radius, tube, 5, 64),
    ),
    material,
    x,
    y,
    z,
  );
}
export function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (parent) parent.add(g);
  return g;
}

export function makeTower(type, level = 1, ghost = false) {
  const root = group(),
    m = materials;
  const accent = new THREE.MeshStandardMaterial({
    color: TOWERS[type].color,
    map: steel,
    bumpMap: steel,
    bumpScale: 0.018,
    roughness: 0.45,
    metalness: 0.4,
  });
  const light = new THREE.MeshStandardMaterial({
    color: TOWERS[type].color,
    emissive: TOWERS[type].color,
    emissiveIntensity: 2,
  });
  root.userData.ownedMaterials = [accent, light];
  accent.color.multiplyScalar(3);
  cylinder(root, m.dark, 0, 0.22, 0, 1.65, 1.9, 0.44, 6);
  cylinder(root, m.cream, 0, 0.48, 0, 1.5, 1.65, 0.15, 6);
  cylinder(root, m.metal, 0, 0.95, 0, 0.8, 1.1, 0.8, 8);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const leg = box(
      root,
      m.metal,
      Math.sin(a) * 1.1,
      0.6,
      Math.cos(a) * 1.1,
      0.45,
      0.5,
      1.0,
    );
    leg.rotation.y = a;
    box(
      root,
      light,
      Math.sin(a) * 1.65,
      0.43,
      Math.cos(a) * 1.65,
      0.2,
      0.1,
      0.2,
    );
  }
  const head = group(root, 0, 1.65, 0);
  root.userData.head = head;
  cylinder(head, m.dark, 0, 0, 0, 0.85, 0.85, 0.45, 12);
  if (type === "sentry") {
    box(head, accent, 0, 0.35, 0, 1.9, 0.65, 1.5);
    box(head, m.cream, 0, 0.72, -0.1, 1.5, 0.12, 1.2);
    for (const x of [-0.55, 0.55]) {
      const b = cylinder(head, m.dark, x, 0.35, 1.5, 0.16, 0.19, 2.2, 8);
      b.rotation.x = Math.PI / 2;
      box(head, m.metal, x, 0.35, 0.8, 0.45, 0.5, 1.2);
      box(head, light, x, 0.35, 2.58, 0.16, 0.16, 0.04);
    }
    box(head, m.dark, 0, 0.38, -0.82, 1.4, 0.65, 0.4);
    box(head, light, 0, 0.48, 0.79, 0.35, 0.13, 0.06);
  } else if (type === "mortar") {
    box(head, accent, 0, 0.2, -0.15, 1.9, 0.85, 1.8);
    const barrel = group(head, 0, 0.7, 0.6);
    barrel.rotation.x = Math.PI / 3;
    cylinder(barrel, m.dark, 0, 0.9, 0, 0.42, 0.48, 2.3, 12);
    cylinder(barrel, m.cream, 0, 1.1, 0, 0.53, 0.53, 0.3, 12);
    cylinder(barrel, accent, 0, 2, 0, 0.5, 0.5, 0.4, 12);
    cylinder(barrel, m.dark, 0, 2.22, 0, 0.32, 0.32, 0.03, 12);
    for (const x of [-1, 1]) box(head, m.metal, x, 0.65, 0, 0.3, 1.1, 1.25);
  } else if (type === "frost") {
    cylinder(head, m.metal, 0, 0.8, 0, 0.4, 0.7, 1.5, 6);
    const crystal = mesh(
      head,
      geo("octa", () => new THREE.OctahedronGeometry()),
      light,
      0,
      1.45,
      0,
      0.55,
      1.15,
      0.55,
    );
    root.userData.rotor = crystal;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const fin = box(
        head,
        accent,
        Math.sin(a) * 0.85,
        1.1,
        Math.cos(a) * 0.85,
        0.18,
        1.85,
        0.55,
      );
      fin.rotation.y = a;
    }
    ring(head, light, 1.05, 0.055, 0, 1.5, 0).rotation.x = Math.PI / 2;
  } else {
    box(head, m.cream, 0, 0.35, -0.3, 1.45, 0.7, 1.8);
    box(head, accent, 0, 0.77, -0.4, 1.15, 0.16, 1.8);
    for (const x of [-0.3, 0.3]) {
      box(head, m.dark, x, 0.35, 1.6, 0.28, 0.36, 3.4);
      box(head, light, x * 0.65, 0.39, 1.65, 0.07, 0.1, 3.2);
    }
    box(head, accent, 0, 0.35, 3.1, 1, 0.6, 0.5);
    box(head, m.dark, 0, 1, 0, 0.25, 0.2, 0.6);
    box(head, light, 0, 1, 0.32, 0.15, 0.09, 0.01);
  }
  for (let i = 0; i < level; i++)
    box(root, light, -0.3 + i * 0.3, 0.85, 0.87, 0.16, 0.22, 0.1);
  if (level > 1) {
    cylinder(root, accent, 0, 0.18, 0, 1.9, 2.05, 0.2, 6);
    head.position.y += 0.12 * (level - 1);
  }
  if (ghost)
    root.traverse((o) => {
      if (o.isMesh) {
        const mat = o.material.clone();
        mat.transparent = true;
        mat.opacity = 0.28;
        mat.depthWrite = false;
        o.material = mat;
        root.userData.ownedMaterials.push(mat);
        o.castShadow = false;
      }
    });
  if (!ghost) {
    fuseRigid(root, root);
    if (type !== "frost") fuseRigid(head, root);
  }
  return root;
}

export function makeEnemy(enemy) {
  const root = group(),
    m = materials,
    s = enemy.size;
  const armor = new THREE.MeshStandardMaterial({
    color: enemy.color,
    roughness: 0.65,
    metalness: 0.55,
  });
  root.userData.ownedMaterials = [armor];
  root.userData.armor = armor;
  const body = group(root, 0, 1.05, 0);
  root.userData.body = body;
  const legs = [];
  for (const side of [-1, 1])
    for (const end of [-1, 1]) {
      const pivot = group(root, side * 0.66, 0.92, end * 0.6);
      const upper = box(pivot, m.dark, side * 0.13, -0.23, 0, 0.24, 0.65, 0.28);
      upper.rotation.z = side * 0.35;
      box(pivot, armor, side * 0.18, -0.48, 0.06, 0.36, 0.25, 0.4);
      box(pivot, m.dark, side * 0.21, -0.76, 0.13, 0.25, 0.5, 0.26);
      box(pivot, m.metal, side * 0.21, -0.93, 0.2, 0.35, 0.15, 0.6);
      legs.push(pivot);
    }
  root.userData.legs = legs;
  box(body, m.dark, 0, 0, 0, 1.4, 0.72, 1.6);
  const shell = box(body, armor, 0, 0.45, -0.05, 1.6, 0.55, 1.6);
  shell.rotation.x = -0.12;
  box(body, m.metal, 0, 0.1, 0.9, 1.1, 0.45, 0.4);
  box(body, m.red, 0, 0.28, 1.12, 0.7, 0.13, 0.05);
  for (const side of [-1, 1]) {
    box(body, armor, side * 0.83, 0.1, 0, 0.25, 0.6, 1.4);
    box(body, m.dark, side * 0.5, 0.77, -0.3, 0.15, 0.12, 0.65);
  }
  if (enemy.type === "brute" || enemy.type === "boss") {
    for (const side of [-1, 1]) {
      const plate = box(body, m.cream, side * 0.85, 0.52, 0, 0.4, 0.75, 1.9);
      plate.rotation.z = side * 0.25;
      box(body, m.red, side * 1.05, 0.57, 0.6, 0.05, 0.18, 0.35);
    }
    box(body, armor, 0, 0.86, -0.3, 0.9, 0.3, 1.2);
  }
  if (enemy.ranged) {
    const gun = cylinder(body, m.dark, 0, 1.05, 0.25, 0.18, 0.25, 1.8, 8);
    gun.rotation.x = Math.PI / 2;
    sphere(body, m.red, 0, 1.05, 1.18, 0.15);
  }
  if (enemy.type === "runner") {
    body.scale.set(0.85, 0.65, 1.2);
    root.scale.y = 0.8;
  }
  root.scale.multiplyScalar(s);
  const bar = group(root, 0, enemy.ranged ? 3 : 2.6, 0);
  const bg = box(bar, m.dark, 0, 0, 0, 1.6, 0.12, 0.06);
  const health = box(bar, m.red, 0, 0, 0.05, 1.55, 0.075, 0.02);
  bg.castShadow = health.castShadow = false;
  bar.visible = false;
  root.userData.healthBar = bar;
  root.userData.health = health;
  return root;
}

export function makeWeapon(type = "rifle") {
  const root = group(),
    m = materials;
  const body = group(root);
  body.rotation.y = Math.PI;
  rounded(body, m.metal, 0, 0, 0, 0.17, 0.21, 0.58);
  rounded(body, m.cream, 0, 0.11, 0.03, 0.19, 0.07, 0.58);
  rounded(body, m.dark, 0, -0.16, -0.07, 0.12, 0.22, 0.16).rotation.x = -0.18;
  rounded(body, m.dark, 0, 0, -0.4, 0.15, 0.18, 0.3);
  rounded(body, m.rubber, 0, -0.07, -0.59, 0.19, 0.29, 0.09);
  rounded(body, m.brass, 0.102, 0.01, 0.1, 0.018, 0.065, 0.15);
  if (type === "rifle") {
    rounded(body, m.dark, 0, -0.23, 0.16, 0.1, 0.3, 0.17).rotation.x = -0.12;
    rounded(body, m.metal, 0, 0.03, 0.45, 0.14, 0.16, 0.36);
    const barrel = cylinder(body, m.dark, 0, 0.04, 0.78, 0.035, 0.035, 0.4, 10);
    barrel.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++)
      rounded(body, m.dark, 0, 0.132, 0.35 + i * 0.06, 0.17, 0.03, 0.025);
    // An open reflex housing: nothing opaque crosses the optical axis.
    rounded(body, m.dark, 0, 0.163, 0.02, 0.09, 0.038, 0.13);
    for (const x of [-0.065, 0.065])
      rounded(body, m.metal, x, 0.24, 0.02, 0.014, 0.118, 0.09);
    for (const y of [0.181, 0.299])
      rounded(body, m.metal, 0, y, 0.02, 0.144, 0.014, 0.09);
    const lensMaterial = new THREE.MeshBasicMaterial({
      color: 0x86c8ed,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6747,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const lens = mesh(
      body,
      geo("reflex-lens", () => new THREE.PlaneGeometry(0.116, 0.105)),
      lensMaterial,
      0,
      0.24,
      -0.027,
    );
    lens.renderOrder = 1;
    const reticle = group(body, 0, 0.24, 0.063);
    mesh(
      reticle,
      geo("reflex-ring", () => new THREE.RingGeometry(0.009, 0.0105, 40)),
      reticleMaterial,
    );
    mesh(
      reticle,
      geo("reflex-dot", () => new THREE.CircleGeometry(0.002, 20)),
      reticleMaterial,
    );
    reticle.traverse((o) => {
      if (o.isMesh) o.renderOrder = 2;
    });
    reticle.visible = false;
    root.userData.sight = reticle;
    root.userData.reticle = reticle;
    root.userData.lens = lens;
    root.userData.ownedMaterials = [lensMaterial, reticleMaterial];
    rounded(body, m.teal, 0.104, 0.06, -0.08, 0.006, 0.04, 0.1);
  } else {
    for (const x of [-0.045, 0.045]) {
      const b = cylinder(body, m.dark, x, 0.04, 0.56, 0.055, 0.055, 0.85, 10);
      b.rotation.x = Math.PI / 2;
    }
    rounded(body, m.brass, 0, -0.035, 0.49, 0.21, 0.12, 0.3);
    rounded(body, m.dark, 0, 0.2, 0.36, 0.06, 0.1, 0.035);
    const bead = rounded(body, m.amber, 0, 0.256, 0.335, 0.01, 0.01, 0.008);
    // Rear notch and front bead share the same sight line.
    for (const x of [-0.033, 0.033])
      rounded(body, m.dark, x, 0.235, -0.13, 0.012, 0.068, 0.03);
    rounded(body, m.dark, 0, 0.205, -0.13, 0.078, 0.012, 0.03);
    root.userData.sight = bead;
    for (let i = 0; i < 3; i++)
      rounded(body, m.brass, 0.12, 0, -0.13 + i * 0.08, 0.04, 0.13, 0.045);
  }
  // Armored gloves and sleeves give the weapon a physical first-person presence.
  const hand = rounded(body, m.rubber, 0.01, -0.22, -0.04, 0.14, 0.15, 0.2);
  hand.rotation.x = -0.2;
  rounded(body, m.panel, 0.08, -0.33, -0.18, 0.17, 0.19, 0.38).rotation.x =
    -0.35;
  rounded(body, m.rubber, -0.015, -0.1, 0.43, 0.19, 0.13, 0.18);
  const arm = rounded(body, m.panel, -0.16, -0.23, 0.24, 0.17, 0.19, 0.47);
  arm.rotation.y = -0.5;
  arm.rotation.x = -0.2;
  const flash = mesh(
    body,
    geo("flash", () => new THREE.ConeGeometry(0.1, 0.4, 6)),
    m.amber,
    0,
    0.04,
    1.06,
  );
  flash.rotation.x = Math.PI / 2;
  flash.visible = false;
  root.userData.flash = flash;
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return root;
}

export function disposeModel(root) {
  for (const texture of root.userData.ownedTextures || []) texture.dispose();
  root.removeFromParent();
  for (const material of root.userData.ownedMaterials || []) material.dispose();
  for (const geometry of root.userData.ownedGeometries || [])
    geometry.dispose();
}
