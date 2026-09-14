import {
  BASES,
  BASE_BUDGET,
  encodeBlueprint,
  towerInvestment,
} from "./blueprints.js";
const key = (text) => `<kbd>${text}</kbd>`;
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export function initializeRaidUI(ui) {
  ui.elements.hud.insertAdjacentHTML(
    "beforeend",
    `
    <div id="raid-objectives" class="raid-objectives"><span class="eyebrow">BREACH PROTOCOL</span><div id="relay-status"></div><p id="raid-task"></p></div>
    <div id="squad-panel" class="squad-panel"><div class="squad-heading"><span>FIRETEAM / <b id="squad-count">06</b></span><span id="order-label">FOLLOWING YOU</span></div><div id="squad-roster" class="squad-roster"></div><div class="squad-orders"><button data-action="order" data-order="follow">${key("1")} FOLLOW</button><button data-action="order" data-order="advance">${key("2")} ADVANCE</button><button data-action="order" data-order="hold">${key("3")} HOLD</button></div><button id="reinforce-button" data-action="reinforce">${key("E")} REINFORCE <span>120 SUPPORT</span></button><div class="squad-hint">${key("F")} Focus fire · ${key("C")} Hold to crouch</div></div>
    <div id="shield-hud" class="shield-hud"><span>PERSONAL SHIELD <b id="shield-value">75</b></span><div><i id="shield-fill"></i></div></div>
    <button id="share-base" class="share-base" data-action="share-base">EXPORT BASE CODE ↗</button>
  `,
  );
  for (const el of ui.elements.hud.querySelectorAll("[id]"))
    ui.elements[el.id] = el;
}

export function installRaidUI(UI) {
  Object.assign(UI.prototype, {
    raidAction(action, button) {
      const g = this.game;
      if (action === "raid-menu") this.raidMenu();
      if (action === "choose-base")
        this.raidMenu(BASES[Number(button.dataset.base)]);
      if (action === "launch-raid") g.startRaid();
      if (action === "import-base")
        g.importRaidBase(document.querySelector("#import-code").value);
      if (action === "workshop") g.startWorkshop();
      if (action === "share-base") this.shareBase();
      if (action === "copy-base") g.copyBase();
      if (action === "refresh-code") {
        g.prepareBaseCode();
        document.querySelector("#copy-status").textContent =
          "Code updated with your base name.";
      }
      if (action === "test-base") {
        g.prepareBaseCode();
        g.startRaid(g.currentBlueprint());
      }
      if (action === "order" && !g.paused) g.sim.command(button.dataset.order);
      if (action === "reinforce" && !g.paused) g.sim.reinforce();
    },
    raidMenu(base = this.game.raidBase || BASES[0]) {
      this.game.raidBase = base;
      const cost = base.towers.reduce((n, t) => n + towerInvestment(t), 0);
      this
        .overlay(`<span class="eyebrow">ASSAULT OPERATIONS / SOLO + AI SQUAD</span><h2>Take their stronghold.</h2><p>Deploy as an armored trooper with six squadmates. Break two shield relays, then destroy the enemy reactor. Every base is defended by AI infantry and automated towers.</p>
      <div class="base-options">${BASES.map((b, i) => `<button data-action="choose-base" data-base="${i}" class="${base.name === b.name ? "selected" : ""}"><span>0${i + 1} / ${["GARRISON", "CITADEL", "FORTRESS"][i]}</span><b>${b.name}</b><small>${b.description}</small></button>`).join("")}</div>
      <div class="selected-base"><span>SELECTED TARGET</span><b>${escape(base.name)}</b><small>${base.towers.length} defenses · ${cost.toLocaleString()} alloy · 2 shield relays</small></div>
      <details class="import-base"><summary>RAID A FRIEND'S BASE CODE</summary><p>Ask them to export a layout from Base Workshop. Paste it here to raid their base against AI defenders.</p><label for="import-code">Shared base code</label><textarea id="import-code" placeholder="LLB1.…" spellcheck="false" maxlength="12000"></textarea><button class="secondary" data-action="import-base">LOAD SHARED BASE ↗</button><p id="base-error" role="alert"></p></details>
      <div class="overlay-buttons"><button class="primary" data-action="launch-raid">DEPLOY ASSAULT SQUAD ↗</button><button data-action="close">BACK</button></div>`);
    },
    shareBase() {
      const g = this.game;
      this
        .overlay(`<span class="eyebrow">BASE WORKSHOP / SHARE YOUR STRONGHOLD</span><h2>Let them try.</h2><p>Give this code to another player. They can load your layout in Assault a Base and fight its AI defenders. Your towers, upgrades, and base name are included.</p>
      <label class="form-label" for="base-name">BASE NAME</label><input id="base-name" class="base-name" maxlength="40" value="${escape(g.baseName)}">
      <label class="form-label" for="base-code">SHARE CODE</label><textarea id="base-code" readonly spellcheck="false">${encodeBlueprint(g.currentBlueprint())}</textarea>
      <p id="copy-status" role="status">The workshop saves automatically in this browser.</p>
      <div class="overlay-buttons"><button class="primary" data-action="copy-base">UPDATE & COPY BASE CODE ↗</button><button data-action="refresh-code">UPDATE CODE WITH BASE NAME</button><button data-action="test-base">TEST THIS BASE IN ASSAULT</button><button data-action="close">RETURN TO WORKSHOP</button></div>`);
    },
    operationLabels() {
      const g = this.game,
        raid = g.sim.isRaid,
        workshop = g.operation === "workshop";
      document.querySelector(".core-resource small").textContent = raid
        ? "ENEMY CORE"
        : "REACTOR";
      document.querySelector(
        ".resource:not(.core-resource) small",
      ).textContent = raid ? "SUPPORT" : workshop ? "BUDGET" : "ALLOY";
      document.querySelector(".wave-top > div > small").textContent = raid
        ? "/ 02"
        : "/ 12";
      document.querySelector("#objective > b").textContent = workshop
        ? "Build your stronghold."
        : raid
          ? "Breach the reactor."
          : "Protect the reactor.";
      this.elements["wave-action-hint"].textContent = workshop
        ? "READY? LEAD A RAID AGAINST YOUR BASE."
        : "BUILD YOUR DEFENSES. THEN BEGIN.";
      this.elements["boss-panel"].classList.add("hidden");
      this.elements["context-panel"].classList.add("hidden");
    },
    updateRaid() {
      const g = this.game,
        s = g.sim,
        e = this.elements;
      e["credits-value"].textContent = Math.floor(s.credits);
      const hp = Math.max(0, Math.ceil((s.coreHp / s.reactor.maxHp) * 100));
      e["core-value"].innerHTML = `${hp}<span>%</span>`;
      e["core-value"].classList.remove("danger");
      e["phase-label"].textContent = s.relays.length
        ? "DISABLE SHIELD RELAYS"
        : "DESTROY THE REACTOR";
      e["wave-number"].textContent = String(2 - s.relays.length).padStart(
        2,
        "0",
      );
      e["wave-name"].textContent = s.base.name;
      e["wave-progress-fill"].style.width =
        `${((2 - s.relays.length) / 2) * 100}%`;
      e["relay-status"].innerHTML = [0, 1]
        .map(
          (i) =>
            `<span class="${s.enemies.some((t) => t.kind === "relay" && !t.dead && t.name.startsWith(i ? "South" : "North")) ? "" : "complete"}">${i ? "SOUTH" : "NORTH"} RELAY</span>`,
        )
        .join("");
      e["raid-task"].textContent = s.relays.length
        ? "Destroy the relays to drop the reactor shield."
        : "SHIELD OFFLINE. Destroy the red reactor.";
      e["objective-text"].textContent =
        "Your squad fights while you survey the battlefield. Press Tab to redeploy.";
      e["enemy-count"].textContent =
        `${s.enemies.filter((t) => !t.dead).length} HOSTILES`;
      e["status-line"].textContent =
        s.player.respawn > 0
          ? `REDEPLOYING IN ${Math.ceil(s.player.respawn)}s / ${s.tickets} LIVES LEFT`
          : `${s.tickets} LIVES LEFT / ${s.kills} ELIMINATED / ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, "0")}`;
      e["squad-count"].textContent = String(s.allies.length).padStart(2, "0");
      e["order-label"].textContent = {
        follow: "FOLLOWING YOU",
        advance: "PUSHING THE OBJECTIVE",
        hold: "HOLDING POSITION",
      }[s.order];
      e["squad-roster"].innerHTML =
        s.allies
          .map(
            (u) =>
              `<div title="${u.name}: ${Math.ceil(u.hp)} HP"><span>${u.type === "heavy" ? "HVY" : u.type === "medic" ? "MED" : "RFL"}</span><i><b style="width:${Math.max(0, (u.hp / u.maxHp) * 100)}%"></b></i></div>`,
          )
          .join("") ||
        '<span class="danger">SQUAD DOWN · CALL REINFORCEMENTS</span>';
      e["squad-panel"].querySelectorAll("[data-order]").forEach((b) => {
        b.classList.toggle("selected", b.dataset.order === s.order);
        b.setAttribute("aria-pressed", String(b.dataset.order === s.order));
      });
      const button = e["reinforce-button"];
      button.disabled =
        s.credits < 120 ||
        s.reinforceCooldown > 0 ||
        s.allies.length >= 10 ||
        s.player.respawn > 0;
      button.innerHTML = `${key("E")} REINFORCE <span>${s.reinforceCooldown > 0 ? `${Math.ceil(s.reinforceCooldown)}s` : s.allies.length >= 10 ? "SQUAD FULL" : "120 SUPPORT"}</span>`;
      e["shield-value"].textContent = Math.ceil(s.player.shield);
      e["shield-fill"].style.width =
        `${(s.player.shield / s.player.maxShield) * 100}%`;
      if (g.mode === "fps") {
        this.updateField();
        e["field-prompt"].textContent = s.relays.length
          ? ""
          : "REACTOR VULNERABLE";
      }
      this.drawMinimap();
    },
    updateWorkshop() {
      const e = this.elements;
      e["phase-label"].textContent = "BASE WORKSHOP";
      e["wave-number"].textContent = String(
        this.game.sim.towers.length,
      ).padStart(2, "0");
      document.querySelector(".wave-top > div > small").textContent = "/ 18";
      e["wave-name"].textContent = this.game.baseName;
      e["wave-button-label"].textContent = "TEST YOUR BASE";
      e["objective-text"].textContent =
        `${BASE_BUDGET.toLocaleString()} alloy to build and upgrade. Salvage returns the full cost in the workshop. Export a code to challenge a friend.`;
      e["status-line"].textContent = "WORKSHOP / LAYOUT SAVED AUTOMATICALLY";
    },
    raidGuide() {
      this.overlay(
        `<span class="eyebrow">ASSAULT FIELD MANUAL</span><h2>Breach. Advance. Destroy.</h2><p>Lead your squad against a fortified base. Destroy the north and south shield relays before attacking the central reactor. AI defenders will counterattack.</p><div class="guide-grid"><div><h3>YOUR FIRETEAM</h3><p>${key("1")} Follow you<br>${key("2")} Advance on the next objective<br>${key("3")} Hold your current position<br>${key("F")} Aim at a target to focus fire<br>${key("E")} Drop up to 4 reinforcements<br>120 support · Maximum squad size 10</p></div><div><h3>YOUR ARMOR</h3><p>${key("WASD")} Move ${key("SHIFT")} Sprint<br>${key("C")} Hold to crouch behind cover<br>Mouse aim · Left mouse button fire<br>Right mouse button aim down sights<br>${key("Q")} Switch gun ${key("R")} Reload<br>${key("G")} Grenade ${key("SPACE")} Jump</p></div></div><div class="guide-tip">Blue markers are your squad. Red markers are enemies.<br>Your medic heals nearby troops. Heavy gunners pierce armor.<br>Shields regenerate after 4 seconds without damage. You have 3 lives.<br>${key("TAB")} Tactical overview. Combat continues; your operator is safe while you command. ${key("ESC")} Pause.<br><br>Shared base codes contain a player's tower layout. Assaults run locally against AI defenders.</div><button class="primary" data-action="close">READY TO DEPLOY ↗</button>`,
      );
    },
    raidResult(won) {
      const s = this.game.sim;
      this.overlay(
        `<span class="eyebrow">ASSAULT ${won ? "COMPLETE" : "FAILED"}</span><h2>${won ? "Stronghold broken." : "Regroup. Rearm."}</h2><p>${won ? `The reactor at ${escape(s.base.name)} is destroyed. Your fireteam has secured the outpost.` : "Your deployment lives are exhausted. Try a different approach, use cover, and keep your squad reinforced."}</p><div class="result-stats"><div><b>${s.structuresDestroyed}</b><span>STRUCTURES DESTROYED</span></div><div><b>${s.kills}</b><span>ELIMINATIONS</span></div><div><b>${s.allies.length}</b><span>SQUAD SURVIVORS</span></div></div><div class="result-detail"><span>OPERATOR ELIMINATIONS <b>${s.playerKills}</b></span><span>TIME IN ASSAULT <b>${Math.floor(s.time / 60)}m ${Math.floor(s.time % 60)}s</b></span></div><div class="overlay-buttons"><button class="primary" data-action="retry">RAID THIS BASE AGAIN ↗</button><button data-action="raid-menu">CHOOSE ANOTHER BASE</button><button data-action="workshop">BASE WORKSHOP</button><button data-action="menu">MAIN MENU</button></div>`,
      );
    },
  });
}
