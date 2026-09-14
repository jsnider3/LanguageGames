import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { installRaids } from "./raid-controller.js";
import { BunkerGame, readBunkerCheckpoint } from "./bunker-game.js";
import { BunkerWorld } from "./bunker-world.js";
import { BunkerSimulation } from "./bunker-simulation.js";
import { Simulation } from "./simulation.js";
import {
  TOWERS,
  WEAPONS,
  PADS,
  BOUNDS,
  WAVES,
  CORE,
  ROUTES,
  routePosition,
  towerStats,
} from "./data.js";
import { World } from "./world.js";
import {
  makeTower,
  makeEnemy,
  makeWeapon,
  disposeModel,
  materials,
} from "./models.js";
import { Effects } from "./effects.js";
import { Soundscape } from "./audio.js";
import { UI } from "./ui.js";
import "./style.css";
import "./military.css";

const SAVE_KEY = "last-light.checkpoint.v1",
  SETTINGS_KEY = "last-light.settings.v1";
const clamp = THREE.MathUtils.clamp;
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

class Game {
  constructor() {
    this.canvas = document.querySelector("#world");
    this.settings = {
      quality: "high",
      sensitivity: 1,
      volume: 0.4,
      music: true,
      shake: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      difficulty: "normal",
    };
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (stored)
        for (const key of Object.keys(this.settings))
          if (typeof stored[key] === typeof this.settings[key])
            this.settings[key] = stored[key];
    } catch {
      /* Storage may be unavailable; play remains possible. */
    }
    if (!["high", "medium", "low"].includes(this.settings.quality))
      this.settings.quality = "high";
    if (!["normal", "relaxed", "veteran"].includes(this.settings.difficulty))
      this.settings.difficulty = "normal";
    this.settings.sensitivity = clamp(this.settings.sensitivity, 0.3, 2.5);
    this.settings.volume = clamp(this.settings.volume, 0, 1);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.world = new World(this.renderer);
    this.scene = this.world.scene;
    this.camera = new THREE.PerspectiveCamera(
      44,
      innerWidth / innerHeight,
      0.08,
      1500,
    );
    this.camera.position.set(77, 53, 70);
    this.camera.lookAt(8, 1, 0);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight),
      0.23,
      0.5,
      1.15,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.effects = new Effects(this.scene);
    this.audio = new Soundscape();
    this.audio.setVolume(this.settings.volume);
    this.audio.music = this.settings.music;
    this.operation = "defense";
    this.allyModels = new Map();
    this.sim = new Simulation();
    this.started = false;
    this.paused = false;
    this.mode = "command";
    this.selectedType = "sentry";
    this.selectedPad = null;
    this.hoverPad = null;
    this.nearPad = null;
    this.keys = new Set();
    this.mouse = new THREE.Vector2();
    this.mouseScreen = { x: 0, y: 0 };
    this.firing = false;
    this.aiming = false;
    this.aimBlend = 0;
    this.dragging = false;
    this.yaw = Math.PI / 2;
    this.pitch = 0;
    this.verticalVelocity = 0;
    this.jumpHeight = 0;
    this.bob = 0;
    this.orbit = { yaw: 0.48, elevation: 0.86, distance: 104, x: -3, z: 0 };
    this.transition = 0;
    this.shake = 0;
    this.time = 0;
    this.uiTimer = 0;
    this.fireTimer = 0;
    this.reloadTimer = 0;
    this.grenadeCooldown = 0;
    this.recoil = 0;
    this.ammo = { rifle: 32, shotgun: 8 };
    this.weaponType = "rifle";
    this.grenades = [];
    this.towerModels = new Map();
    this.enemyModels = new Map();
    this.projectileModels = new Map();
    this.ghost = null;
    this.ghostType = null;
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(v3(0, 1, 0), 0);
    this.groundPoint = v3();
    this.targetCamera = new THREE.PerspectiveCamera();
    this.targetPos = v3();
    this.temp = v3();
    this.cameraDirection = v3();
    this.weaponScene = new THREE.Scene();
    this.weaponCamera = new THREE.PerspectiveCamera(
      58,
      innerWidth / innerHeight,
      0.01,
      10,
    );
    this.weaponScene.environment =
      this.scene.environment.texture || this.scene.environment;
    this.weaponScene.environmentIntensity = 0.45;
    this.weaponScene.add(new THREE.HemisphereLight(0xe3ecd6, 0x344039, 1.8));
    const gunLight = new THREE.DirectionalLight(0xffd3a2, 2);
    gunLight.position.set(-2, 4, 1);
    this.weaponScene.add(gunLight);
    this.weaponModels = {
      rifle: makeWeapon("rifle"),
      shotgun: makeWeapon("shotgun"),
    };
    for (const weapon of Object.values(this.weaponModels))
      this.weaponScene.add(weapon);
    this.ui = new UI(this);
    this.bindInput();
    this.applyQuality();
    this.resize();
    this.makePreview();
    this.ui.showMenu();
    this.lastFrame = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
    setTimeout(
      () => document.querySelector("#loading").classList.add("loaded"),
      250,
    );
    // A narrow read-only inspection API is useful for browser diagnostics.
    window.lastLight = { getState: () => this.inspect() };
    // Mutation hooks are available only in Vite development mode, never in production builds.
    if (import.meta.env.DEV && new URLSearchParams(location.search).has("test"))
      window.__lastLightTest = this;
  }
  makePreview() {
    this.bunkerPreview = new BunkerWorld(this.world.environment.texture);
    this.bunkerPreview.ceiling.visible = false;
    this.bunkerPreviewSim = new BunkerSimulation();
    this.bunkerPreviewSim.turrets.forEach(t => t.level = 1);
    this.bunkerPreviewSim.barriers[0].open = true;
    this.bunkerPreviewCamera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, .1, 150);
    this.bunkerPreviewCamera.position.set(27, 39, 38);
    this.bunkerPreviewCamera.lookAt(-7, 0, 0);
    this.bunkerPreview.update(this.bunkerPreviewSim, 1, this.bunkerPreviewCamera);
    this.sim.credits = 2000;
    for (const [pad, type] of [
      [7, "sentry"],
      [9, "frost"],
      [11, "rail"],
      [16, "mortar"],
      [4, "sentry"],
    ])
      this.sim.build(pad, type);
    this.sim.drainEvents();
    this.syncModels();
  }
  inspect() {
    if (this.bunker) return this.bunker.inspect();
    return {
      started: this.started,
      operation: this.operation,
      squad:
        this.sim.allies?.map((u) => ({
          id: u.id,
          type: u.type,
          hp: u.hp,
          x: u.x,
          z: u.z,
        })) || [],
      order: this.sim.order,
      relays: this.sim.relays?.length,
      tickets: this.sim.tickets,
      raidTargets: this.sim.isRaid
        ? this.sim.enemies.map((e) => ({
            id: e.id,
            kind: e.kind,
            type: e.type,
            x: e.x,
            z: e.z,
            hp: e.hp,
            maxHp: e.maxHp,
          }))
        : [],
      mode: this.mode,
      paused: this.paused,
      phase: this.sim.phase,
      wave: this.sim.wave,
      breaches: this.world.gates.map(({ status, active }) => ({
        status,
        active,
      })),
      credits: this.sim.credits,
      coreHp: this.sim.coreHp,
      enemies: this.sim.enemies.length,
      remaining: this.sim.queue.length,
      towers: this.sim.towers.map((t) => ({
        padId: t.padId,
        type: t.type,
        level: t.level,
      })),
      player: { ...this.sim.player },
      weapon: this.weaponType,
      ammo: { ...this.ammo },
      kills: this.sim.kills,
      playerKills: this.sim.playerKills,
      saved: !!this.readCheckpoint(),
      render: {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      },
    };
  }
  resetVisuals() {
    for (const model of this.allyModels.values()) disposeModel(model);
    this.allyModels.clear();
    for (const model of [
      ...this.towerModels.values(),
      ...this.enemyModels.values(),
    ])
      disposeModel(model);
    for (const model of this.projectileModels.values())
      model.removeFromParent();
    this.towerModels.clear();
    this.enemyModels.clear();
    this.projectileModels.clear();
    for (const g of this.grenades) g.model.removeFromParent();
    this.grenades = [];
    this.effects.clear();
    this.selectedPad = null;
    this.hoverPad = null;
    this.nearPad = null;
    this.ammo = { rifle: 32, shotgun: 8 };
    this.weaponType = "rifle";
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.grenadeCooldown = 0;
    this.shake = 0;
    this.jumpHeight = 0;
    this.verticalVelocity = 0;
    this.keys.clear();
    this.ui.elements["wave-banner"].classList.remove("visible");
    this.ui.elements.notice.classList.remove("visible");
  }
  startNew() {
    this.bunker = new BunkerGame(this);
  }
  startLegacyDefense() {
    this.resetVisuals();
    this.operation = "defense";
    this.sim = new Simulation(this.settings.difficulty);
    this.begin();
    this.saveCheckpoint();
    this.ui.banner(
      "WELCOME TO KEPLER-09",
      "Hold the frontier.",
      "Place your first towers. Press Tab to enter the battlefield.",
    );
  }
  continueGame() {
    this.bunker = new BunkerGame(this, readBunkerCheckpoint());
  }
  retry() {
    if (this.sim.isRaid) {
      this.startRaid(this.raidBase);
      return;
    }
    const sim = Simulation.restore(this.readCheckpoint());
    if (sim) { this.resetVisuals(); this.sim = sim; this.operation = "defense"; this.begin(); }
    else this.startLegacyDefense();
  }
  begin() {
    this.world.setOperation(this.operation === "raid");
    this.world.updateGates(this.time, this.sim, true);
    document.body.classList.toggle("raid-mode", this.operation === "raid");
    document.body.classList.toggle(
      "workshop-mode",
      this.operation === "workshop",
    );
    this.started = true;
    this.paused = false;
    this.mode = "command";
    this.sim.player.active = false;
    this.orbit = { yaw: 0.48, elevation: 0.86, distance: 104, x: -3, z: 0 };
    this.yaw = Math.PI / 2;
    this.pitch = 0;
    this.firing = false;
    this.aiming = false;
    document.body.classList.remove("aiming");
    if (document.pointerLockElement) document.exitPointerLock();
    this.ui.showGame();
    this.ui.setMode("command");
    this.syncModels();
    this.audio.unlock();
    this.transition = 0.9;
  }
  readCheckpoint() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      return Simulation.restore(data) ? data : null;
    } catch {
      return null;
    }
  }
  saveCheckpoint() {
    if (!this.started) return;
    if (this.operation === "workshop") {
      this.saveBlueprint();
      return;
    }
    if (this.sim.isRaid) return;
    const checkpoint = this.sim.checkpoint();
    if (!checkpoint) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(checkpoint));
    } catch {
      if (!this.storageWarning) {
        this.ui.notice(
          "Browser storage is unavailable. This operation cannot be saved.",
        );
        this.storageWarning = true;
      }
    }
  }
  startWave() {
    if (this.operation === "workshop" && !this.paused) {
      this.saveBlueprint();
      this.startRaid(this.currentBlueprint());
      return;
    }
    if (this.sim.isRaid) return;
    if (!this.started || this.paused || this.sim.phase !== "build") return;
    this.saveCheckpoint();
    this.sim.startWave();
    this.grenadeCooldown = 0;
    this.ammo.rifle = 32;
    this.ammo.shotgun = 8;
    this.reloadTimer = 0;
  }
  selectTower(type) {
    if (this.sim.isRaid) return;
    if (!TOWERS[type] || !this.started || this.paused) return;
    this.selectedType = type;
    if (
      this.selectedPad !== null &&
      !this.sim.towers.some((t) => t.padId === this.selectedPad)
    )
      this.ui.lastContext = "";
    if (this.mode === "fps")
      this.ui.notice(
        `${TOWERS[type].name} selected · E to build near a platform`,
      );
  }
  buildSelected() {
    if (this.sim.isRaid) {
      if (!this.paused) this.sim.reinforce();
      return;
    }
    const pad = this.mode === "fps" ? this.nearPad?.id : this.selectedPad;
    if (pad === undefined || pad === null || this.paused) return;
    if (
      this.mode === "fps" &&
      Math.hypot(
        this.sim.player.x - PADS[pad].x,
        this.sim.player.z - PADS[pad].z,
      ) < 2.4
    ) {
      this.ui.notice("Step off the platform to deploy a defense.");
      return;
    }
    const tower = this.sim.build(pad, this.selectedType);
    if (tower) {
      this.saveCheckpoint();
      this.ui.notice(`${TOWERS[tower.type].name} online · Platform ${pad + 1}`);
    }
  }
  upgradeSelected() {
    if (this.sim.isRaid) return;
    const pad = this.mode === "fps" ? this.nearPad?.id : this.selectedPad;
    if (pad === undefined || pad === null || this.paused) return;
    if (this.sim.upgrade(pad)) this.saveCheckpoint();
  }
  sellSelected() {
    if (this.sim.isRaid) return;
    const pad = this.mode === "fps" ? this.nearPad?.id : this.selectedPad;
    if (pad === undefined || pad === null || this.paused) return;
    if (this.sim.sell(pad)) this.saveCheckpoint();
  }
  async captureMouse() {
    try {
      await this.canvas.requestPointerLock();
    } catch {
      this.ui.notice("Click the battlefield to capture the mouse.");
    }
  }
  switchMode(force) {
    if (!this.started || this.paused) return;
    const next = force || (this.mode === "fps" ? "command" : "fps");
    if (next === "fps" && this.sim.player.respawn > 0) {
      this.ui.notice(
        `Operator recovering · ${Math.ceil(this.sim.player.respawn)}s`,
      );
      return;
    }
    this.mode = next;
    this.sim.player.active = next === "fps";
    this.firing = false;
    this.aiming = false;
    this.keys.clear();
    this.transition = 0.7;
    this.hoverPad = null;
    this.nearPad = null;
    document.body.classList.remove("aiming");
    this.ui.setMode(next);
    if (next === "fps") {
      this.selectedPad = null;
      const p = this.sim.player;
      // A tower placed from command view may now occupy the operator's previous location.
      if (this.world.collides(p.x, p.z, this.sim.towers)) {
        search: for (let radius = 2.5; radius <= 15; radius += 1.5)
          for (let step = 0; step < 16; step++) {
            const angle = (step * Math.PI) / 8,
              x = clamp(
                p.x + Math.cos(angle) * radius,
                BOUNDS.minX,
                BOUNDS.maxX,
              ),
              z = clamp(
                p.z + Math.sin(angle) * radius,
                BOUNDS.minZ,
                BOUNDS.maxZ,
              );
            if (!this.world.collides(x, z, this.sim.towers)) {
              p.x = x;
              p.z = z;
              break search;
            }
          }
      }
      this.captureMouse();
    } else if (document.pointerLockElement) document.exitPointerLock();
  }
  openOverlay() {
    this.paused = true;
    this.firing = false;
    this.aiming = false;
    this.keys.clear();
    document.body.classList.remove("aiming");
    if (document.pointerLockElement) document.exitPointerLock();
  }
  closeOverlay() {
    if (this.started && ["victory", "defeat"].includes(this.sim.phase)) {
      this.ui.result(this.sim.phase === "victory");
      return;
    }
    this.resume();
  }
  pause() {
    if (!this.started || this.paused) return;
    this.ui.pause();
  }
  resume() {
    this.paused = false;
    this.ui.elements.overlay.classList.add("hidden");
    if (this.started && this.mode === "fps") this.captureMouse();
  }
  goToMenu() {
    this.saveCheckpoint();
    this.started = false;
    this.paused = false;
    this.mode = "command";
    this.sim.player.active = false;
    this.ui.setMode("command");
    this.ui.showMenu();
    if (document.pointerLockElement) document.exitPointerLock();
    this.keys.clear();
    this.firing = false;
  }
  updateSetting(key, value) {
    if (!(key in this.settings)) return;
    if (["volume", "sensitivity"].includes(key)) value = Number(value);
    this.settings[key] = value;
    if (key === "quality") this.applyQuality();
    if (key === "volume") this.audio.setVolume(value);
    if (key === "music") this.audio.music = value;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* Settings are still applied for this session. */
    }
  }
  applyQuality() {
    const q = this.settings.quality;
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        q === "high" ? 1.75 : q === "medium" ? 1.25 : 1,
      ),
    );
    this.renderer.shadowMap.enabled = q !== "low";
    this.bloom.enabled = q === "high";
    this.world.dust.visible = q !== "low";
    this.resize();
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.weaponCamera.aspect = w / h;
    this.weaponCamera.updateProjectionMatrix();
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.bunker?.resize();
    if (this.bunkerPreviewCamera) {
      this.bunkerPreviewCamera.aspect = w / h;
      this.bunkerPreviewCamera.updateProjectionMatrix();
    }
  }
  bindInput() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (e) => {
      if (this.bunker) return;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (
        this.started &&
        !this.paused &&
        [
          "Tab",
          "Enter",
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      )
        e.preventDefault();
      if (e.code === "Escape") {
        if (this.started) {
          if (this.paused) this.closeOverlay();
          else this.pause();
        } else if (this.paused) this.closeOverlay();
        return;
      }
      if (!this.started || this.paused) return;
      this.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === "Tab") this.switchMode();
      if (e.code === "Enter" || (e.code === "Space" && this.mode === "command"))
        this.startWave();
      if (this.sim.isRaid) {
        if (/^Digit[1-3]$/.test(e.code))
          this.sim.command(
            ["follow", "advance", "hold"][Number(e.code.at(-1)) - 1],
          );
        if (e.code === "KeyF") this.focusRaidTarget();
      }
      if (!this.sim.isRaid && /^Digit[1-4]$/.test(e.code))
        this.selectTower(Object.keys(TOWERS)[Number(e.code.at(-1)) - 1]);
      if (e.code === "KeyE") this.buildSelected();
      if (e.code === "KeyU") this.upgradeSelected();
      if (e.code === "KeyX") this.sellSelected();
      if (e.code === "KeyH") this.ui.guide();
      if (this.mode === "fps") {
        if (e.code === "KeyR") this.reload();
        if (e.code === "KeyQ") this.swapWeapon();
        if (e.code === "KeyG") this.throwGrenade();
        if (e.code === "Space" && this.jumpHeight <= 0)
          this.verticalVelocity = 7;
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.bunker) return;
      if (!this.started || this.paused) return;
      this.audio.unlock();
      if (this.mode === "fps") {
        if (document.pointerLockElement !== this.canvas) {
          this.captureMouse();
          if (e.button !== 2) return;
        }
        if (e.button === 0) this.firing = true;
        if (e.button === 2) {
          this.aiming = true;
          document.body.classList.add("aiming");
        }
      } else {
        if (e.button === 2) this.dragging = true;
        if (e.button === 0) {
          this.updatePointer(e);
          this.updateHover();
          this.selectedPad = this.hoverPad;
          if (
            this.selectedPad !== null &&
            !this.sim.towers.some((t) => t.padId === this.selectedPad)
          )
            this.buildSelected();
        }
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.firing = false;
      if (e.button === 2) {
        this.dragging = false;
        this.aiming = false;
        document.body.classList.remove("aiming");
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (this.bunker) return;
      this.updatePointer(e);
      if (!this.started || this.paused) return;
      if (this.mode === "fps" && document.pointerLockElement === this.canvas) {
        const speed =
          0.002 * this.settings.sensitivity * (this.aiming ? 0.6 : 1);
        this.yaw -= e.movementX * speed;
        this.pitch = clamp(this.pitch - e.movementY * speed, -1.43, 1.43);
      } else if (this.dragging && this.mode === "command") {
        this.orbit.yaw -= e.movementX * 0.005;
        this.orbit.elevation = clamp(
          this.orbit.elevation + e.movementY * 0.004,
          0.42,
          1.35,
        );
      }
    });
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (this.bunker) return;
        if (this.started && !this.paused && this.mode === "command") {
          e.preventDefault();
          this.orbit.distance = clamp(
            this.orbit.distance + e.deltaY * 0.055,
            40,
            155,
          );
        }
      },
      { passive: false },
    );
    document.addEventListener("pointerlockchange", () => {
      if (this.bunker) return;
      if (
        document.pointerLockElement !== this.canvas &&
        this.started &&
        this.mode === "fps" &&
        !this.paused
      )
        this.pause();
    });
    window.addEventListener("blur", () => {
      if (this.bunker) return;
      this.keys.clear();
      this.firing = false;
      this.dragging = false;
      if (this.started && !this.paused) this.pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (this.bunker) return;
      if (document.hidden && this.started) this.pause();
    });
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (this.bunker) {
        this.bunker.pause();
        this.bunker.ui.overlay('<h2>Graphics connection lost.</h2><p>Reload the page to return to your preparation checkpoint.</p><button onclick="location.reload()">RECONNECT</button>');
        return;
      }
      this.openOverlay();
      this.ui.elements.fatal.innerHTML =
        '<div class="overlay-card"><h2>Graphics connection lost.</h2><p>Reload the page to reconnect. Your last preparation checkpoint is saved.</p><button class="primary" onclick="location.reload()">RECONNECT</button></div>';
      this.ui.elements.fatal.classList.remove("hidden");
    });
  }
  updatePointer(e) {
    this.mouse.set(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1,
    );
    this.mouseScreen.x = e.clientX;
    this.mouseScreen.y = e.clientY;
  }
  updateHover() {
    if (this.sim.isRaid) {
      this.hoverPad = null;
      return;
    }
    if (this.mode !== "command" || this.paused) {
      this.hoverPad = null;
      return;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.ray.intersectPlane(
      this.ground,
      this.groundPoint,
    );
    this.hoverPad = null;
    if (hit) {
      const pad = PADS.find((p) => Math.hypot(p.x - hit.x, p.z - hit.z) < 2.65);
      if (pad) this.hoverPad = pad.id;
    }
    this.canvas.style.cursor = this.hoverPad !== null ? "pointer" : "default";
  }
  reload() {
    if (
      this.reloadTimer <= 0 &&
      this.ammo[this.weaponType] < WEAPONS[this.weaponType].magazine
    ) {
      this.reloadTimer = WEAPONS[this.weaponType].reload;
      this.audio.play("reload");
    }
  }
  swapWeapon() {
    this.weaponType = this.weaponType === "rifle" ? "shotgun" : "rifle";
    this.reloadTimer = 0;
    this.fireTimer = 0.3;
    this.recoil = 0.6;
    this.audio.play("reload");
  }
  obstructionDistance(ray, maximum) {
    let distance = maximum;
    const point = v3();
    for (const obstacle of [
      ...this.world.obstacles.filter(
        (o) => !this.sim.isRaid || o.x !== CORE.x || o.z !== CORE.z,
      ),
      ...this.sim.towers.map((t) => ({ x: t.x, z: t.z, radius: 1.6 })),
    ]) {
      const halfX = obstacle.halfX || obstacle.radius * 0.75,
        halfZ = obstacle.halfZ || obstacle.radius * 0.75;
      const height =
        obstacle.height ||
        (obstacle.halfX
          ? 3.5
          : obstacle.x === CORE.x && obstacle.z === CORE.z
            ? 8
            : obstacle.radius > 3
              ? 4
              : 2.5);
      const bounds = new THREE.Box3(
        v3(obstacle.x - halfX, 0, obstacle.z - halfZ),
        v3(obstacle.x + halfX, height, obstacle.z + halfZ),
      );
      const intersect = ray.intersectBox(bounds, point);
      if (intersect)
        distance = Math.min(distance, intersect.distanceTo(ray.origin));
    }
    const groundHit = ray.intersectPlane(this.ground, point);
    if (groundHit)
      distance = Math.min(distance, groundHit.distanceTo(ray.origin));
    return distance;
  }
  shoot() {
    const w = WEAPONS[this.weaponType];
    if (this.fireTimer > 0 || this.reloadTimer > 0 || this.transition > 0.1)
      return;
    if (!this.ammo[this.weaponType]) {
      this.reload();
      return;
    }
    this.ammo[this.weaponType]--;
    this.sim.totalShots++;
    this.fireTimer = w.interval;
    this.recoil = this.weaponType === "rifle" ? 0.6 : 1.6;
    this.audio.play(this.weaponType);
    this.weaponModels[this.weaponType].userData.flash.visible = true;
    this.flashTimer = 0.065;
    if (this.settings.shake)
      this.shake = Math.max(
        this.shake,
        this.weaponType === "rifle" ? 0.018 : 0.07,
      );
    const from = this.camera.position.clone();
    this.camera.getWorldDirection(this.cameraDirection);
    const direction = this.cameraDirection.clone();
    let hitAny = false;
    for (let i = 0; i < w.pellets; i++) {
      const spread = w.spread * (this.aiming ? 0.38 : 1);
      direction
        .copy(this.cameraDirection)
        .add(
          v3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
          ),
        )
        .normalize();
      const ray = new THREE.Ray(from, direction);
      let closest = this.obstructionDistance(ray, w.range),
        target = null;
      const hitPoint = v3();
      let impact = from.clone().addScaledVector(direction, closest);
      for (const enemy of this.sim.enemies) {
        if (enemy.dead) continue;
        const s = enemy.size;
        const bounds = new THREE.Box3(
          v3(enemy.x - s, 0.3 * s, enemy.z - s),
          v3(
            enemy.x + s,
            enemy.kind === "trooper" ? 2.45 : 2.1 * s,
            enemy.z + s,
          ),
        );
        if (ray.intersectBox(bounds, hitPoint)) {
          const distance = hitPoint.distanceTo(from);
          if (distance < closest) {
            closest = distance;
            target = enemy;
            impact.copy(hitPoint);
          }
        }
      }
      const muzzle = from
        .clone()
        .addScaledVector(direction, 0.8)
        .add(v3(0.08, -0.12, 0));
      this.effects.beam(
        muzzle,
        impact,
        this.weaponType === "rifle" ? 0xffd599 : 0xffbc79,
        0.055,
        this.weaponType === "rifle" ? 0.012 : 0.009,
      );
      if (target) {
        hitAny = true;
        const multiplier =
          impact.y > (target.kind === "trooper" ? 1.95 : target.size * 1.45)
            ? 1.5
            : 1;
        const falloff =
          this.weaponType === "shotgun" ? clamp(1 - closest / 65, 0.3, 1) : 1;
        this.sim.damage(target, w.damage * multiplier * falloff, "player");
        this.effects.burst(impact.x, impact.y, impact.z, 0xffda8f, 3, 2);
        this.ui.hit(target.dead);
      } else
        this.effects.burst(
          impact.x,
          Math.max(0.15, impact.y),
          impact.z,
          0xd8c498,
          2,
          1,
        );
    }
    if (hitAny) {
      this.sim.hits++;
      this.audio.play("hit");
    }
  }
  throwGrenade() {
    if (this.grenadeCooldown > 0 || this.sim.player.respawn > 0) return;
    this.grenadeCooldown = 12;
    this.audio.play("reload");
    this.camera.getWorldDirection(this.cameraDirection);
    const velocity = this.cameraDirection.clone().multiplyScalar(21);
    velocity.y += 6;
    const model = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18),
      materials.brass,
    );
    this.scene.add(model);
    model.position
      .copy(this.camera.position)
      .addScaledVector(this.cameraDirection, 1);
    this.grenades.push({ model, velocity, timer: 1.6 });
    this.ui.notice("Frag out.");
  }
  updatePlayer(dt) {
    const p = this.sim.player;
    if (this.mode !== "fps" || p.respawn > 0) return;
    const forward =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const side =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const crouching = this.keys.has("KeyC");
    const speed =
      (crouching ? 3.5 : this.aiming ? 4.2 : sprint ? 12.5 : 7.5) *
      (p.slowTimer > 0 ? 0.6 : 1);
    p.yaw = this.yaw;
    const length = Math.hypot(forward, side) || 1;
    const dx =
      ((-Math.sin(this.yaw) * forward + Math.cos(this.yaw) * side) *
        speed *
        dt) /
      length;
    const dz =
      ((-Math.cos(this.yaw) * forward - Math.sin(this.yaw) * side) *
        speed *
        dt) /
      length;
    const x = clamp(p.x + dx, BOUNDS.minX, BOUNDS.maxX),
      z = clamp(p.z + dz, BOUNDS.minZ, BOUNDS.maxZ);
    if (
      !this.world.collides(
        x,
        p.z,
        this.sim.isRaid
          ? this.sim.enemies.filter(
              (e) => !e.dead && ["turret", "relay"].includes(e.kind),
            )
          : this.sim.towers,
      )
    )
      p.x = x;
    if (
      !this.world.collides(
        p.x,
        z,
        this.sim.isRaid
          ? this.sim.enemies.filter(
              (e) => !e.dead && ["turret", "relay"].includes(e.kind),
            )
          : this.sim.towers,
      )
    )
      p.z = z;
    if (forward || side) this.bob += dt * (sprint ? 15 : 10);
    else this.bob += dt * 2;
    this.verticalVelocity -= 19 * dt;
    this.jumpHeight = Math.max(0, this.jumpHeight + this.verticalVelocity * dt);
    if (!this.jumpHeight) this.verticalVelocity = 0;
    p.y = (crouching ? 1.05 : 1.8) + this.jumpHeight;
    this.nearPad = null;
    let nearestDistance = 5.7;
    for (const pad of PADS) {
      const distance = Math.hypot(pad.x - p.x, pad.z - p.z);
      if (distance < nearestDistance) {
        this.nearPad = pad;
        nearestDistance = distance;
      }
    }
  }
  updateCamera(dt) {
    if (!this.started) {
      this.targetPos.set(
        77 + Math.sin(this.time * 0.035) * 6,
        51,
        70 + Math.cos(this.time * 0.035) * 4,
      );
      this.targetCamera.position.copy(this.targetPos);
      this.targetCamera.lookAt(8, 1.5, 0);
    } else if (this.mode === "command") {
      if (!this.paused) {
        const forward =
          Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
          Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
        const side =
          Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
          Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
        this.orbit.x = clamp(
          this.orbit.x +
            (side * Math.cos(this.orbit.yaw) -
              forward * Math.sin(this.orbit.yaw)) *
              dt *
              25,
          -35,
          35,
        );
        this.orbit.z = clamp(
          this.orbit.z +
            (-forward * Math.cos(this.orbit.yaw) -
              side * Math.sin(this.orbit.yaw)) *
              dt *
              25,
          -25,
          25,
        );
      }
      const o = this.orbit;
      this.targetPos.set(
        o.x + Math.sin(o.yaw) * Math.cos(o.elevation) * o.distance,
        Math.sin(o.elevation) * o.distance,
        o.z + Math.cos(o.yaw) * Math.cos(o.elevation) * o.distance,
      );
      this.targetCamera.position.copy(this.targetPos);
      this.targetCamera.lookAt(o.x, 0, o.z);
    } else {
      const p = this.sim.player,
        moving =
          this.keys.has("KeyW") ||
          this.keys.has("KeyS") ||
          this.keys.has("KeyA") ||
          this.keys.has("KeyD");
      this.targetPos.set(
        p.x,
        p.y +
          (this.settings.shake && moving && !this.jumpHeight
            ? Math.sin(this.bob) * 0.045
            : 0),
        p.z,
      );
      this.targetCamera.position.copy(this.targetPos);
      this.targetCamera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    }
    const alpha =
      this.mode === "fps" && this.transition <= 0 ? 1 : 1 - Math.exp(-dt * 6);
    this.camera.position.lerp(this.targetPos, alpha);
    this.camera.quaternion.slerp(this.targetCamera.quaternion, alpha);
    const fov =
      this.started && this.mode === "fps" ? (this.aiming ? 51 : 76) : 44;
    this.camera.fov = THREE.MathUtils.lerp(
      this.camera.fov,
      fov,
      1 - Math.exp(-dt * 10),
    );
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    if (this.settings.shake && this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
    this.shake *= Math.exp(-dt * 9);
    this.transition = Math.max(0, this.transition - dt);
    this.recoil *= Math.exp(-dt * 13);
    const aimTarget =
      this.aiming && this.reloadTimer <= 0 && this.mode === "fps" ? 1 : 0;
    this.aimBlend = THREE.MathUtils.lerp(
      this.aimBlend,
      aimTarget,
      1 - Math.exp(-dt * 18),
    );
    if (Math.abs(this.aimBlend - aimTarget) < 0.001) this.aimBlend = aimTarget;
    const sighted = this.mode === "fps" && this.aiming && this.aimBlend === 1;
    document.body.classList.toggle("sighted", sighted);
    for (const [type, model] of Object.entries(this.weaponModels)) {
      model.visible = this.mode === "fps" && type === this.weaponType;
      const reload =
        this.reloadTimer > 0
          ? Math.sin((this.reloadTimer / WEAPONS[type].reload) * Math.PI)
          : 0;
      const aim = this.aimBlend;
      model.position.set(
        (0.26 + Math.sin(this.bob * 0.5) * 0.004) * (1 - aim),
        THREE.MathUtils.lerp(-0.26, -model.userData.sight.position.y, aim) -
          reload * 0.25 +
          Math.cos(this.bob) * 0.003 * (1 - aim),
        -0.88 + this.recoil * 0.075 + aim * 0.1,
      );
      model.rotation.set(
        this.recoil * 0.045 * (1 - aim) - reload * 0.5,
        reload * 0.3,
        -reload * 0.6,
      );
      if (model.userData.reticle) model.userData.reticle.visible = sighted;
      model.userData.flash.visible =
        type === this.weaponType && this.flashTimer > 0;
    }
  }
  syncModels() {
    for (const tower of this.sim.towers) {
      let model = this.towerModels.get(tower.id);
      if (model && model.userData.level !== tower.level) {
        disposeModel(model);
        this.towerModels.delete(tower.id);
        model = null;
      }
      if (!model) {
        model = makeTower(tower.type, tower.level);
        model.position.set(tower.x, 0.2, tower.z);
        model.userData.level = tower.level;
        model.userData.head.rotation.y = -Math.PI / 2;
        this.scene.add(model);
        this.towerModels.set(tower.id, model);
      }
    }
    for (const [id, model] of this.towerModels)
      if (!this.sim.towers.some((t) => t.id === id)) {
        disposeModel(model);
        this.towerModels.delete(id);
      }
    if (this.sim.isRaid) this.syncRaidModels();
    else
      for (const enemy of this.sim.enemies) {
        let model = this.enemyModels.get(enemy.id);
        if (!model) {
          model = makeEnemy(enemy);
          this.scene.add(model);
          this.enemyModels.set(enemy.id, model);
        }
        model.position.set(enemy.x, 0.15, enemy.z);
        model.rotation.y = enemy.angle;
        const stride =
          this.sim.time * enemy.speed * (enemy.slowTimer > 0 ? 0.5 : 1);
        model.userData.legs.forEach((leg, i) => {
          leg.rotation.x =
            Math.sin(stride * 2.6 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.42;
        });
        model.userData.body.position.y = 1.05 + Math.sin(stride * 5.2) * 0.035;
        const flash = model.userData.hitUntil > this.time;
        model.userData.armor.emissive.set(
          flash ? 0xad582e : enemy.slowTimer > 0 ? 0x224b5a : 0x000000,
        );
        model.userData.armor.emissiveIntensity = flash ? 0.7 : 0.4;
        const bar = model.userData.healthBar;
        bar.visible = enemy.hp < enemy.maxHp || enemy.type === "boss";
        bar.quaternion
          .copy(this.camera.quaternion)
          .premultiply(model.quaternion.clone().invert());
        model.userData.health.scale.x = Math.max(0.001, enemy.hp / enemy.maxHp);
        model.userData.health.position.x =
          -0.775 * (1 - enemy.hp / enemy.maxHp);
      }
    for (const [id, model] of this.enemyModels)
      if (!this.sim.enemies.some((e) => e.id === id && !e.dead)) {
        disposeModel(model);
        this.enemyModels.delete(id);
      }
    for (const shot of this.sim.projectiles) {
      let model = this.projectileModels.get(shot.id);
      if (!model) {
        model = new THREE.Mesh(
          (this.projectileGeometry ||= new THREE.SphereGeometry(0.15, 6, 4)),
          materials.red,
        );
        this.scene.add(model);
        this.projectileModels.set(shot.id, model);
      }
      model.position.set(shot.x, shot.y, shot.z);
    }
    for (const [id, model] of this.projectileModels)
      if (!this.sim.projectiles.some((s) => s.id === id)) {
        model.removeFromParent();
        this.projectileModels.delete(id);
      }
  }
  processEvents() {
    for (const event of this.sim.drainEvents()) {
      const e = event.enemy;
      if (this.sim.isRaid) this.raidEvent(event);
      if (event.type === "notice") this.ui.notice(event.text, event.urgent);
      if (["built", "upgraded"].includes(event.type)) {
        this.audio.play("build");
        this.effects.shockwave(event.tower.x, event.tower.z, 3.5, 0xbeefc6);
        this.effects.burst(event.tower.x, 0.5, event.tower.z, 0xe5cd89, 15, 4);
      }
      if (event.type === "sold") this.audio.play("build");
      if (event.type === "towerShot") {
        const tower = event.tower,
          target = event.target,
          model = this.towerModels.get(tower.id);
        if (model) {
          model.userData.head.rotation.y = Math.atan2(
            target.x - tower.x,
            target.z - tower.z,
          );
          model.userData.firedUntil = this.time + 0.12;
        }
        const angle = Math.atan2(target.x - tower.x, target.z - tower.z),
          barrelLength =
            tower.type === "rail" ? 3.2 : tower.type === "frost" ? 0 : 2.3;
        const from = {
          x: tower.x + Math.sin(angle) * barrelLength,
          y: tower.type === "frost" ? 3.2 : 2.1,
          z: tower.z + Math.cos(angle) * barrelLength,
        };
        this.effects.beam(
          from,
          { x: target.x, y: target.size * 1.2, z: target.z },
          TOWERS[tower.type].color,
          tower.type === "rail" ? 0.22 : 0.1,
          tower.type === "rail" ? 0.08 : 0.04,
        );
        this.effects.burst(
          from.x,
          from.y,
          from.z,
          TOWERS[tower.type].color,
          3,
          2,
        );
        if (tower.type === "frost")
          this.effects.shockwave(target.x, target.z, 3, 0x9eece5);
        this.audio.play(
          tower.type,
          this.mode === "fps"
            ? Math.hypot(
                this.sim.player.x - tower.x,
                this.sim.player.z - tower.z,
              )
            : 14,
        );
      }
      if (event.type === "hit") {
        const model = this.enemyModels.get(e.id);
        if (model) model.userData.hitUntil = this.time + 0.1;
        if (this.sim.isRaid) e.hurtUntil = this.sim.time + 0.1;
      }
      if (event.type === "killed" || event.type === "breach") {
        this.effects.burst(
          e.x,
          e.size,
          e.z,
          event.type === "breach" ? 0x9cffd4 : 0xffab64,
          e.type === "boss" ? 65 : 15,
          e.size * 4,
        );
        this.effects.shockwave(e.x, e.z, e.type === "boss" ? 8 : 2.3);
        if (event.type === "breach") {
          this.audio.play("hurt");
          this.ui.notice(
            "Reactor breached. Reinforce the final approach.",
            true,
          );
          this.shake = this.settings.shake ? 0.3 : 0;
        }
        if (event.source === "player") this.ui.hit(true);
      }
      if (event.type === "explosion") {
        this.effects.burst(event.x, 0.8, event.z, 0xffb36c, 22, 8);
        this.effects.shockwave(event.x, event.z, event.radius);
        this.audio.play(
          "explosion",
          this.mode === "fps"
            ? Math.hypot(
                event.x - this.sim.player.x,
                event.z - this.sim.player.z,
              )
            : 18,
        );
      }
      if (event.type === "wave") {
        this.audio.play("wave");
        this.ui.banner(
          `WAVE ${String(event.wave).padStart(2, "0")} / 12`,
          event.name,
          WAVES[event.wave - 1].briefing,
        );
      }
      if (event.type === "waveClear") {
        this.audio.play("clear");
        this.saveCheckpoint();
        this.ui.banner(
          "SECTOR SECURED",
          `Wave ${event.wave} cleared.`,
          `+${event.bonus} alloy · Reactor repaired +40 · Checkpoint saved`,
        );
      }
      if (event.type === "playerHit") {
        this.ui.hurt();
        this.audio.play("hurt");
        this.shake = this.settings.shake ? 0.12 : 0;
      }
      if (event.type === "playerDown") {
        this.switchMode("command");
        this.ui.banner(
          "OPERATOR DOWN",
          "Recovering…",
          this.sim.isRaid
            ? `Redeployment in 6 seconds. ${this.sim.tickets} lives remaining.`
            : "Returning to command. Redeployment ready in 6 seconds. Reactor −50.",
        );
      }
      if (event.type === "respawn")
        this.ui.notice("Operator ready. Press Tab to redeploy.");
      if (event.type === "victory" || event.type === "defeat") {
        this.audio.play(event.type === "victory" ? "clear" : "hurt");
        if (event.type === "victory" && !this.sim.isRaid) {
          try {
            localStorage.removeItem(SAVE_KEY);
          } catch {}
        }
        this.ui.result(event.type === "victory");
      }
    }
  }
  updateGhost() {
    if (this.sim.isRaid) {
      this.world.showRange(null);
      if (this.ghost) this.ghost.visible = false;
      return;
    }
    const id =
      this.mode === "fps"
        ? this.nearPad?.id
        : (this.hoverPad ?? this.selectedPad);
    const pad = id !== null && id !== undefined ? PADS[id] : null,
      tower = this.sim.towers.find((t) => t.padId === id);
    if (!this.started || this.paused || !pad) {
      this.world.showRange(null);
      if (this.ghost) this.ghost.visible = false;
      return;
    }
    const type = tower?.type || this.selectedType,
      stats = towerStats(type, tower?.level || 1);
    this.world.showRange(pad, stats.range, stats.color);
    if (!tower && this.mode === "command") {
      if (!this.ghost || this.ghostType !== type) {
        if (this.ghost) disposeModel(this.ghost);
        this.ghost = makeTower(type, 1, true);
        this.ghostType = type;
        this.scene.add(this.ghost);
      }
      this.ghost.position.set(pad.x, 0.2, pad.z);
      this.ghost.visible = true;
    } else if (this.ghost) this.ghost.visible = false;
  }
  frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    if (this.bunker) {
      this.bunker.frame(dt);
      requestAnimationFrame(this.frame);
      return;
    }
    if (!this.paused) {
      this.time += dt;
      if (this.started) {
        this.fireTimer = Math.max(0, this.fireTimer - dt);
        this.flashTimer = Math.max(0, (this.flashTimer || 0) - dt);
        this.grenadeCooldown = Math.max(0, this.grenadeCooldown - dt);
        if (this.reloadTimer > 0) {
          this.reloadTimer = Math.max(0, this.reloadTimer - dt);
          if (!this.reloadTimer) {
            this.ammo[this.weaponType] = WEAPONS[this.weaponType].magazine;
            this.audio.play("reload");
          }
        }
        this.updatePlayer(dt);
        // Fixed maximum substeps keep contact, movement, and targeting stable across frame rates.
        let remaining = dt;
        while (remaining > 0) {
          const step = Math.min(remaining, 1 / 60);
          this.sim.update(step);
          remaining -= step;
        }
        for (const g of this.grenades) {
          g.timer -= dt;
          g.velocity.y -= 15 * dt;
          g.model.position.addScaledVector(g.velocity, dt);
          g.model.rotation.x += dt * 5;
          if (g.model.position.y < 0.2) {
            g.model.position.y = 0.2;
            g.velocity.y *= -0.35;
            g.velocity.x *= 0.65;
            g.velocity.z *= 0.65;
          }
          if (g.timer <= 0) {
            this.sim.blast(
              g.model.position.x,
              g.model.position.z,
              7,
              230,
              "player",
              true,
            );
            g.model.removeFromParent();
          }
        }
        this.grenades = this.grenades.filter((g) => g.timer > 0);
        for (const shot of this.sim.projectiles)
          if (
            shot.y < 2.5 &&
            this.world.collides(shot.x, shot.z, this.sim.towers)
          )
            shot.life = 0;
        this.processEvents();
        this.syncModels();
        this.audio.update(dt, this.sim.phase === "wave");
      }
      this.world.update(this.time, this.sim, this.selectedPad, this.hoverPad);
      this.effects.update(dt);
      for (const model of this.towerModels.values())
        if (model.userData.rotor)
          model.userData.rotor.rotation.y = this.time * 1.5;
    }
    this.updateCamera(this.paused ? 0 : dt);
    // Fire using the camera for this frame, matching the point shown by the sight.
    if (
      this.started &&
      !this.paused &&
      this.mode === "fps" &&
      this.sim.player.respawn <= 0 &&
      this.firing &&
      document.pointerLockElement === this.canvas
    )
      this.shoot();
    if (this.started && this.mode === "command") this.updateHover();
    this.updateGhost();
    this.uiTimer += dt;
    if (this.uiTimer >= 0.08) {
      this.ui.update(this.paused ? 0 : this.uiTimer);
      this.uiTimer = 0;
    }
    this.renderer.autoClear = true;
    if (!this.started && this.bunkerPreview) this.renderer.render(this.bunkerPreview.scene, this.bunkerPreviewCamera);
    else if (this.settings.quality === "high") this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    if (this.started && this.mode === "fps" && this.transition < 0.25) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.weaponScene, this.weaponCamera);
      this.renderer.autoClear = true;
    }
    requestAnimationFrame(this.frame);
  }
}

installRaids(Game);

try {
  new Game();
} catch (error) {
  console.error(error);
  document.querySelector("#loading").innerHTML =
    '<span class="loading-mark">◈</span><b>GRAPHICS UNAVAILABLE</b><span>Last Light needs a browser with WebGL 2 and hardware acceleration.</span><span>Try a current version of Chrome, Edge, or Firefox.</span>';
}
