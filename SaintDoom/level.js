export class Level {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.floors = [];
        this.ceilings = [];
        this.lights = [];
    }
    
    createTestLevel() {
        // Create materials
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x666655,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 1,
            metalness: 0
        });
        
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.floors.push(floor);
        
        // Create ceiling
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
        this.ceilings.push(ceiling);
        
        // Create walls
        this.createWall(-10, 1.5, 0, 0.2, 3, 20, wallMaterial); // Left wall
        this.createWall(10, 1.5, 0, 0.2, 3, 20, wallMaterial);  // Right wall
        this.createWall(0, 1.5, -10, 20, 3, 0.2, wallMaterial); // Back wall
        this.createWall(0, 1.5, 10, 20, 3, 0.2, wallMaterial);  // Front wall
        
        // Add some interior walls for cover
        this.createWall(-3, 1.5, -3, 0.2, 3, 6, wallMaterial);  // Pillar 1
        this.createWall(3, 1.5, -3, 0.2, 3, 6, wallMaterial);   // Pillar 2
        this.createWall(0, 1.5, 3, 4, 3, 0.2, wallMaterial);    // Half wall
        
        // Add atmospheric lighting
        this.addLighting();
        
        // Add decorative elements
        this.addDecorations();
    }
    
    createWall(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        
        // Store wall bounds for collision detection
        this.walls.push({
            mesh: wall,
            min: new THREE.Vector3(
                x - width / 2,
                y - height / 2,
                z - depth / 2
            ),
            max: new THREE.Vector3(
                x + width / 2,
                y + height / 2,
                z + depth / 2
            )
        });
    }
    
    addLighting() {
        // Add torches/holy lights
        const torchPositions = [
            { x: -9, y: 2, z: -9 },
            { x: 9, y: 2, z: -9 },
            { x: -9, y: 2, z: 9 },
            { x: 9, y: 2, z: 9 }
        ];
        
        torchPositions.forEach(pos => {
            // Create torch light
            const light = new THREE.PointLight(0xffaa00, 1, 10);
            light.position.set(pos.x, pos.y, pos.z);
            light.castShadow = true;
            light.shadow.camera.near = 0.1;
            light.shadow.camera.far = 10;
            this.scene.add(light);
            this.lights.push(light);
            
            // Create torch mesh
            const torchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.5);
            const torchMaterial = new THREE.MeshStandardMaterial({
                color: 0x442211,
                roughness: 0.9
            });
            const torch = new THREE.Mesh(torchGeometry, torchMaterial);
            torch.position.set(pos.x, pos.y - 0.5, pos.z);
            this.scene.add(torch);
            
            // Create flame effect
            const flameGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
            const flameMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(pos.x, pos.y, pos.z);
            this.scene.add(flame);
            
            // Animate flame
            this.animateFlame(flame, light);
        });
    }
    
    animateFlame(flame, light) {
        const baseY = flame.position.y;
        const baseIntensity = light.intensity;
        
        const animate = () => {
            // Flicker effect
            flame.position.y = baseY + Math.random() * 0.05;
            flame.scale.y = 1 + Math.random() * 0.2;
            light.intensity = baseIntensity + Math.random() * 0.3;
            
            // Random color variation
            const r = 1;
            const g = 0.6 + Math.random() * 0.2;
            const b = 0;
            flame.material.color.setRGB(r, g, b);
            light.color.setRGB(r, g, b);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    addDecorations() {
        // Add blood stains on floor
        const bloodGeometry = new THREE.CircleGeometry(0.5 + Math.random() * 0.5, 8);
        const bloodMaterial = new THREE.MeshStandardMaterial({
            color: 0x440000,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 5; i++) {
            const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
            blood.rotation.x = -Math.PI / 2;
            blood.position.set(
                (Math.random() - 0.5) * 15,
                0.01,
                (Math.random() - 0.5) * 15
            );
            blood.scale.set(
                1 + Math.random() * 0.5,
                1 + Math.random() * 0.5,
                1
            );
            this.scene.add(blood);
        }
        
        // Add barrels
        const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x332211,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const barrelPositions = [
            { x: -7, z: -7 },
            { x: 7, z: -7 },
            { x: -5, z: 5 }
        ];
        
        barrelPositions.forEach(pos => {
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.position.set(pos.x, 0.4, pos.z);
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            this.scene.add(barrel);
        });
        
        // Add demonic symbols on walls
        const symbolGeometry = new THREE.PlaneGeometry(1, 1);
        const symbolMaterial = new THREE.MeshBasicMaterial({
            color: 0x880000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbol.position.set(0, 2, -9.9);
        this.scene.add(symbol);
    }
    
    loadLevel(levelData) {
        // Clear current level
        this.clearLevel();
        
        // Load level from JSON data
        // This would parse level data and create geometry
        // For now, just use the test level
        this.createTestLevel();
    }
    
    clearLevel() {
        // Remove all level geometry from scene
        this.walls.forEach(wall => {
            this.scene.remove(wall.mesh);
        });
        this.floors.forEach(floor => {
            this.scene.remove(floor);
        });
        this.ceilings.forEach(ceiling => {
            this.scene.remove(ceiling);
        });
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        
        this.walls = [];
        this.floors = [];
        this.ceilings = [];
        this.lights = [];
    }
}