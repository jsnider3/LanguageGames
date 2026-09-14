import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "artifacts");
mkdirSync(output, { recursive: true });
const port = 5181;
const server = spawn(
  process.execPath,
  [
    join(root, "node_modules/vite/bin/vite.js"),
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: "pipe" },
);
let serverLog = "";
server.stdout.on("data", (d) => {
  serverLog += d;
});
server.stderr.on("data", (d) => {
  serverLog += d;
});
let browser;
function executable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = join(homedir(), ".cache/ms-playwright");
  if (existsSync(cache))
    for (const entry of readdirSync(cache)
      .filter((n) => n.startsWith("chromium-"))
      .sort()
      .reverse()) {
      for (const subdir of ["chrome-linux", "chrome-linux64"]) {
        const candidate = join(cache, entry, subdir, "chrome");
        if (existsSync(candidate)) return candidate;
      }
    }
  throw new Error("Chromium not found. Run npx playwright install chromium.");
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, `Vite failed to start: ${serverLog}`);
  browser = await chromium.launch({
    headless: true,
    executablePath: executable(),
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on(
    "pageerror",
    (error) => (errors.push(error.message), console.error(error.message)),
  );
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() =>
    localStorage.setItem(
      "last-light.settings.v1",
      JSON.stringify({
        quality: "low",
        volume: 0,
        music: false,
        shake: false,
        sensitivity: 1,
        difficulty: "normal",
      }),
    ),
  );
  await page.goto(`http://127.0.0.1:${port}/?test=1`);
  await page.waitForFunction(() => !!window.__lastLightTest, null, {
    timeout: 120000,
  });
  // Software rasterization uses a reduced internal resolution; UI and hit tests retain full viewport coordinates.
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.renderer.setPixelRatio(0.5);
    g.resize();
  });
  await page.waitForFunction(() =>
    document.querySelector("#loading").classList.contains("loaded"),
  );

  // Outdoor gates remain in the assault/workshop environment. Exercise their
  // legacy wave fixture directly; the public defense entry now launches the bunker.
  await page.evaluate(() => window.__lastLightTest.startLegacyDefense());
  await page.waitForFunction(() => window.__lastLightTest.transition === 0);
  await page.keyboard.press("Tab");
  await page.waitForFunction(
    () =>
      document.pointerLockElement !== null &&
      window.__lastLightTest.transition === 0,
  );
  async function faceGate(index) {
    await page.evaluate((index) => {
      const g = window.__lastLightTest;
      g.sim.player.x = -35;
      g.sim.player.z = g.world.gates[index].z;
      g.yaw = Math.PI / 2;
      g.pitch = 0.15;
      g.updateCamera(1);
      g.ui.bannerTimer = g.ui.noticeTimer = 0;
      g.ui.update(0);
    }, index);
  }
  async function states() {
    return page.evaluate(() =>
      window.lastLight.getState().breaches.map((b) => b.status),
    );
  }
  async function assertEntrance(index, open) {
    const result = await page.evaluate((index) => {
      const g = window.__lastLightTest;
      const gate = g.world.gates[index];
      g.world.staticWorld.updateMatrixWorld(true);
      gate.root.updateMatrixWorld(true);
      const ray = new g.raycaster.constructor();
      const staticHits = [],
        doorHits = [],
        approachHits = [];
      for (const y of [0.5, 1.8, 3.5, 5.8])
        for (const offset of [-2.4, 0, 2.4]) {
          ray.set(
            g.camera.position.clone().set(-43, y, gate.z + offset),
            g.camera.position.clone().set(-1, 0, 0),
          );
          ray.far = 28;
          const solid = (objects) =>
            ray
              .intersectObjects(objects, true)
              .filter((hit) => !hit.object.material.transparent);
          staticHits.push(solid([g.world.staticWorld]).length);
          doorHits.push(solid([gate.root]).length);
        }
      // Check the view beyond the gate, not only its immediate walkable corridor.
      for (const y of [1.8, 3.5, 5])
        for (const offset of [-1, 0, 1]) {
          const from = g.camera.position.clone().set(-35, 1.8, gate.z);
          const direction = from
            .clone()
            .set(gate.x, y, gate.z + offset)
            .sub(from)
            .normalize();
          ray.set(from, direction);
          ray.far = 140;
          approachHits.push(
            ray
              .intersectObject(g.world.staticWorld, true)
              .filter((hit) => !hit.object.material.transparent).length,
          );
        }
      ray.set(
        g.camera.position.clone().set(-43, 1.8, gate.z),
        g.camera.position.clone().set(-1, 0, 0),
      );
      return {
        staticHits,
        doorHits,
        approachHits,
        obstruction: g.obstructionDistance(ray.ray, 28),
        collision: g.world.collides(gate.x, gate.z, []),
        sight: g.world.lineOfSight(
          { x: -43, y: 1.8, z: gate.z },
          { x: -71, y: 1.8, z: gate.z },
        ),
        visibleSign: Object.entries(gate.statuses)
          .filter(([, sign]) => sign.visible)
          .map(([text]) => text),
      };
    }, index);
    assert.ok(
      result.staticHits.every((n) => n === 0),
      `Breach ${index + 1} has permanent scenery blocking its passage: ${JSON.stringify(result)}`,
    );
    assert.ok(
      result.approachHits.every((n) => n === 0),
      `Rock face obscures the view beyond breach ${index + 1}: ${JSON.stringify(result)}`,
    );
    assert.ok(
      result.doorHits.every((n) => (open ? n === 0 : n > 0)),
      `Breach ${index + 1} shutter geometry must match its state: ${JSON.stringify(result)}`,
    );
    assert.equal(result.collision, !open);
    assert.equal(result.sight, open);
    assert.ok(open ? result.obstruction === 28 : result.obstruction < 5);
    assert.deepEqual(result.visibleSign, [open ? "OPEN" : "SEALED"]);
  }
  assert.deepEqual(await states(), ["SEALED", "SEALED"]);
  await assertEntrance(0, false);
  await assertEntrance(1, false);
  await faceGate(0);
  await page.screenshot({ path: join(output, "breach-north-sealed.png") });
  console.log(
    "PASS: Both sealed gates have solid shutters; neither entrance has permanent rocks across its passage",
  );

  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => window.lastLight.getState().breaches[0].status === "OPEN",
  );
  assert.deepEqual(await states(), ["OPEN", "SEALED"]);
  await assertEntrance(0, true);
  await assertEntrance(1, false);
  await page.waitForFunction(() => window.__lastLightTest.sim.spawned > 0);
  assert.ok(
    await page.evaluate(() =>
      window.__lastLightTest.sim.enemies.every((e) => e.routeIndex === 0),
    ),
  );
  await faceGate(0);
  assert.match(await page.locator("#breach-0").innerText(), /OPEN$/);
  assert.match(await page.locator("#breach-1").innerText(), /SEALED$/);
  await page.screenshot({ path: join(output, "breach-north-open.png") });
  assert.ok(await page.evaluate(() => {
    const g = window.__lastLightTest;
    for (let x = -35; x >= -47; x -= 0.25)
      if (g.world.collides(x, -16, [])) return false;
    g.sim.player.x = -44;
    return true;
  }), "The whole approach lane must be clear for the operator");
  await page.keyboard.down("KeyW");
  await page.waitForFunction(() => window.__lastLightTest.sim.player.x < -46.9);
  await page.keyboard.up("KeyW");
  console.log(
    "PASS: Wave 1 opens only the north gate; enemies use that lane and the FPS approach is unobstructed",
  );

  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.queue = [];
    g.sim.enemies = [];
  });
  await page.waitForFunction(
    () =>
      window.__lastLightTest.sim.phase === "build" &&
      window.lastLight.getState().breaches.every((b) => b.status === "SEALED"),
  );
  await page.keyboard.down("KeyS");
  await page.waitForFunction(() => window.__lastLightTest.sim.player.x > -45);
  await page.keyboard.up("KeyS");
  await assertEntrance(0, false);
  console.log(
    "PASS: Preparation closes the gate and restores its collision without trapping the player",
  );

  // Use a preparation checkpoint before the first split wave, then launch normally.
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.wave = 3;
    g.saveCheckpoint();
  });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    window.lastLight.getState().breaches.every((b) => b.status === "OPEN"),
  );
  await page.waitForFunction(() =>
    window.__lastLightTest.sim.enemies.some((e) => e.routeIndex === 1),
  );
  await assertEntrance(0, true);
  await assertEntrance(1, true);
  await faceGate(1);
  assert.match(await page.locator("#breach-1").innerText(), /OPEN$/);
  await page.screenshot({ path: join(output, "breach-south-open.png") });
  console.log(
    "PASS: Wave 4 opens both gates, including a clear south passage and matching HUD/signs",
  );

  await page.evaluate(() => window.__lastLightTest.retry());
  await page.waitForFunction(
    () => window.__lastLightTest.sim.phase === "build",
  );
  assert.equal(await page.evaluate(() => window.__lastLightTest.sim.wave), 3);
  assert.deepEqual(await states(), ["SEALED", "SEALED"]);
  await page.evaluate(() => window.__lastLightTest.startRaid());
  assert.deepEqual(await states(), ["OPEN", "OPEN"]);
  await assertEntrance(0, true);
  await assertEntrance(1, true);
  assert.ok(
    await page.evaluate(() => {
      const s = window.__lastLightTest.sim;
      return s.allies.every((u) => !s.navigation.blocked(u.x, u.z));
    }),
  );
  await page.evaluate(() => window.__lastLightTest.startWorkshop());
  assert.deepEqual(await states(), ["SEALED", "SEALED"]);
  await page.evaluate(() => window.__lastLightTest.startLegacyDefense());
  assert.deepEqual(await states(), ["SEALED", "SEALED"]);
  assert.deepEqual(errors, [], "No browser or WebGL errors");
  console.log(
    "PASS: Checkpoint retry, raids, workshop, and new games reset gates and collisions correctly",
  );
} catch (error) {
  console.error(serverLog);
  throw error;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
