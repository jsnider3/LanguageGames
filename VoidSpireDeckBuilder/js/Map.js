import { NODE_TYPES, MAP_FLOORS } from './Constants.js';
import { randomInt, pickRandom, shuffle } from './Utils.js';

export class GameMap {
    constructor(act) {
        this.act = act;
        this.floors = MAP_FLOORS;
        this.nodes = [];
        this.paths = [];
        this.currentFloor = -1;
        this.currentNode = null;
        this.visitedNodes = new Set();
        this.generate();
    }

    generate() {
        this.nodes = [];
        this.paths = [];
        const columns = this.floors;
        const nodeGrid = [];

        // Generate nodes per floor
        for (let floor = 0; floor < columns; floor++) {
            let count;
            if (floor === 0) count = 1; // start
            else if (floor === columns - 1) count = 1; // boss
            else if (floor === 1) count = randomInt(2, 3);
            else count = randomInt(2, 4);

            const floorNodes = [];
            for (let i = 0; i < count; i++) {
                const node = {
                    id: `${floor}-${i}`,
                    floor,
                    index: i,
                    count,
                    type: this.getNodeType(floor, columns),
                    connections: [],
                    x: 0, y: 0,
                    visited: false,
                    accessible: floor === 0
                };
                floorNodes.push(node);
            }
            nodeGrid.push(floorNodes);
        }

        // Set start and boss
        nodeGrid[0][0].type = NODE_TYPES.START;
        nodeGrid[0][0].visited = true;
        nodeGrid[columns - 1][0].type = NODE_TYPES.BOSS;

        // Ensure first real floor is combat
        for (const n of nodeGrid[1]) n.type = NODE_TYPES.COMBAT;

        // Connect floors - ensure each node has at least one forward connection
        // and no paths cross
        for (let floor = 0; floor < columns - 1; floor++) {
            const current = nodeGrid[floor];
            const next = nodeGrid[floor + 1];

            if (next.length === 1) {
                // All connect to the single next node
                for (const node of current) {
                    node.connections.push(next[0].id);
                }
            } else if (current.length === 1) {
                // Single node connects to all next
                for (const nextNode of next) {
                    current[0].connections.push(nextNode.id);
                }
            } else {
                // Multiple to multiple - avoid crossing
                // Sort both by index, connect each to its "closest" neighbor
                for (let i = 0; i < current.length; i++) {
                    const ratio = next.length > 1 ? i / (current.length - 1) : 0;
                    const targetIdx = Math.round(ratio * (next.length - 1));
                    current[i].connections.push(next[targetIdx].id);

                    // Add occasional extra connections (only to adjacent to avoid crossing)
                    if (Math.random() < 0.4 && targetIdx + 1 < next.length) {
                        current[i].connections.push(next[targetIdx + 1].id);
                    }
                    if (Math.random() < 0.3 && targetIdx - 1 >= 0) {
                        // Check no crossing: no node below us should connect to a node above targetIdx-1
                        const wouldCross = current.some((n, ni) => ni > i && n.connections.some(
                            cid => { const t = next.findIndex(nn => nn.id === cid); return t >= 0 && t < targetIdx - 1; }
                        ));
                        if (!wouldCross) {
                            current[i].connections.push(next[targetIdx - 1].id);
                        }
                    }
                }

                // Ensure every next node is reachable
                for (const nextNode of next) {
                    const reachable = current.some(n => n.connections.includes(nextNode.id));
                    if (!reachable) {
                        // Connect from closest current node
                        let bestIdx = 0;
                        let bestDist = Infinity;
                        for (let i = 0; i < current.length; i++) {
                            const dist = Math.abs(i / (current.length - 1) - nextNode.index / (next.length - 1));
                            if (dist < bestDist) { bestDist = dist; bestIdx = i; }
                        }
                        current[bestIdx].connections.push(nextNode.id);
                    }
                }
            }

            // Deduplicate connections
            for (const node of current) {
                node.connections = [...new Set(node.connections)];
            }
        }

        // Flatten and assign positions
        const canvasW = 960, canvasH = 640;
        const marginX = 60, marginY = 60;
        const usableW = canvasW - marginX * 2;
        const usableH = canvasH - marginY * 2;

        for (let floor = 0; floor < columns; floor++) {
            const floorNodes = nodeGrid[floor];
            const x = marginX + (floor / (columns - 1)) * usableW;
            for (let i = 0; i < floorNodes.length; i++) {
                const node = floorNodes[i];
                const spacing = usableH / (floorNodes.length + 1);
                node.x = x;
                node.y = marginY + spacing * (i + 1);
                this.nodes.push(node);
            }
        }

        // Build path list for rendering
        for (const node of this.nodes) {
            for (const connId of node.connections) {
                const target = this.nodes.find(n => n.id === connId);
                if (target) {
                    this.paths.push({ from: node, to: target });
                }
            }
        }

        this.currentFloor = 0;
        this.visitedNodes.add(nodeGrid[0][0].id);
        this.updateAccessibility();
    }

    getNodeType(floor, total) {
        if (floor === 0) return NODE_TYPES.START;
        if (floor === total - 1) return NODE_TYPES.BOSS;

        // Floor distribution
        if (floor === Math.floor(total / 2)) {
            // Mid-point rest site
            return Math.random() < 0.5 ? NODE_TYPES.REST : NODE_TYPES.EVENT;
        }

        const roll = Math.random();
        if (floor >= total - 3) {
            // Late floors: more elites
            if (roll < 0.35) return NODE_TYPES.COMBAT;
            if (roll < 0.55) return NODE_TYPES.ELITE;
            if (roll < 0.70) return NODE_TYPES.REST;
            if (roll < 0.85) return NODE_TYPES.EVENT;
            return NODE_TYPES.SHOP;
        }

        // Normal distribution
        if (roll < 0.45) return NODE_TYPES.COMBAT;
        if (roll < 0.60) return NODE_TYPES.ELITE;
        if (roll < 0.75) return NODE_TYPES.EVENT;
        if (roll < 0.88) return NODE_TYPES.REST;
        return NODE_TYPES.SHOP;
    }

    updateAccessibility() {
        // Mark nodes accessible from current visited nodes
        for (const node of this.nodes) {
            node.accessible = false;
        }

        // Find nodes connected from the latest visited floor
        const lastVisited = this.nodes.filter(n => n.visited && n.floor === this.currentFloor);
        for (const visited of lastVisited) {
            for (const connId of visited.connections) {
                const target = this.nodes.find(n => n.id === connId);
                if (target && !target.visited) {
                    target.accessible = true;
                }
            }
        }
    }

    selectNode(node) {
        if (!node.accessible) return false;
        node.visited = true;
        node.accessible = false;
        this.currentFloor = node.floor;
        this.currentNode = node;
        this.visitedNodes.add(node.id);
        this.updateAccessibility();
        return true;
    }

    getNodeAt(x, y) {
        const radius = 18;
        for (const node of this.nodes) {
            const dx = x - node.x;
            const dy = y - node.y;
            if (dx * dx + dy * dy < radius * radius) {
                return node;
            }
        }
        return null;
    }

    isComplete() {
        return this.currentFloor >= this.floors - 1;
    }

    getState() {
        return {
            act: this.act,
            currentFloor: this.currentFloor,
            visitedNodes: [...this.visitedNodes],
            nodes: this.nodes.map(n => ({
                id: n.id, floor: n.floor, index: n.index, count: n.count,
                type: n.type, connections: n.connections,
                x: n.x, y: n.y, visited: n.visited
            }))
        };
    }

    loadState(state) {
        this.act = state.act;
        this.currentFloor = state.currentFloor;
        this.visitedNodes = new Set(state.visitedNodes);
        this.nodes = state.nodes;
        this.paths = [];
        for (const node of this.nodes) {
            for (const connId of node.connections) {
                const target = this.nodes.find(n => n.id === connId);
                if (target) this.paths.push({ from: node, to: target });
            }
        }
        this.updateAccessibility();
    }
}
