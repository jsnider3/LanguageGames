// Resource Pool System
// Manages geometry and material instances to prevent memory leaks and improve performance

import * as THREE from 'three';

export class ResourcePool {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
        this.meshPool = new Map();
        this.stats = {
            geometryHits: 0,
            geometryMisses: 0,
            materialHits: 0,
            materialMisses: 0,
            meshesCreated: 0,
            meshesReused: 0
        };
    }

    /**
     * Get a geometry with caching
     * @param {string} type - Geometry type ('sphere', 'box', 'cylinder', etc.)
     * @param {Array} params - Parameters for geometry creation
     * @returns {THREE.Geometry} - Cached or new geometry
     */
    getGeometry(type, ...params) {
        const key = `${type}_${JSON.stringify(params)}`;
        
        if (this.geometries.has(key)) {
            this.stats.geometryHits++;
            return this.geometries.get(key);
        }

        let geometry;
        switch (type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(...params);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(...params);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(...params);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(...params);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(...params);
                break;
            case 'ring':
                geometry = new THREE.RingGeometry(...params);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(...params);
                break;
            default:
                console.warn(`[ResourcePool] Unknown geometry type: ${type}`);
                return null;
        }

        this.geometries.set(key, geometry);
        this.stats.geometryMisses++;
        return geometry;
    }

    /**
     * Get a material with caching
     * @param {string} type - Material type ('basic', 'standard', 'phong', etc.)
     * @param {Object} properties - Material properties
     * @returns {THREE.Material} - Cached or new material
     */
    getMaterial(type, properties = {}) {
        const key = `${type}_${JSON.stringify(properties)}`;
        
        if (this.materials.has(key)) {
            this.stats.materialHits++;
            return this.materials.get(key);
        }

        let material;
        switch (type) {
            case 'basic':
                material = new THREE.MeshBasicMaterial(properties);
                break;
            case 'standard':
                material = new THREE.MeshStandardMaterial(properties);
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial(properties);
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial(properties);
                break;
            case 'points':
                material = new THREE.PointsMaterial(properties);
                break;
            case 'line':
                material = new THREE.LineBasicMaterial(properties);
                break;
            default:
                console.warn(`[ResourcePool] Unknown material type: ${type}`);
                return null;
        }

        this.materials.set(key, material);
        this.stats.materialMisses++;
        return material;
    }

    /**
     * Create a mesh using pooled geometry and materials
     * @param {string} geometryType - Geometry type
     * @param {Array} geometryParams - Geometry parameters
     * @param {string} materialType - Material type
     * @param {Object} materialProperties - Material properties
     * @returns {THREE.Mesh} - New mesh with pooled resources
     */
    createMesh(geometryType, geometryParams, materialType, materialProperties = {}) {
        const geometry = this.getGeometry(geometryType, ...geometryParams);
        const material = this.getMaterial(materialType, materialProperties);
        
        if (!geometry || !material) {
            return null;
        }

        const mesh = new THREE.Mesh(geometry, material);
        this.stats.meshesCreated++;
        return mesh;
    }

    /**
     * Get a pooled mesh for temporary effects (particles, etc.)
     * @param {string} poolKey - Pool identifier
     * @param {Function} createFn - Function to create new mesh if pool empty
     * @returns {THREE.Mesh} - Pooled or new mesh
     */
    getPooledMesh(poolKey, createFn) {
        if (!this.meshPool.has(poolKey)) {
            this.meshPool.set(poolKey, []);
        }

        const pool = this.meshPool.get(poolKey);
        
        if (pool.length > 0) {
            this.stats.meshesReused++;
            return pool.pop();
        }

        this.stats.meshesCreated++;
        return createFn();
    }

    /**
     * Return a mesh to the pool for reuse
     * @param {string} poolKey - Pool identifier
     * @param {THREE.Mesh} mesh - Mesh to return
     */
    returnMesh(poolKey, mesh) {
        if (!mesh) return;

        // Reset mesh properties
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.visible = true;

        if (mesh.material && mesh.material.opacity !== undefined) {
            mesh.material.opacity = 1;
        }

        if (!this.meshPool.has(poolKey)) {
            this.meshPool.set(poolKey, []);
        }

        const pool = this.meshPool.get(poolKey);
        
        // Limit pool size to prevent unlimited growth
        if (pool.length < 50) {
            pool.push(mesh);
        }
    }

    /**
     * Pre-populate common geometries
     */
    preloadCommonGeometries() {
        // Common particle geometries
        this.getGeometry('sphere', 0.05, 4, 4);
        this.getGeometry('sphere', 0.1, 8, 6);
        this.getGeometry('sphere', 0.2, 8, 6);
        this.getGeometry('sphere', 0.3, 16, 16);
        
        // Common effect geometries  
        this.getGeometry('box', 0.1, 0.1, 0.1);
        this.getGeometry('box', 0.2, 0.2, 0.2);
        this.getGeometry('plane', 0.2, 0.2);
        this.getGeometry('ring', 0.5, 1, 16);
        
        console.log('[ResourcePool] Preloaded common geometries');
    }

    /**
     * Pre-populate common materials
     */
    preloadCommonMaterials() {
        // Blood particle materials
        this.getMaterial('basic', { color: 0x880000, transparent: true, opacity: 1 });
        this.getMaterial('basic', { color: 0x660000, transparent: true, opacity: 0.7 });
        
        // Holy effect materials
        this.getMaterial('basic', { color: 0xffffff, transparent: true, opacity: 0.8 });
        this.getMaterial('basic', { color: 0xffff00, transparent: true, opacity: 1 });
        
        // Common enemy materials
        this.getMaterial('phong', { color: 0x666666 });
        this.getMaterial('standard', { color: 0x220000, roughness: 0.9 });
        
        console.log('[ResourcePool] Preloaded common materials');
    }

    /**
     * Clean up unused resources
     */
    cleanup() {
        // Dispose of all geometries
        for (const geometry of this.geometries.values()) {
            geometry.dispose();
        }
        this.geometries.clear();

        // Dispose of all materials
        for (const material of this.materials.values()) {
            material.dispose();
        }
        this.materials.clear();

        // Clear mesh pools
        this.meshPool.clear();

        console.log('[ResourcePool] Cleaned up all resources');
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const hitRate = this.stats.geometryHits + this.stats.materialHits;
        const missRate = this.stats.geometryMisses + this.stats.materialMisses;
        const totalRequests = hitRate + missRate;
        
        return {
            ...this.stats,
            totalGeometries: this.geometries.size,
            totalMaterials: this.materials.size,
            totalPooledMeshes: Array.from(this.meshPool.values()).reduce((sum, pool) => sum + pool.length, 0),
            cacheHitRate: totalRequests > 0 ? (hitRate / totalRequests * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Log performance statistics
     */
    logStats() {
        const stats = this.getStats();
        console.log(`[ResourcePool] Performance Stats:
        - Geometries cached: ${stats.totalGeometries}
        - Materials cached: ${stats.totalMaterials}
        - Meshes in pools: ${stats.totalPooledMeshes}
        - Cache hit rate: ${stats.cacheHitRate}
        - Meshes created: ${stats.meshesCreated}
        - Meshes reused: ${stats.meshesReused}`);
    }
}

// Global resource pool instance
export const resourcePool = new ResourcePool();

// Initialize common resources
resourcePool.preloadCommonGeometries();
resourcePool.preloadCommonMaterials();

// Convenience functions
export const getPooledGeometry = (type, ...params) => resourcePool.getGeometry(type, ...params);
export const getPooledMaterial = (type, properties) => resourcePool.getMaterial(type, properties);
export const createPooledMesh = (geometryType, geometryParams, materialType, materialProperties) => 
    resourcePool.createMesh(geometryType, geometryParams, materialType, materialProperties);