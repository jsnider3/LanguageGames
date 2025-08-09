import { Player } from './player.js';
import { InputManager } from './input.js';
import { Level } from './level.js';
import { Enemy } from './enemy.js';
import { CollisionSystem } from './collision.js';
import { MeleeCombat } from './combat.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.player = null;
        this.inputManager = null;
        this.level = null;
        this.enemies = [];
        this.collisionSystem = null;
        this.meleeCombat = null;
        this.isRunning = false;
        this.isPaused = false;
    }

    async init() {
        // Setup Three.js
        this.setupRenderer();
        this.setupScene();
        
        // Setup game systems
        this.clock = new THREE.Clock();
        this.inputManager = new InputManager();
        this.collisionSystem = new CollisionSystem();
        
        // Create player
        this.player = new Player(this.camera);
        this.meleeCombat = new MeleeCombat(this.player, this.scene);
        
        // Create level
        this.level = new Level(this.scene);
        this.level.createTestLevel();
        
        // Spawn test enemy
        this.spawnEnemy(5, 0, -5);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide start screen and start game
        document.getElementById('startScreen').style.display = 'none';
        this.isRunning = true;
        
        // Start game loop
        this.animate();
    }

    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 0.1, 50);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 0);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (simulating torch/holy light)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.init();
        });
        
        // Pause on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.isPaused = !this.isPaused;
            }
        });
    }

    spawnEnemy(x, y, z) {
        const enemy = new Enemy(this.scene, new THREE.Vector3(x, y, z));
        this.enemies.push(enemy);
    }

    update(deltaTime) {
        if (this.isPaused) return;
        
        // Update input
        const input = this.inputManager.getInput();
        
        // Update player
        this.player.update(deltaTime, input);
        
        // Handle melee combat
        if (input.attack) {
            const hits = this.meleeCombat.performSwing(this.enemies);
            
            // Remove dead enemies
            this.enemies = this.enemies.filter(enemy => {
                if (enemy.health <= 0) {
                    enemy.destroy();
                    return false;
                }
                return true;
            });
        }
        
        if (input.block) {
            this.meleeCombat.performBlock();
        }
        
        // Update combat system
        this.meleeCombat.update(deltaTime);
        
        // Apply mouse look to player
        this.player.applyMouseLook(input.mouseDeltaX, input.mouseDeltaY);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player);
        });
        
        // Check collisions
        this.collisionSystem.checkPlayerWallCollisions(this.player, this.level.walls);
        this.collisionSystem.checkEnemyPlayerCollisions(this.enemies, this.player);
        
        // Update HUD
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('healthValue').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('armorValue').textContent = Math.floor(this.player.armor);
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Initialize on start button click (handled in setupEventListeners)
    game.setupEventListeners();
});