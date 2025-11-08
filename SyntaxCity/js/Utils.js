// SyntaxCity - Utility Functions

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

export function choose(array) {
    return array[randomInt(0, array.length - 1)];
}

export function gridToWorld(gridX, gridY, tileSize) {
    return {
        x: gridX * tileSize + tileSize / 2,
        y: gridY * tileSize + tileSize / 2
    };
}

export function worldToGrid(worldX, worldY, tileSize) {
    return {
        x: Math.floor(worldX / tileSize),
        y: Math.floor(worldY / tileSize)
    };
}

export function isInBounds(gridX, gridY, cols, rows) {
    return gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows;
}

export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
}

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToString(r, g, b, a = 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function getColorWithAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToString(rgb.r, rgb.g, rgb.b, alpha);
}

export function drawCircle(ctx, x, y, radius, color, fill = true) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

export function drawRect(ctx, x, y, width, height, color, fill = true) {
    if (fill) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    } else {
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, width, height);
    }
}

export function drawText(ctx, text, x, y, options = {}) {
    const {
        color = '#ffffff',
        size = 16,
        font = 'Courier New',
        align = 'center',
        baseline = 'middle',
        bold = false,
        stroke = false,
        strokeColor = '#000000',
        strokeWidth = 2
    } = options;

    ctx.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (stroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

export function drawLine(ctx, x1, y1, x2, y2, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

export function drawPolygon(ctx, points, color, fill = true) {
    if (points.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInQuad(t) {
    return t * t;
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }

    distance(v) {
        return this.subtract(v).magnitude();
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }
}

export class Timer {
    constructor(duration, callback, repeat = false) {
        this.duration = duration;
        this.callback = callback;
        this.repeat = repeat;
        this.elapsed = 0;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.callback();
            if (this.repeat) {
                this.elapsed = 0;
            } else {
                this.active = false;
            }
        }
    }

    reset() {
        this.elapsed = 0;
        this.active = true;
    }

    stop() {
        this.active = false;
    }

    getProgress() {
        return Math.min(this.elapsed / this.duration, 1);
    }

    getRemaining() {
        return Math.max(this.duration - this.elapsed, 0);
    }
}

export class ObjectPool {
    constructor(factory, initialSize = 50) {
        this.factory = factory;
        this.available = [];
        this.active = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.available.push(factory());
        }
    }

    get() {
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.factory();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.available.push(obj);
        }
    }

    clear() {
        this.available = [...this.available, ...this.active];
        this.active = [];
    }
}

export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = [];

        for (let i = 0; i < this.cols * this.rows; i++) {
            this.cells.push([]);
        }
    }

    clear() {
        for (let cell of this.cells) {
            cell.length = 0;
        }
    }

    getCellIndex(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return -1;
        }
        return row * this.cols + col;
    }

    insert(obj, x, y) {
        const index = this.getCellIndex(x, y);
        if (index !== -1) {
            this.cells[index].push(obj);
        }
    }

    query(x, y, radius) {
        const results = [];
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const index = row * this.cols + col;
                results.push(...this.cells[index]);
            }
        }

        return results;
    }
}

export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function waitForSeconds(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
