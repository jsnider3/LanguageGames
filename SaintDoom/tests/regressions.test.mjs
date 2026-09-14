import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { InputManager } from "../modules/InputManager.js";
import { LevelFactory } from "../modules/LevelFactory.js";
import { CollisionSystem } from "../modules/CollisionSystem.js";
import { Player } from "../modules/Player.js";
import {
  normalizeSettings,
  readSettings,
  writeSettings,
  DEFAULT_SETTINGS,
} from "../modules/Settings.js";
import { AudioManager } from "../modules/Utils.js";
import { Game } from "../modules/Game.js";

function dom() {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  document.body = {};
  document.pointerLockElement = null;
  document.getElementById = () => null;
}
function dispatch(target, type, properties = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, properties);
  target.dispatchEvent(event);
  return event;
}

test("mouse movement accumulates between frames and is consumed once", () => {
  dom();
  const input = new InputManager();
  document.pointerLockElement = document.body;
  dispatch(document, "pointerlockchange");
  dispatch(window, "mousemove", { movementX: 4, movementY: 2 });
  dispatch(window, "mousemove", { movementX: -1, movementY: 5 });
  assert.equal(input.getInput().mouseDeltaX, 3);
  assert.equal(input.getInput().mouseDeltaY, 0);
  input.destroy();
});

test("losing focus or mouse capture clears movement and attack; menu clicks never fire", () => {
  dom();
  const input = new InputManager();
  dispatch(window, "mousedown", { button: 0 });
  assert.equal(input.getInput().attack, false);
  document.pointerLockElement = document.body;
  dispatch(document, "pointerlockchange");
  dispatch(window, "keydown", { code: "KeyW" });
  dispatch(window, "mousedown", { button: 0 });
  assert.equal(input.getInput().attack, true);
  dispatch(window, "blur");
  assert.equal(input.getInput().forward, false);
  assert.equal(input.getInput().attack, false);
  dispatch(window, "keydown", { code: "KeyW" });
  document.pointerLockElement = null;
  dispatch(document, "pointerlockchange");
  assert.equal(input.getInput().forward, false);
  input.destroy();
  dispatch(window, "keydown", { code: "KeyW" });
  assert.equal(input.getInput().forward, false);
});

test("paused inputs leave menu keyboard controls alone and held weapon keys do not repeat", () => {
  dom();
  const game = { isRunning: true, isPaused: true };
  const input = new InputManager(game);
  assert.equal(
    dispatch(window, "keydown", { code: "Space" }).defaultPrevented,
    false,
  );
  game.isPaused = false;
  dispatch(window, "keydown", { code: "Digit2", repeat: false });
  assert.equal(input.getInput().weapon2, true);
  dispatch(window, "keydown", { code: "Digit2", repeat: true });
  assert.equal(input.getInput().weapon2, false);
  dispatch(window, "keydown", { code: "ShiftRight" });
  assert.equal(input.getInput().sprint, true);
  input.destroy();
});

for (const shape of ["array", "object", "instance"]) {
  test(`level loader preserves collision bounds from ${shape} results`, async () => {
    dom();
    const walls = [
      { min: new THREE.Vector3(-5, 0, -5), max: new THREE.Vector3(-4, 4, 5) },
    ];
    const game = {
      scene: new THREE.Scene(),
      camera: { uuid: "test" },
      player: { position: new THREE.Vector3() },
    };
    const factory = new LevelFactory(game);
    factory.registerLevel("test", { className: "TestLevel" });
    factory.loadLevelClass = async () =>
      class {
        walls = walls;
        create() {
          return shape === "array"
            ? walls
            : shape === "object"
              ? { walls }
              : undefined;
        }
      };
    await factory.createLevel("test");
    assert.equal(game.level.walls, walls);
    const collision = new CollisionSystem();
    assert.equal(
      collision.checkWallCollision(
        new THREE.Vector3(-4.5, 1.7, 0),
        game.level.walls,
        0.4,
      ),
      true,
    );
    assert.equal(
      collision.checkWallCollision(
        new THREE.Vector3(0, 1.7, 0),
        game.level.walls,
        0.4,
      ),
      false,
    );
  });
}

test("movement acceleration and head bob match at 30, 60, and 144 FPS", () => {
  dom();
  const results = [30, 60, 144].map((fps) => {
    const player = new Player(new THREE.PerspectiveCamera());
    for (let i = 0; i < fps; i++) player.update(1 / fps, { forward: true });
    return { velocity: player.velocity.z, bob: player.bobAmount };
  });
  for (const result of results) {
    assert.ok(Math.abs(result.velocity - results[1].velocity) < 0.0001);
    assert.ok(Math.abs(result.bob - results[1].bob) < 0.0001);
  }
});

test("settings tolerate corrupt/unavailable storage and clamp unsafe values", () => {
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(
    normalizeSettings({ volume: 900, fov: 1, sensitivity: NaN, motion: "no" }),
    { ...DEFAULT_SETTINGS, volume: 100, fov: 65 },
  );
  globalThis.localStorage = {
    getItem: () => "{broken",
    setItem: () => {
      throw Error("denied");
    },
  };
  assert.deepEqual(readSettings(), DEFAULT_SETTINGS);
  assert.equal(writeSettings({ volume: 0 }).volume, 0);
  let saved;
  globalThis.localStorage = {
    getItem: () => saved,
    setItem: (_, value) => {
      saved = value;
    },
  };
  writeSettings({ volume: 25, fov: 90, sensitivity: 6, motion: false });
  assert.deepEqual(readSettings(), {
    volume: 25,
    fov: 90,
    sensitivity: 6,
    motion: false,
  });
});

test("master volume affects the shared audio output, including zero for mute", () => {
  dom();
  const destination = {};
  window.AudioContext = class {
    destination = destination;
    currentTime = 0;
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime(value) {
            this.value = value;
          },
        },
        connect(node) {
          this.output = node;
        },
      };
    }
  };
  AudioManager.audioContext = null;
  AudioManager.masterGain = null;
  AudioManager.setVolume(0.25);
  const output = AudioManager.getOutput();
  assert.equal(output.output, destination);
  assert.equal(output.gain.value, 0.25);
  AudioManager.setVolume(0);
  assert.equal(output.gain.value, 0);
  AudioManager.audioContext = null;
  AudioManager.masterGain = null;
});

test("physics cannot move the player through a wall before collision resolution", async () => {
  dom();
  const { PhysicsManager } = await import("../modules/PhysicsManager.js");
  const scene = new THREE.Scene();
  const physics = new PhysicsManager(scene);
  const player = new Player(new THREE.PerspectiveCamera());
  const collision = new CollisionSystem();
  physics.registerEntity(player, {
    integrateHorizontal: false,
    groundOffset: 1.7,
  });
  const walls = [
    { min: new THREE.Vector3(1, 0, -10), max: new THREE.Vector3(1.2, 4, 10) },
  ];
  for (let frame = 0; frame < 180; frame++) {
    player.velocity.x = 10;
    const before = player.position.x;
    physics.update(1 / 60, walls);
    assert.equal(
      player.position.x,
      before,
      "physics must leave horizontal integration to collision",
    );
    collision.checkPlayerWallCollisions(player, walls, 1 / 60, {}, []);
  }
  assert.ok(player.position.x < 1 - collision.margin);
  assert.equal(player.position.y, 1.7);
});

for (const action of ["restartLevel", "quitToTitle"]) {
  test(`${action} clears the game transition guard so chapter doors remain usable`, async () => {
    dom();
    document.body.classList = { remove() {} };
    document.exitPointerLock = () => {};
    const game = new Game();
    game.player = new Player(new THREE.PerspectiveCamera());
    game.currentLevel = "chapel";
    game.levelStates = new Map([["chapel", { chapelCleansed: true }]]);
    game.isTransitioning = true;
    game.zoneManager = {
      activeTransition: { from: "chapel", to: "armory" },
      _deferredLoadResolve() {},
    };
    game.pauseGame = () => {};
    game.loadLevel = async () => {};
    game.updateHUD = () => {};
    game.cleanupPerformanceSystems = () => {};
    game.hideInteractPrompt = () => {};

    await game[action]();

    assert.equal(game.isTransitioning, false, "chapter doors check the Game transition guard");
    assert.equal(game.zoneManager.activeTransition, null);
    assert.equal(game.zoneManager._deferredLoadResolve, null);
  });
}
