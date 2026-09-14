import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "artifacts");
mkdirSync(output, { recursive: true });
const port = 5180;
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

  await page.locator("[data-action=raid-menu]:visible").click();
  await page.locator("[data-action=launch-raid]").click();
  await page.waitForFunction(() => window.__lastLightTest.transition === 0);
  await page.waitForFunction(
    () => document.pointerLockElement === window.__lastLightTest.canvas,
  );

  // Keep an actual enemy in an unobstructed lane, with no other attackers.
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.allies = [];
    g.sim.enemies = g.sim.enemies.filter((e) =>
      ["relay", "reactor"].includes(e.kind),
    );
    g.sim.guardTimer = 1000;
    const guard = g.sim.spawnGuard(-28, -16);
    guard.speed = 0;
    guard.damage = 0;
    guard.cooldown = 1000;
    guard.hp = guard.maxHp = 10000;
    window.sightTargetId = guard.id;
    g.sim.player.x = -34;
    g.sim.player.z = -16;
    g.yaw = -Math.PI / 2;
    g.pitch = 0;
    g.transition = 0;
    g.updateCamera(1);
    g.ui.bannerTimer = g.ui.noticeTimer = 0;
    g.ui.update(0);
  });

  async function sightState() {
    return page.evaluate(() => {
      const g = window.__lastLightTest;
      const model = g.weaponModels[g.weaponType];
      g.weaponScene.updateMatrixWorld(true);
      g.weaponCamera.updateMatrixWorld(true);
      const point = model.userData.sight
        .getWorldPosition(g.camera.position.clone())
        .project(g.weaponCamera);
      const ray = new g.raycaster.constructor();
      ray.setFromCamera({ x: 0, y: 0 }, g.weaponCamera);
      const isVisible = (object) => {
        for (let node = object; node; node = node.parent)
          if (!node.visible) return false;
        return true;
      };
      const isSight = (object) => {
        for (let node = object; node; node = node.parent)
          if (node === model.userData.sight) return true;
        return false;
      };
      const blockers = ray
        .intersectObject(model, true)
        .filter(
          (hit) =>
            isVisible(hit.object) &&
            !isSight(hit.object) &&
            !hit.object.material.transparent,
        );
      return {
        weapon: g.weaponType,
        x: point.x,
        y: point.y,
        blockers: blockers.length,
        aim: g.aimBlend,
        reticle: model.userData.reticle?.visible,
        lensOpacity: model.userData.lens?.material.opacity,
        crosshair: getComputedStyle(document.querySelector("#crosshair"))
          .opacity,
        hp: g.sim.enemies.find((e) => e.id === window.sightTargetId).hp,
        ammo: g.ammo[g.weaponType],
      };
    });
  }
  function assertAligned(state) {
    assert.ok(
      Math.abs(state.x) < 1e-7 && Math.abs(state.y) < 1e-7,
      `Sight must align with the firing point: ${JSON.stringify(state)}`,
    );
    assert.equal(
      state.blockers,
      0,
      "Weapon housing must not block the sight line",
    );
    assert.equal(state.crosshair, "0", "The weapon sight replaces the HUD dot");
  }
  await page.mouse.down({ button: "right" });
  await page.waitForFunction(() => window.__lastLightTest.aimBlend === 1);
  let state = await sightState();
  assert.equal(state.weapon, "rifle");
  assert.equal(state.reticle, true);
  assert.ok(state.lensOpacity < 0.1, "Targets remain visible through the lens");
  assertAligned(state);
  await page.screenshot({ path: join(output, "rifle-sight.png") });
  console.log(
    "PASS: Right mouse aligns the rifle reflex sight with an unobstructed view",
  );

  const initialHp = state.hp;
  await page.mouse.down({ button: "left" });
  await page.waitForFunction(() => {
    const g = window.__lastLightTest;
    return g.sim.enemies.find((e) => e.id === window.sightTargetId).hp < 10000;
  });
  assertAligned(await sightState());
  await page.mouse.up({ button: "left" });
  assert.ok(
    (await sightState()).hp < initialHp,
    "Real mouse fire hits the target under the reticle",
  );
  await page.keyboard.down("KeyW");
  await page.waitForFunction(() => window.__lastLightTest.sim.player.x > -33);
  assertAligned(await sightState());
  await page.keyboard.up("KeyW");
  console.log(
    "PASS: Shots hit the sighted target; recoil and movement retain alignment",
  );

  await page.keyboard.press("KeyR");
  await page.waitForFunction(
    () =>
      window.__lastLightTest.reloadTimer > 0 &&
      window.__lastLightTest.aimBlend < 1,
  );
  state = await sightState();
  assert.equal(
    state.reticle,
    false,
    "Reticle is hidden while the weapon is lowered to reload",
  );
  assert.equal(state.crosshair, "1");
  await page.waitForFunction(
    () =>
      window.__lastLightTest.reloadTimer === 0 &&
      window.__lastLightTest.aimBlend === 1,
  );
  state = await sightState();
  assert.equal(state.ammo, 32);
  assertAligned(state);

  await page.keyboard.press("KeyQ");
  await page.waitForFunction(
    () => window.__lastLightTest.weaponType === "shotgun",
  );
  assertAligned(await sightState());
  await page.screenshot({ path: join(output, "shotgun-sight.png") });
  const beforeShotgun = (await sightState()).hp;
  await page.mouse.down({ button: "left" });
  await page.waitForFunction((hp) => {
    const g = window.__lastLightTest;
    return g.sim.enemies.find((e) => e.id === window.sightTargetId).hp < hp;
  }, beforeShotgun);
  await page.mouse.up({ button: "left" });
  assertAligned(await sightState());
  console.log(
    "PASS: Reload restores the rifle sight; shotgun iron sights align and hit",
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(
    () => window.__lastLightTest.renderer.domElement.clientWidth === 1440,
  );
  assertAligned(await sightState());
  await page.mouse.up({ button: "right" });
  await page.waitForFunction(() => window.__lastLightTest.aimBlend === 0);
  assert.equal((await sightState()).crosshair, "1");
  await page.keyboard.press("KeyQ");
  await page.waitForFunction(
    () => window.__lastLightTest.weaponType === "rifle",
  );
  assert.equal((await sightState()).reticle, false);
  await page.mouse.down({ button: "right" });
  await page.waitForFunction(() => window.__lastLightTest.aimBlend === 1);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__lastLightTest.paused);
  assert.equal(await page.evaluate(() => window.__lastLightTest.aiming), false);
  await page.mouse.up({ button: "right" });
  console.log(
    "PASS: Resize, return to hip fire, weapon switch, and pause clear aiming correctly",
  );
  assert.deepEqual(errors, [], "No browser or WebGL errors");
} catch (error) {
  console.error(serverLog);
  throw error;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
