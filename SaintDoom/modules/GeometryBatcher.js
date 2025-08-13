import * as THREE from 'three';
// Note: BufferGeometryUtils would need to be imported via importmap or loaded separately
// For now, we'll implement our own geometry merging

/**
 * Geometry batching system to reduce draw calls
 * Merges static geometry and uses instancing for repeated objects
 */
export class GeometryBatcher {
    constructor(scene) {
        this.scene = scene;
        this.batchedMeshes = new Map();
        this.instancedMeshes = new Map();
        this.materialGroups = new Map();
    }
    
    /**
     * Simple geometry merging function
     * Merges multiple BufferGeometry objects into one
     */
    mergeBufferGeometries(geometries) {
        if (geometries.length === 0) return null;
        if (geometries.length === 1) return geometries[0];
        
        // Calculate total vertex count
        let totalVertices = 0;
        let totalIndices = 0;
        
        geometries.forEach(geometry => {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
                totalVertices += positionAttribute.count;
            }
            if (geometry.index) {
                totalIndices += geometry.index.count;
            }
        });
        
        // Create merged arrays
        const positions = new Float32Array(totalVertices * 3);
        const normals = new Float32Array(totalVertices * 3);
        const uvs = new Float32Array(totalVertices * 2);
        const indices = totalIndices > 0 ? new Uint32Array(totalIndices) : null;
        
        let vertexOffset = 0;
        let indexOffset = 0;
        let currentIndexStart = 0;
        
        // Merge geometries
        geometries.forEach(geometry => {
            const positionAttribute = geometry.getAttribute('position');
            const normalAttribute = geometry.getAttribute('normal');
            const uvAttribute = geometry.getAttribute('uv');
            
            if (positionAttribute) {
                positions.set(positionAttribute.array, vertexOffset * 3);
                
                if (normalAttribute) {
                    normals.set(normalAttribute.array, vertexOffset * 3);
                }
                
                if (uvAttribute) {
                    uvs.set(uvAttribute.array, vertexOffset * 2);
                }
                
                if (geometry.index && indices) {
                    const indexArray = geometry.index.array;
                    for (let i = 0; i < indexArray.length; i++) {
                        indices[indexOffset + i] = indexArray[i] + currentIndexStart;
                    }
                    indexOffset += indexArray.length;
                }
                
                currentIndexStart += positionAttribute.count;
                vertexOffset += positionAttribute.count;
            }
        });
        
        // Create merged geometry
        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        
        if (indices) {
            mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        }
        
        mergedGeometry.computeBoundingSphere();
        
        return mergedGeometry;
    }
    
    /**
     * Batch multiple static meshes with the same material
     * @param {Array} meshes - Array of THREE.Mesh objects to batch
     * @param {string} batchName - Name for this batch (for later reference)
     * @returns {THREE.Mesh} The batched mesh
     */
    batchStaticMeshes(meshes, batchName) {
        if (meshes.length === 0) return null;
        
        // Group meshes by material
        const materialGroups = new Map();
        
        meshes.forEach(mesh => {
            if (!mesh.geometry || !mesh.material) return;
            
            const materialKey = this.getMaterialKey(mesh.material);
            if (!materialGroups.has(materialKey)) {
                materialGroups.set(materialKey, {
                    material: mesh.material,
                    geometries: []
                });
            }
            
            // Clone geometry and apply mesh transformation
            const geometry = mesh.geometry.clone();
            geometry.applyMatrix4(mesh.matrixWorld);
            
            materialGroups.get(materialKey).geometries.push(geometry);
            
            // Remove original mesh from scene
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
        });
        
        // Create batched mesh for each material group
        const batchedMeshes = [];
        
        materialGroups.forEach((group, materialKey) => {
            if (group.geometries.length === 0) return;
            
            // Merge geometries using our custom function
            const mergedGeometry = this.mergeBufferGeometries(group.geometries);
            
            if (!mergedGeometry) return;
            
            // Create batched mesh
            const batchedMesh = new THREE.Mesh(mergedGeometry, group.material);
            batchedMesh.name = `${batchName}_${materialKey}`;
            batchedMesh.castShadow = false; // Static batched geometry usually doesn't need shadows
            batchedMesh.receiveShadow = true;
            
            // Add to scene
            this.scene.add(batchedMesh);
            batchedMeshes.push(batchedMesh);
            
            // Clean up individual geometries
            group.geometries.forEach(geo => geo.dispose());
        });
        
        // Store reference
        this.batchedMeshes.set(batchName, batchedMeshes);
        
        return batchedMeshes;
    }
    
    /**
     * Create instanced mesh for repeated objects
     * @param {THREE.BufferGeometry} geometry - The geometry to instance
     * @param {THREE.Material} material - The material to use
     * @param {Array} transforms - Array of {position, rotation, scale} objects
     * @param {string} instanceName - Name for this instance group
     * @returns {THREE.InstancedMesh} The instanced mesh
     */
    createInstancedMesh(geometry, material, transforms, instanceName) {
        const count = transforms.length;
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        instancedMesh.name = instanceName;
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        // Set transforms for each instance
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        transforms.forEach((transform, index) => {
            position.copy(transform.position || new THREE.Vector3());
            
            if (transform.rotation) {
                quaternion.setFromEuler(transform.rotation);
            } else {
                quaternion.identity();
            }
            
            scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
            
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(index, matrix);
        });
        
        // Update instance matrix
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Add to scene
        this.scene.add(instancedMesh);
        
        // Store reference
        this.instancedMeshes.set(instanceName, instancedMesh);
        
        return instancedMesh;
    }
    
    /**
     * Batch walls from a level
     * @param {Array} walls - Array of wall objects with mesh property
     * @returns {Array} Array of batched wall meshes
     */
    batchWalls(walls) {
        const wallMeshes = walls
            .filter(wall => wall && wall.mesh)
            .map(wall => wall.mesh);
        
        return this.batchStaticMeshes(wallMeshes, 'walls');
    }
    
    /**
     * Create instanced decorations (barrels, crates, etc.)
     * @param {string} type - Type of decoration ('barrel', 'crate', etc.)
     * @param {Array} positions - Array of position vectors
     * @returns {THREE.InstancedMesh} The instanced decoration mesh
     */
    createInstancedDecorations(type, positions) {
        let geometry, material;
        
        switch(type) {
            case 'barrel':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1);
                material = new THREE.MeshStandardMaterial({
                    color: 0x654321,
                    roughness: 0.9,
                    metalness: 0.1
                });
                break;
                
            case 'crate':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshStandardMaterial({
                    color: 0x8b4513,
                    roughness: 0.95,
                    metalness: 0.05
                });
                break;
                
            case 'pillar':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 6, 1);
                material = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.8,
                    metalness: 0.2
                });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        }
        
        const transforms = positions.map(pos => ({
            position: pos,
            rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
            scale: new THREE.Vector3(1, 1, 1)
        }));
        
        return this.createInstancedMesh(geometry, material, transforms, `decorations_${type}`);
    }
    
    /**
     * Optimize a level by batching appropriate geometry
     * @param {Object} level - Level object with walls, floors, etc.
     */
    optimizeLevel(level) {
        const stats = {
            originalDrawCalls: 0,
            optimizedDrawCalls: 0,
            meshesRemoved: 0
        };
        
        // Count original draw calls
        this.scene.traverse(child => {
            if (child.isMesh) stats.originalDrawCalls++;
        });
        
        // Batch walls if they exist
        if (level.walls && Array.isArray(level.walls)) {
            const wallMeshes = [];
            level.walls.forEach(wall => {
                if (wall.mesh && wall.mesh.userData.static !== false) {
                    wallMeshes.push(wall.mesh);
                    stats.meshesRemoved++;
                }
            });
            
            if (wallMeshes.length > 0) {
                this.batchStaticMeshes(wallMeshes, 'level_walls');
            }
        }
        
        // Batch floors
        const floors = [];
        this.scene.traverse(child => {
            if (child.isMesh && child.name && child.name.includes('floor')) {
                floors.push(child);
                stats.meshesRemoved++;
            }
        });
        
        if (floors.length > 0) {
            this.batchStaticMeshes(floors, 'level_floors');
        }
        
        // Count optimized draw calls
        this.scene.traverse(child => {
            if (child.isMesh) stats.optimizedDrawCalls++;
        });
        
        console.log(`Batching optimization: ${stats.originalDrawCalls} -> ${stats.optimizedDrawCalls} draw calls`);
        
        return stats;
    }
    
    /**
     * Get a unique key for a material (for grouping)
     */
    getMaterialKey(material) {
        // Create a key based on material properties
        return `${material.type}_${material.color?.getHexString() || '000000'}_${material.transparent || false}`;
    }
    
    /**
     * Update instanced mesh transforms
     * @param {string} instanceName - Name of the instance group
     * @param {number} index - Index of the instance to update
     * @param {Object} transform - New transform {position, rotation, scale}
     */
    updateInstance(instanceName, index, transform) {
        const instancedMesh = this.instancedMeshes.get(instanceName);
        if (!instancedMesh) return;
        
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        position.copy(transform.position || new THREE.Vector3());
        
        if (transform.rotation) {
            quaternion.setFromEuler(transform.rotation);
        } else {
            quaternion.identity();
        }
        
        scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
        
        matrix.compose(position, quaternion, scale);
        instancedMesh.setMatrixAt(index, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * Remove a batched mesh group
     */
    removeBatch(batchName) {
        const batches = this.batchedMeshes.get(batchName);
        if (batches) {
            batches.forEach(mesh => {
                if (mesh.parent) mesh.parent.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
            });
            this.batchedMeshes.delete(batchName);
        }
    }
    
    /**
     * Remove an instanced mesh group
     */
    removeInstances(instanceName) {
        const instancedMesh = this.instancedMeshes.get(instanceName);
        if (instancedMesh) {
            if (instancedMesh.parent) instancedMesh.parent.remove(instancedMesh);
            if (instancedMesh.geometry) instancedMesh.geometry.dispose();
            this.instancedMeshes.delete(instanceName);
        }
    }
    
    /**
     * Clear all batched geometry
     */
    clear() {
        // Clear batched meshes
        this.batchedMeshes.forEach((batches, name) => {
            this.removeBatch(name);
        });
        
        // Clear instanced meshes
        this.instancedMeshes.forEach((mesh, name) => {
            this.removeInstances(name);
        });
        
        this.batchedMeshes.clear();
        this.instancedMeshes.clear();
        this.materialGroups.clear();
    }
    
    /**
     * Get batching statistics
     */
    getStats() {
        let totalBatchedMeshes = 0;
        let totalInstances = 0;
        
        this.batchedMeshes.forEach(batches => {
            totalBatchedMeshes += batches.length;
        });
        
        this.instancedMeshes.forEach(mesh => {
            totalInstances += mesh.count;
        });
        
        return {
            batchGroups: this.batchedMeshes.size,
            totalBatchedMeshes: totalBatchedMeshes,
            instanceGroups: this.instancedMeshes.size,
            totalInstances: totalInstances
        };
    }
}