/**
 * ComponentManager
 * Stores and manages all active game components (Gates, Wires, etc).
 */
export class ComponentManager {
    constructor(grid) {
        this.grid = grid;
        this.components = [];
        this.wires = []; // Array of { start: {x,y}, end: {x,y}, state: bool }
    }

    addWire(startNode, endNode) {
        // Prevent zero-length wires
        if (startNode.gx === endNode.gx && startNode.gy === endNode.gy) return;

        // Check if wire already exists (naive check)
        // TODO: spatial hashing for optimization if many wires
        this.wires.push({
            start: startNode,
            end: endNode,
            state: false,
            signalProgress: 0 // For animation
        });
        console.log("Wire added", startNode, endNode);
    }

    addComponent(type, gridX, gridY, locked = false) {
        // TODO: Implement actual specialized classes for components
        const comp = {
            type: type,
            x: gridX,
            y: gridY,
            state: false,
            inputs: [false, false],
            output: false,
            locked: locked,
            id: null,
            forceOutput: undefined
        };
        this.components.push(comp);

        // Update UI
        document.getElementById('score-silicon').innerText = this.components.length;
        return comp;
    }

    getComponentById(id) {
        return this.components.find(c => c.id === id);
    }

    getComponentById(id) {
        return this.components.find(c => c.id === id);
    }

    findComponentAt(x, y) {
        return this.components.find(c => c.x === x && c.y === y);
    }

    removeComponent(comp) {
        const idx = this.components.indexOf(comp);
        if (idx > -1) {
            this.components.splice(idx, 1);
            // Also update UI
            document.getElementById('score-silicon').innerText = this.components.length;
        }
    }

    findWiresConnectedTo(x, y) {
        return this.wires.filter(w =>
            (Math.abs(w.start.x - x) < 5 && Math.abs(w.start.y - y) < 5) ||
            (Math.abs(w.end.x - x) < 5 && Math.abs(w.end.y - y) < 5)
        );
    }

    removeWire(wire) {
        const idx = this.wires.indexOf(wire);
        if (idx > -1) {
            this.wires.splice(idx, 1);
        }
    }

    clear() {
        // Only remove non-locked components
        this.components = this.components.filter(c => c.locked);

        // Remove wires that are connected to deleted components?
        // Actually, just clear all wires for simplicity, OR try to keep wires between fixed nodes?
        // Standard "Clear" usually means "Reset Solution", so removing all wires is correct.
        this.wires = [];

        document.getElementById('score-silicon').innerText = this.components.length;
    }

    update(dt, isSimulating) {
        // Animation updates
        this.wires.forEach(wire => {
            if (wire.state && isSimulating) {
                wire.signalProgress += dt * 0.005; // Speed of pulse
                if (wire.signalProgress > 1) wire.signalProgress = 0;
            } else {
                wire.signalProgress = 0;
            }
        });
    }

    draw(ctx) {
        // Draw Wires
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        this.wires.forEach(wire => {
            // Initial path
            ctx.beginPath();
            ctx.moveTo(wire.start.x, wire.start.y);
            ctx.lineTo(wire.end.x, wire.end.y);

            if (wire.state) {
                // Active wire (Glowing)
                ctx.strokeStyle = '#00f3ff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00f3ff';
                ctx.stroke();

                // Draw Pulse (White hot center moving)
                // Lerp position
                const dx = wire.end.x - wire.start.x;
                const dy = wire.end.y - wire.start.y;
                const px = wire.start.x + (dx * wire.signalProgress);
                const py = wire.start.y + (dy * wire.signalProgress);

                ctx.beginPath();
                ctx.fillStyle = '#ffffff';
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Inactive wire (Dim)
                ctx.strokeStyle = '#333344';
                ctx.shadowBlur = 0;
                ctx.stroke();
            }
        });
        ctx.shadowBlur = 0; // Reset

        // Draw Components
        this.components.forEach(comp => {
            const pos = this.grid.toScreen(comp.x, comp.y);

            // Draw Body
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30);

            // Draw Border
            if (comp.output) {
                ctx.strokeStyle = '#00f3ff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00f3ff';
            } else {
                ctx.strokeStyle = GetColorForType(comp.type);
                ctx.shadowBlur = 0;
            }

            // Draw Lock Indicator
            if (comp.locked) {
                ctx.strokeStyle = '#555'; // Grey out border slightly if locked? Or keep normal
                // Maybe a small padlock icon or distinct corner
                ctx.fillStyle = '#333';
                ctx.fillRect(pos.x - 15, pos.y - 15, 6, 6);
            }

            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - 15, pos.y - 15, 30, 30);

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '10px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(GetShortName(comp.type), pos.x, pos.y);

            if (comp.label) {
                ctx.fillStyle = '#aaa';
                ctx.fillText(comp.label, pos.x, pos.y - 20);
            }
        });
        ctx.shadowBlur = 0;
    }
}

function GetColorForType(type) {
    if (type.includes('AND')) return '#00f3ff'; // Cyan
    if (type.includes('OR')) return '#bc13fe'; // Pink
    if (type.includes('NOT')) return '#ff003c'; // Red
    return '#fff';
}

function GetShortName(type) {
    if (type === 'GATE_AND') return '&';
    if (type === 'GATE_OR') return '≥1';
    if (type === 'GATE_NOT') return '!';
    if (type === 'EMITTER') return 'TX';
    if (type === 'RECEIVER') return 'RX';
    return '?';
}
