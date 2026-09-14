import * as THREE from 'three';

// A self-lit marker keeps pickups visible without changing the scene's light
// count on collection (which would recompile every lit material's shaders).
// Each pickup owns this mesh's geometry and material.
export function createPickupGlow(color, radius = 0.45) {
    const glow = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.85, radius, 24),
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.25;
    return glow;
}
