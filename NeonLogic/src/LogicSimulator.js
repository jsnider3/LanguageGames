/**
 * LogicSimulator
 * Processes the circuit logic.
 */
export class LogicSimulator {
    constructor(componentManager) {
        this.components = componentManager;
        this.tickCount = 0;
    }

    reset() {
        this.tickCount = 0;
        this.components.components.forEach(c => {
            c.state = false;
            c.output = false;
        });
        this.components.wires.forEach(w => w.state = false);
    }

    tick(dt, totalFrames) {
        // Run logic 4 times per second (slow enough to visualize)
        if (totalFrames % 15 !== 0) return;

        this.tickCount++;
        const comps = this.components.components;
        const wires = this.components.wires;

        // 1. Reset all wire states to false (pulse logic)
        // We will rebuild the signal graph this tick
        wires.forEach(w => w.state = false);

        // 2. Identify Sources 
        // Sources are: Emitters (that are ON), and Gates (that were ON last tick)
        // We use 'forceOutput' for Emitters to respect Level validation
        let activeNodes = []; // {x, y}

        // Add Active Emitters
        comps.filter(c => c.type === 'EMITTER').forEach(c => {
            // If forced by level (Iterative Inputs), use that. Else default true.
            const isOn = c.forceOutput !== undefined ? c.forceOutput : true;
            c.state = isOn;
            c.output = isOn;
            if (isOn) activeNodes.push({ x: c.x, y: c.y });
        });

        // Add Active Gates (from previous tick results)
        comps.filter(c => c.type !== 'EMITTER' && c.type !== 'RECEIVER').forEach(c => {
            if (c.output) activeNodes.push({ x: c.x, y: c.y });
        });

        // 3. Flood Fill Signal through Wires
        // Iteratively activate wires connected to active nodes
        let changed = true;
        let pass = 0;

        while (changed && pass < 100) { // Limit passes to prevent infinite loops
            changed = false;
            pass++;

            // Pass A: Source -> Wire
            wires.forEach(w => {
                if (w.state) return; // Already lit

                // Check if efficiently connected to an activeNode (Source)
                const startActive = activeNodes.some(n => n.x === w.start.gx && n.y === w.start.gy);
                const endActive = activeNodes.some(n => n.x === w.end.gx && n.y === w.end.gy);

                if (startActive || endActive) {
                    w.state = true;
                    changed = true;
                }
            });

            // Pass B: Wire -> Wire (Propagate)
            wires.forEach(w1 => {
                if (!w1.state) return;

                wires.forEach(w2 => {
                    if (w2.state) return;

                    // If they connect at a valid junction (no component blocking)
                    if (this.areWiresConnected(w1, w2)) {
                        w2.state = true;
                        changed = true;
                    }
                });
            });
        }

        // 4. Calculate Gate Inputs based on active nodes/wires
        // We need the list of ORIGINAL sources to determine if a wire is carrying an EXTERNAL signal
        const originalSources = activeNodes.map(n => ({ x: n.x, y: n.y }));

        comps.forEach(c => {
            if (c.type === 'EMITTER') return;

            // Find all active wires touching me
            const touchingWires = wires.filter(w =>
                w.state && (
                    (w.start.gx === c.x && w.start.gy === c.y) ||
                    (w.end.gx === c.x && w.end.gy === c.y)
                )
            );

            // Filter to only those powered by SOMEONE ELSE
            const externalInputs = touchingWires.filter(w =>
                this.isPoweredByExternalSource(w, c.x, c.y, wires, originalSources)
            );

            const activeInputWires = externalInputs.length;
            c.inputSignalCount = activeInputWires;

            // GATE LOGIC
            switch (c.type) {
                case 'GATE_AND':
                    // AND requires at least 2 active inputs
                    c.output = activeInputWires >= 2;
                    break;
                case 'GATE_OR':
                    // OR requires any input
                    c.output = activeInputWires >= 1;
                    break;
                case 'GATE_XOR':
                    c.output = activeInputWires === 1; // Strictly one
                    break;
                case 'GATE_NOT':
                    // Simple Rule: Invert input.
                    // Isolation logic ensures activeInputWires excludes own output.
                    c.output = activeInputWires === 0;
                    break;
                case 'RECEIVER':
                    c.output = activeInputWires >= 1;
                    // For checking win condition
                    c.inputs = [c.output];
                    break;
            }
            c.state = c.output;

            // Output is stored in 'state' and 'output' for next tick
        });
    }

    /**
     * BFS to verify if a wire network connects to a source other than the ignored coordinate
     * Respects Component-Blocking (Isolation)
     */
    isPoweredByExternalSource(startWire, ignoreX, ignoreY, allWires, sources) {
        let queue = [startWire];
        let visitedWireIds = new Set();
        visitedWireIds.add(allWires.indexOf(startWire));

        while (queue.length > 0) {
            const w = queue.shift();
            const p1 = w.start;
            const p2 = w.end;

            // Direct connection to Source?
            // Check P1
            if (sources.some(s => s.x === p1.gx && s.y === p1.gy)) {
                // If source is NOT the ignored gate, then yes it is external power
                if (p1.gx !== ignoreX || p1.gy !== ignoreY) return true;
            }
            // Check P2
            if (sources.some(s => s.x === p2.gx && s.y === p2.gy)) {
                if (p2.gx !== ignoreX || p2.gy !== ignoreY) return true;
            }

            // Expand to Connected Neighbors
            const neighbors = allWires.filter(nw => {
                const idx = allWires.indexOf(nw);
                if (visitedWireIds.has(idx)) return false;
                // Only consider active wires (Logic Step: active wires only)
                if (!nw.state) return false;

                // Must be physically connected via a non-blocked node
                return this.areWiresConnected(w, nw);
            });

            neighbors.forEach(nw => {
                visitedWireIds.add(allWires.indexOf(nw));
                queue.push(nw);
            });
        }
        return false;
    }

    findComponentAt(gx, gy) {
        return this.components.components.find(c => c.x === gx && c.y === gy);
    }

    /**
     * Checks if two wires share a node AND that node is not blocked by a component.
     */
    areWiresConnected(w1, w2) {
        let sharedNode = null;
        if (w1.start.gx === w2.start.gx && w1.start.gy === w2.start.gy) sharedNode = w1.start;
        else if (w1.start.gx === w2.end.gx && w1.start.gy === w2.end.gy) sharedNode = w1.start;
        else if (w1.end.gx === w2.start.gx && w1.end.gy === w2.start.gy) sharedNode = w1.end;
        else if (w1.end.gx === w2.end.gx && w1.end.gy === w2.end.gy) sharedNode = w1.end;

        if (!sharedNode) return false;

        // Check for component at sharedNode
        const comp = this.findComponentAt(sharedNode.gx, sharedNode.gy);
        // If component exists, it blocks wire-to-wire conduction
        if (comp) return false;

        return true;
    }
}
