import { BOUNDS } from "./data.js";

// A small navigation grid is shared by all infantry; routes are rebuilt only on demand.
export class NavigationGrid {
  constructor(blocked = () => false, cell = 2) {
    this.cell = cell;
    this.width = Math.ceil((BOUNDS.maxX - BOUNDS.minX) / cell);
    this.height = Math.ceil((BOUNDS.maxZ - BOUNDS.minZ) / cell);
    this.blocked = blocked;
    this.cells = new Uint8Array(this.width * this.height);
    for (let id = 0; id < this.cells.length; id++) {
      const p = this.point(id);
      this.cells[id] = blocked(p.x, p.z) ? 1 : 0;
    }
  }
  point(id) {
    return {
      x: BOUNDS.minX + ((id % this.width) + 0.5) * this.cell,
      z: BOUNDS.minZ + (Math.floor(id / this.width) + 0.5) * this.cell,
    };
  }
  index(x, z) {
    const cx = Math.max(
        0,
        Math.min(this.width - 1, Math.floor((x - BOUNDS.minX) / this.cell)),
      ),
      cz = Math.max(
        0,
        Math.min(this.height - 1, Math.floor((z - BOUNDS.minZ) / this.cell)),
      );
    return cz * this.width + cx;
  }
  nearest(x, z) {
    const start = this.index(x, z);
    if (!this.cells[start]) return start;
    let best = -1,
      distance = Infinity;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i]) continue;
      const p = this.point(i),
        d = Math.hypot(p.x - x, p.z - z);
      if (d < distance) {
        best = i;
        distance = d;
      }
    }
    return best;
  }
  path(from, to) {
    const start = this.nearest(from.x, from.z),
      end = this.nearest(to.x, to.z);
    if (start < 0 || end < 0) return [];
    if (start === end) return [this.point(end)];
    const open = [start],
      inOpen = new Set([start]),
      visited = new Set(),
      cost = new Float32Array(this.cells.length).fill(Infinity),
      parent = new Int32Array(this.cells.length).fill(-1);
    cost[start] = 0;
    const ep = this.point(end);
    const estimate = (id) => {
      const p = this.point(id);
      return cost[id] + Math.hypot(p.x - ep.x, p.z - ep.z) / this.cell;
    };
    while (open.length) {
      let best = 0;
      for (let i = 1; i < open.length; i++)
        if (estimate(open[i]) < estimate(open[best])) best = i;
      const current = open.splice(best, 1)[0];
      inOpen.delete(current);
      if (current === end) {
        const result = [];
        let id = end;
        while (id !== start && id >= 0) {
          result.unshift(this.point(id));
          id = parent[id];
        }
        return result;
      }
      visited.add(current);
      const x = current % this.width,
        z = Math.floor(current / this.width);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const nx = x + dx,
          nz = z + dz,
          id = nz * this.width + nx;
        if (
          nx < 0 ||
          nx >= this.width ||
          nz < 0 ||
          nz >= this.height ||
          this.cells[id] ||
          visited.has(id)
        )
          continue;
        if (
          dx &&
          dz &&
          (this.cells[z * this.width + nx] || this.cells[nz * this.width + x])
        )
          continue;
        const next = cost[current] + (dx && dz ? Math.SQRT2 : 1);
        if (next < cost[id]) {
          cost[id] = next;
          parent[id] = current;
          if (!inOpen.has(id)) {
            open.push(id);
            inOpen.add(id);
          }
        }
      }
    }
    return [];
  }
  visible(a, b) {
    const distance = Math.hypot(b.x - a.x, b.z - a.z),
      steps = Math.ceil(distance / 0.65);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t))
        return false;
    }
    return true;
  }
}
