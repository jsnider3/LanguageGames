const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayCard = document.getElementById('overlay-card');
const toast = document.getElementById('toast');

const hudLevel = document.getElementById('hud-level');
const hudArtifacts = document.getElementById('hud-artifacts');
const hudPings = document.getElementById('hud-pings');
const hudTime = document.getElementById('hud-time');
const hudAlert = document.getElementById('hud-alert');
const hudBeacon = document.getElementById('hud-beacon');
const hudDampener = document.getElementById('hud-dampener');
const hudPhase = document.getElementById('hud-phase');

const levels = JSON.parse(document.getElementById('levels-data').textContent.trim());

const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  WIN: 'win',
  LOSE: 'lose'
};

const CONFIG = {
  moveDelay: 0.12,
  pingCooldown: 0.55,
  pingChargeMin: 0.18,
  pingChargeMax: 1.1,
  pingRadiusMin: 3,
  pingRadiusMax: 8,
  revealDuration: 1.6,
  alertDecay: 7,
  baseAlertGain: 34,
  baseDetection: 1.35,
  detectionBoost: 1.0,
  sentryStepBase: 0.5,
  sentryStepBoost: 0.18,
  dampenerDuration: 4.2,
  dampenerAlertCut: 0.55,
  dampenerDetectionCut: 0.35,
  wanderChance: 0.5,
  toastDuration: 1800
};

function createAudioEngine() {
  let ctx = null;
  let master = null;
  let ambience = null;
  let ambienceFilter = null;
  let ambienceGain = null;
  let muted = false;
  let lastProxTick = 0;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);

      ambience = ctx.createOscillator();
      ambience.type = 'sine';
      ambience.frequency.value = 52;
      ambienceFilter = ctx.createBiquadFilter();
      ambienceFilter.type = 'lowpass';
      ambienceFilter.frequency.value = 150;
      ambienceGain = ctx.createGain();
      ambienceGain.gain.value = 0.0;
      ambience.connect(ambienceFilter);
      ambienceFilter.connect(ambienceGain);
      ambienceGain.connect(master);
      ambience.start();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setMuted(nextMuted) {
    muted = nextMuted;
    if (master && ctx) {
      const target = muted ? 0.0 : 0.7;
      master.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
    }
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  function tone(freq, duration, type, gain) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(master);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain || 0.08), now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function sweep(startFreq, endFreq, duration, type, gain) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = startFreq;
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(master);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain || 0.1), now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function ping(radius) {
    ensure();
    if (!ctx || muted) return;
    const ratio = (radius - CONFIG.pingRadiusMin) / (CONFIG.pingRadiusMax - CONFIG.pingRadiusMin);
    const start = 820 - ratio * 180;
    const end = 240 + ratio * 80;
    const duration = 0.22 + ratio * 0.18;
    sweep(start, end, duration, 'sine', 0.12 + ratio * 0.06);
    tone(end * 1.4, 0.12, 'triangle', 0.05);
  }

  function beacon() {
    ensure();
    tone(320, 0.1, 'square', 0.07);
    tone(180, 0.14, 'triangle', 0.05);
  }

  function pickup(type) {
    ensure();
    const base = type === 'beacon' ? 420 : type === 'dampener' ? 360 : 520;
    tone(base, 0.08, 'sine', 0.07);
    tone(base * 1.5, 0.12, 'triangle', 0.05);
  }

  function artifact() {
    ensure();
    sweep(520, 820, 0.2, 'triangle', 0.08);
  }

  function phase() {
    ensure();
    sweep(260, 520, 0.14, 'square', 0.06);
  }

  function dampener() {
    ensure();
    sweep(420, 160, 0.25, 'sine', 0.07);
  }

  function win() {
    ensure();
    sweep(320, 880, 0.32, 'triangle', 0.1);
    tone(880, 0.2, 'sine', 0.08);
  }

  function lose() {
    ensure();
    sweep(480, 120, 0.36, 'sawtooth', 0.09);
  }

  function updateAmbience(alert) {
    if (!ctx || !ambienceGain || muted) return;
    const gainTarget = 0.02 + (alert / 100) * 0.08;
    ambienceGain.gain.setTargetAtTime(gainTarget, ctx.currentTime, 0.4);
    ambience.frequency.setTargetAtTime(48 + alert * 0.4, ctx.currentTime, 0.5);
    ambienceFilter.frequency.setTargetAtTime(140 + alert * 1.6, ctx.currentTime, 0.5);
  }

  function proximityTick(distance, alert) {
    if (!ctx || muted || !Number.isFinite(distance)) return;
    const now = ctx.currentTime;
    const interval = Math.max(0.25, Math.min(1.2, distance * 0.22));
    if (now - lastProxTick < interval) return;
    lastProxTick = now;
    const intensity = Math.max(0, 1 - Math.min(distance / 6, 1));
    const freq = 140 + intensity * 260 + alert * 1.2;
    tone(freq, 0.06, 'square', 0.05 + intensity * 0.04);
  }

  return {
    ensure,
    toggleMuted,
    ping,
    beacon,
    pickup,
    artifact,
    phase,
    dampener,
    win,
    lose,
    updateAmbience,
    proximityTick
  };
}

const audio = createAudioEngine();

let state = STATE.MENU;
let selectedLevel = 0;
let level = null;
let player = null;
let stats = null;
let resources = null;
let visibility = null;
let pingWaves = [];
let decoy = null;
let alertLevel = 0;
let dampenerUntil = 0;
let lastMoveAt = 0;
let lastPingAt = -999;
let gameClock = 0;
let tileSize = 32;
let lastFrame = 0;
let pingCharging = false;
let pingChargeStart = 0;
let keys = {};
let bestStats = loadBest();

function loadBest() {
  try {
    return JSON.parse(localStorage.getItem('echotrace-best') || '{}');
  } catch (err) {
    return {};
  }
}

function saveBest() {
  localStorage.setItem('echotrace-best', JSON.stringify(bestStats));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), CONFIG.toastDuration);
}

function setOverlay(html) {
  overlayCard.innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

function isWall(x, y) {
  return level.walls[y][x];
}

function neighbors(x, y) {
  const opts = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
  return opts.filter(p => inBounds(p.x, p.y) && !isWall(p.x, p.y));
}

function bfsNextStep(start, goal) {
  if (!goal) return null;
  if (start.x === goal.x && start.y === goal.y) return null;

  const w = level.width;
  const h = level.height;
  const size = w * h;
  const startIdx = start.y * w + start.x;
  const goalIdx = goal.y * w + goal.x;
  const cameFrom = new Int32Array(size);
  cameFrom.fill(-1);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  queue[tail++] = startIdx;
  cameFrom[startIdx] = startIdx;

  while (head < tail) {
    const current = queue[head++];
    if (current === goalIdx) break;
    const cx = current % w;
    const cy = Math.floor(current / w);
    const nexts = [
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 }
    ];
    for (const n of nexts) {
      if (!inBounds(n.x, n.y) || isWall(n.x, n.y)) continue;
      const idx = n.y * w + n.x;
      if (cameFrom[idx] !== -1) continue;
      cameFrom[idx] = current;
      queue[tail++] = idx;
    }
  }

  if (cameFrom[goalIdx] === -1) return null;

  let stepIdx = goalIdx;
  while (cameFrom[stepIdx] !== startIdx) {
    stepIdx = cameFrom[stepIdx];
  }

  return { x: stepIdx % w, y: Math.floor(stepIdx / w) };
}

function parseLevel(data) {
  const grid = data.grid.map(row => row.split(''));
  const height = grid.length;
  const width = grid[0].length;
  const walls = Array.from({ length: height }, () => Array(width).fill(false));
  const artifacts = [];
  const pickups = [];
  const sentries = [];
  let playerStart = { x: 1, y: 1 };
  let exit = { x: width - 2, y: height - 2 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      if (tile === '#') {
        walls[y][x] = true;
      } else if (tile === 'P') {
        playerStart = { x, y };
      } else if (tile === 'E') {
        exit = { x, y };
      } else if (tile === 'A') {
        artifacts.push({ x, y, collected: false });
      } else if (tile === 'B') {
        pickups.push({ x, y, type: 'beacon', collected: false });
      } else if (tile === 'D') {
        pickups.push({ x, y, type: 'dampener', collected: false });
      } else if (tile === 'T') {
        pickups.push({ x, y, type: 'phase', collected: false });
      } else if (tile === 'S') {
        sentries.push({
          x,
          y,
          home: { x, y },
          state: 'idle',
          target: null,
          waitUntil: 0,
          moveClock: 0
        });
      }
    }
  }

  return {
    id: data.id,
    name: data.name,
    width,
    height,
    walls,
    artifacts,
    pickups,
    sentries,
    playerStart,
    exit,
    starting: data.starting || { beacon: 0, dampener: 0, phase: 0 }
  };
}

function resetLevel(index) {
  const data = levels[index];
  level = parseLevel(data);
  player = {
    x: level.playerStart.x,
    y: level.playerStart.y,
    facing: { x: 1, y: 0 },
    phaseReady: false
  };
  stats = {
    pings: 0,
    steps: 0,
    time: 0
  };
  resources = {
    beacon: level.starting.beacon || 0,
    dampener: level.starting.dampener || 0,
    phase: level.starting.phase || 0
  };
  visibility = Array.from({ length: level.height }, () => Array(level.width).fill(0));
  pingWaves = [];
  decoy = null;
  alertLevel = 0;
  dampenerUntil = 0;
  lastMoveAt = 0;
  lastPingAt = -999;
  pingCharging = false;
  gameClock = 0;
  resizeCanvas();
  updateHud();
}

function updateHud() {
  if (!level || !stats) return;
  hudLevel.textContent = `${level.id}. ${level.name}`;
  const totalArtifacts = level.artifacts.length;
  const collected = level.artifacts.filter(a => a.collected).length;
  hudArtifacts.textContent = `${collected}/${totalArtifacts}`;
  hudPings.textContent = stats.pings;
  hudTime.textContent = formatTime(stats.time);
  hudAlert.style.width = `${Math.min(alertLevel, 100).toFixed(1)}%`;
  hudBeacon.textContent = resources.beacon;
  hudDampener.textContent = resources.dampener;
  hudPhase.textContent = resources.phase;
}

function visibilityAt(x, y) {
  const reveal = visibility[y][x] / CONFIG.revealDuration;
  const dx = x - player.x;
  const dy = y - player.y;
  const dist = Math.hypot(dx, dy);
  const ambient = Math.max(0, 1 - dist / 1.8);
  return Math.min(1, Math.max(reveal, ambient));
}

function revealTiles(cx, cy, radius) {
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= radius) {
        visibility[y][x] = Math.max(visibility[y][x], CONFIG.revealDuration * (1 - dist / (radius + 0.01)));
      }
    }
  }
}

function signalSentries(x, y) {
  for (const sentry of level.sentries) {
    sentry.state = 'investigate';
    sentry.target = { x, y };
    sentry.waitUntil = 0;
  }
}

function emitPing(radius) {
  const now = gameClock;
  if (now - lastPingAt < CONFIG.pingCooldown) return;
  lastPingAt = now;
  stats.pings += 1;
  const dampenerActive = now < dampenerUntil;
  const gain = CONFIG.baseAlertGain * (dampenerActive ? CONFIG.dampenerAlertCut : 1);
  alertLevel = Math.min(100, alertLevel + gain * (radius / CONFIG.pingRadiusMax));
  revealTiles(player.x, player.y, radius);
  pingWaves.push({ x: player.x, y: player.y, radius, age: 0, duration: 0.9 });
  audio.ping(radius);
  signalSentries(player.x, player.y);
  updateHud();
}

function placeDecoy() {
  if (resources.beacon <= 0 || decoy) {
    showToast(decoy ? 'Beacon already active.' : 'No beacons left.');
    return;
  }
  resources.beacon -= 1;
  decoy = {
    x: player.x,
    y: player.y,
    timer: 0.6,
    duration: 2.4,
    active: true,
    pinged: false
  };
  showToast('Beacon armed.');
  updateHud();
}

function triggerDampener() {
  if (resources.dampener <= 0) {
    showToast('No dampeners left.');
    return;
  }
  const now = gameClock;
  if (now < dampenerUntil) {
    showToast('Dampener already active.');
    return;
  }
  resources.dampener -= 1;
  dampenerUntil = now + CONFIG.dampenerDuration;
  alertLevel = Math.max(0, alertLevel - 18);
  audio.dampener();
  showToast('Dampener online.');
  updateHud();
}

function armPhase() {
  if (resources.phase <= 0) {
    showToast('No phase steps left.');
    return;
  }
  if (player.phaseReady) {
    showToast('Phase step already primed.');
    return;
  }
  player.phaseReady = true;
  audio.phase();
  showToast('Phase step primed.');
}

function attemptMove(dx, dy) {
  const now = gameClock;
  if (now - lastMoveAt < CONFIG.moveDelay) return;
  lastMoveAt = now;

  const nx = player.x + dx;
  const ny = player.y + dy;
  player.facing = { x: dx, y: dy };

  if (!inBounds(nx, ny)) return;

  if (isWall(nx, ny)) {
    if (player.phaseReady && resources.phase > 0) {
      const bx = player.x + dx * 2;
      const by = player.y + dy * 2;
      if (inBounds(bx, by) && !isWall(bx, by)) {
        player.x = bx;
        player.y = by;
        resources.phase -= 1;
        player.phaseReady = false;
        showToast('Phase step used.');
      } else {
        showToast('Phase step blocked.');
      }
    }
    return;
  }

  player.x = nx;
  player.y = ny;
  stats.steps += 1;

  const artifact = level.artifacts.find(a => !a.collected && a.x === player.x && a.y === player.y);
  if (artifact) {
    artifact.collected = true;
    audio.artifact();
    showToast('Artifact secured.');
  }

  const pickup = level.pickups.find(p => !p.collected && p.x === player.x && p.y === player.y);
  if (pickup) {
    pickup.collected = true;
    resources[pickup.type] += 1;
    audio.pickup(pickup.type);
    showToast(`${pickup.type} acquired.`);
  }

  if (player.x === level.exit.x && player.y === level.exit.y) {
    const remaining = level.artifacts.some(a => !a.collected);
    if (remaining) {
      showToast('Exit locked. Collect all artifacts.');
    } else {
      handleWin();
    }
  }

  updateHud();
}

function handleWin() {
  state = STATE.WIN;
  audio.win();
  const totalArtifacts = level.artifacts.length;
  const collected = level.artifacts.filter(a => a.collected).length;
  const record = bestStats[level.id];
  const newScore = { pings: stats.pings, time: stats.time };
  let improved = false;
  if (!record || newScore.pings < record.pings || (newScore.pings === record.pings && newScore.time < record.time)) {
    bestStats[level.id] = newScore;
    saveBest();
    improved = true;
  }
  setOverlay(`
    <h2>Signal Stable</h2>
    <p>Artifacts secured: ${collected}/${totalArtifacts}</p>
    <p>Pings used: ${stats.pings} | Time: ${formatTime(stats.time)}</p>
    <p>${improved ? 'New best record logged.' : 'Record unchanged.'}</p>
    <p>Press N for next level, R to replay, M for menu.</p>
  `);
}

function handleLose(reason) {
  state = STATE.LOSE;
  audio.lose();
  setOverlay(`
    <h2>Trace Compromised</h2>
    <p>${reason || 'A sentry found you in the dark.'}</p>
    <p>Pings used: ${stats.pings} | Time: ${formatTime(stats.time)}</p>
    <p>Press R to retry or M for menu.</p>
  `);
}

function showMenu() {
  state = STATE.MENU;
  resetLevel(selectedLevel);
  const items = levels.map((lvl, idx) => {
    const best = bestStats[lvl.id];
    const bestLine = best ? `Best: ${best.pings} pings / ${formatTime(best.time)}` : 'Best: --';
    return `
      <div class="menu-item ${idx === selectedLevel ? 'active' : ''}">
        ${lvl.id}. ${lvl.name}
        <span>${bestLine}</span>
      </div>
    `;
  }).join('');

  setOverlay(`
    <h2>EchoTrace</h2>
    <p>Emit sonar, read the echoes, and keep your signal low.</p>
    <p>Choose a mission. Press Enter to begin.</p>
    <div class="menu-list">${items}</div>
    <p>Arrow keys to select. Enter to deploy.</p>
  `);
}

function startLevel(index) {
  selectedLevel = index;
  resetLevel(selectedLevel);
  state = STATE.PLAYING;
  hideOverlay();
}

function resizeCanvas() {
  if (!level) return;
  const container = canvas.parentElement;
  const maxWidth = container.clientWidth - 8;
  const maxHeight = window.innerHeight * 0.65;
  const size = Math.floor(Math.min(maxWidth / level.width, maxHeight / level.height));
  tileSize = Math.max(18, Math.min(size, 36));
  const pixelWidth = tileSize * level.width;
  const pixelHeight = tileSize * level.height;
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = `${pixelWidth}px`;
  canvas.style.height = `${pixelHeight}px`;
  canvas.width = pixelWidth * ratio;
  canvas.height = pixelHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function update(delta) {
  if (state !== STATE.PLAYING) return;

  stats.time += delta;
  gameClock += delta;

  alertLevel = Math.max(0, alertLevel - CONFIG.alertDecay * delta);
  audio.updateAmbience(alertLevel);

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      visibility[y][x] = Math.max(0, visibility[y][x] - delta);
    }
  }

  pingWaves = pingWaves.filter(wave => {
    wave.age += delta;
    return wave.age < wave.duration;
  });

  if (decoy) {
    decoy.timer -= delta;
    if (!decoy.pinged && decoy.timer <= 0) {
      decoy.pinged = true;
      signalSentries(decoy.x, decoy.y);
      pingWaves.push({ x: decoy.x, y: decoy.y, radius: 5, age: 0, duration: 0.6 });
      audio.beacon();
    }
    decoy.duration -= delta;
    if (decoy.duration <= 0) decoy = null;
  }

  const dampenerActive = gameClock < dampenerUntil;
  const detectionRange = Math.max(0.9, CONFIG.baseDetection + (alertLevel / 100) * CONFIG.detectionBoost - (dampenerActive ? CONFIG.dampenerDetectionCut : 0));

  let nearestDist = Infinity;
  for (const sentry of level.sentries) {
    const speed = Math.max(0.18, CONFIG.sentryStepBase - (alertLevel / 100) * CONFIG.sentryStepBoost);
    sentry.moveClock += delta;
    if (sentry.moveClock >= speed) {
      sentry.moveClock = 0;
      let next = null;
      if (sentry.state === 'investigate' || sentry.state === 'return') {
        next = bfsNextStep({ x: sentry.x, y: sentry.y }, sentry.target || sentry.home);
      }
      if (!next && Math.random() < CONFIG.wanderChance) {
        const opts = neighbors(sentry.x, sentry.y);
        if (opts.length) {
          next = opts[Math.floor(Math.random() * opts.length)];
        }
      }
      if (next) {
        sentry.x = next.x;
        sentry.y = next.y;
      }
    }

    if (sentry.state === 'investigate' && sentry.target && sentry.x === sentry.target.x && sentry.y === sentry.target.y) {
      if (!sentry.waitUntil) {
        sentry.waitUntil = gameClock + 1.4;
      } else if (gameClock >= sentry.waitUntil) {
        sentry.state = 'return';
        sentry.target = sentry.home;
        sentry.waitUntil = 0;
      }
    }

    if (sentry.state === 'return' && sentry.x === sentry.home.x && sentry.y === sentry.home.y) {
      sentry.state = 'idle';
      sentry.target = null;
    }

    const dist = Math.hypot(player.x - sentry.x, player.y - sentry.y);
    if (dist < nearestDist) nearestDist = dist;
    if (dist <= detectionRange) {
      handleLose('A sentry intercepted your signal.');
      return;
    }
  }

  audio.proximityTick(nearestDist, alertLevel);
  updateHud();
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function draw() {
  if (!level) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const wall = level.walls[y][x];
      drawTile(x, y, wall ? '#0b111a' : '#0d1724');
      const vis = visibilityAt(x, y);
      if (vis > 0.02) {
        ctx.globalAlpha = Math.min(1, 0.3 + vis * 0.8);
        drawTile(x, y, wall ? '#1c2a3b' : '#162636');
        ctx.globalAlpha = 1;
      }
    }
  }

  for (const wave of pingWaves) {
    const progress = wave.age / wave.duration;
    const radius = wave.radius * progress * tileSize;
    ctx.beginPath();
    ctx.arc((wave.x + 0.5) * tileSize, (wave.y + 0.5) * tileSize, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(126, 246, 255, ${Math.max(0, 0.6 - progress)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const drawIfVisible = (x, y, drawFn) => {
    if (visibilityAt(x, y) > 0.06) drawFn();
  };

  drawIfVisible(level.exit.x, level.exit.y, () => {
    ctx.fillStyle = '#ffe99b';
    ctx.fillRect(level.exit.x * tileSize + tileSize * 0.2, level.exit.y * tileSize + tileSize * 0.2, tileSize * 0.6, tileSize * 0.6);
  });

  for (const artifact of level.artifacts) {
    if (artifact.collected) continue;
    drawIfVisible(artifact.x, artifact.y, () => {
      ctx.fillStyle = '#a88bff';
      ctx.beginPath();
      ctx.moveTo((artifact.x + 0.5) * tileSize, (artifact.y + 0.15) * tileSize);
      ctx.lineTo((artifact.x + 0.85) * tileSize, (artifact.y + 0.5) * tileSize);
      ctx.lineTo((artifact.x + 0.5) * tileSize, (artifact.y + 0.85) * tileSize);
      ctx.lineTo((artifact.x + 0.15) * tileSize, (artifact.y + 0.5) * tileSize);
      ctx.closePath();
      ctx.fill();
    });
  }

  for (const pickup of level.pickups) {
    if (pickup.collected) continue;
    drawIfVisible(pickup.x, pickup.y, () => {
      ctx.fillStyle = pickup.type === 'beacon' ? '#3ee6b2' : pickup.type === 'dampener' ? '#ff9159' : '#7ef6ff';
      ctx.beginPath();
      ctx.arc((pickup.x + 0.5) * tileSize, (pickup.y + 0.5) * tileSize, tileSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (decoy) {
    drawIfVisible(decoy.x, decoy.y, () => {
      ctx.strokeStyle = 'rgba(62, 230, 178, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc((decoy.x + 0.5) * tileSize, (decoy.y + 0.5) * tileSize, tileSize * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  for (const sentry of level.sentries) {
    drawIfVisible(sentry.x, sentry.y, () => {
      ctx.fillStyle = '#ff5e73';
      ctx.beginPath();
      ctx.arc((sentry.x + 0.5) * tileSize, (sentry.y + 0.5) * tileSize, tileSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (pingCharging) {
    const charge = Math.min(CONFIG.pingChargeMax, gameClock - pingChargeStart);
    const ratio = Math.min(1, Math.max(0, (charge - CONFIG.pingChargeMin) / (CONFIG.pingChargeMax - CONFIG.pingChargeMin)));
    ctx.strokeStyle = `rgba(126, 246, 255, ${0.4 + ratio * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc((player.x + 0.5) * tileSize, (player.y + 0.5) * tileSize, tileSize * (0.6 + ratio * 0.8), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#7ef6ff';
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * tileSize, (player.y + 0.5) * tileSize, tileSize * 0.32, 0, Math.PI * 2);
  ctx.fill();

  if (player.phaseReady) {
    ctx.strokeStyle = 'rgba(168, 139, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc((player.x + 0.5) * tileSize, (player.y + 0.5) * tileSize, tileSize * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function loop(timestamp) {
  const now = timestamp / 1000;
  if (!lastFrame) lastFrame = now;
  const delta = Math.min(0.05, now - lastFrame);
  lastFrame = now;
  if (state === STATE.PLAYING) {
    update(delta);
  } else {
    audio.updateAmbience(0);
  }
  if (level) draw();
  requestAnimationFrame(loop);
}

function handleDirectionalInput() {
  if (state !== STATE.PLAYING) return;
  const dir =
    (keys['ArrowUp'] || keys['KeyW']) ? { x: 0, y: -1 } :
    (keys['ArrowDown'] || keys['KeyS']) ? { x: 0, y: 1 } :
    (keys['ArrowLeft'] || keys['KeyA']) ? { x: -1, y: 0 } :
    (keys['ArrowRight'] || keys['KeyD']) ? { x: 1, y: 0 } :
    null;
  if (dir) attemptMove(dir.x, dir.y);
}

window.addEventListener('keydown', (event) => {
  const code = event.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
    event.preventDefault();
  }
  keys[code] = true;

  if (code === 'KeyV' && !event.repeat) {
    audio.ensure();
    const muted = audio.toggleMuted();
    showToast(muted ? 'Audio muted.' : 'Audio live.');
    return;
  }

  audio.ensure();

  if (state === STATE.MENU) {
    if (code === 'ArrowUp' || code === 'KeyW') {
      selectedLevel = (selectedLevel - 1 + levels.length) % levels.length;
      showMenu();
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      selectedLevel = (selectedLevel + 1) % levels.length;
      showMenu();
    }
    if (code === 'Enter' || code === 'Space') {
      startLevel(selectedLevel);
    }
    if (code.startsWith('Digit')) {
      const idx = parseInt(code.replace('Digit', ''), 10) - 1;
      if (!Number.isNaN(idx) && idx >= 0 && idx < levels.length) {
        selectedLevel = idx;
        showMenu();
      }
    }
    return;
  }

  if (code === 'KeyM') {
    showMenu();
    return;
  }

  if (code === 'KeyR') {
    if (state === STATE.PLAYING) {
      resetLevel(selectedLevel);
    } else {
      startLevel(selectedLevel);
    }
    return;
  }

  if (state === STATE.WIN) {
    if (code === 'KeyN') {
      const next = (selectedLevel + 1) % levels.length;
      startLevel(next);
    }
    if (code === 'KeyM') showMenu();
    return;
  }

  if (state === STATE.LOSE) {
    if (code === 'KeyR') startLevel(selectedLevel);
    if (code === 'KeyM') showMenu();
    return;
  }

  if (state !== STATE.PLAYING) return;

  if (code === 'Space' && !event.repeat) {
    if (gameClock - lastPingAt < CONFIG.pingCooldown) {
      showToast('Ping recharging.');
      return;
    }
    pingCharging = true;
    pingChargeStart = gameClock;
  }

  if (code === 'KeyQ' && !event.repeat) placeDecoy();
  if (code === 'KeyE' && !event.repeat) triggerDampener();
  if (code === 'KeyF' && !event.repeat) armPhase();
});

window.addEventListener('keyup', (event) => {
  const code = event.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
    event.preventDefault();
  }
  keys[code] = false;

  if (state !== STATE.PLAYING) return;
  if (code === 'Space' && pingCharging) {
    pingCharging = false;
    const charge = Math.min(CONFIG.pingChargeMax, gameClock - pingChargeStart);
    const clamped = Math.max(CONFIG.pingChargeMin, charge);
    const ratio = Math.min(1, (clamped - CONFIG.pingChargeMin) / (CONFIG.pingChargeMax - CONFIG.pingChargeMin));
    const radius = CONFIG.pingRadiusMin + ratio * (CONFIG.pingRadiusMax - CONFIG.pingRadiusMin);
    emitPing(radius);
  }
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointerdown', () => audio.ensure(), { once: true });

setInterval(handleDirectionalInput, 40);

showMenu();
requestAnimationFrame(loop);
