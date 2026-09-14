import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { fortifications, atmosphere } from "./fortifications.js";
import { concrete, groundConcrete, rockConcrete } from "./surfaces.js";
import { RELAYS } from "./blueprints.js";
import { CORE, PADS, ROUTES, breachActive } from "./data.js";
import {
  materials as m,
  box,
  cylinder,
  sphere,
  mesh,
  ring,
  group,
} from "./models.js";

function random(seed = 1984) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = random();
// Reserve the full entrance volume before baking rocks into permanent geometry.
const breachApproaches = ROUTES.flatMap((route) => [
  new THREE.Box3(
    new THREE.Vector3(-76, 0.2, route[0][1] - 5),
    new THREE.Vector3(-42, 12, route[0][1] + 5),
  ),
  // Keep a broad valley visible beyond the opening, not a rock face at the end of the road.
  new THREE.Box3(
    new THREE.Vector3(-180, 0.2, route[0][1] - 18),
    new THREE.Vector3(-70, 80, route[0][1] + 18),
  ),
]);
function clearOfBreaches(rock) {
  const bounds = new THREE.Box3().setFromObject(rock);
  if (!breachApproaches.some((approach) => approach.intersectsBox(bounds)))
    return true;
  rock.removeFromParent();
  return false;
}
function groundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#727a60";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40000; i++) {
    const v = 70 + rand() * 70;
    ctx.fillStyle = `rgba(${v + 12},${v + 16},${v},${rand() * 0.3})`;
    const size = rand() * 4 + 1;
    ctx.fillRect(rand() * 512, rand() * 512, size, size);
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = rand() > 0.5 ? "#616b5430" : "#adab8220";
    ctx.beginPath();
    ctx.ellipse(
      rand() * 512,
      rand() * 512,
      rand() * 18,
      rand() * 8,
      rand() * 6,
      0,
      7,
    );
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
function label(parent, text, x, y, z, width = 4, color = "#dce1cb") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "600 62px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const obj = mesh(
    parent,
    new THREE.PlaneGeometry(width, width / 4),
    mat,
    x,
    y,
    z,
  );
  obj.castShadow = false;
  return obj;
}
function distanceToPath(x, z) {
  let distance = Infinity;
  for (const route of ROUTES)
    for (let i = 1; i < route.length; i++) {
      const [ax, az] = route[i - 1],
        [bx, bz] = route[i];
      const dx = bx - ax,
        dz = bz - az,
        t = Math.max(
          0,
          Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
        );
      distance = Math.min(
        distance,
        Math.hypot(x - ax - t * dx, z - az - t * dz),
      );
    }
  return distance;
}
function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse((obj) => {
    if (!obj.isMesh || Array.isArray(obj.material)) return;
    const key = obj.material.uuid;
    if (!groups.has(key))
      groups.set(key, { material: obj.material, geometries: [] });
    let geometry = obj.geometry.clone();
    geometry.applyMatrix4(obj.matrixWorld);
    // Normalize attributes before merging geometry from primitive types.
    if (geometry.index) {
      const old = geometry;
      geometry = geometry.toNonIndexed();
      old.dispose();
    }
    for (const name of Object.keys(geometry.attributes))
      if (!["position", "normal", "uv"].includes(name))
        geometry.deleteAttribute(name);
    groups.get(key).geometries.push(geometry);
  });
  const result = new THREE.Group();
  for (const { material, geometries } of groups.values()) {
    const geometry = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const obj = new THREE.Mesh(geometry, material);
    obj.castShadow = !material.transparent;
    obj.receiveShadow = true;
    result.add(obj);
  }
  return result;
}

export class World {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x394a60);
    this.scene.fog = new THREE.FogExp2(0x394a60, 0.0038);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.4;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xa9c8f2, 0x252b35, 1.55));
    const fill = new THREE.DirectionalLight(0xb5d5ff, 0.9);
    fill.position.set(45, 22, -12);
    this.scene.add(fill);
    const sun = new THREE.DirectionalLight(0xf1d7b7, 2.5);
    sun.position.set(-20, 42, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -75,
      right: 75,
      top: 65,
      bottom: -65,
      near: 1,
      far: 220,
    });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.08;
    this.scene.add(sun);
    this.sun = sun;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(700, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color(0x14263f) },
          bottom: { value: new THREE.Color(0x81919f) },
        },
        vertexShader:
          "varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "uniform vec3 top;uniform vec3 bottom;varying vec3 vPosition;void main(){vec3 d=normalize(vPosition);float h=pow(max(d.y,0.),.6);vec3 col=mix(bottom,top,h);float sun=pow(max(dot(d,normalize(vec3(-.5,.35,-.7))),0.),320.);col+=vec3(1.,.75,.4)*sun*.7;gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
      }),
    );
    this.scene.add(sky);
    const moon = mesh(
      this.scene,
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshStandardMaterial({
        color: 0xa7bdcf,
        roughness: 1,
        fog: false,
      }),
      160,
      190,
      -390,
      43,
      43,
      43,
    );
    moon.castShadow = false;
    moon.receiveShadow = false;
    moon.rotation.z = 0.4;
    const moonRing = ring(
      this.scene,
      new THREE.MeshBasicMaterial({
        color: 0xc3d4bd,
        transparent: true,
        opacity: 0.25,
        fog: false,
      }),
      67,
      1.5,
      160,
      190,
      -390,
    );
    moonRing.rotation.set(0.9, 0.2, -0.4);
    const staticRoot = group();
    this.obstacles = [{ x: CORE.x, z: CORE.z, radius: 4.4 }];
    this.makeTerrain(staticRoot);
    this.makeRoads(staticRoot);
    this.makeSetDressing(staticRoot);
    fortifications(staticRoot, this.obstacles);
    this.staticWorld = bakeStatic(staticRoot);
    this.scene.add(this.staticWorld);
    this.makeCore();
    this.makeGates();
    this.makePads();
    this.makeDust();
    this.smoke = atmosphere(this.scene);
    this.shieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(6.4, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0x5bafff,
        wireframe: true,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    );
    this.shieldDome.position.set(CORE.x, 3.5, CORE.z);
    this.shieldDome.visible = false;
    this.scene.add(this.shieldDome);
    this.range = new THREE.Mesh(
      new THREE.RingGeometry(0.985, 1, 96),
      new THREE.MeshBasicMaterial({
        color: 0xd5efb6,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.range.rotation.x = -Math.PI / 2;
    this.range.position.y = 0.22;
    this.range.visible = false;
    this.scene.add(this.range);
    this.rangeFill = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshBasicMaterial({
        color: 0xaee1c4,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
      }),
    );
    this.rangeFill.rotation.x = -Math.PI / 2;
    this.rangeFill.visible = false;
    this.scene.add(this.rangeFill);
  }
  makeTerrain(root) {
    const soil = new THREE.MeshStandardMaterial({
      map: groundConcrete,
      bumpMap: groundConcrete,
      bumpScale: 0.065,
      roughness: 0.86,
      color: 0xaab4c1,
    });
    box(root, soil, -1, -0.6, 0, 105, 1.1, 74);
    const rockMats = [0x535e6a, 0x44505d, 0x65717e, 0x79828c].map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 1,
          map: rockConcrete,
          bumpMap: rockConcrete,
          bumpScale: 0.15,
          flatShading: false,
        }),
    );
    const rockGeo = new THREE.IcosahedronGeometry(1, 2);
    for (let i = 0; i < 95; i++) {
      const a = (i / 95) * Math.PI * 2,
        x = Math.cos(a) * (54 + rand() * 4),
        z = Math.sin(a) * (38 + rand() * 4);
      const rock = mesh(
        root,
        rockGeo,
        rockMats[i % 4],
        x,
        -6 - rand() * 2,
        z,
        6 + rand() * 5,
        6 + rand() * 6,
        6 + rand() * 4,
      );
      rock.rotation.set(rand(), rand() * 6, rand());
      clearOfBreaches(rock);
    }
    // Layered, craggy mountains frame the entire playable plateau.
    for (let i = 0; i < 100; i++) {
      const a = rand() * Math.PI * 2,
        distance = 155 + rand() * 230;
      const height = 20 + rand() * 65;
      const mountain = mesh(
        root,
        rockGeo,
        rockMats[i % 4],
        Math.cos(a) * distance,
        height * 0.18 - 28,
        Math.sin(a) * distance,
        20 + rand() * 50,
        height,
        22 + rand() * 45,
      );
      mountain.rotation.y = rand() * Math.PI;
      clearOfBreaches(mountain);
    }
    const valley = new THREE.MeshStandardMaterial({
      color: 0x283646,
      roughness: 1,
    });
    box(root, valley, 0, -33, 0, 1500, 1, 1500);
    box(root, rockMats[1], 0, -18, -40, 265, 25, 245);
    for (let i = 0; i < 95; i++) {
      const x = rand() * 96 - 48,
        z = rand() * 65 - 32.5;
      if (
        distanceToPath(x, z) < 5 ||
        PADS.some((p) => Math.hypot(x - p.x, z - p.z) < 4.5) ||
        Math.hypot(x - CORE.x, z) < 8 ||
        RELAYS.some((p) => Math.hypot(x - p.x, z - p.z) < 4)
      )
        continue;
      const size = 0.4 + rand() * 2;
      const rock = mesh(
        root,
        rockGeo,
        rockMats[i % 4],
        x,
        size * 0.25,
        z,
        size * 1.3,
        size * 0.6,
        size,
      );
      rock.rotation.y = rand() * 6;
      if (clearOfBreaches(rock) && size > 1.2)
        this.obstacles.push({ x, z, radius: size });
    }
  }

  makeRoads(root) {
    const road = new THREE.MeshStandardMaterial({
      color: 0x576877,
      roughness: 0.95,
    });
    const edge = new THREE.MeshStandardMaterial({
      color: 0x8996a2,
      roughness: 0.9,
    });
    const stripe = new THREE.MeshStandardMaterial({
      color: 0xcab786,
      roughness: 0.85,
    });
    for (const route of ROUTES) {
      const z = route[0][1];
      // A visible approach road continues through each gate into the cleared rock cut.
      box(root, m.concrete, -59, -0.75, z, 26, 1.4, 8.6);
      box(root, edge, -59, 0.01, z, 26, 0.1, 5.8);
      box(root, road, -59, 0.075, z, 26, 0.07, 5.1);
      for (const side of [-1, 1]) {
        box(root, m.concrete, -60, 1.5, z + side * 4.4, 24, 3, 0.5);
        box(root, stripe, -59, 0.12, z + side * 2.34, 26, 0.015, 0.13);
      }
      for (let x = -70; x < -46; x += 4)
        box(root, stripe, x, 0.12, z, 0.85, 0.015, 0.11);
    }
    const segments = new Set();
    for (const route of ROUTES)
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1],
          b = route[i],
          key = [a, b].join("|");
        if (segments.has(key)) continue;
        segments.add(key);
        const dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz),
          x = (a[0] + b[0]) / 2,
          z = (a[1] + b[1]) / 2;
        const segment = group(root, x, 0, z);
        segment.rotation.y = Math.atan2(dx, dz);
        box(segment, edge, 0, 0.01, 0, 5.8, 0.1, length + 5.7);
        box(segment, road, 0, 0.075, 0, 5.1, 0.07, length + 5.05);
        for (const side of [-1, 1]) {
          box(
            segment,
            stripe,
            side * 2.34,
            0.12,
            0,
            0.13,
            0.015,
            Math.max(1, length - 4.5),
          );
          for (let t = -length / 2 + 2; t < length / 2 - 2; t += 5) {
            box(segment, m.dark, side * 2.68, 0.18, t, 0.28, 0.2, 0.85);
            box(segment, m.amber, side * 2.68, 0.29, t, 0.16, 0.03, 0.55);
          }
        }
        for (let t = -length / 2 + 3; t < length / 2 - 3; t += 4)
          box(segment, stripe, 0, 0.12, t, 0.11, 0.015, 0.85);
      }
  }
  makeSetDressing(root) {
    const building = group(root, 33, 0, -22);
    box(building, m.dark, 0, 1.55, 0, 13, 3.1, 7);
    box(building, m.panel, 0, 3.2, 0, 13.6, 0.35, 7.6);
    box(building, m.cream, 0, 1.75, 3.55, 11, 2.5, 0.2);
    for (const x of [-4, -2, 2, 4]) {
      box(building, m.dark, x, 1.9, 3.7, 1.2, 0.8, 0.12);
      box(building, m.glass, x, 1.9, 3.78, 1, 0.6, 0.04);
    }
    box(building, m.dark, 0, 1.15, 3.72, 1.4, 2.3, 0.12);
    box(building, m.teal, 0, 2.4, 3.8, 1.4, 0.07, 0.04);
    label(building, "KEPLER / 09", 0, 3.8, 3.82, 8);
    for (const x of [-4.5, 4.5])
      cylinder(building, m.metal, x, 3.8, 0, 1.1, 1.1, 0.9, 12);
    cylinder(building, m.cream, 4, 7, -2, 0.08, 0.15, 7, 8);
    box(building, m.dark, 4, 8.6, -2, 2.4, 0.2, 0.15);
    sphere(building, m.red, 4, 10.6, -2, 0.13);
    this.obstacles.push({ x: 33, z: -22, halfX: 7, halfZ: 4 });
    // Solar collectors and industrial storage on the quiet perimeter.
    for (let i = 0; i < 5; i++) {
      const g = group(root, -6 + i * 6, 0, -25);
      cylinder(g, m.metal, 0, 1.1, 0, 0.16, 0.3, 2.2, 8);
      const panel = group(g, 0, 2.3, 0);
      panel.rotation.x = -0.3;
      box(panel, m.dark, 0, 0, 0, 4.8, 0.16, 3.2);
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 3; k++)
          box(
            panel,
            m.glass,
            -1.75 + j * 1.17,
            0.095,
            -1 + k,
            1.1,
            0.035,
            0.92,
          );
      this.obstacles.push({ x: -6 + i * 6, z: -25, radius: 1.4 });
    }
    for (let i = 0; i < 13; i++) {
      const x = i < 6 ? 38 + (i % 2) * 3 : -42 + (i % 3) * 3;
      const z = i < 6 ? -11 - Math.floor(i / 2) * 3 : 0 + Math.floor(i / 3) * 3;
      const g = group(root, x, 0, z);
      g.rotation.y = (rand() - 0.5) * 0.4;
      box(g, m.metal, 0, 0.9, 0, 2.1, 1.8, 2);
      for (const side of [-1, 1]) {
        box(g, m.cream, side * 0.75, 0.9, 1.02, 0.14, 1.75, 0.1);
        box(g, m.cream, side * 0.75, 1.85, 0, 0.14, 0.12, 2.1);
      }
      box(g, m.brass, 0, 1.25, 1.08, 0.6, 0.35, 0.03);
      this.obstacles.push({ x, z, radius: 1.5 });
    }
    for (let i = 0; i < 11; i++) {
      const x = -42 + i * 8,
        z = 31;
      box(root, m.dark, x, 0.45, z, 3, 0.9, 0.75);
      box(root, m.cream, x, 0.95, z, 3.1, 0.15, 0.8);
      cylinder(root, m.metal, x, 2.2, z, 0.06, 0.1, 3.5, 6);
      box(root, m.amber, x, 4, z, 0.4, 0.08, 0.4);
    }
    const decal = label(root, "REACTOR  /  01", 31, 0.15, -8.5, 9);
    decal.rotation.x = -Math.PI / 2;
    const zone = label(root, "NORTH BREACH", -36, 0.16, -16, 8, "#d4bc88");
    zone.rotation.x = -Math.PI / 2;
    const south = label(root, "SOUTH BREACH", -36, 0.16, 23, 8, "#d4bc88");
    south.rotation.x = -Math.PI / 2;
  }
  makeCore() {
    const root = group(this.scene, CORE.x, 0, CORE.z);
    this.core = root;
    cylinder(root, m.dark, 0, 0.3, 0, 5.7, 6.2, 0.6, 12);
    cylinder(root, m.panel, 0, 0.68, 0, 5.2, 5.7, 0.2, 12);
    cylinder(root, m.metal, 0, 1.1, 0, 3.8, 4.3, 0.75, 8);
    cylinder(root, m.dark, 0, 1.6, 0, 2.8, 3.5, 0.5, 8);
    this.coreCrystal = mesh(
      root,
      new THREE.OctahedronGeometry(1, 0),
      m.teal,
      0,
      6,
      0,
      1.55,
      4.4,
      1.55,
    );
    const inner = mesh(
      root,
      new THREE.OctahedronGeometry(1, 0),
      m.glass,
      0,
      6,
      0,
      2.1,
      5.0,
      2.1,
    );
    inner.material = m.glass.clone();
    inner.material.transparent = true;
    inner.material.opacity = 0.25;
    this.coreRings = [];
    for (let i = 0; i < 3; i++) {
      const g = group(root, 0, 4.8 + i * 1.3, 0);
      g.rotation.set(Math.PI / 2 + i * 0.3, i * 0.7, i * 0.25);
      ring(g, m.brass, 2.65 + i * 0.12, 0.09);
      this.coreRings.push(g);
      for (let j = 0; j < 4; j++)
        sphere(
          g,
          m.teal,
          Math.cos((j * Math.PI) / 2) * (2.65 + i * 0.12),
          Math.sin((j * Math.PI) / 2) * (2.65 + i * 0.12),
          0,
          0.13,
        );
    }
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4,
        g = group(root, Math.cos(a) * 3.8, 0, Math.sin(a) * 3.8);
      g.rotation.y = -a;
      box(g, m.metal, 0, 2.8, 0, 0.95, 5.5, 1.3);
      box(g, m.cream, 0, 3.1, 0, 1.15, 3.6, 1.0);
      box(g, m.teal, 0, 3.2, 0.55, 0.16, 3, 0.04);
      box(g, m.dark, 0, 5.8, 0, 1.3, 0.35, 1.4);
      box(g, m.brass, 0, 1, 0, 1.4, 0.35, 1.5);
    }
    const light = new THREE.PointLight(0x6cffcc, 40, 22, 2);
    light.position.set(0, 5, 0);
    root.add(light);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 1.1, 100, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x99ffd7,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.y = 57;
    root.add(beam);
    ring(root, m.teal, 4.8, 0.045, 0, 0.83, 0).rotation.x = Math.PI / 2;
  }
  makeGates() {
    this.gates = ROUTES.map((route, index) => {
      const z = route[0][1],
        x = route[0][0] - 1.5;
      const root = group(this.scene, x, 0, z);
      root.rotation.y = Math.PI / 2;
      const signal = new THREE.MeshStandardMaterial({
        color: 0x77c9ee,
        emissive: 0x77c9ee,
        emissiveIntensity: 1.7,
      });
      for (const side of [-1, 1]) {
        const post = side * 4.3;
        box(root, m.dark, post, 3.6, 0, 1.6, 7.2, 2.2);
        box(root, m.panel, post, 4, 0, 1.2, 4.7, 2.4);
        box(root, signal, side * 3.27, 3.4, 0.65, 0.16, 5.8, 0.12);
        box(root, m.cream, post, 0.8, 0, 2.4, 1.6, 3.5);
        this.obstacles.push({
          x,
          z: z - post,
          halfX: 1.1,
          halfZ: 0.8,
          height: 7.2,
        });
      }
      box(root, m.dark, 0, 7.1, 0, 10.1, 1, 2);
      box(root, m.brass, 0, 7.7, 0, 10.4, 0.2, 2.3);
      label(root, `BREACH  0${index + 1}`, 0, 7.1, 1.02, 5.8);
      box(root, m.dark, 0, 8.65, 0, 7.4, 1.3, 0.5);
      const statuses = {};
      for (const [status, color] of Object.entries({
        SEALED: "#91d9f5",
        OPENING: "#ffd18b",
        OPEN: "#ffad65",
        CLOSING: "#ffd18b",
      })) {
        const sign = label(root, status, 0, 8.65, 0.27, 6.5, color);
        sign.visible = status === "SEALED";
        statuses[status] = sign;
      }
      // Armored slats telescope into the overhead housing, leaving the full lane clear.
      const shutters = [];
      for (let i = 0; i < 6; i++) {
        const slat = group(root, 0, 0.64 + i * 1.03, 0);
        box(slat, m.metal, 0, 0, 0, 6.2, 1.02, 0.3);
        box(slat, m.panel, 0, 0, 0.18, 5.9, 0.79, 0.08);
        for (const side of [-1, 1])
          box(slat, m.brass, side * 2.5, 0, 0.24, 0.22, 0.75, 0.03).rotation.z =
            -0.35;
        shutters.push(slat);
      }
      const blocker = { x, z, halfX: 0.1, halfZ: 3.1, height: 6.4 };
      this.obstacles.push(blocker);
      return {
        root,
        x,
        z,
        shutters,
        signal,
        statuses,
        blocker,
        openness: 0,
        active: false,
        status: "SEALED",
      };
    });
  }
  updateGates(time, sim, snap = false) {
    const dt = Math.max(0, Math.min(0.05, time - (this.gateTime ?? time)));
    snap ||= this.gateSimulation !== sim;
    this.gateTime = time;
    this.gateSimulation = sim;
    for (const [index, gate] of this.gates.entries()) {
      gate.active = breachActive(sim, index);
      const target = Number(gate.active);
      gate.openness = snap
        ? target
        : THREE.MathUtils.clamp(
            gate.openness + (Math.sign(target - gate.openness) * dt) / 0.55,
            0,
            1,
          );
      const t = gate.openness * gate.openness * (3 - 2 * gate.openness);
      gate.shutters.forEach((slat, i) => {
        slat.position.y = THREE.MathUtils.lerp(
          0.64 + i * 1.03,
          6.55 + i * 0.055,
          t,
        );
        slat.scale.y = THREE.MathUtils.lerp(1, 0.15, t);
      });
      gate.status =
        gate.openness === 1
          ? "OPEN"
          : gate.openness === 0
            ? "SEALED"
            : gate.active
              ? "OPENING"
              : "CLOSING";
      for (const [status, sign] of Object.entries(gate.statuses))
        sign.visible = status === gate.status;
      gate.signal.color.set(gate.active ? 0xff9b4d : 0x77c9ee);
      gate.signal.emissive.copy(gate.signal.color);
      gate.signal.emissiveIntensity = gate.active
        ? 1.8 + Math.sin(time * 6) * 0.6
        : 1.2;
      const blockerIndex = this.obstacles.indexOf(gate.blocker);
      if (gate.openness === 1 && blockerIndex >= 0)
        this.obstacles.splice(blockerIndex, 1);
      else if (gate.openness < 1 && blockerIndex < 0)
        this.obstacles.push(gate.blocker);
    }
  }
  makePads() {
    this.pads = PADS.map((pad) => {
      const root = group(this.scene, pad.x, 0, pad.z);
      cylinder(root, m.dark, 0, 0.07, 0, 2.4, 2.5, 0.14, 6);
      cylinder(root, m.panel, 0, 0.15, 0, 2.2, 2.3, 0.08, 6);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xb7cf9c,
        transparent: true,
        opacity: 0.7,
      });
      const rim = ring(root, lightMat, 2.15, 0.035, 0, 0.21, 0);
      rim.rotation.x = Math.PI / 2;
      for (const a of [0, Math.PI / 2]) {
        const cross = box(root, lightMat, 0, 0.21, 0, 0.1, 0.015, 0.9);
        cross.rotation.y = a;
      }
      const id = label(
        root,
        String(pad.id + 1).padStart(2, "0"),
        0,
        0.205,
        1.3,
        1.2,
      );
      id.rotation.x = -Math.PI / 2;
      const target = cylinder(
        root,
        new THREE.MeshBasicMaterial({ visible: false }),
        0,
        0.2,
        0,
        2.5,
        2.5,
        0.4,
        12,
      );
      target.userData.padId = pad.id;
      return { ...pad, root, rim, lightMat, target };
    });
  }
  makeDust() {
    const points = new Float32Array(480 * 3);
    for (let i = 0; i < 480; i++) {
      points[i * 3] = rand() * 130 - 65;
      points[i * 3 + 1] = rand() * 25;
      points[i * 3 + 2] = rand() * 100 - 50;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(points, 3));
    this.dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xf1e3b6,
        size: 0.09,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    this.scene.add(this.dust);
  }
  update(time, sim, selectedPad, hoverPad) {
    this.shieldDome.visible = !!sim.isRaid && sim.relays.length > 0;
    this.shieldDome.rotation.y = time * 0.025;
    this.smoke.position.x = Math.sin(time * 0.04) * 3;
    this.smoke.position.y = Math.sin(time * 0.06) * 2;
    this.coreCrystal.rotation.y = time * 0.25;
    this.coreCrystal.position.y = 6 + Math.sin(time) * 0.15;
    this.coreCrystal.visible = !(sim.isRaid && sim.reactor.dead);
    this.coreRings.forEach((ring, i) => {
      ring.rotation.z = time * (0.12 + i * 0.05);
      ring.rotation.y = Math.sin(time * 0.2 + i) * 0.35;
    });
    this.updateGates(time, sim);
    this.dust.position.x = Math.sin(time * 0.05) * 4;
    this.dust.position.y = Math.sin(time * 0.1) * 1.5;
    for (const pad of this.pads) {
      const occupied =
          sim.towers.some((t) => t.padId === pad.id) ||
          (sim.isRaid &&
            sim.enemies.some((e) => !e.dead && e.padId === pad.id)),
        active = pad.id === selectedPad || pad.id === hoverPad;
      pad.lightMat.color.set(
        active
          ? 0xffcd84
          : occupied
            ? sim.isRaid
              ? 0xeb835c
              : 0x638ba5
            : 0x99b6c9,
      );
      pad.lightMat.opacity = active
        ? 1
        : 0.45 + Math.sin(time * 2 + pad.id) * 0.1;
    }
  }
  showRange(pad, radius, color = "#c9e5ac") {
    this.range.visible = this.rangeFill.visible = !!pad;
    if (!pad) return;
    this.range.position.set(pad.x, 0.24, pad.z);
    this.range.scale.setScalar(radius);
    this.range.material.color.set(color);
    this.rangeFill.position.set(pad.x, 0.23, pad.z);
    this.rangeFill.scale.setScalar(radius);
    this.rangeFill.material.color.set(color);
  }
  setOperation(raid) {
    this.core.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.userData.normalMaterial) o.userData.normalMaterial = o.material;
      if (o.userData.normalMaterial === m.teal) {
        if (!o.userData.enemyMaterial) {
          o.userData.enemyMaterial = m.teal.clone();
          o.userData.enemyMaterial.emissive.set(0xef493b);
          o.userData.enemyMaterial.color.set(0xff8e69);
        }
        o.material = raid
          ? o.userData.enemyMaterial
          : o.userData.normalMaterial;
      }
    });
  }
  lineOfSight(a, b) {
    for (const o of this.obstacles) {
      const halfX = o.halfX || o.radius * 0.75,
        halfZ = o.halfZ || o.radius * 0.75,
        height =
          o.height ||
          (o.x === CORE.x && o.z === CORE.z ? 8 : o.halfX ? 3.5 : 2.5);
      let low = 0,
        high = 1;
      for (const [v, d, min, max] of [
        [a.x, b.x - a.x, o.x - halfX, o.x + halfX],
        [a.z, b.z - a.z, o.z - halfZ, o.z + halfZ],
        [a.y ?? 1.5, (b.y ?? 1.5) - (a.y ?? 1.5), 0, height],
      ]) {
        if (Math.abs(d) < 0.00001) {
          if (v < min || v > max) {
            high = -1;
            break;
          }
        } else {
          let t1 = (min - v) / d,
            t2 = (max - v) / d;
          if (t1 > t2) [t1, t2] = [t2, t1];
          low = Math.max(low, t1);
          high = Math.min(high, t2);
        }
      }
      if (high >= low && high > 0.02 && low < 0.98) return false;
    }
    return true;
  }
  collides(x, z, towers) {
    for (const obstacle of this.obstacles) {
      if (
        obstacle.halfX
          ? Math.abs(x - obstacle.x) < obstacle.halfX + 0.4 &&
            Math.abs(z - obstacle.z) < obstacle.halfZ + 0.4
          : Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + 0.4
      )
        return true;
    }
    return towers.some((t) => Math.hypot(x - t.x, z - t.z) < 1.9);
  }
}
