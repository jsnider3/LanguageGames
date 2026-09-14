import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "artifacts");
mkdirSync(output, { recursive: true });
const port = 5179;
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
  await page.screenshot({ path: join(output, "military-menu.png") });
  await page.locator("[data-action=new]:visible").click();
  await page.keyboard.press("Escape");
  await page.locator("[data-bk=menu]:visible").click();
  const defenseSave = await page.evaluate(() =>
    localStorage.getItem("last-light.bunker.v1"),
  );
  await page.locator("[data-action=raid-menu]:visible").click();
  assert.match(
    await page.locator("#overlay-content").innerText(),
    /SOLO \+ AI SQUAD/,
  );
  await page.locator('[data-action=choose-base][data-base="1"]').click();
  assert.match(
    await page.locator(".selected-base").innerText(),
    /Iron Citadel/,
  );
  await page.locator('[data-action=choose-base][data-base="0"]').click();
  await page.locator("[data-action=launch-raid]").click();
  await page.waitForFunction(() => window.__lastLightTest.transition === 0);
  let state = await page.evaluate(() => window.lastLight.getState());
  assert.ok(
    await page.evaluate(() => {
      const s = window.__lastLightTest.sim;
      return s.allies.every((u) => !s.navigation.blocked(u.x, u.z));
    }),
    "insertion points must be walkable",
  );
  assert.equal(state.operation, "raid");
  assert.equal(state.mode, "fps");
  assert.equal(state.squad.length, 6);
  assert.equal(state.relays, 2);
  assert.equal(await page.locator("#build-dock").isVisible(), false);
  assert.equal(await page.locator("#squad-panel").isVisible(), true);
  await page.keyboard.press("Digit3");
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().order),
    "hold",
  );
  await page.keyboard.press("Digit2");
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().order),
    "advance",
  );
  await page.keyboard.press("Digit1");
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().order),
    "follow",
  );
  await page.keyboard.press("KeyE");
  await page.waitForFunction(
    () => window.lastLight.getState().squad.length === 10,
  );
  await page.keyboard.down("KeyC");
  await page.waitForFunction(() => window.lastLight.getState().player.y < 1.2);
  await page.keyboard.up("KeyC");
  await page.waitForFunction(() => window.lastLight.getState().player.y > 1.7);
  console.log(
    "PASS: Raid deployment, squad controls, reinforcement and crouch",
  );

  // Look back at the deployed fireteam, with the fortified outpost in view.
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.player.x = -40;
    g.sim.player.z = -16;
    g.yaw = 2.4;
    g.pitch = -0.03;
    g.transition = 0;
    g.updateCamera(1);
    g.ui.bannerTimer = 0;
    g.ui.noticeTimer = 0;
    g.ui.update(0);
  });
  await page.screenshot({ path: join(output, "assault-squad.png") });

  // Exercise the real FPS raycast against a shield relay, with other attackers held back.
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.allies = [];
    g.sim.enemies = g.sim.enemies.filter((e) =>
      ["relay", "reactor"].includes(e.kind),
    );
    g.sim.guardTimer = 1000;
    g.sim.player.x = -18;
    g.sim.player.z = -24;
    g.yaw = -Math.PI / 2;
    g.pitch = 0;
    g.transition = 0;
    g.updateCamera(1);
    g.sim.relays[0].hp = 55;
    g.rebuildRaidNavigation();
  });
  await page.keyboard.press("KeyF");
  assert.ok(await page.evaluate(() => window.__lastLightTest.sim.focusId));
  await page.mouse.down();
  await page.waitForFunction(() => window.lastLight.getState().relays === 1);
  await page.mouse.up();
  assert.ok(
    (await page.evaluate(() => window.lastLight.getState().ammo.rifle)) < 32,
  );
  const helmetHit = await page.evaluate(() => {
    const g = window.__lastLightTest,
      guard = g.sim.spawnGuard(-12, -24);
    g.camera.lookAt(guard.x, 2.3, guard.z);
    g.fireTimer = 0;
    g.shoot();
    return guard.hp < guard.maxHp;
  });
  assert.equal(
    helmetHit,
    true,
    "FPS bullets must register on the full height of an infantry helmet",
  );
  const shielded = await page.evaluate(() => {
    const s = window.__lastLightTest.sim;
    const hp = s.reactor.hp;
    s.damage(s.reactor, 10000);
    return s.reactor.hp === hp;
  });
  assert.equal(shielded, true);
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.damage(g.sim.relays[0], 10000);
    g.sim.damage(g.sim.reactor, 10000);
  });
  await page.waitForFunction(
    () => window.lastLight.getState().phase === "victory",
  );
  assert.match(
    await page.locator("#overlay-content").innerText(),
    /Stronghold broken/,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("last-light.bunker.v1")),
    defenseSave,
  );
  await page.locator("[data-action=retry]:visible").click();
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().relays),
    2,
  );
  console.log(
    "PASS: FPS damages enemy structures, relay shield gates victory, raid retry preserves defense save",
  );

  // Simulate a whole raid with the real scene collision and visibility, without render-speed dependence.
  const battle = await page.evaluate(() => {
    const g = window.__lastLightTest,
      s = g.sim;
    g.switchMode("command");
    s.command("advance");
    for (let i = 0; i < 30 * 240 && s.phase === "wave"; i++) {
      s.update(1 / 30);
      for (const e of s.drainEvents())
        if (e.type === "killed" && e.enemy.kind !== "trooper")
          g.rebuildRaidNavigation();
      if (s.allies.length < 5 && s.credits >= 120) s.reinforce();
    }
    const result = {
      phase: s.phase,
      time: s.time,
      kills: s.kills,
      relays: s.relays.length,
      hp: s.coreHp,
      squad: s.allies.map((u) => ({ type: u.type, x: u.x, z: u.z })),
    };
    g.paused = true;
    return result;
  });
  console.log("World raid simulation:", JSON.stringify(battle));
  assert.equal(
    battle.phase,
    "victory",
    "squad should complete the starter base around real world obstacles",
  );

  await page.evaluate(() => window.__lastLightTest.startWorkshop());
  await page.waitForFunction(() => window.__lastLightTest.transition === 0);
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.selectedPad = 1;
    g.selectedType = "rail";
    g.buildSelected();
    g.upgradeSelected();
  });
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().credits),
    4368,
  );
  await page.evaluate(() => window.__lastLightTest.sellSelected());
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().credits),
    4800,
    "workshop salvage should refund full investment",
  );
  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.buildSelected();
    g.upgradeSelected();
  });
  await page.locator("[data-action=share-base]:visible").click();
  await page.locator("#base-name").fill('Josh’s Citadel & "North"');
  await page.locator("[data-action=refresh-code]").click();
  const code = await page.locator("#base-code").inputValue();
  assert.ok(code.startsWith("LLB1."));
  await page.locator("[data-action=close]:visible").click();
  await page.keyboard.press("Escape");
  await page.locator("[data-action=menu]:visible").click();
  await page.locator("[data-action=raid-menu]:visible").click();
  await page.locator(".import-base summary").click();
  await page.locator("#import-code").fill("LLB1.broken");
  await page.locator("[data-action=import-base]").click();
  assert.match(await page.locator("#base-error").innerText(), /invalid/);
  await page.locator("#import-code").fill(code);
  await page.locator("[data-action=import-base]").click();
  assert.match(
    await page.locator(".selected-base").innerText(),
    /Josh’s Citadel & "North"/,
  );
  await page.locator("[data-action=launch-raid]").click();
  state = await page.evaluate(() => window.lastLight.getState());
  assert.equal(state.raidTargets.filter((e) => e.kind === "turret").length, 1);
  assert.equal(state.raidTargets.find((e) => e.kind === "turret").type, "rail");
  console.log(
    "PASS: Workshop build, upgrade, full refund, export, invalid import and shared base assault",
  );

  await page.evaluate(() => {
    const g = window.__lastLightTest;
    g.sim.tickets = 1;
    g.sim.player.active = true;
    g.sim.hurtPlayer(1000);
  });
  await page.waitForFunction(
    () =>
      window.lastLight.getState().phase === "defeat" &&
      document
        .querySelector("#overlay-content")
        .textContent.includes("Regroup. Rearm"),
  );
  assert.match(
    await page.locator("#overlay-content").innerText(),
    /Regroup. Rearm/,
  );
  await page.locator("[data-action=workshop]:visible").click();
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().towers[0].level),
    2,
  );
  await page.keyboard.press("Escape");
  await page.locator("[data-action=menu]:visible").click();
  await page.locator("[data-action=continue]:visible").click();
  assert.equal(
    await page.evaluate(() => window.lastLight.getState().operation),
    "defense",
  );
  assert.equal(await page.locator("#squad-panel").isVisible(), false);
  assert.equal(await page.locator("#bunker-ui").isVisible(), true);
  assert.equal(await page.evaluate(() => window.lastLight.getState().scenario), "bunker");
  console.log(
    "PASS: Raid defeat, workshop persistence and independent defense checkpoint",
  );
  await page.keyboard.press("Escape");
  await page.locator("[data-bk=menu]:visible").click();
  await page.setViewportSize({ width: 960, height: 600 });
  const workshop = await page
    .locator("[data-action=workshop]:visible")
    .boundingBox();
  assert.ok(workshop.y + workshop.height < 550);
  assert.deepEqual(errors, [], "No JavaScript or WebGL errors");
  console.log(`Raid browser verification complete. Screenshots: ${output}`);
} catch (error) {
  console.error(error);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
