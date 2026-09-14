import { initializeRaidUI, installRaidUI } from "./raid-ui.js";
import { readBunkerCheckpoint } from "./bunker-game.js";
import { BUNKER_MANUAL } from "./bunker-ui.js";
import {
  TOWERS,
  WAVES,
  CORE,
  PADS,
  WEAPONS,
  towerStats,
  upgradeCost,
  refund,
  ROUTES,
} from "./data.js";

export const icon = (name, cls = "") => {
  const paths = {
    logo: '<path d="m16 3 13 23H3L16 3Z"/><path d="m16 12 6 10H10l6-10ZM7 30h18"/>',
    sentry:
      '<path d="M7 26h18M10 26v-6h12v6M5 14h22v6H5zM9 14V4h4v10m6 0V4h4v10M8 8h6m4 0h6"/>',
    mortar:
      '<path d="M6 27h20M10 27v-6h12v6M7 21h18v-7H7zM13 14l6-11 6 3-5 8M18 7l6 3"/>',
    frost:
      '<path d="m16 2 5 10-5 10-5-10 5-10Zm-9 8-3 6 5 9m16-15 3 6-5 9M6 28h20M16 22v6"/>',
    rail: '<path d="M6 28h20M11 28v-6h10v6M6 16h20v6H6zM12 16V3h3v13m3 0V3h3v13M10 5h13"/>',
    alloy:
      '<path d="m16 3 12 7v13l-12 7-12-7V10l12-7Zm0 0v13m12-6-12 6-12-6m12 6v14"/>',
    shield:
      '<path d="m16 3 11 4v10c0 6-11 12-11 12S5 23 5 17V7l11-4Zm-5 13 4 4 7-9"/>',
    field:
      '<circle cx="16" cy="16" r="9"/><path d="M16 1v9m0 12v9M1 16h9m12 0h9"/>',
    command:
      '<path d="m16 3 13 8-13 8L3 11l13-8ZM3 17l13 8 13-8M3 23l13 8 13-8"/>',
    arrow: '<path d="M4 16h23m-8-8 8 8-8 8"/>',
    pause: '<path d="M10 6v20M22 6v20"/>',
    sound: '<path d="M5 12h6l8-7v22l-8-7H5v-8Zm19-3c5 4 5 10 0 14"/>',
    gear: '<path d="m12 4 1-2h6l1 5 4 2 4-1 3 5-4 4v3l2 4-5 4-4-2h-4l-4 2-5-4 2-4v-4l-3-4 3-5 4 1 3-2Z"/><circle cx="16" cy="16" r="5"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.field}</svg>`;
};
const key = (text) => `<kbd>${text}</kbd>`;
const towerCards = Object.entries(TOWERS)
  .map(
    ([id, t], index) =>
      `<button class="tower-card" data-action="tower" data-type="${id}" aria-label="Select ${t.name}, ${t.cost} alloy"><span class="card-key">0${index + 1}</span>${icon(id)}<span class="card-name">${t.name}</span><span class="card-role">${t.role}</span><span class="card-cost">◈ ${t.cost}</span></button>`,
  )
  .join("");

export class UI {
  constructor(game) {
    this.game = game;
    this.lastContext = "";
    this.lastHud = "";
    this.noticeTimer = 0;
    document.querySelector("#interface").innerHTML = `
      <div class="vignette"></div><div id="damage-flash"></div>
      <section id="main-menu" class="menu">
        <header class="menu-header"><a class="wordmark" href="#" data-action="home">${icon("logo")}<span>LAST LIGHT<span class="wordmark-sub">FRONTIER DEFENSE INITIATIVE</span></span></a><span class="edition">FIRST-PERSON BUNKER DEFENSE</span><button class="icon-button" data-action="settings" aria-label="Settings">${icon("gear")}</button></header>
        <div class="menu-copy"><div class="eyebrow"><span class="status-dot"></span> KEPLER-09 <span class="divider">/</span> BUNKER 09</div><h1>LAST<br><span>LIGHT.</span></h1><div class="title-rule"></div><h2>Hold the room.<br>Keep the light on.</h2><p>Fight through a failing bunker. Weld the walls.<br>Reset the doors. Keep the reactor alive<br class="wide-break"> through twelve increasingly desperate assaults.</p>
        <button class="primary deploy" data-action="new">DEFEND THE BUNKER ${icon("arrow")}</button>
        <button class="assault-deploy" data-action="raid-menu">ASSAULT A BASE <span>↗</span></button><button class="workshop-link" data-action="workshop">BASE WORKSHOP <span>BUILD · SHARE · RAID</span></button>
        <button id="continue" class="continue hidden" data-action="continue">CONTINUE OPERATION <span>↗</span></button>
        <div class="menu-links"><button data-action="guide">FIELD MANUAL <span>↗</span></button><span>DEFENSE + SQUAD ASSAULT</span></div></div>
        <div class="scene-caption"><span class="status-dot"></span><span>REACTOR 01<b>THE LIGHT IS STILL ON.</b></span><i></i></div>
        <footer class="menu-footer"><span>09 / 13 <i></i> KEPLER STATION</span><span>TACTICAL STRATEGY <b>×</b> FIRST-PERSON COMBAT</span><span>DESKTOP · HEADPHONES RECOMMENDED</span></footer>
      </section>
      <section id="hud" class="hidden">
        <header class="hud-top"><div class="hud-brand">${icon("logo")}<span>LAST LIGHT<small>KEPLER-09 / <b id="mode-label">COMMAND</b></small></span></div>
          <div class="wave-top"><span id="phase-label" class="eyebrow">PREPARATION</span><div><span id="wave-number">01</span><small>/ 12</small><i></i><b id="wave-name">First contact</b></div><div class="wave-progress"><span id="wave-progress-fill"></span></div></div>
          <div class="resources"><div class="resource core-resource">${icon("shield")}<span><small>REACTOR</small><b id="core-value">100<span>%</span></b></span></div><div class="resource">${icon("alloy")}<span><small>ALLOY</small><b id="credits-value">480</b></span></div><button class="icon-button" data-action="pause" aria-label="Pause game">${icon("pause")}</button></div>
        </header>
        <div id="objective" class="objective"><span class="eyebrow">YOUR OBJECTIVE</span><b>Protect the reactor.</b><p id="objective-text">Select a defense below, then click a numbered platform.</p><span class="objective-key">${key("TAB")} Switch to first person</span></div>
        <div class="tactical-controls" id="tactical-controls"><span>${key("W A S D")} Pan</span><span>Scroll to zoom</span><span>Right-drag to orbit</span></div>
        <div id="notice" role="status" aria-live="polite"></div>
        <div id="wave-banner"><small id="banner-kicker">INCOMING TRANSMISSION</small><h2 id="banner-title"></h2><p id="banner-subtitle"></p></div>
        <div id="crosshair" class="hidden"><i></i><i></i><i></i><i></i><b></b></div><div id="hitmarker"></div><div id="field-prompt" class="hidden"></div>
        <div class="right-stack"><div id="boss-panel" class="hidden"><span>COLOSSUS</span><b id="boss-hp"></b><div><i id="boss-fill"></i></div></div>
          <div class="minimap-panel"><div class="minimap-heading"><span>SECTOR OVERVIEW</span><span class="status-dot"></span></div><canvas id="minimap" width="320" height="210" aria-label="Battlefield minimap"></canvas><div class="minimap-footer"><span>● <b>HOSTILE</b></span><span>◆ <b>REACTOR</b></span><span id="enemy-count">CLEAR</span></div><div id="breach-status" class="breach-status" aria-label="Breach doors"><span id="breach-0">01 · SEALED</span><span id="breach-1">02 · SEALED</span></div></div>
          <button id="mode-button" class="mode-button" data-action="mode">${icon("field")}<span id="mode-button-label">ENTER THE FIELD<small>Fight alongside your defenses</small></span>${key("TAB")}</button>
        </div>
        <div id="context-panel" class="context-panel hidden"></div>
        <div id="build-dock" class="build-dock"><div class="dock-heading"><span>DEFENSE SYSTEMS</span><span id="build-hint">SELECT → PLACE</span></div><div class="tower-cards">${towerCards}</div></div>
        <div id="wave-action" class="wave-action"><span id="wave-action-hint">BUILD YOUR DEFENSES. THEN BEGIN.</span><button class="primary" data-action="wave"><span id="wave-button-label">BEGIN WAVE 01</span>${icon("arrow")}${key("↵")}</button></div>
        <div id="field-hud" class="field-hud hidden"><div class="health-block"><small>OPERATOR VITALS</small><div><b id="health-value">100</b><span>HP</span></div><div class="health-track"><i id="health-fill"></i></div><span>${key("SHIFT")} Sprint ${key("SPACE")} Jump</span></div><div class="weapon-block"><small id="weapon-name">AR-9 / PULSE RIFLE</small><div><b id="ammo-value">32</b><span id="mag-value">/ 32</span></div><span id="reload-label">${key("R")} Reload <i>·</i> ${key("Q")} Switch weapon</span><span id="grenade-label">${key("G")} Frag grenade · READY</span></div></div>
        <div class="hud-bottom-line"><span id="status-line">UPLINK SECURE <i></i> DEFENSE NETWORK ONLINE</span><span>${key("H")} Manual ${key("ESC")} Pause</span></div>
      </section>
      <div id="overlay" class="overlay hidden"><div id="overlay-content" class="overlay-card"></div></div>
      <div id="fatal" class="overlay hidden"></div>
    `;
    this.elements = Object.fromEntries(
      [...document.querySelectorAll("[id]")].map((e) => [e.id, e]),
    );
    initializeRaidUI(this);
    this.ctx = this.elements.minimap.getContext("2d");
    document.querySelector("#interface").addEventListener("click", (e) => {
      const button = e.target.closest("[data-action]");
      if (!button || button.disabled) return;
      e.preventDefault();
      game.audio.play("click");
      this.action(button.dataset.action, button);
    });
    document.querySelector("#interface").addEventListener("input", (e) => {
      if (e.target.dataset.setting)
        game.updateSetting(
          e.target.dataset.setting,
          e.target.type === "checkbox" ? e.target.checked : e.target.value,
        );
    });
    document.querySelector("#interface").addEventListener("change", (e) => {
      if (e.target.dataset.setting)
        game.updateSetting(
          e.target.dataset.setting,
          e.target.type === "checkbox" ? e.target.checked : e.target.value,
        );
    });
  }
  action(action, button) {
    const g = this.game;
    this.raidAction(action, button);
    if (action === "new") g.startNew();
    if (action === "continue") g.continueGame();
    if (action === "tower") g.selectTower(button.dataset.type);
    if (action === "mode") g.switchMode();
    if (action === "wave") g.startWave();
    if (action === "pause") g.pause();
    if (action === "resume") g.resume();
    if (action === "menu") g.goToMenu();
    if (action === "guide") this.guide();
    if (action === "settings") this.settings();
    if (action === "close") g.closeOverlay();
    if (action === "upgrade") g.upgradeSelected();
    if (action === "sell") g.sellSelected();
    if (action === "build") g.buildSelected();
    if (action === "cancel") {
      g.selectedPad = null;
      g.hoverPad = null;
      this.lastContext = "";
    }
    if (action === "retry") g.retry();
    if (action === "fullscreen") {
      if (document.fullscreenElement) document.exitFullscreen();
      else
        document.documentElement
          .requestFullscreen()
          .catch(() =>
            this.notice("Fullscreen is unavailable in this browser."),
          );
    }
  }
  showMenu() {
    this.elements["main-menu"].classList.remove("hidden");
    this.elements.hud.classList.add("hidden");
    this.elements.overlay.classList.add("hidden");
    this.elements.continue.classList.toggle(
      "hidden",
      !readBunkerCheckpoint(),
    );
  }
  showGame() {
    this.operationLabels();
    this.elements["main-menu"].classList.add("hidden");
    this.elements.hud.classList.remove("hidden");
    this.elements.overlay.classList.add("hidden");
    this.lastContext = "";
  }
  setMode(mode) {
    const fps = mode === "fps";
    document.body.classList.toggle("field-mode", fps);
    for (const id of ["crosshair", "field-hud", "field-prompt"])
      this.elements[id].classList.toggle("hidden", !fps);
    for (const id of ["objective", "tactical-controls"])
      this.elements[id].classList.toggle("hidden", fps);
    this.elements["mode-label"].textContent = fps ? "FIELD" : "COMMAND";
    this.elements["mode-button-label"].innerHTML = fps
      ? "COMMAND VIEW<small>Build and manage your defenses</small>"
      : "ENTER THE FIELD<small>Fight alongside your defenses</small>";
    if (this.game.sim.isRaid)
      this.elements["mode-button-label"].innerHTML = fps
        ? "TACTICAL VIEW<small>Survey the assault</small>"
        : "REDEPLOY TROOPER<small>Rejoin your squad</small>";
    this.lastContext = "";
  }
  notice(text, urgent = false) {
    this.elements.notice.textContent = text;
    this.elements.notice.className = `visible ${urgent ? "urgent" : ""}`;
    this.noticeTimer = 4;
  }
  banner(kicker, title, subtitle) {
    this.elements["banner-kicker"].textContent = kicker;
    this.elements["banner-title"].textContent = title;
    this.elements["banner-subtitle"].textContent = subtitle;
    this.elements["wave-banner"].classList.add("visible");
    this.bannerTimer = 4;
  }
  hit(kill = false) {
    this.elements.hitmarker.className = kill ? "active kill" : "active";
    this.hitTimer = 0.16;
  }
  hurt() {
    this.elements["damage-flash"].style.opacity = "1";
    this.hurtTimer = 0.4;
  }
  update(dt) {
    const g = this.game,
      s = g.sim,
      fps = g.mode === "fps",
      next = WAVES[Math.min(s.phase === "wave" ? s.wave - 1 : s.wave, 11)];
    this.noticeTimer -= dt;
    if (this.noticeTimer <= 0) this.elements.notice.classList.remove("visible");
    this.bannerTimer -= dt;
    if (this.bannerTimer <= 0)
      this.elements["wave-banner"].classList.remove("visible");
    this.hitTimer -= dt;
    if (this.hitTimer <= 0) this.elements.hitmarker.className = "";
    this.hurtTimer = Math.max(0, (this.hurtTimer || 0) - dt);
    this.elements["damage-flash"].style.opacity = this.hurtTimer / 0.4;
    if (!g.started) return;
    g.world.gates.forEach((gate, index) => {
      const indicator = this.elements[`breach-${index}`];
      indicator.textContent = `${String(index + 1).padStart(2, "0")} · ${gate.status}`;
      indicator.dataset.active = String(gate.active);
      indicator.title = `${index ? "South" : "North"} breach: ${gate.status.toLowerCase()}`;
    });
    if (s.isRaid) {
      this.updateRaid();
      return;
    }
    this.elements["credits-value"].textContent = Math.floor(
      s.credits,
    ).toLocaleString();
    const hp = Math.ceil((s.coreHp / CORE.maxHp) * 100);
    this.elements["core-value"].innerHTML = `${hp}<span>%</span>`;
    this.elements["core-value"].classList.toggle("danger", hp < 30);
    this.elements["phase-label"].textContent =
      s.phase === "wave" ? "ASSAULT IN PROGRESS" : "PREPARATION";
    this.elements["wave-number"].textContent = String(
      Math.min(12, s.phase === "wave" ? s.wave : s.wave + 1),
    ).padStart(2, "0");
    this.elements["wave-name"].textContent = next.name;
    const total = Object.values(next.units).reduce((a, b) => a + b, 0);
    this.elements["wave-progress-fill"].style.width =
      `${s.phase === "wave" ? (1 - (s.queue.length + s.enemies.length) / total) * 100 : 0}%`;
    this.elements["objective-text"].textContent =
      s.phase === "build"
        ? s.towers.length
          ? next.briefing
          : "Choose a defense below, then click a numbered platform. Start with 3–4 towers."
        : `${s.enemies.length + s.queue.length} hostiles remaining. Build during combat or press Tab to join the fight.`;
    this.elements["wave-action"].classList.toggle(
      "hidden",
      s.phase !== "build",
    );
    this.elements["wave-button-label"].textContent =
      `BEGIN WAVE ${String(s.wave + 1).padStart(2, "0")}`;
    this.elements["enemy-count"].textContent =
      s.phase === "wave" ? `${s.enemies.length} HOSTILES` : "CLEAR";
    this.elements["status-line"].textContent =
      s.player.respawn > 0
        ? `OPERATOR RECOVERY · ${Math.ceil(s.player.respawn)}s`
        : s.phase === "wave"
          ? `${s.kills} ELIMINATED  /  ${s.towers.length} DEFENSES ONLINE`
          : "UPLINK SECURE  /  CHECKPOINT SAVED";
    document.querySelectorAll(".tower-card").forEach((card) => {
      const type = card.dataset.type;
      card.classList.toggle("selected", g.selectedType === type);
      card.classList.toggle("unaffordable", s.credits < TOWERS[type].cost);
      card.setAttribute("aria-pressed", String(g.selectedType === type));
    });
    const boss = s.enemies.find((e) => e.type === "boss");
    this.elements["boss-panel"].classList.toggle("hidden", !boss);
    if (boss) {
      this.elements["boss-hp"].textContent =
        `${Math.ceil(boss.hp).toLocaleString()} HP`;
      this.elements["boss-fill"].style.width =
        `${(boss.hp / boss.maxHp) * 100}%`;
    }
    if (fps) this.updateField();
    if (g.operation === "workshop") this.updateWorkshop();
    this.context();
    this.drawMinimap();
  }
  updateField() {
    const g = this.game,
      s = g.sim;

    const w = WEAPONS[g.weaponType];
    this.elements["health-value"].textContent = Math.ceil(s.player.hp);
    this.elements["health-fill"].style.width = `${s.player.hp}%`;
    this.elements["weapon-name"].textContent = w.name;
    this.elements["ammo-value"].textContent = String(
      g.ammo[g.weaponType],
    ).padStart(2, "0");
    this.elements["mag-value"].textContent = `/ ${w.magazine}`;
    this.elements["reload-label"].innerHTML =
      g.reloadTimer > 0
        ? `RELOADING · ${g.reloadTimer.toFixed(1)}s`
        : `${key("R")} Reload <i>·</i> ${key("Q")} Switch weapon`;
    this.elements["grenade-label"].innerHTML =
      `${key("G")} Frag grenade · ${g.grenadeCooldown > 0 ? `${Math.ceil(g.grenadeCooldown)}s` : "READY"}`;
    const p = g.nearPad,
      tower = s.towers.find((t) => t.padId === p?.id);
    this.elements["field-prompt"].innerHTML = p
      ? tower
        ? `${TOWERS[tower.type].name} <span>MK ${tower.level}</span><br>${key("U")} ${tower.level === 3 ? "Maximum level" : `Upgrade · ${upgradeCost(tower)} alloy`} ${key("X")} Salvage`
        : `PLATFORM ${String(p.id + 1).padStart(2, "0")}<br>${key("E")} Build ${TOWERS[g.selectedType].name} <span>◈ ${TOWERS[g.selectedType].cost}</span>`
      : "";
  }
  context() {
    const g = this.game,
      s = g.sim,
      id = g.selectedPad,
      tower = s.towers.find((t) => t.padId === id),
      panel = this.elements["context-panel"];
    if (id === null || g.mode === "fps") {
      panel.classList.add("hidden");
      return;
    }
    const signature = JSON.stringify([
      id,
      tower?.type,
      tower?.level,
      tower?.kills,
      g.selectedType,
      Math.floor(s.credits),
    ]);
    if (signature === this.lastContext) return;
    this.lastContext = signature;
    panel.classList.remove("hidden");
    const type = tower?.type || g.selectedType,
      t = towerStats(type, tower?.level || 1);
    panel.innerHTML = `<div class="context-heading"><span>PLATFORM ${String(id + 1).padStart(2, "0")} ${tower ? ` / MK ${tower.level}` : "/ AVAILABLE"}</span><button data-action="cancel" aria-label="Close platform details">×</button></div><div class="context-title">${icon(type)}<div><h3>${t.name}</h3><span>${t.role}</span></div></div><p>${t.desc}</p><div class="tower-stats"><span><b>${Math.round(t.damage / t.interval)}</b>DPS</span><span><b>${t.range}m</b>RANGE</span><span><b>${tower?.kills || 0}</b>KILLS</span></div><div class="context-actions">${tower ? `<button class="primary" data-action="upgrade" ${tower.level >= 3 || s.credits < upgradeCost(tower) ? "disabled" : ""}>${tower.level === 3 ? "MAXIMUM LEVEL" : `UPGRADE · ◈ ${upgradeCost(tower)}`}</button><button class="text-button" data-action="sell">SALVAGE +${g.operation === "workshop" ? tower.invested : refund(tower)}</button>` : `<button class="primary" data-action="build" ${s.credits < t.cost ? "disabled" : ""}>BUILD · ◈ ${t.cost} ${key("E")}</button>`}</div>`;
  }
  drawMinimap() {
    const ctx = this.ctx,
      s = this.game.sim,
      w = 320,
      h = 210,
      x = (v) => ((v + 52) / 100) * w,
      z = (v) => ((v + 33) / 68) * h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#142332";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#9db79513";
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#7890a755";
    ctx.lineJoin = "round";
    for (const route of ROUTES) {
      ctx.beginPath();
      route.forEach(([px, pz], i) =>
        i ? ctx.lineTo(x(px), z(pz)) : ctx.moveTo(x(px), z(pz)),
      );
      ctx.stroke();
    }
    for (const [index, gate] of this.game.world.gates.entries()) {
      ctx.fillStyle = gate.active ? "#ffad65" : "#91d9f5";
      ctx.fillRect(x(gate.x) - 2, z(gate.z) - 6, 4, 12);
      ctx.font = "bold 11px monospace";
      ctx.fillText(String(index + 1), x(gate.x) + 5, z(gate.z) - 8);
    }
    for (const pad of PADS) {
      const tower = s.towers.find((t) => t.padId === pad.id);
      ctx.fillStyle = tower ? TOWERS[tower.type].color : "#648294";
      ctx.fillRect(x(pad.x) - 2, z(pad.z) - 2, 4, 4);
    }
    ctx.fillStyle = "#8fcaff";
    ctx.beginPath();
    ctx.arc(x(CORE.x), z(CORE.z), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f58663";
    for (const e of s.enemies) {
      ctx.beginPath();
      if (e.dead) continue;
      ctx.arc(
        x(e.x),
        z(e.z),
        e.kind === "relay" ? 4.5 : e.type === "boss" ? 4 : 2.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    for (const ally of s.allies || []) {
      ctx.fillStyle = "#73c8ff";
      ctx.fillRect(x(ally.x) - 2, z(ally.z) - 2, 4, 4);
    }
    const p = s.player;
    ctx.save();
    ctx.translate(x(p.x), z(p.z));
    ctx.rotate(-this.game.yaw);
    ctx.fillStyle = "#fff6da";
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  overlay(html) {
    this.game.openOverlay();
    this.elements["overlay-content"].innerHTML = html;
    this.elements.overlay.classList.remove("hidden");
  }
  pause() {
    if (this.game.sim.isRaid || this.game.operation === "workshop") {
      const raid = this.game.sim.isRaid;
      this.overlay(
        `<span class="eyebrow">OPERATION ON HOLD</span><h2>Take a breath.</h2><p>${raid ? "The assault is paused. Returning to the menu ends this raid; you can deploy again from the beginning." : "Your base layout saves automatically. Export its code to share it with a friend."}</p><div class="overlay-buttons"><button class="primary" data-action="resume">RESUME ↗</button><button data-action="${raid ? "guide" : "share-base"}">${raid ? "ASSAULT MANUAL" : "EXPORT BASE CODE"}</button><button data-action="settings">SETTINGS</button><button data-action="menu">MAIN MENU</button></div>`,
      );
      return;
    }
    this.overlay(
      `<span class="eyebrow">UPLINK ON HOLD</span><h2>Take a breath.</h2><p>The battlefield is paused. Your checkpoint is saved before each wave.</p><div class="overlay-buttons"><button class="primary" data-action="resume">RETURN TO THE FIGHT ${icon("arrow")}</button><button data-action="settings">SETTINGS</button><button data-action="guide">FIELD MANUAL</button><button data-action="retry">RESTART FROM CHECKPOINT</button><button data-action="menu">MAIN MENU</button></div>`,
    );
  }
  guide() {
    if (!this.game.started || (!this.game.sim.isRaid && this.game.operation !== "workshop")) {
      this.overlay(`${BUNKER_MANUAL}<button class="primary" data-action="close">UNDERSTOOD</button>`);
      return;
    }
    if (this.game.sim.isRaid && this.game.started) {
      this.raidGuide();
      return;
    }
    this.overlay(
      `<span class="eyebrow">BASE WORKSHOP / FIELD MANUAL</span><h2>Build your stronghold.</h2><p>Design a base with 4,800 alloy and 18 numbered platforms. Upgrade each tower twice to reach MK III. Salvage returns the full investment so you can redesign freely.</p><div class="guide-grid"><div><h3>COMMAND VIEW</h3><p>${key("1–4")} Select a tower type<br>Click an empty platform to build<br>Click a tower to inspect it<br>${key("U")} Upgrade ${key("X")} Salvage<br>${key("WASD")} Pan · Scroll to zoom<br>Right-drag to orbit</p></div><div><h3>IN THE FIELD</h3><p>${key("WASD")} Move ${key("SHIFT")} Sprint<br>${key("C")} Hold to crouch ${key("SPACE")} Jump<br>Mouse to aim · Left mouse button to fire<br>Right mouse button to aim down sights<br>${key("R")} Reload ${key("Q")} Switch weapon<br>${key("G")} Grenade<br>${key("1–4")} Select a tower type<br>${key("E")} Build on a nearby platform<br>${key("U")} Upgrade ${key("X")} Salvage a nearby tower</p></div></div><div class="guide-tip">${key("TAB")} Switch between command and first-person views.<br>${key("ENTER")} Test your base in an assault. ${key("ESC")} Pause.<br><br>Pair Cryo arrays with Howitzers. Use Railguns against armor.<br>The reactor, shield relays, and infantry garrison are fixed.<br>Your layout saves automatically in this browser.<br>Choose EXPORT BASE CODE to name your base and copy a code to share. Other players can load it in ASSAULT A BASE and fight its AI defenders.</div><button class="primary" data-action="close">UNDERSTOOD ${icon("arrow")}</button>`,
    );
  }
  settings() {
    const s = this.game.settings;
    this.overlay(
      `<span class="eyebrow">OPERATOR PREFERENCES</span><h2>Settings.</h2><div class="settings-fields"><label>Graphics<select data-setting="quality"><option value="high" ${s.quality === "high" ? "selected" : ""}>High · bloom & shadows</option><option value="medium" ${s.quality === "medium" ? "selected" : ""}>Medium · shadows</option><option value="low" ${s.quality === "low" ? "selected" : ""}>Low · performance</option></select></label><label>Difficulty <small>Applies to a new operation</small><select data-setting="difficulty"><option value="relaxed" ${s.difficulty === "relaxed" ? "selected" : ""}>Relaxed</option><option value="normal" ${s.difficulty === "normal" ? "selected" : ""}>Standard</option><option value="veteran" ${s.difficulty === "veteran" ? "selected" : ""}>Veteran</option></select></label><label>Mouse sensitivity<input type="range" min="0.3" max="2.5" step="0.1" value="${s.sensitivity}" data-setting="sensitivity" aria-label="Mouse sensitivity"></label><label>Master volume<input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-setting="volume" aria-label="Master volume"></label><label>Music<input type="checkbox" data-setting="music" ${s.music ? "checked" : ""}></label><label>Camera shake<input type="checkbox" data-setting="shake" ${s.shake ? "checked" : ""}></label></div><div class="settings-footer"><button class="text-button" data-action="fullscreen">TOGGLE FULLSCREEN ↗</button><button class="primary" data-action="close">DONE ${icon("arrow")}</button></div>`,
    );
  }
  result(won) {
    if (this.game.sim.isRaid) {
      this.raidResult(won);
      return;
    }
    const s = this.game.sim;
    this.overlay(
      `<span class="eyebrow">OPERATION ${won ? "COMPLETE" : "LOST"}</span><h2>${won ? "The light holds." : "The frontier falls."}</h2><p>${won ? "Extraction is inbound. Against every wave, you kept the last reactor alive." : "The reactor has gone dark. Regroup at your last checkpoint and rebuild your defense."}</p><div class="result-stats"><div><b>${s.wave}<small>/12</small></b><span>WAVES ${won ? "CLEARED" : "REACHED"}</span></div><div><b>${s.kills}</b><span>ELIMINATIONS</span></div><div><b>${s.playerKills}</b><span>PERSONAL KILLS</span></div></div><div class="result-detail"><span>REACTOR INTEGRITY <b>${Math.ceil(s.coreHp / 10)}%</b></span><span>TIME IN OPERATION <b>${Math.floor(s.time / 60)}m ${Math.floor(s.time % 60)}s</b></span></div><div class="overlay-buttons">${won ? '<button class="primary" data-action="new">NEW OPERATION ↗</button>' : '<button class="primary" data-action="retry">RETRY FROM CHECKPOINT ↗</button>'}<button data-action="menu">MAIN MENU</button></div>`,
    );
  }
}

installRaidUI(UI);
