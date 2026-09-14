import * as THREE from 'three';

// Four draws per shelf, independent of book count. Books remain decorative;
// collectible and floating tomes are separate meshes in the level.
export function createArchiveShelf(height, width) {
    const group = new THREE.Group();
    const box = new THREE.BoxGeometry(1, 1, 1);
    const wood = new THREE.MeshPhongMaterial({ color: 0x493021 });
    const backing = new THREE.Mesh(box, wood);
    backing.scale.set(width + 0.2, height + 0.15, 0.18);
    backing.position.set(0, height / 2, -0.12);
    group.add(backing);

    const rows = Math.floor(height);
    const columns = Math.floor(width * 3);
    const count = rows * columns;
    const books = new THREE.InstancedMesh(box, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 8 }), count);
    const bands = new THREE.InstancedMesh(box, new THREE.MeshPhongMaterial({ color: 0xb99b62, shininess: 24 }), count * 2);
    const frame = new THREE.InstancedMesh(box, wood, rows + 3);
    books.name = 'archive-books';
    bands.name = 'archive-book-gilding';
    frame.name = 'archive-shelf-frame';
    // Three r128 does not compute bounds for instance transforms. These small
    // shelf batches must not disappear when only the top of a shelf is in view.
    for (const mesh of [books, bands, frame]) mesh.frustumCulled = false;
    const transform = new THREE.Object3D();
    const set = (mesh, index, x, y, z, sx, sy, sz) => {
        transform.position.set(x, y, z);
        transform.scale.set(sx, sy, sz);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
    };
    const colors = [0x663d37, 0x354b42, 0x3e475c, 0x806c43, 0x5a4053, 0x665343];
    const color = new THREE.Color();
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const index = row * columns + column;
            const bookHeight = 0.62 + Math.random() * 0.23;
            const bookWidth = (width / columns) * (0.68 + Math.random() * 0.22);
            const x = -width / 2 + (column + 0.5) * width / columns;
            const y = row + 0.1 + bookHeight / 2;
            const z = Math.random() < 0.1 ? 0.34 : 0.22;
            set(books, index, x, y, z, bookWidth, bookHeight, 0.4);
            books.setColorAt(index, color.setHex(colors[Math.floor(Math.random() * colors.length)]));
            for (let band = 0; band < 2; band++) {
                set(bands, index * 2 + band, x, y + (band ? 1 : -1) * bookHeight * 0.32,
                    z + 0.205, bookWidth * 0.82, 0.025, 0.015);
            }
        }
    }
    for (let row = 0; row <= rows; row++) {
        set(frame, row, 0, row + 0.04, 0.2, width + 0.2, 0.08, 0.65);
    }
    for (let side = 0; side < 2; side++) {
        set(frame, rows + 1 + side, (side ? 1 : -1) * (width / 2 + 0.06), height / 2,
            0.2, 0.12, height + 0.15, 0.65);
    }
    for (const mesh of [books, bands, frame]) {
        mesh.instanceMatrix.needsUpdate = true;
        group.add(mesh);
    }
    return group;
}
