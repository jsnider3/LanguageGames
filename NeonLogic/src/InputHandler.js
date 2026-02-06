/**
 * InputHandler
 * Manages mouse/keyboard input for tool usage.
 */
export class InputHandler {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;

        this.toolType = 'WIRE';
        this.isDragging = false;
        this.dragStartNode = null; // {x, y, gx, gy}
        this.mousePos = { x: 0, y: 0 };
        this.snapPos = { x: 0, y: 0 };

        // Bind events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Right click separate handler
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onRightClick(e);
        });
    }

    setTool(type) {
        this.toolType = type;
        this.isDragging = false;
        this.isPanning = false;
        this.dragStartNode = null;
        this.lastMousePos = { x: 0, y: 0 };
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onMouseDown(e) {
        // Middle Click = Pan
        if (e.button === 1) {
            this.isPanning = true;
            this.lastMousePos = this.getMousePos(e);
            e.preventDefault();
            return;
        }

        if (e.button !== 0) return; // Only Left Click for tools

        const pos = this.getMousePos(e);
        this.engine.audio.playClick();

        // Basic hit test first
        if (this.toolType === 'WIRE') {
            this.isDragging = true;
            this.dragStartNode = this.engine.grid.snapToNode(pos.x, pos.y);
        } else {
            // Place Component
            const gridPos = this.engine.grid.toGrid(pos.x, pos.y);

            // Should not be able to place on top of any existing component
            const existing = this.engine.components.findComponentAt(gridPos.x, gridPos.y);
            if (existing) {
                console.log("Cannot place here, occupied");
                return;
            }

            this.engine.components.addComponent(this.toolType, gridPos.x, gridPos.y);
            this.engine.audio.playClick();
            this.isDragging = false; // Instant placement
        }
    }

    onRightClick(e) {
        // Deletion Mode
        const pos = this.getMousePos(e);
        const gridPos = this.engine.grid.toGrid(pos.x, pos.y);
        const snapPos = this.engine.grid.snapToNode(pos.x, pos.y);

        // 1. Check for Component
        const comp = this.engine.components.findComponentAt(gridPos.x, gridPos.y);
        if (comp && !comp.locked) {
            this.engine.components.removeComponent(comp);
            this.engine.audio.playDelete();
            return;
        }

        // 2. Check for Wire (nearby snap node)
        // This is a bit tricky, wires are edges.
        // Let's delete any wire connected to the node we clicked near
        const wires = this.engine.components.findWiresConnectedTo(snapPos.x, snapPos.y);
        if (wires.length > 0) {
            wires.forEach(w => this.engine.components.removeWire(w));
            this.engine.audio.playDelete();
        }
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isPanning) {
            const dx = pos.x - this.lastMousePos.x;
            const dy = pos.y - this.lastMousePos.y;
            this.engine.grid.pan(dx, dy);
            this.lastMousePos = pos;
        }

        this.mousePos = pos;
        this.snapPos = this.engine.grid.snapToNode(this.mousePos.x, this.mousePos.y);
    }

    onMouseUp(e) {
        if (e.button === 1) {
            this.isPanning = false;
        }

        if (this.toolType === 'WIRE' && this.isDragging && this.dragStartNode) {
            const endNode = this.engine.grid.snapToNode(this.mousePos.x, this.mousePos.y);
            this.engine.components.addWire(this.dragStartNode, endNode);
            this.engine.audio.playConnect();
        }

        this.isDragging = false;
        this.dragStartNode = null;
    }

    draw(ctx) {
        // Draw Mouse Cursor / Snap Indicator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;

        if (this.toolType === 'WIRE') {
            // Draw Dragging Wire
            if (this.isDragging && this.dragStartNode) {
                ctx.beginPath();
                ctx.moveTo(this.dragStartNode.x, this.dragStartNode.y);
                ctx.lineTo(this.snapPos.x, this.snapPos.y);
                ctx.strokeStyle = '#00f3ff';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw snap indicator
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(this.snapPos.x - 3, this.snapPos.y - 3, 6, 6);

        } else {
            // Draw Ghost Component
            const gridPos = this.engine.grid.toGrid(this.mousePos.x, this.mousePos.y);
            const screenPos = this.engine.grid.toScreen(gridPos.x, gridPos.y);

            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.strokeRect(screenPos.x - 15, screenPos.y - 15, 30, 30);
        }
    }
}
