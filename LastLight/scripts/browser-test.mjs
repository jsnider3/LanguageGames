import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const port = 5178, output = 'artifacts';
mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let log = '', browser;
server.stdout.on('data', d => log += d); server.stderr.on('data', d => log += d);
function executable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = join(homedir(), '.cache/ms-playwright');
  for (const entry of readdirSync(cache).filter(n => n.startsWith('chromium-')).sort().reverse())
    for (const dir of ['chrome-linux', 'chrome-linux64']) { const path = join(cache, entry, dir, 'chrome'); if (existsSync(path)) return path; }
  throw new Error('Install Chromium with npx playwright install chromium');
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert.ok(ready, log);
  browser = await chromium.launch({ executablePath: executable(), headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); page.setDefaultTimeout(45000);
  const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error(e.message); }); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('last-light.settings.v1', JSON.stringify({ quality: 'low', volume: 0, music: false, shake: false, sensitivity: 1, difficulty: 'normal' })));
  await page.goto(`http://127.0.0.1:${port}/?test=1`);
  await page.waitForFunction(() => !!window.__lastLightTest);
  await page.evaluate(() => { const g = window.__lastLightTest; g.renderer.setPixelRatio(.35); g.resize(); });
  await page.locator('[data-action=new]:visible').click();
  await page.waitForFunction(() => window.lastLight.getState().scenario === 'bunker' && !!document.pointerLockElement);
  assert.equal(await page.evaluate(() => window.lastLight.getState().mode), 'fps');
  console.log('PASS: Main menu launches directly into first-person bunker defense');
  async function capture(name) {
    await page.evaluate(() => { const g = window.__lastLightTest; g.renderer.setPixelRatio(.85); g.resize(); });
    await page.screenshot({ path: join(output, name), timeout: 60000 });
    await page.evaluate(() => { const g = window.__lastLightTest; g.renderer.setPixelRatio(.35); g.resize(); });
  }
  await capture('bunker-control.png');
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => window.lastLight.getState().player.z < 6);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__lastLightTest.bunker.jump > .1);
  await page.waitForFunction(() => window.__lastLightTest.bunker.jump === 0);
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => window.lastLight.getState().mode === 'map');
  await capture('bunker-floorplan.png');
  assert.ok(await page.locator('#bk-map').isVisible());
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => !!document.pointerLockElement);
  console.log('PASS: Walking, jumping, live floor plan and mouse recapture');
  // Place the operator at a real control; all interactions below use the actual keyboard path.
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; Object.assign(g.sim.player, { x: -4.5, z: 0 }); g.yaw = Math.PI / 2; g.pitch = 0; });
  await page.waitForFunction(() => window.__lastLightTest.bunker.target?.id === 'west-wall');
  const before = await page.evaluate(() => window.lastLight.getState().credits);
  await page.keyboard.down('KeyE');
  await page.waitForFunction(() => window.lastLight.getState().barriers[2].hp > 115);
  await capture('bunker-welding.png');
  await page.keyboard.up('KeyE');
  assert.ok(await page.evaluate(() => window.lastLight.getState().credits) < before);
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; const b = g.sim.barriers[0]; g.sim.damageBarrier(b, 999); Object.assign(g.sim.player, { x: -4.5, z: -5.3 }); g.yaw = Math.PI / 2; });
  await page.waitForFunction(() => window.__lastLightTest.bunker.target?.id === 'west-door');
  await page.keyboard.down('KeyE');
  await page.waitForFunction(() => window.lastLight.getState().barriers[0].hp > 0);
  await page.keyboard.up('KeyE');
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => window.lastLight.getState().barriers[0].open);
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => !window.lastLight.getState().barriers[0].open);
  console.log('PASS: Welding spends scrap; jammed doors reset, open and seal by hand');
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; Object.assign(g.sim.player, { x: -3, z: -8 }); g.yaw = 0; });
  await page.waitForFunction(() => window.__lastLightTest.bunker.target?.id === 'west-turret');
  await page.keyboard.down('KeyE');
  await page.waitForFunction(() => window.lastLight.getState().towers[0].level === 1);
  await page.keyboard.up('KeyE');
  await page.keyboard.press('Escape');
  await page.locator('[data-bk=menu]:visible').click();
  await page.reload();
  await page.waitForFunction(() => !!window.__lastLightTest);
  await page.evaluate(() => { const g = window.__lastLightTest; g.renderer.setPixelRatio(.35); g.resize(); });
  await page.locator('[data-action=continue]:visible').click();
  await page.waitForFunction(() => !!document.pointerLockElement);
  assert.equal(await page.evaluate(() => window.lastLight.getState().towers[0].level), 1);
  console.log('PASS: Sentry construction and independent bunker checkpoint survive reload');
  // A deterministic fixture tests the actual raycast against a closed door and a live target.
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; const s = g.sim; Object.assign(s.player, { x: -4, z: -7 }); g.yaw = Math.PI / 2; g.pitch = 0; s.enemies = []; const e = s.spawn('grunt', 'west-door'); e.x = -9; e.z = -7; s.barriers[0].hp = 180; s.barriers[0].open = false; });
  await page.mouse.down(); await page.waitForFunction(() => window.lastLight.getState().ammo.rifle <= 28); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.__lastLightTest.bunker.sim.enemies[0].hp), 95);
  await page.evaluate(() => window.__lastLightTest.bunker.sim.barriers[0].open = true);
  await page.mouse.down(); await page.waitForFunction(() => window.lastLight.getState().playerKills > 0); await page.mouse.up();
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => window.lastLight.getState().ammo.rifle === 32);
  await page.keyboard.press('KeyQ'); assert.equal(await page.evaluate(() => window.lastLight.getState().weapon), 'shotgun');
  await page.mouse.down({ button: 'right' });
  await page.waitForFunction(() => window.__lastLightTest.bunker.aimBlend === 1);
  await capture('bunker-sight.png');
  await page.mouse.up({ button: 'right' });
  await page.keyboard.press('KeyG');
  await page.waitForFunction(() => window.__lastLightTest.bunker.grenadeCooldown > 0);
  console.log('PASS: Walls stop bullets; actual rifle hits, reload, shotgun sights and grenades');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.lastLight.getState().wave === 1 && window.lastLight.getState().enemies > 0);
  await page.keyboard.press('Escape');
  const pausedTime = await page.evaluate(() => window.__lastLightTest.bunker.sim.time);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__lastLightTest.bunker.sim.time), pausedTime);
  await page.locator('[data-bk=settings]:visible').click();
  await page.locator('#bk-panel input[data-setting=volume]').fill('0.2');
  await page.locator('[data-bk=resume]:visible').click();
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; g.sim.coreHp = 0; });
  await page.waitForFunction(() => window.lastLight.getState().phase === 'defeat');
  await page.locator('[data-bk=retry]:visible').click();
  await page.waitForFunction(() => window.lastLight.getState().phase === 'build');
  assert.equal(await page.evaluate(() => window.lastLight.getState().wave), 0);
  await page.evaluate(() => { const g = window.__lastLightTest.bunker; g.sim.wave = 11; g.startWave(); g.sim.queue = []; g.sim.enemies = []; });
  await page.waitForFunction(() => window.lastLight.getState().phase === 'victory');
  assert.match(await page.locator('#bk-panel').innerText(), /The light holds/);
  await page.locator('[data-bk=menu]:visible').click();
  // Existing assault and workshop flows still launch on their own outdoor map.
  await page.locator('[data-action=raid-menu]:visible').click(); await page.locator('[data-action=launch-raid]').click();
  await page.waitForFunction(() => window.lastLight.getState().operation === 'raid');
  await page.keyboard.press('Escape'); await page.locator('[data-action=menu]:visible').click();
  await page.locator('[data-action=workshop]:visible').click();
  assert.equal(await page.evaluate(() => window.lastLight.getState().operation), 'workshop');
  assert.deepEqual(errors, [], 'No JavaScript or WebGL errors');
  console.log('PASS: Pause, settings, defeat/retry, victory, raid and workshop transitions');
  console.log(`Bunker browser verification complete. Screenshots: ${output}/bunker-*.png`);
} catch (error) { console.error(log); throw error; }
finally { await browser?.close(); server.kill('SIGTERM'); }
