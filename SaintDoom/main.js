import { readSettings, writeSettings } from "./modules/Settings.js";
import { CHAPTERS } from "./modules/Chapters.js";

const element = (id) => document.getElementById(id);
let game;
let launching = false;
let settings = readSettings();
let settingsOpener;

function show(id, visible) {
  element(id).style.display = visible
    ? id === "startScreen" || id === "levelSelectScreen"
      ? "block"
      : "flex"
    : "none";
}
function showTitle() {
  show("startScreen", true);
  element("startButton").focus();
}

const chapterGrid = element("chapterGrid");
for (const chapter of CHAPTERS) {
  const button = document.createElement("button");
  button.className = `chapter-card${chapter.number === "SECRET" ? " secret" : ""}`;
  button.dataset.level = chapter.id;
  button.innerHTML = `<span class="chapter-number">${chapter.number === "SECRET" || chapter.id === "tutorial" ? chapter.number : `CHAPTER ${chapter.number}`}</span><strong>${chapter.name}</strong><span class="chapter-description">${chapter.description}</span><span class="arrow" aria-hidden="true">↗</span>`;
  button.addEventListener("click", () => launch(chapter.id));
  chapterGrid.appendChild(button);
}

async function launch(level) {
  if (launching) return;
  launching = true;
  element("launchError").hidden = true;
  show("levelSelectScreen", false);
  show("loadingScreen", true);
  element("loadingText").textContent = "Preparing your descent…";
  try {
    // Keep the title, settings, and chapter menu usable while the engine loads.
    const { Game } = await import("./modules/Game.js");
    game = new Game();
    game.settings = settings;
    await game.init(level);
  } catch (error) {
    console.error("Unable to start SaintDoom:", error);
    game?.quitToTitle();
    showTitle();
    element("launchError").textContent =
      "The crusade could not start. Check your connection and WebGL support, then try again.";
    element("launchError").hidden = false;
  } finally {
    launching = false;
    show("loadingScreen", false);
  }
}

element("startButton").addEventListener("click", () => launch("chapel"));
element("tutorialButton").addEventListener("click", () => launch("tutorial"));
element("levelSelectButton").addEventListener("click", () => {
  show("startScreen", false);
  show("levelSelectScreen", true);
  chapterGrid.querySelector("button").focus();
});
element("backToMenuBtn").addEventListener("click", () => {
  show("levelSelectScreen", false);
  showTitle();
});
element("creditsButton").addEventListener("click", () => {
  show("creditsScreen", true);
  element("backFromCredits").focus();
});
element("backFromCredits").addEventListener("click", () => {
  show("creditsScreen", false);
  element("creditsButton").focus();
});

function openSettings(event) {
  settingsOpener = event.currentTarget;
  show("settingsPanel", true);
  element("mouseSensitivity").focus();
}
function closeSettings() {
  show("settingsPanel", false);
  settingsOpener?.focus();
}
element("mainSettingsButton").addEventListener("click", openSettings);
element("settingsButton").addEventListener("click", openSettings);
element("closeSettings").addEventListener("click", closeSettings);

for (const [id, key, suffix] of [
  ["mouseSensitivity", "sensitivity", ""],
  ["volume", "volume", "%"],
  ["fov", "fov", "°"],
]) {
  const input = /** @type {HTMLInputElement} */ (element(id));
  const output = element(
    key === "sensitivity" ? "sensitivityValue" : `${key}Value`,
  );
  input.value = String(settings[key]);
  output.textContent = `${settings[key]}${suffix}`;
  input.addEventListener("input", () => {
    settings = writeSettings({ ...settings, [key]: Number(input.value) });
    output.textContent = `${settings[key]}${suffix}`;
    game?.applySettings(settings);
  });
}
const motion = /** @type {HTMLInputElement} */ (element("motion"));
motion.checked = settings.motion;
motion.addEventListener("change", () => {
  settings = writeSettings({ ...settings, motion: motion.checked });
  game?.applySettings(settings);
});

element("resumeButton").addEventListener("click", () => game?.resumeGame());
element("restartButton").addEventListener("click", async () => {
  if (!game || game.isLoadingLevel) return;
  try {
    await game.restartLevel();
  } catch (error) {
    console.error(error);
    game.quitToTitle();
  }
});
for (const id of ["quitButton", "deathQuitButton"])
  element(id).addEventListener("click", () => {
    game?.quitToTitle();
    showTitle();
  });
element("respawnButton").addEventListener("click", () => game?.respawn());
element("gameCanvas").addEventListener("click", () => {
  if (game?.isRunning && !game.gameOver && !game.isLoadingLevel)
    game.resumeGame();
});
window.addEventListener("resize", () => {
  if (!game?.camera || !game.renderer) return;
  game.camera.aspect = window.innerWidth / window.innerHeight;
  game.camera.updateProjectionMatrix();
  game.renderer.setSize(window.innerWidth, window.innerHeight);
});
document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && game?.isRunning && !game.gameOver)
    game.pauseGame();
});
window.addEventListener("blur", () => {
  if (game?.isRunning && !game.gameOver) game.pauseGame();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game?.isRunning && !game.gameOver) game.pauseGame();
});
document.addEventListener("keydown", (event) => {
  const visiblePanel = [
    "settingsPanel",
    "creditsScreen",
    "levelSelectScreen",
    "deathScreen",
    "pauseMenu",
    "startScreen",
  ].find((id) => element(id).style.display !== "none");
  if (event.code === "Escape" && !event.repeat) {
    if (visiblePanel === "settingsPanel") closeSettings();
    else if (visiblePanel === "creditsScreen") {
      show("creditsScreen", false);
      element("creditsButton").focus();
    } else if (visiblePanel === "levelSelectScreen") {
      show("levelSelectScreen", false);
      showTitle();
    } else if (game?.isRunning && !game.gameOver && !game.isPaused)
      game.pauseGame();
  }
  // Keep keyboard focus within the active menu. During play Tab belongs to the map.
  if (
    event.code === "Tab" &&
    visiblePanel &&
    (!game?.isRunning || game.isPaused || game.gameOver)
  ) {
    const focusable = Array.from(
      element(visiblePanel).querySelectorAll("button:not(:disabled), input"),
    );
    const first = /** @type {HTMLElement} */ (focusable[0]);
    const last = /** @type {HTMLElement} */ (focusable[focusable.length - 1]);
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !element(visiblePanel).contains(document.activeElement))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
