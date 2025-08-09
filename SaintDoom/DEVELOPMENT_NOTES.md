# SaintDoom Development Notes - Implementation Strategy

## Critical Starting Points

### 1. Start with the Core Game Loop FIRST
Don't get distracted by fancy features. Build this exact sequence:
1. **Player movement** - WASD + mouse look (use Pointer Lock API)
2. **Basic melee combat** - Sword swing with hitbox in front of player
3. **One enemy type** - Just a possessed scientist that walks toward player and dies
4. **Health/damage system** - Player can die, enemy can die, melee heals on kill
5. **Level geometry** - Start with just boxes/walls, no textures needed yet
6. **Block/parry system** - Right click to block, timed blocks reflect projectiles

Once this loop is fun, THEN add complexity.

### 1.5 Doom-Style Movement Feel
The movement should feel fast and responsive like classic Doom:

```javascript
class PlayerController {
  constructor() {
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 10; // High base speed
    this.strafeMultiplier = 0.7071; // For diagonal movement (1/sqrt(2))
    this.friction = 0.9; // Slight slide for momentum
    this.bobAmount = 0;
    this.bobSpeed = 0.018;
  }
  
  updateMovement(input, deltaTime) {
    // Get input direction
    const moveVector = new THREE.Vector3();
    if (input.forward) moveVector.z -= 1;
    if (input.backward) moveVector.z += 1;
    if (input.left) moveVector.x -= 1;
    if (input.right) moveVector.x += 1;
    
    // Normalize diagonal movement (important for Doom feel!)
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.moveSpeed);
    }
    
    // Apply to velocity with momentum
    this.velocity.x = this.velocity.x * this.friction + moveVector.x * deltaTime;
    this.velocity.z = this.velocity.z * this.friction + moveVector.z * deltaTime;
    
    // Head bobbing
    if (moveVector.length() > 0) {
      this.bobAmount += this.bobSpeed;
      this.camera.position.y = 1.7 + Math.sin(this.bobAmount * Math.PI) * 0.05;
    }
  }
}
```

### 1.6 Melee Combat Implementation
First-person melee is tricky, here's what works:

```javascript
class MeleeCombat {
  constructor(player) {
    this.player = player;
    this.swordReach = 3; // Units in front of player
    this.swingArc = 90; // Degrees of swing arc
    this.swingTime = 0.3; // Seconds per swing
    this.comboDamage = [50, 75, 100]; // Escalating combo damage
    this.currentCombo = 0;
    this.lastSwingTime = 0;
  }
  
  performSwing() {
    const now = Date.now();
    
    // Reset combo if too much time passed
    if (now - this.lastSwingTime > 1000) {
      this.currentCombo = 0;
    }
    
    // Create hit detection cone in front of player
    const hitbox = this.createMeleeHitbox();
    const hits = this.checkEnemiesInHitbox(hitbox);
    
    hits.forEach(enemy => {
      const damage = this.comboDamage[this.currentCombo];
      enemy.takeDamage(damage);
      
      // Knockback based on combo
      const knockback = this.player.forward.multiplyScalar(this.currentCombo + 1);
      enemy.applyForce(knockback);
      
      // Heal on kill (Doom Eternal style)
      if (enemy.health <= 0) {
        this.player.heal(10);
        this.spawnHealthParticles();
      }
    });
    
    // Advance combo
    this.currentCombo = (this.currentCombo + 1) % 3;
    this.lastSwingTime = now;
    
    // Visual feedback
    this.playSwingAnimation();
    this.createSwordTrail();
  }
  
  createMeleeHitbox() {
    // Cone-shaped hitbox in front of player
    const forward = this.player.camera.getWorldDirection();
    const origin = this.player.position.clone();
    origin.y += 1; // Sword height
    
    return {
      origin: origin,
      direction: forward,
      range: this.swordReach,
      angle: this.swingArc * Math.PI / 180
    };
  }
  
  performParry() {
    this.parryWindow = 0.2; // 200ms perfect parry window
    this.isParrying = true;
    
    setTimeout(() => {
      this.isParrying = false;
    }, this.parryWindow * 1000);
  }
}
```

### 1.7 Collision Detection That Actually Works
Use simple AABB (Axis-Aligned Bounding Box) collision with wall sliding:

```javascript
class CollisionSystem {
  checkCollision(entity, walls) {
    const margin = 0.3; // Player radius
    const nextPos = entity.position.clone().add(entity.velocity);
    
    // Check X and Z axes separately for smooth wall sliding
    const canMoveX = !this.checkWallCollision(
      new THREE.Vector3(nextPos.x, entity.position.y, entity.position.z),
      walls, margin
    );
    
    const canMoveZ = !this.checkWallCollision(
      new THREE.Vector3(entity.position.x, entity.position.y, nextPos.z),
      walls, margin
    );
    
    // Apply movement based on collision
    if (canMoveX) entity.position.x = nextPos.x;
    if (canMoveZ) entity.position.z = nextPos.z;
    
    // This creates the "sliding along walls" effect
  }
  
  checkWallCollision(pos, walls, margin) {
    for (let wall of walls) {
      if (pos.x + margin > wall.min.x && pos.x - margin < wall.max.x &&
          pos.z + margin > wall.min.z && pos.z - margin < wall.max.z) {
        return true;
      }
    }
    return false;
  }
}
```

### 2. Use Three.js, But Keep It Simple
```javascript
// Start with this basic structure - it works and scales well
class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.clock = new THREE.Clock();
    this.entities = [];
  }
  
  update(deltaTime) {
    // Update all game entities
    this.entities.forEach(e => e.update(deltaTime));
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
```

### 3. Level Design Architecture That Actually Works
Instead of trying to build a complex level editor, use this approach:
- Define levels as JSON files with entity placements
- Use a simple grid system (each cell is 1x1 unit)
- Load textures from sprite sheets to reduce HTTP requests
- Here's the structure that works:

```javascript
const level = {
  geometry: [
    // Simple wall segments defined by start/end points
    {type: 'wall', x1: 0, z1: 0, x2: 10, z2: 0, texture: 'brick'},
  ],
  entities: [
    {type: 'zombie_scientist', x: 5, z: 5, rotation: 0},
    {type: 'health_pack', x: 3, z: 3}
  ],
  lighting: [
    {type: 'point', x: 5, y: 3, z: 5, color: 0xffff00, intensity: 1}
  ]
};
```

### 4. Enemy AI - Keep It Doom-Simple
Don't overcomplicate the AI. Original Doom's AI was basically:
1. Can I see the player? → Move toward player
2. Am I close enough? → Attack
3. Did I get hit? → Enter pain state briefly
4. Randomize slightly to avoid predictability

```javascript
class DemonAI {
  update(deltaTime) {
    if (this.canSeePlayer()) {
      this.moveTowardPlayer(deltaTime);
      if (this.inAttackRange()) {
        this.attack();
      }
    } else {
      this.patrol(deltaTime);
    }
  }
  
  // Raycasting for line-of-sight checks
  canSeePlayer() {
    const direction = new THREE.Vector3()
      .subVectors(this.player.position, this.position)
      .normalize();
    
    const raycaster = new THREE.Raycaster(
      this.position,
      direction,
      0.1,
      this.position.distanceTo(this.player.position)
    );
    
    // Check if any walls block the view
    const intersects = raycaster.intersectObjects(this.scene.walls);
    return intersects.length === 0;
  }
}
```

### 5. Weapon System Architecture
Use a weapon factory pattern - it's clean and extensible:

```javascript
class Weapon {
  constructor(config) {
    this.damage = config.damage;
    this.fireRate = config.fireRate;
    this.ammoType = config.ammoType;
    this.lastFired = 0;
  }
  
  canFire(currentTime) {
    return currentTime - this.lastFired > (1000 / this.fireRate);
  }
}

// Ammo management system
class AmmoManager {
  constructor() {
    this.ammo = {
      shells: 50,      // Shotgun
      bullets: 200,    // Minigun
      cells: 100,      // Plasma
      rockets: 10,     // Explosives
      holy: Infinity   // Holy water is unlimited
    };
    this.maxAmmo = {
      shells: 100,
      bullets: 400,
      cells: 300,
      rockets: 50
    };
  }
  
  canFire(ammoType) {
    return this.ammo[ammoType] > 0;
  }
  
  useAmmo(ammoType, amount = 1) {
    if (this.ammo[ammoType] !== Infinity) {
      this.ammo[ammoType] = Math.max(0, this.ammo[ammoType] - amount);
      return true;
    }
    return false;
  }
  
  addAmmo(ammoType, amount) {
    if (this.ammo[ammoType] !== Infinity) {
      this.ammo[ammoType] = Math.min(
        this.maxAmmo[ammoType],
        this.ammo[ammoType] + amount
      );
    }
  }
}

// Define all weapons in data, not code
const WEAPONS = {
  blessed_shotgun: {
    damage: 100,
    fireRate: 1.5,
    spread: 0.1,
    projectileCount: 8,
    range: 10
  }
};
```

### 6. Performance Tricks That Matter
- **Object Pooling is ESSENTIAL**: Reuse bullet/particle objects
- **Frustum Culling**: Three.js does this automatically, but help it by organizing your scene
- **LOD for enemies**: Use sprites for distant enemies, models for close ones
- **Batch sprite rendering**: Use THREE.InstancedMesh for multiple same-type enemies
- **Texture atlases**: One 2048x2048 texture is better than 50 small ones

### 7. The Audio System Nobody Tells You About
Web Audio API is powerful but tricky. Here's what works:

```javascript
class AudioManager {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.masterVolume = this.context.createGain();
    this.masterVolume.connect(this.context.destination);
  }
  
  // Preload all sounds to avoid delays
  async loadSound(name, url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.sounds[name] = await this.context.decodeAudioData(buffer);
  }
  
  playSound(name, volume = 1, loop = false) {
    const source = this.context.createBufferSource();
    source.buffer = this.sounds[name];
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterVolume);
    source.loop = loop;
    source.start();
    return source; // Return so we can stop it later
  }
  
  // 3D spatial audio for positioned sounds
  play3DSound(name, position, volume = 1) {
    const source = this.context.createBufferSource();
    source.buffer = this.sounds[name];
    
    // Create panner for 3D positioning
    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    
    // Set position
    panner.setPosition(position.x, position.y, position.z);
    
    // Connect nodes
    source.connect(panner);
    panner.connect(this.masterVolume);
    source.start();
    
    return source;
  }
  
  updateListenerPosition(camera) {
    // Update audio listener to match camera
    const pos = camera.position;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    
    this.listener.setPosition(pos.x, pos.y, pos.z);
    this.listener.setOrientation(
      forward.x, forward.y, forward.z,
      0, 1, 0 // Up vector
    );
  }
}
```

### 8. State Management Pattern
Use a simple state machine for game states:

```javascript
class GameStateManager {
  constructor() {
    this.states = {
      MENU: new MenuState(),
      PLAYING: new PlayingState(),
      PAUSED: new PausedState(),
      DEAD: new DeadState()
    };
    this.currentState = this.states.MENU;
  }
  
  changeState(newState) {
    this.currentState.exit();
    this.currentState = this.states[newState];
    this.currentState.enter();
  }
}
```

### 9. The Save System That Actually Works
Don't overthink it - use localStorage for settings, IndexedDB for saves:

```javascript
class SaveGame {
  save(slot) {
    const data = {
      level: this.currentLevel,
      health: this.player.health,
      weapons: this.player.weapons,
      timestamp: Date.now()
    };
    localStorage.setItem(`save_${slot}`, JSON.stringify(data));
  }
  
  load(slot) {
    const data = JSON.parse(localStorage.getItem(`save_${slot}`));
    // Restore game state from data
  }
}
```

### 10. Specific Implementation Warnings

#### DON'T:
- Try to implement multiplayer in v1 (it's a massive complexity spike)
- Use physics engine for basic collision (axis-aligned bounding boxes are enough)
- Generate levels procedurally at first (hand-craft them for better gameplay)
- Worry about mobile controls initially (get desktop working first)
- Over-engineer the entity component system (inheritance is fine for a game this size)

#### DO:
- Profile early and often (Chrome DevTools Performance tab)
- Test in multiple browsers (Safari is always weird with WebGL)
- Keep all game settings in one config object
- Use requestAnimationFrame properly (pass the timestamp!)
- Add debug rendering toggles from the start (hitboxes, AI states, etc.)

### 11. The Holy/Sci-Fi Weapon Swap Mechanic
Implement this as two separate weapon wheels:
```javascript
class WeaponManager {
  constructor() {
    this.holyWeapons = [];
    this.techWeapons = [];
    this.currentSet = 'holy'; // or 'tech'
    this.currentIndex = 0;
  }
  
  swapWeaponSet() {
    this.currentSet = this.currentSet === 'holy' ? 'tech' : 'holy';
    // Play swap animation/sound
  }
}
```

### 12. Visual Effects That Sell the Theme
- **Holy damage**: White/gold particle bursts + Latin text floating up
- **Demon deaths**: Dissolve shader with embers falling
- **Blessing mode**: Rim lighting shader on player weapon
- **Portal effects**: Simple UV distortion in shader, not complex geometry

### 13. Quick Win Features
These are easy to implement but add a lot:
- Screen shake on explosions (just offset camera briefly)
- Damage numbers floating up (2D text sprites)
- Auto-aim assist (slight magnetism toward enemies)
- Gore stays on ground (just don't delete blood decal sprites)
- Breakable decorations (barrels, crates - same as enemies with no AI)

### 14. File Structure That Scales
```
/src
  /core
    Game.js
    InputManager.js
    AudioManager.js
  /entities
    Player.js
    Enemy.js
    Weapon.js
  /levels
    Level.js
    LevelLoader.js
  /graphics
    Renderer.js
    ParticleSystem.js
  /data
    weapons.json
    enemies.json
    levels/
      level01.json
```

### 15. Sprite Animation System
For that retro feel with smooth animations:

```javascript
class SpriteAnimator {
  constructor(textures, fps = 10) {
    this.textures = textures; // Array of THREE.Texture
    this.fps = fps;
    this.currentFrame = 0;
    this.timer = 0;
    this.playing = true;
  }
  
  update(deltaTime, mesh) {
    if (!this.playing) return;
    
    this.timer += deltaTime;
    const frameDuration = 1 / this.fps;
    
    if (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.currentFrame = (this.currentFrame + 1) % this.textures.length;
      mesh.material.map = this.textures[this.currentFrame];
      mesh.material.needsUpdate = true;
    }
  }
  
  play(animationName) {
    // Switch to different animation set
    this.textures = this.animations[animationName];
    this.currentFrame = 0;
    this.timer = 0;
    this.playing = true;
  }
}

// Enemy sprite always faces player (billboarding)
class BillboardSprite {
  update(camera) {
    this.mesh.lookAt(camera.position);
    this.mesh.rotation.x = 0; // Keep upright
    this.mesh.rotation.z = 0;
  }
}
```

### 16. Damage Feedback System
Make hits feel impactful:

```javascript
class DamageEffects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.screenFlashTime = 0;
    this.cameraShake = 0;
    
    // Red overlay for damage
    this.damageOverlay = document.createElement('div');
    this.damageOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: red;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.1s;
    `;
    document.body.appendChild(this.damageOverlay);
  }
  
  takeDamage(amount) {
    // Screen flash
    this.damageOverlay.style.opacity = Math.min(0.5, amount / 50);
    setTimeout(() => {
      this.damageOverlay.style.opacity = 0;
    }, 100);
    
    // Camera shake
    this.cameraShake = amount / 10;
    
    // Play pain sound
    this.audioManager.playSound('pain', 0.8);
    
    // Blood particles
    this.spawnBloodParticles();
  }
  
  update(deltaTime) {
    // Apply camera shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.9; // Decay
    }
  }
}
```

### 17. Level Transition System
Smooth transitions between levels:

```javascript
class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevel = null;
    this.levelIndex = 0;
    this.levelList = [
      'level01.json',
      'level02.json',
      // etc
    ];
  }
  
  async loadLevel(levelName) {
    // Fade out
    await this.fadeOut();
    
    // Save current state
    this.savePlayerState();
    
    // Clear current level
    this.clearLevel();
    
    // Load new level data
    const levelData = await fetch(`/levels/${levelName}`);
    const level = await levelData.json();
    
    // Build level
    this.buildLevel(level);
    
    // Restore player state
    this.restorePlayerState();
    
    // Fade in
    await this.fadeIn();
  }
  
  nextLevel() {
    this.levelIndex++;
    if (this.levelIndex < this.levelList.length) {
      this.loadLevel(this.levelList[this.levelIndex]);
    } else {
      this.showVictoryScreen();
    }
  }
  
  savePlayerState() {
    this.playerState = {
      health: this.game.player.health,
      armor: this.game.player.armor,
      weapons: [...this.game.player.weapons],
      ammo: {...this.game.player.ammo}
    };
  }
}
```

### 18. Asset Loading Strategy
Preload everything with a loading screen:

```javascript
class AssetLoader {
  constructor() {
    this.assets = {};
    this.loadingProgress = 0;
  }
  
  async loadAllAssets() {
    const textureLoader = new THREE.TextureLoader();
    const audioLoader = new THREE.AudioLoader();
    
    // Define all assets to load
    const manifest = {
      textures: [
        { name: 'wall_brick', url: '/textures/brick.png' },
        { name: 'demon_idle', url: '/sprites/demon_idle.png' },
        // etc
      ],
      sounds: [
        { name: 'shotgun', url: '/sounds/shotgun.wav' },
        { name: 'pain', url: '/sounds/pain.wav' },
        // etc
      ],
      models: [
        { name: 'crucifix', url: '/models/crucifix.glb' },
        // etc
      ]
    };
    
    // Load everything in parallel
    const totalAssets = manifest.textures.length + 
                       manifest.sounds.length + 
                       manifest.models.length;
    let loaded = 0;
    
    const updateProgress = () => {
      loaded++;
      this.loadingProgress = loaded / totalAssets;
      this.updateLoadingScreen(this.loadingProgress);
    };
    
    // Load all asset types
    const promises = [];
    
    // Textures
    manifest.textures.forEach(item => {
      promises.push(
        textureLoader.loadAsync(item.url).then(texture => {
          texture.minFilter = THREE.NearestFilter; // Pixelated look
          texture.magFilter = THREE.NearestFilter;
          this.assets[item.name] = texture;
          updateProgress();
        })
      );
    });
    
    // Sounds
    manifest.sounds.forEach(item => {
      promises.push(
        fetch(item.url)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            this.assets[item.name] = buffer;
            updateProgress();
          })
      );
    });
    
    // Wait for everything
    await Promise.all(promises);
    
    // Hide loading screen
    this.hideLoadingScreen();
  }
  
  updateLoadingScreen(progress) {
    const percent = Math.floor(progress * 100);
    document.getElementById('loading-bar').style.width = `${percent}%`;
    document.getElementById('loading-text').textContent = `Loading... ${percent}%`;
  }
}
```

### 19. Input Buffering for Responsive Controls
Make weapon switching and actions feel snappy:

```javascript
class InputBuffer {
  constructor() {
    this.buffer = [];
    this.maxBufferSize = 3;
    this.bufferWindow = 100; // ms
  }
  
  addInput(action, timestamp) {
    this.buffer.push({ action, timestamp });
    
    // Keep buffer small
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
    
    // Remove old inputs
    const now = Date.now();
    this.buffer = this.buffer.filter(
      input => now - input.timestamp < this.bufferWindow
    );
  }
  
  getNextAction() {
    if (this.buffer.length > 0) {
      return this.buffer.shift().action;
    }
    return null;
  }
  
  // Use for weapon switching
  handleWeaponSwitch(keyCode) {
    const weaponSlot = keyCode - 48; // Convert '1' to 1, etc
    this.addInput({ type: 'weaponSwitch', slot: weaponSlot }, Date.now());
  }
}
```

### 20. Error Handling and Resilience
Don't let missing assets crash the game:

```javascript
class ErrorHandler {
  constructor() {
    this.fallbackAssets = {
      texture: this.createErrorTexture(),
      sound: this.createSilentSound(),
      model: this.createErrorCube()
    };
  }
  
  async loadAssetSafe(loader, url, type) {
    try {
      return await loader.loadAsync(url);
    } catch (error) {
      console.error(`Failed to load ${type}: ${url}`, error);
      
      // Return fallback asset
      return this.fallbackAssets[type];
    }
  }
  
  createErrorTexture() {
    // Create a magenta/black checkerboard
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 2 ? '#FF00FF' : '#000000';
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  wrapGameLoop(updateFn) {
    return (deltaTime) => {
      try {
        updateFn(deltaTime);
      } catch (error) {
        console.error('Game loop error:', error);
        // Optionally show error to player
        this.showErrorNotification('Something went wrong, but the game continues...');
      }
    };
  }
}
```

### 21. Performance Monitoring
Track FPS and performance metrics:

```javascript
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;
    this.frames = [];
    this.lastTime = performance.now();
    
    // Create FPS display
    this.display = document.createElement('div');
    this.display.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      color: lime;
      font-family: monospace;
      font-size: 14px;
      background: rgba(0,0,0,0.5);
      padding: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(this.display);
    
    // Performance budgets
    this.budgets = {
      frameTime: 16.67, // Target 60 FPS
      drawCalls: 100,
      triangles: 50000,
      memoryMB: 500
    };
  }
  
  update() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    // Track frame times
    this.frames.push(delta);
    if (this.frames.length > 60) {
      this.frames.shift();
    }
    
    // Calculate metrics
    this.frameTime = this.frames.reduce((a, b) => a + b) / this.frames.length;
    this.fps = 1000 / this.frameTime;
    
    // Update display
    this.updateDisplay();
    
    // Warn if performance is bad
    if (this.fps < 30) {
      this.handleLowPerformance();
    }
  }
  
  updateDisplay() {
    const info = this.renderer.info;
    const memory = info.memory;
    const render = info.render;
    
    this.display.innerHTML = `
      FPS: ${Math.round(this.fps)}<br>
      Frame: ${this.frameTime.toFixed(2)}ms<br>
      Draw Calls: ${render.calls}<br>
      Triangles: ${render.triangles}<br>
      Geometries: ${memory.geometries}<br>
      Textures: ${memory.textures}
    `;
    
    // Color code based on performance
    if (this.fps >= 55) {
      this.display.style.color = 'lime';
    } else if (this.fps >= 30) {
      this.display.style.color = 'yellow';
    } else {
      this.display.style.color = 'red';
    }
  }
  
  handleLowPerformance() {
    // Auto-adjust quality settings
    if (this.game.settings.autoQuality) {
      console.log('Performance low, reducing quality...');
      this.game.settings.shadows = false;
      this.game.settings.particleCount *= 0.5;
      this.game.settings.textureQuality = 'low';
    }
  }
}
```

## The First Week Milestone
By end of week 1, you should have:
1. Player walking around a box room
2. Can swing sword with visible arc/trail effect
3. One enemy that dies when hit with sword
4. Basic HUD showing health/stamina
5. Can die and restart
6. Basic block/parry mechanic working

If you have this, you have a game. Everything else is just content and polish.

## Remember
The original Doom was made in 13 months by 5 people. Your browser version doesn't need to match that scope. Focus on making 3 levels that are incredibly fun rather than 10 mediocre ones. The holy/MIB weapon duality and the saint protagonist are your unique hooks - lean into them hard with the presentation, but keep the underlying mechanics Doom-simple.

## Critical Success Factors

### What Makes SaintDoom Unique
1. **The Weary Veteran Angle** - Giovanni isn't a space marine discovering demons, he's tired of this shit. Use voice lines and mechanics to reinforce this.
2. **Melee/Ranged Hybrid Combat** - Unlike pure shooters, rewarding players for weapon switching between sword and guns
3. **Historical References** - Drop hints about past missions. Makes the world feel lived-in.
4. **The Holy Missile Launch** - This NEEDS to be an epic moment. Don't skip it for time.

### Common Pitfalls to Avoid
1. **Don't Make Melee Feel Weak** - If players avoid the sword, you've failed. It should feel POWERFUL.
2. **Don't Overexplain the Lore** - Players should discover Giovanni's past through gameplay, not cutscenes
3. **Avoid Feature Creep** - Every feature should reinforce "tired holy warrior fights demons again"
4. **Don't Make It Too Dark** - Yes it's Hell, but players need to see enemies. Use holy light liberally.

### Quick Implementation Order
1. **Week 1**: Core movement + sword combat
2. **Week 2**: 3 enemy types + basic AI
3. **Week 3**: First complete level with progression
4. **Week 4**: Ranged weapons + ammo system
5. **Week 5**: Boss fight + special abilities
6. **Week 6**: Polish, particles, sound
7. **Week 7**: Testing and balancing
8. **Week 8**: Second level + weapon variety

### The "Is It Fun?" Test
Every 2 days, ask yourself:
- Can I play for 5 minutes without getting bored?
- Does the sword feel satisfying?
- Do enemies provide interesting challenges?
- Would I play this over actual Doom?

If any answer is "no," stop adding features and fix what's broken.

### Audio Priority (Often Forgotten)
1. **Sword swoosh/impact** - This sells melee combat
2. **Enemy pain sounds** - Feedback for hits
3. **Gregorian chant ambient** - Sets the mood
4. **Footsteps** - Sells the weight
5. **Giovanni's grunts** - He's tired, not silent

### Final Advice
This game's personality is its biggest asset. Giovanni being a recurring Vatican asset who's done this before is GOLD. Every system should reinforce that he's skilled but exhausted, holy but pragmatic, medieval but adapted. 

When in doubt: "What would a tired, 800-year-old zombie saint do?"

The answer is usually: "Sigh, grab sword, get to work."