import * as THREE from "three";

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.lines = [];
    this.rings = [];
    this.capacity = 750;
    this.mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      this.capacity,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.ringGeometry = new THREE.RingGeometry(0.88, 1, 48);
  }
  burst(x, y, z, color = 0xffb566, count = 18, power = 5) {
    for (let i = 0; i < count && this.particles.length < this.capacity; i++) {
      const life = 0.35 + Math.random() * 0.6;
      this.particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * power,
        vy: Math.random() * power,
        vz: (Math.random() - 0.5) * power,
        life,
        maxLife: life,
        color,
        scale: 0.4 + Math.random() * 1.8,
      });
    }
  }
  beam(from, to, color = 0xffca83, life = 0.1, width = 0.055) {
    const start = new THREE.Vector3(from.x, from.y, from.z),
      end = new THREE.Vector3(to.x, to.y, to.z);
    const dir = end.clone().sub(start),
      length = dir.length();
    const geo = new THREE.CylinderGeometry(width, width, length, 5, 1);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const object = new THREE.Mesh(geo, mat);
    object.position.copy(start).add(end).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize(),
    );
    this.scene.add(object);
    this.lines.push({ object, life, maxLife: life });
  }
  shockwave(x, z, radius = 5, color = 0xf9c98a) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const object = new THREE.Mesh(this.ringGeometry, material);
    object.rotation.x = -Math.PI / 2;
    object.position.set(x, 0.3, z);
    this.scene.add(object);
    this.rings.push({ object, life: 0.6, radius });
  }
  update(dt) {
    this.particles = this.particles.filter((p) => p.life > 0);
    let i = 0;
    for (const p of this.particles) {
      p.life -= dt;
      p.vy -= dt * 9;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.1) {
        p.y = 0.1;
        p.vy *= -0.3;
        p.vx *= 0.8;
        p.vz *= 0.8;
      }
      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.setScalar(Math.max(0, p.life / p.maxLife) * p.scale);
      this.dummy.rotation.set(p.life * 4, p.life * 3, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.color.set(p.color));
      i++;
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    for (const line of this.lines) {
      line.life -= dt;
      line.object.material.opacity = Math.max(0, line.life / line.maxLife);
    }
    this.lines = this.lines.filter((line) => {
      if (line.life > 0) return true;
      line.object.removeFromParent();
      line.object.geometry.dispose();
      line.object.material.dispose();
      return false;
    });
    for (const ring of this.rings) {
      ring.life -= dt;
      ring.object.scale.setScalar((1 - ring.life / 0.6) * ring.radius);
      ring.object.material.opacity = Math.max(0, ring.life);
    }
    this.rings = this.rings.filter((ring) => {
      if (ring.life > 0) return true;
      ring.object.removeFromParent();
      ring.object.material.dispose();
      return false;
    });
  }
  clear() {
    this.particles = [];
    for (const line of this.lines) line.life = 0;
    for (const ring of this.rings) ring.life = 0;
    this.update(0);
  }
}
