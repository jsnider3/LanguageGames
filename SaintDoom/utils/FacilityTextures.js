import * as THREE from 'three';

// Small local textures add surface detail without adding geometry or lights.
export function createFacilityTexture(style) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = style === 'wall' ? '#b7c2c1' : '#8c9a9b';
    ctx.fillRect(0, 0, 256, 256);
    let seed = 41;
    for (let i = 0; i < 6500; i++) {
        seed = (seed * 16807) % 2147483647;
        const x = seed % 256;
        seed = (seed * 16807) % 2147483647;
        ctx.fillStyle = i % 2 ? '#ffffff09' : '#0000000b';
        ctx.fillRect(x, seed % 256, 2, 2);
    }
    if (style === 'wall') {
        // The lower service panel and turquoise stripe repeat along the corridor.
        ctx.fillStyle = '#475c61';
        ctx.fillRect(0, 156, 256, 100);
        ctx.fillStyle = '#549f9e';
        ctx.fillRect(0, 151, 256, 5);
        ctx.fillStyle = '#263d43';
        ctx.fillRect(0, 236, 256, 20);
        for (let x of [12, 244]) {
            for (let y of [12, 176, 224]) {
                ctx.fillStyle = '#526368';
                ctx.fillRect(x - 2, y - 2, 4, 4);
                ctx.fillStyle = '#d0dad7';
                ctx.fillRect(x - 1, y - 1, 2, 1);
            }
        }
    }
    ctx.strokeStyle = '#3f5156';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeStyle = '#d6dfd63b';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, 250, 250);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
}

// Use physical dimensions instead of stretching one panel across a long wall.
export function setWallPanelUVs(geometry) {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
        const horizontal = Math.abs(normals.getX(i)) > 0.5 ? positions.getZ(i) : positions.getX(i);
        uv.setXY(i, horizontal / 2 + 0.5, positions.getY(i) / 4 + 0.5);
    }
    uv.needsUpdate = true;
}

export function createFacilitySign(title, clearance, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#14262e';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 10, 128);
    ctx.fillStyle = '#e5ece5';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText(title.toUpperCase(), 28, 57, 460);
    ctx.fillStyle = color;
    ctx.font = '20px monospace';
    ctx.fillText(`${clearance.toUpperCase()} CLEARANCE`, 28, 96);
    return new THREE.CanvasTexture(canvas);
}
