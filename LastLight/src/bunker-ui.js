import { ROOMS, WALLS, REACTOR, BUNKER_WAVES } from "./bunker-data.js";
export const BUNKER_MANUAL = `<h2>Keep the bunker alive.</h2><p>Hold off twelve assaults in a compact interior. Fight in the entry rooms, fall back through the service loop, and stop hostiles from reaching the reactor.</p><div class="bk-manual"><p><b>FIGHT</b><br>WASD move · Shift sprint · C crouch · Space jump<br>Left mouse button fire · Right mouse button aim · R reload<br>Q rifle / shotgun · G grenade (12s recharge)</p><p><b>MAINTAIN</b><br>Look at a nearby panel or door control.<br>Hold E to weld, rebuild a wall, or reset a jammed motor.<br>F opens / seals a working door. Clear the opening first.<br>Hold E at a sentry mount to build (70 scrap) or upgrade (60).</p><p><b>SURVIVE</b><br>Repairs occupy your hands and spend scrap. Groups and breachers can damage barriers faster than you can repair them.<br>Tab shows the floor plan. Combat continues and your operator remains vulnerable.<br>Enter starts an assault. Escape pauses.<br>Three deployment lives; a downing also costs 60 reactor integrity.<br>Preparation saves automatically. Retry restores the preparation checkpoint for the assault.</p></div>`;
export class BunkerUI {
  constructor(game) {
    this.game = game; this.root = document.createElement("section"); this.root.id = "bunker-ui";
    this.root.innerHTML = `<header class="bk-top"><div class="bk-brand">△ LAST LIGHT<small>BUNKER 09 / <span id="bk-room">CONTROL</span></small></div><div class="bk-wave"><small id="bk-phase"></small><b id="bk-wave"></b></div><div class="bk-resources"><span>REACTOR <b id="bk-core"></b></span><span>SCRAP <b id="bk-scrap"></b></span><button data-bk="pause" aria-label="Pause">Ⅱ</button></div></header>
      <div id="bk-brief" class="bk-brief"></div><div id="bk-notice" role="status" aria-live="polite"></div>
      <aside class="bk-condition"><small>BUNKER INTEGRITY <span>TAB / MAP</span></small><div id="bk-barriers"></div></aside>
      <div id="bk-crosshair"></div><div id="bk-hit">×</div><div id="bk-hurt"></div>
      <div id="bk-interaction"><b id="bk-target"></b><span id="bk-use"></span><div class="bk-track"><i id="bk-work"></i></div></div>
      <div id="bk-prep"><button data-bk="wave">BEGIN ASSAULT <kbd>ENTER</kbd></button><small id="bk-prep-hint"></small></div>
      <footer class="bk-bottom"><div><small>OPERATOR <span id="bk-lives"></span></small><b id="bk-health"></b><div class="bk-track"><i id="bk-health-fill"></i></div></div><div class="bk-bottom-hint">E / MAINTAIN · F / DOOR<br><span>H / MANUAL · ESC / PAUSE</span></div><div class="bk-ammo"><small id="bk-weapon"></small><b id="bk-ammo"></b><span id="bk-reload"></span><small id="bk-grenade"></small></div></footer>
      <div id="bk-map" class="bk-map hidden"><div><small>BUNKER 09 / LIVE FLOOR PLAN</small><h2>Know your way back.</h2><canvas id="bk-map-canvas" width="720" height="560" aria-label="Bunker rooms, damaged barriers, hostiles and operator"></canvas><p>● YOU &nbsp; ● HOSTILES &nbsp; ▰ DOOR / WALL<br>Combat continues. Your operator remains exposed.</p><button data-bk="map">RETURN TO FIRST PERSON <kbd>TAB</kbd></button></div></div>
      <div id="bk-overlay" class="bk-overlay hidden"><div id="bk-panel"></div></div>`;
    document.body.append(this.root);
    this.e = Object.fromEntries([...this.root.querySelectorAll("[id]")].map(el => [el.id.replace("bk-", ""), el]));
    this.ctx = this.e["map-canvas"].getContext("2d");
    this.root.addEventListener("click", e => { const button = e.target.closest("[data-bk]"); if (button) game.action(button.dataset.bk); }, { signal: game.abort.signal });
    this.root.addEventListener("change", e => { if (e.target.dataset.setting) game.host.updateSetting(e.target.dataset.setting, e.target.type === "checkbox" ? e.target.checked : e.target.value); }, { signal: game.abort.signal });
  }
  notice(text) { this.e.notice.textContent = text; this.noticeUntil = this.game.sim.time + 4.5; }
  overlay(content) { this.e.panel.innerHTML = content; this.e.overlay.classList.remove("hidden"); }
  pause() { this.overlay(`<small>OPERATION PAUSED</small><h2>Take a breath.</h2><p>Preparation is saved. Retrying or leaving during an assault returns you to its preparation checkpoint.</p><div class="bk-buttons"><button data-bk="resume">RESUME</button><button data-bk="manual">FIELD MANUAL</button><button data-bk="settings">SETTINGS</button><button data-bk="retry">RETRY ASSAULT</button><button data-bk="menu">MAIN MENU</button></div>`); }
  manual() { this.overlay(`${BUNKER_MANUAL}<button data-bk="resume">RETURN TO BUNKER</button>`); }
  settings() {
    const s = this.game.host.settings;
    this.overlay(`<small>OPERATOR PREFERENCES</small><h2>Settings.</h2><div class="bk-settings"><label>Graphics<select data-setting="quality">${["high", "medium", "low"].map(q => `<option value="${q}" ${s.quality === q ? "selected" : ""}>${q.toUpperCase()}</option>`).join("")}</select></label><label>Volume<input data-setting="volume" type="range" min="0" max="1" step=".05" value="${s.volume}"></label><label>Sensitivity<input data-setting="sensitivity" type="range" min=".3" max="2.5" step=".1" value="${s.sensitivity}"></label><label>Music<input data-setting="music" type="checkbox" ${s.music ? "checked" : ""}></label><label>Camera shake<input data-setting="shake" type="checkbox" ${s.shake ? "checked" : ""}></label></div><button data-bk="resume">RETURN TO BUNKER</button>`);
  }
  result(won) { const s = this.game.sim; this.overlay(`<small>OPERATION ${won ? "COMPLETE" : "LOST"}</small><h2>${won ? "The light holds." : "The bunker falls."}</h2><p>${won ? "Extraction has your signal. You held off every assault and kept the reactor online." : "Return to the last preparation checkpoint. Repair a different barrier, use the service loop, and keep the reactor covered."}</p><div class="bk-results"><span><b>${s.playerKills}</b>PERSONAL KILLS</span><span><b>${s.resets}</b>BARRIERS RESTORED</span><span><b>${Math.ceil(s.coreHp / 5)}%</b>REACTOR</span></div><div class="bk-buttons"><button data-bk="${won ? "new" : "retry"}">${won ? "NEW OPERATION" : "RETRY ASSAULT"}</button><button data-bk="menu">MAIN MENU</button></div>`); }
  update() {
    const g = this.game, s = g.sim, e = this.e, wave = BUNKER_WAVES[Math.min(11, s.phase === "build" ? s.wave : s.wave - 1)];
    e.phase.textContent = s.phase === "build" ? "PREPARATION / CHECKPOINT" : `${s.enemies.length + s.queue.length} HOSTILES REMAIN`;
    e.wave.textContent = `${String(s.phase === "build" ? s.wave + 1 : s.wave).padStart(2, "0")} / 12  ·  ${wave.name}`;
    e.core.textContent = `${Math.ceil(s.coreHp / 5)}%`; e.scrap.textContent = Math.floor(s.credits);
    e.brief.textContent = wave.briefing; e.brief.classList.toggle("hidden", s.phase !== "build" && s.time > g.briefUntil);
    e.notice.classList.toggle("visible", s.time < this.noticeUntil);
    e.room.textContent = ROOMS.find(r => Math.abs(s.player.x - r.x) < r.w / 2 && Math.abs(s.player.z - r.z) < r.d / 2)?.name || "SERVICE PASSAGE";
    const status = s.barriers.map(b => `<div class="${b.hp <= 0 ? "broken" : b.hp < b.maxHp * .35 ? "critical" : ""}"><span>${b.name}</span><b>${b.hp <= 0 ? b.kind === "door" ? "JAMMED" : "BREACHED" : b.open ? "OPEN" : `${Math.ceil(b.hp / b.maxHp * 100)}%`}</b><i style="width:${b.hp / b.maxHp * 100}%"></i></div>`).join("");
    if (status !== this.lastStatus) { e.barriers.innerHTML = status; this.lastStatus = status; }
    e.health.textContent = Math.ceil(s.player.hp); e["health-fill"].style.width = `${s.player.hp}%`; e.lives.textContent = `${s.lives} LIVES`;
    e.weapon.textContent = g.weapon === "rifle" ? "AR-9 / PULSE RIFLE" : "SG-4 / BREACHER";
    e.ammo.textContent = `${g.ammo[g.weapon]} / ${g.weapon === "rifle" ? 32 : 8}`;
    e.reload.textContent = g.reloads[g.weapon] > 0 ? `RELOADING ${g.reloads[g.weapon].toFixed(1)}s` : "R / RELOAD · Q / SWITCH";
    e.grenade.textContent = g.grenadeCooldown > 0 ? `G / GRENADE ${Math.ceil(g.grenadeCooldown)}s` : "G / GRENADE READY";
    e.prep.classList.toggle("hidden", s.phase !== "build" || g.mode === "map" || !!g.target);
    e["prep-hint"].textContent = s.wave === 0 ? "Patch the workshop wall. Check the door controls. Build supporting sentries." : "Damage persists. Use this quiet moment to repair and rearm.";
    e.map.classList.toggle("hidden", g.mode !== "map");
    e.crosshair.classList.toggle("hidden", g.mode !== "fps" || g.paused || g.aimBlend > .95 || !!s.work);
    e.hit.style.opacity = g.hitTimer > 0 ? "1" : "0"; e.hurt.style.opacity = Math.min(.5, g.hurtTimer * 1.5);
    const b = g.target;
    e.interaction.classList.toggle("visible", !!b && g.mode === "fps" && !g.paused && !s.player.respawn);
    if (b) {
      e.target.textContent = `${b.name.toUpperCase()}${b.kind ? ` / ${Math.ceil(b.hp)} INTEGRITY` : ""}`;
      const occupied = b.kind && s.occupied(b);
      e.use.textContent = b.kind ? b.hp <= 0 ? occupied ? "Clear the opening to restore this barrier" : b.kind === "door" ? "HOLD E / RESET MOTOR · 2s · 20 SCRAP" : "HOLD E / REBUILD PANEL · 2.4s · 25 SCRAP" : `${b.hp < b.maxHp ? "HOLD E / WELD · 0.12 SCRAP PER INTEGRITY" : "FULL INTEGRITY"}${b.kind === "door" ? ` · F / ${b.open ? "SEAL" : "OPEN"}` : ""}` : b.level === 2 ? "SENTRY MK II / ONLINE" : `HOLD E / ${b.level ? "UPGRADE · 60" : "BUILD · 70"} SCRAP`;
      e.work.style.width = `${b.progress ? b.progress / (b.kind === "wall" ? 2.4 : 2) * 100 : b.kind ? b.hp / b.maxHp * 100 : b.level / 2 * 100}%`;
    }
    if (s.player.respawn) { e.notice.textContent = `OPERATOR DOWN · REDEPLOYING IN ${Math.ceil(s.player.respawn)}s`; e.notice.classList.add("visible"); }
    if (g.mode === "map") this.drawMap();
  }
  drawMap() {
    const ctx = this.ctx, s = this.game.sim, scale = 18, x = n => 360 + n * scale, z = n => 280 + n * scale;
    ctx.fillStyle = "#101e29"; ctx.fillRect(0, 0, 720, 560);
    for (const r of ROOMS) { ctx.fillStyle = r.color + "19"; ctx.fillRect(x(r.x - r.w / 2), z(r.z - r.d / 2), r.w * scale, r.d * scale); ctx.fillStyle = r.color; ctx.font = "12px monospace"; ctx.textAlign = "center"; ctx.fillText(r.name, x(r.x), z(r.z + 2.8)); }
    ctx.fillStyle = "#869da9"; for (const w of WALLS) ctx.fillRect(x(w.x - w.halfX), z(w.z - w.halfZ), w.halfX * 2 * scale, w.halfZ * 2 * scale);
    for (const b of s.barriers) { ctx.fillStyle = b.hp <= 0 ? "#ff7257" : b.open ? "#f4bb70" : "#8fddd0"; ctx.fillRect(x(b.x) - 4, z(b.z - b.width / 2), 8, b.width * scale); }
    for (const t of s.turrets) { ctx.fillStyle = t.level ? "#9acced" : "#536572"; ctx.fillRect(x(t.x) - 5, z(t.z) - 5, 10, 10); }
    ctx.fillStyle = "#91e1c1"; ctx.fillRect(x(REACTOR.x) - 12, z(REACTOR.z) - 12, 24, 24);
    ctx.fillStyle = "#ff795e"; for (const e of s.enemies) { ctx.beginPath(); ctx.arc(x(e.x), z(e.z), 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(x(s.player.x), z(s.player.z)); ctx.rotate(-this.game.yaw); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
