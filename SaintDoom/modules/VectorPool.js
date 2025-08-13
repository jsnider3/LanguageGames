import * as THREE from 'three';

// Vector Pool System
// Reduces garbage collection by reusing vector objects

class VectorPool {
    constructor(initialSize = 50) {
        this.vectors = [];
        this.quaternions = [];
        this.eulers = [];
        this.matrices = [];
        
        this.vectorIndex = 0;
        this.quaternionIndex = 0;
        this.eulerIndex = 0;
        this.matrixIndex = 0;
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.vectors.push(new THREE.Vector3());
            this.quaternions.push(new THREE.Quaternion());
            this.eulers.push(new THREE.Euler());
            this.matrices.push(new THREE.Matrix4());
        }
        
        // Track usage for debugging
        this.maxVectorUsage = 0;
        this.maxQuaternionUsage = 0;
        this.maxEulerUsage = 0;
        this.maxMatrixUsage = 0;
    }
    
    // Get a temporary vector
    getVector(x = 0, y = 0, z = 0) {
        if (this.vectorIndex >= this.vectors.length) {
            this.vectors.push(new THREE.Vector3());
        }
        
        const vector = this.vectors[this.vectorIndex++];
        vector.set(x, y, z);
        
        this.maxVectorUsage = Math.max(this.maxVectorUsage, this.vectorIndex);
        return vector;
    }
    
    // Get a temporary quaternion
    getQuaternion(x = 0, y = 0, z = 0, w = 1) {
        if (this.quaternionIndex >= this.quaternions.length) {
            this.quaternions.push(new THREE.Quaternion());
        }
        
        const quaternion = this.quaternions[this.quaternionIndex++];
        quaternion.set(x, y, z, w);
        
        this.maxQuaternionUsage = Math.max(this.maxQuaternionUsage, this.quaternionIndex);
        return quaternion;
    }
    
    // Get a temporary euler
    getEuler(x = 0, y = 0, z = 0, order = 'XYZ') {
        if (this.eulerIndex >= this.eulers.length) {
            this.eulers.push(new THREE.Euler());
        }
        
        const euler = this.eulers[this.eulerIndex++];
        euler.set(x, y, z, order);
        
        this.maxEulerUsage = Math.max(this.maxEulerUsage, this.eulerIndex);
        return euler;
    }
    
    // Get a temporary matrix
    getMatrix() {
        if (this.matrixIndex >= this.matrices.length) {
            this.matrices.push(new THREE.Matrix4());
        }
        
        const matrix = this.matrices[this.matrixIndex++];
        matrix.identity();
        
        this.maxMatrixUsage = Math.max(this.maxMatrixUsage, this.matrixIndex);
        return matrix;
    }
    
    // Reset all pools for next frame
    reset() {
        this.vectorIndex = 0;
        this.quaternionIndex = 0;
        this.eulerIndex = 0;
        this.matrixIndex = 0;
    }
    
    // Get usage statistics
    getStats() {
        return {
            vectors: {
                poolSize: this.vectors.length,
                maxUsage: this.maxVectorUsage,
                currentUsage: this.vectorIndex
            },
            quaternions: {
                poolSize: this.quaternions.length,
                maxUsage: this.maxQuaternionUsage,
                currentUsage: this.quaternionIndex
            },
            eulers: {
                poolSize: this.eulers.length,
                maxUsage: this.maxEulerUsage,
                currentUsage: this.eulerIndex
            },
            matrices: {
                poolSize: this.matrices.length,
                maxUsage: this.maxMatrixUsage,
                currentUsage: this.matrixIndex
            }
        };
    }
}

// Create singleton instance
const vectorPool = new VectorPool();

// Export pool and convenience functions
export default vectorPool;

// Convenience functions for common vector operations
export const VectorMath = {
    // Distance between two positions without creating new vectors
    distance(posA, posB) {
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    // Distance squared (faster, no sqrt)
    distanceSq(posA, posB) {
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        return dx * dx + dy * dy + dz * dz;
    },
    
    // 2D distance (ignoring Y)
    distance2D(posA, posB) {
        const dx = posA.x - posB.x;
        const dz = posA.z - posB.z;
        return Math.sqrt(dx * dx + dz * dz);
    },
    
    // Check if distance is within range (faster than calculating actual distance)
    isWithinDistance(posA, posB, maxDistance) {
        const distSq = this.distanceSq(posA, posB);
        return distSq <= maxDistance * maxDistance;
    },
    
    // Direction from A to B (normalized), using pooled vector
    direction(from, to, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        result.set(
            to.x - from.x,
            to.y - from.y,
            to.z - from.z
        );
        
        const length = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z);
        if (length > 0) {
            result.x /= length;
            result.y /= length;
            result.z /= length;
        }
        
        return result;
    },
    
    // Direction 2D (XZ plane only)
    direction2D(from, to, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        
        if (length > 0) {
            result.set(dx / length, 0, dz / length);
        } else {
            result.set(0, 0, 0);
        }
        
        return result;
    },
    
    // Lerp between two vectors without allocation
    lerp(from, to, alpha, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        result.set(
            from.x + (to.x - from.x) * alpha,
            from.y + (to.y - from.y) * alpha,
            from.z + (to.z - from.z) * alpha
        );
        
        return result;
    },
    
    // Add scaled vector (useful for velocity)
    addScaled(base, direction, scale, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        result.set(
            base.x + direction.x * scale,
            base.y + direction.y * scale,
            base.z + direction.z * scale
        );
        
        return result;
    },
    
    // Clamp vector magnitude
    clampMagnitude(vector, maxLength) {
        const lengthSq = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
        if (lengthSq > maxLength * maxLength) {
            const scale = maxLength / Math.sqrt(lengthSq);
            vector.x *= scale;
            vector.y *= scale;
            vector.z *= scale;
        }
    },
    
    // Angle between two 2D directions (in radians)
    angle2D(dirA, dirB) {
        return Math.atan2(dirB.z, dirB.x) - Math.atan2(dirA.z, dirA.x);
    },
    
    // Rotate vector around Y axis
    rotateY(vector, angle, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        result.set(
            vector.x * cos - vector.z * sin,
            vector.y,
            vector.x * sin + vector.z * cos
        );
        
        return result;
    },
    
    // Project vector onto plane (remove Y component for ground movement)
    projectToGround(vector, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        result.set(vector.x, 0, vector.z);
        return result;
    },
    
    // Random point in circle (for spawn positions, etc)
    randomInCircle(center, radius, result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        
        result.set(
            center.x + Math.cos(angle) * r,
            center.y,
            center.z + Math.sin(angle) * r
        );
        
        return result;
    },
    
    // Random direction (normalized)
    randomDirection(result = null) {
        if (!result) {
            result = vectorPool.getVector();
        }
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        result.set(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        );
        
        return result;
    },
    
    // Check if point is in front of position given a forward direction
    isInFront(point, position, forward) {
        const dx = point.x - position.x;
        const dz = point.z - position.z;
        const dot = dx * forward.x + dz * forward.z;
        return dot > 0;
    }
};

// Math utilities that don't need vectors
export const MathUtils = {
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Linear interpolation
    lerp(from, to, alpha) {
        return from + (to - from) * alpha;
    },
    
    // Smooth step (ease in/out)
    smoothStep(value, min, max) {
        if (value <= min) return 0;
        if (value >= max) return 1;
        const x = (value - min) / (max - min);
        return x * x * (3 - 2 * x);
    },
    
    // Map value from one range to another
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    },
    
    // Wrap angle to -PI to PI
    wrapAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    },
    
    // Degrees to radians
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    // Radians to degrees
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Random float between min and max
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Check if value is approximately equal (for floating point comparison)
    approximately(a, b, epsilon = 0.001) {
        return Math.abs(a - b) < epsilon;
    },
    
    // Exponential decay
    decay(value, decay, deltaTime) {
        return value * Math.pow(decay, deltaTime);
    },
    
    // Spring physics
    spring(current, target, velocity, stiffness, damping, deltaTime) {
        const displacement = target - current;
        const springForce = displacement * stiffness;
        const dampingForce = -velocity * damping;
        const acceleration = springForce + dampingForce;
        
        velocity += acceleration * deltaTime;
        current += velocity * deltaTime;
        
        return { value: current, velocity };
    }
};