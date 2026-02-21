const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const TILE = 64;
const GRID_W = 11;
const GRID_H = 9;
const MAX_DRIFT = 100;
const STORAGE_KEY = 'cinderroute_progress_v1';
const DISPATCH_TARGET = Math.max(1, Math.floor(GRID_W * GRID_H * 0.7));
const FRAGMENTS = ['Steady Rudder', 'Signal Lantern', 'Silent Wake'];
const FRAGMENT_UNLOCKS = [
  { name: FRAGMENTS[0], at: 5, bonus: 'drift-1 on movement', deckBoost: 0 },
  { name: FRAGMENTS[1], at: 11, bonus: 'reroll per run + bonus shard', deckBoost: 1 },
  { name: FRAGMENTS[2], at: 16, bonus: 'dispatch failure penalty reduced', deckBoost: 0 },
];
const DECK_BLUEPRINT = {
  rhyme: 2,
  logic: 2,
  entropy: 2,
  borrowed: 2,
  formal: 2,
  beacon: 1,
};
const BASE_REROLLS = 0;

const RULES = [
  {
    id: 'rhyme',
    name: 'Rhyme Gate',
    color: '#3a6f9a',
  },
  {
    id: 'logic',
    name: 'Logic Lock',
    color: '#5f5cc7',
  },
  {
    id: 'entropy',
    name: 'Entropy Filter',
    color: '#7a4f8d',
  },
  {
    id: 'borrowed',
    name: 'Borrowed Tongue',
    color: '#3f8c77',
  },
  {
    id: 'formal',
    name: 'Formal Drift',
    color: '#9d6b47',
  },
];

const CARD_LIBRARY = {
  beacon: [
    {
      title: 'Relay Beacon Lock',
      prompt: 'To stabilize the relay, pick the sequence that maintains grid coherence.',
      options: ['Rising heat lowers pressure', 'Coherent flow requires stable language', 'More drift means safer travel'],
      answer: 1,
      hint: 'Beacons ignore noise and obey coherent sequence order.',
      good: 'Beacon lock accepted. Relay stabilized.',
      rewardHeat: 8,
      rewardShards: 2,
      driftPenalty: 3,
      driftReward: 0,
    },
    {
      title: 'Relay Beacon Lock',
      prompt: 'Choose the emergency override sequence:',
      options: ['Cut power, cool district, reroute', 'Increase drift, open floodgates', 'Disable drift limits'],
      answer: 0,
      hint: 'Emergency procedures start with reducing pressure.',
      good: 'Relay lock sequence confirmed.',
      rewardHeat: 8,
      rewardShards: 2,
      driftPenalty: 3,
      driftReward: 0,
    },
  ],
  rhyme: [
    {
      title: 'Rhyme Gate',
      prompt: 'Which line keeps the rhyme? Choose the best match.',
      options: ['stone / stone', 'fire / wire', 'calm / run'],
      answer: 1,
      hint: 'Look for matching end sounds.',
      good: 'Clean route lock!',
      rewardHeat: 6,
      rewardShards: 1,
      driftPenalty: 4,
      driftReward: 0,
    },
    {
      title: 'Rhyme Gate',
      prompt: 'A station expects a rhyme to open its gate. Which word rhymes with “glow”?',
      options: ['low', 'blue', 'crowd'],
      answer: 0,
      hint: 'Short vowel sound match is what matters.',
      good: 'Correct rhyme, district unlocked.',
      rewardHeat: 4,
      rewardShards: 1,
      driftPenalty: 3,
      driftReward: 0,
    },
  ],
  logic: [
    {
      title: 'Logic Lock',
      prompt: 'If A implies B, and A is true, what can you safely assume? ',
      options: ['B is false', 'B is true', 'Nothing about B'],
      answer: 1,
      hint: 'An implication guarantees what the conclusion must be.',
      good: 'You held the route together.',
      rewardHeat: 5,
      rewardShards: 2,
      driftPenalty: 5,
      driftReward: 0,
    },
    {
      title: 'Logic Lock',
      prompt: 'Pick the consistent statement:',
      options: ['Rising drift lowers risk', 'No risk means no drift', 'No drift means all zones are stable'],
      answer: 2,
      hint: 'Consistency means causality can be ignored safely.',
      good: 'That gate obeys municipal logic.',
      rewardHeat: 5,
      rewardShards: 1,
      driftPenalty: 6,
      driftReward: 0,
    },
  ],
  entropy: [
    {
      title: 'Entropy Filter',
      prompt: 'Remove forbidden letters (B, L, M) from “BLAMBERJACK” for safe channel.',
      options: ['BLAERJAK', 'AERJACK', 'AKEJ'],
      answer: 1,
      hint: 'Actually delete B, L, and M.',
      good: 'The safe channel pings green.',
      rewardHeat: 3,
      rewardShards: 1,
      driftPenalty: 2,
      driftReward: 0,
    },
    {
      title: 'Entropy Filter',
      prompt: 'Remove X, Q, and Z from “QUARTZXO” for clean routing.',
      options: ['UARTO', 'QAR', 'QUARTZO'],
      answer: 0,
      hint: 'Those letters cannot survive the filter.',
      good: 'Entropy lowered, relay stable.',
      rewardHeat: 4,
      rewardShards: 1,
      driftPenalty: 3,
      driftReward: 0,
    },
  ],
  borrowed: [
    {
      title: 'Borrowed Tongue',
      prompt: 'What does “luma” mean in district dialect? ',
      options: ['Fuel', 'Heat', 'Wind'],
      answer: 0,
      hint: 'Think of what feeds city relays best.',
      good: 'You translated a live transmission.',
      rewardHeat: 4,
      rewardShards: 1,
      driftPenalty: 4,
      driftReward: 0,
    },
    {
      title: 'Borrowed Tongue',
      prompt: '“Draeve” means:',
      options: ['Map', 'Door', 'Crew'],
      answer: 2,
      hint: 'This term is used to summon help.',
      good: 'Crew contact restored.',
      rewardHeat: 4,
      rewardShards: 1,
      driftPenalty: 4,
      driftReward: 0,
    },
  ],
  formal: [
    {
      title: 'Formal Drift',
      prompt: 'Choose the statement that is always true:',
      options: ['If all A, then B. All A are B.', 'Some B are A.', 'B implies all A.'],
      answer: 0,
      hint: 'Formal statements here map directly to the prompt.',
      good: 'Formal check complete.',
      rewardHeat: 5,
      rewardShards: 2,
      driftPenalty: 5,
      driftReward: 0,
    },
    {
      title: 'Formal Drift',
      prompt: 'Which is strongest implication?',
      options: ['Not A therefore Not B', 'A therefore B', 'A and B are unrelated'],
      answer: 1,
      hint: 'This is the direct implication direction.',
      good: 'You kept the relay matrix coherent.',
      rewardHeat: 6,
      rewardShards: 2,
      driftPenalty: 5,
      driftReward: 0,
    },
  ],
};

const $ = (id) => document.getElementById(id);
const hud = $('hud');
const cardModal = $('cardModal');
const cardRule = $('cardRule');
const cardTitle = $('cardTitle');
const cardPrompt = $('cardPrompt');
const cardOptions = $('cardOptions');
const cardMessage = $('cardMessage');
const driftFill = $('driftFill');
const completionFill = $('completionFill');
const overlay = $('overlay');
const overlayText = $('overlayText');
const overlayTitle = $('overlayTitle');
const runSummary = $('runSummary');
const bestStats = $('bestStats');
const fragmentsList = $('fragments');
const runStatusLine = $('runStatusLine');
const runMechanicsLine = $('runMechanicsLine');
const beaconCompassLine = $('beaconCompassLine');
const touchUp = $('touchUp');
const touchLeft = $('touchLeft');
const touchDown = $('touchDown');
const touchRight = $('touchRight');

let grid = [];
let state = {
  startedAt: 0,
  runOver: false,
  cardActive: false,
  runCompleted: false,
  totalRuns: 0,
  player: { x: 0, y: 0 },
  beacon: { x: 0, y: 0 },
  heat: 0,
  shards: 0,
  momentum: 0,
  drift: 0,
  turns: 0,
  distance: 0,
  bestDistance: 0,
  bestHeat: 0,
  bestScore: 0,
  solved: 0,
  lastRunSummary: '',
  recentUnlocks: [],
  runScore: 0,
  runLog: [],
  activeCardTile: null,
  pendingBeacon: false,
  ruleDecks: {},
  rerollsLeft: BASE_REROLLS,
  fragments: [],
  unlockedAt: new Set(),
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

function buildRuleDeck(ruleId) {
  const cards = CARD_LIBRARY[ruleId] || CARD_LIBRARY.rhyme;
  const baseCopies = DECK_BLUEPRINT[ruleId] || 1;
  const bonusCopies = state.unlockedAt.has(FRAGMENTS[1])
    ? FRAGMENT_UNLOCKS[1].deckBoost || 0
    : 0;
  const copies = baseCopies + bonusCopies;
  const deck = [];
  for (let c = 0; c < copies; c++) {
    cards.forEach((card) => {
      deck.push({ ...card });
    });
  }
  if (state.unlockedAt.has(FRAGMENTS[1])) {
    cards.forEach((card) => {
      if (Math.random() < 0.35) {
        deck.push({ ...card });
      }
    });
  }
  return shuffleDeck(deck);
}

function ensureRunDecks() {
  state.ruleDecks = {};
  Object.keys(CARD_LIBRARY).forEach((ruleId) => {
    state.ruleDecks[ruleId] = buildRuleDeck(ruleId);
  });
}

function drawCard(ruleId) {
  if (!state.ruleDecks[ruleId] || state.ruleDecks[ruleId].length === 0) {
    state.ruleDecks[ruleId] = buildRuleDeck(ruleId);
    log(`Deck replenished for ${rulesById(ruleId).name}.`);
  }
  const drawn = state.ruleDecks[ruleId].pop();
  return { ...drawn, ruleName: rulesById(ruleId).name, ruleId };
}

function distanceToBeacon() {
  if (!state.beacon) return 0;
  return Math.abs(state.player.x - state.beacon.x) + Math.abs(state.player.y - state.beacon.y);
}

function remainingDeckCount() {
  return Object.values(state.ruleDecks).reduce((acc, deck) => acc + (Array.isArray(deck) ? deck.length : 0), 0);
}

function deckSnapshot() {
  return Object.entries(state.ruleDecks)
    .map(([ruleId, deck]) => `${rulesById(ruleId).name}: ${deck.length}`)
    .join(', ');
}

function buildRunStatusLine() {
  const beaconTile = grid[state.beacon.y]?.[state.beacon.x];
  const beaconSolved = beaconTile ? beaconTile.cleared : false;
  const atBeacon = state.player.x === state.beacon.x && state.player.y === state.beacon.y;
  const direction = buildBeaconDirection();

  if (state.runOver) {
    return state.runCompleted
      ? 'Relay secured. Begin a new run to keep scoring progress.'
      : 'Relay lost. Try another route.';
  }

  if (beaconSolved) {
    return 'Beacon lock secured. Continue exploring for score, then start a new run.';
  }

  if (atBeacon) {
    return 'At relay beacon now. Solve the beacon lock to complete the run.';
  }

  return `Reach the beacon ${distanceToBeacon()} tile(s) away, heading ${direction}.`;
}

function buildCompassArrow(direction) {
  if (!direction) return '⌖';
  if (direction === 'here') return '⬤';
  if (direction === 'north') return '↑';
  if (direction === 'south') return '↓';
  if (direction === 'east') return '→';
  if (direction === 'west') return '←';
  if (direction === 'north-east') return '↗';
  if (direction === 'north-west') return '↖';
  if (direction === 'south-east') return '↘';
  if (direction === 'south-west') return '↙';
  return '⌖';
}

function buildBeaconDirection() {
  const dx = state.beacon.x - state.player.x;
  const dy = state.beacon.y - state.player.y;

  if (dx === 0 && dy === 0) return 'here';
  const horizontal = dx > 0 ? 'east' : dx < 0 ? 'west' : '';
  const vertical = dy > 0 ? 'south' : dy < 0 ? 'north' : '';
  const parts = [vertical, horizontal].filter(Boolean);

  if (parts.length === 0) return 'unknown';
  return parts.join('-');
}

function buildRunMechanicsLine() {
  const driftMitigation = state.unlockedAt.has(FRAGMENTS[0])
    ? 'Steady Rudder reduces district drift pressure by 1.'
    : 'Steady Rudder not unlocked.';
  const rerollText = state.unlockedAt.has(FRAGMENTS[1])
    ? 'Signal Lantern: one non-beacon reroll remaining this run.'
    : 'Signal Lantern not unlocked.';
  const failureText = state.unlockedAt.has(FRAGMENTS[2])
    ? 'Silent Wake reduces failed-card drift penalty.'
    : 'Silent Wake not unlocked.';

  return `${driftMitigation} ${rerollText} ${failureText}`;
}

function scoreGrade(score) {
  if (score >= 220) return 'A+';
  if (score >= 180) return 'A';
  if (score >= 140) return 'B';
  if (score >= 100) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

function runFlavorLine() {
  const nearBeacon = distanceToBeacon();
  if (state.runCompleted) {
    return 'The relay holds. Signal pressure eased long enough to hold the route.';
  }
  if (state.drift >= MAX_DRIFT) {
    return 'A collapse edge was crossed. The district grid flinched and swallowed the route.';
  }
  if (state.shards <= 2) {
    return 'Without enough shards, every lock felt unstable and expensive.';
  }
  if (nearBeacon <= 3 && state.runCompleted === false) {
    return 'You were at the relay edge, but unresolved constraints kept the final lock closed.';
  }
  if (nearBeacon <= 2) {
    return 'You hovered near the beacon, but the lock stayed hostile.';
  }
  if (state.momentum >= 6) {
    return 'Momentum carried you fast, but faster routes demanded cleaner discipline.';
  }
  return 'The run resolved with mixed stability—tight calls, mixed luck, mixed streets.';
}

function createDistrict(isBeacon = false) {
  const rule = randChoice(RULES);
  const hazard = isBeacon ? 0 : randInt(1, 4);
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    hazard,
    dispatch: isBeacon ? true : Math.random() < 0.7,
    discovered: false,
    cleared: false,
    color: rule.color,
    isBeacon,
  };
}

function generateGrid(startX, startY) {
  grid = [];
  for (let y = 0; y < GRID_H; y++) {
    const row = [];
    for (let x = 0; x < GRID_W; x++) {
      row.push(createDistrict());
    }
    grid.push(row);
  }

  let beaconX = randInt(0, GRID_W);
  let beaconY = randInt(0, GRID_H);
  while (beaconX === startX && beaconY === startY) {
    beaconX = randInt(0, GRID_W);
    beaconY = randInt(0, GRID_H);
  }
  grid[beaconY][beaconX] = {
    ...createDistrict(true),
    ruleName: 'Relay Beacon',
    ruleId: 'beacon',
    color: '#f5c05a',
    isBeacon: true,
  };
  return { x: beaconX, y: beaconY };
}

function startRun() {
  state.startedAt = Date.now();
  state.runOver = false;
  state.cardActive = false;
  state.runCompleted = false;
  state.pendingBeacon = false;
  state.activeCardTile = null;
  state.runScore = 0;
  state.player = { x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) };
  state.beacon = generateGrid(state.player.x, state.player.y);
  state.heat = 0;
  state.shards = 0;
  state.momentum = 0;
  state.drift = 0;
  state.turns = 0;
  state.distance = 0;
  state.solved = 0;
  state.recentUnlocks = [];
  state.lastRunSummary = '';
  state.runLog = [];
  state.runLog.push('Relay run initialized. Reach the beacon and solve its lock.');
  state.rerollsLeft = BASE_REROLLS + (state.unlockedAt.has(FRAGMENTS[1]) ? 1 : 0);
  ensureRunDecks();

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      grid[y][x].discovered = false;
      grid[y][x].cleared = false;
    }
  }
  grid[state.player.y][state.player.x].discovered = true;

  hideCard();
  hideOverlay();
  updateHud();
  revealStartState();
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const progress = JSON.parse(raw);
    state.bestDistance = progress.bestDistance || 0;
    state.bestHeat = progress.bestHeat || 0;
    state.bestScore = progress.bestScore || 0;
    state.totalRuns = progress.totalRuns || 0;
    state.fragments = [...new Set(progress.fragments || [])];
    state.unlockedAt = new Set(state.fragments);
  } catch (_e) {
    // ignore broken cache
  }
}

function saveProgress() {
  const payload = {
    bestDistance: state.bestDistance,
    bestHeat: state.bestHeat,
    bestScore: state.bestScore,
    totalRuns: state.totalRuns,
    fragments: state.fragments,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function revealStartState() {
  setTimeout(() => {
    if (!state.runOver) render();
  }, 0);
}

function pickCard(ruleId) {
  return drawCard(ruleId);
}

function rulesById(id) {
  return (
    RULES.find((r) => r.id === id) || {
      id,
      name: id === 'beacon' ? 'Relay Beacon' : RULES[0].name,
    }
  );
}

function enterDistrict(x, y) {
  const tile = grid[y][x];
  tile.discovered = true;
  state.turns += 1;
  state.momentum = Math.min(state.momentum + 1, 8);
  const hazardProtection = state.unlockedAt.has(FRAGMENTS[0]) ? 1 : 0;
  const momentumProtection = Math.floor(state.momentum / 3);
  const hazardPulse = Math.max(0, tile.hazard - hazardProtection - momentumProtection);
  state.distance += 1;
  state.drift += hazardPulse;
  state.heat += 1;
  state.runScore += 6;
  state.pendingBeacon = false;
  state.activeCardTile = null;
  log(`Entered ${tile.isBeacon ? 'relay beacon corridor' : `${tile.ruleName} district`}. Drift +${hazardPulse}.`);

  if (!tile.cleared && tile.dispatch) {
    state.pendingBeacon = tile.isBeacon;
    state.activeCardTile = tile;
    promptCard(tile);
  }

  if (tile.isBeacon) {
    log(`Beacon reached. A dispatch lock must be solved.`);
  }

  if (state.drift >= MAX_DRIFT) {
    gameOver('District collapse reached 100% drift. Relay unstable.');
  }

  updateHud();
  render();
}

function promptCard(tile) {
  if (state.runOver) return;
  const card = pickCard(tile.ruleId);
  state.cardActive = true;
  cardRule.textContent = tile.ruleName;
  cardTitle.textContent = card.title;
  cardPrompt.textContent = card.prompt;
  if (state.unlockedAt.has(FRAGMENTS[1]) && card.hint) {
    cardPrompt.textContent = `${card.prompt}\nHint: ${card.hint}`;
  }
  cardMessage.textContent = '';
  cardOptions.innerHTML = '';

  card.options.forEach((choice, idx) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => resolveCard(card, idx, tile));
    cardOptions.appendChild(button);
  });

  if (state.unlockedAt.has(FRAGMENTS[1]) && state.rerollsLeft > 0 && tile.ruleId !== 'beacon') {
    const rerollButton = document.createElement('button');
    rerollButton.type = 'button';
    rerollButton.textContent = `Use signal reroll (${state.rerollsLeft})`;
    rerollButton.addEventListener('click', () => {
      state.rerollsLeft -= 1;
      log(`Signal reroll used. Remaining: ${state.rerollsLeft}`);
      promptCard(tile);
    });
    cardOptions.appendChild(rerollButton);
  }

  cardModal.classList.remove('hidden');
}

function resolveCard(card, chosen, tile) {
  const correct = card.answer === chosen;
  cardMessage.textContent = correct ? card.good : 'Signal mismatch. Drift spikes as the gate closes.';
  const wasBeacon = state.pendingBeacon;
  state.pendingBeacon = false;
  const cardTile = tile || state.activeCardTile;
  state.activeCardTile = null;

  if (correct) {
    state.heat += card.rewardHeat;
    log(`Dispatch solved: +${card.rewardHeat} heat`);
    state.shards += card.rewardShards + (state.unlockedAt.has(FRAGMENTS[1]) ? 1 : 0);
    if (cardTile && !cardTile.cleared) {
      cardTile.cleared = true;
      state.solved += 1;
    }
    state.drift = Math.max(0, state.drift - card.driftReward);
  } else {
    const penalty = state.unlockedAt.has(FRAGMENTS[2])
      ? Math.max(0, card.driftPenalty - 2)
      : card.driftPenalty;
    state.drift += penalty;
    log(`Dispatch failed: drift +${penalty}`);
    if (cardTile && !cardTile.isBeacon) {
      cardTile.cleared = true;
    }
  }
  FRAGMENT_UNLOCKS.forEach((unlock) => {
    if (state.shards >= unlock.at && !state.unlockedAt.has(unlock.name)) {
      unlockFragment(unlock.name);
    }
  });

  if (state.heat > state.bestHeat) state.bestHeat = state.heat;

  cardModal.classList.add('hidden');
  state.cardActive = false;

  if (state.drift >= MAX_DRIFT) {
    gameOver('Gate failure after failed dispatch lock.');
    return;
  }

  if (wasBeacon && correct) {
    completeRun('Relay beacon reached. Dispatch lock cleared.');
    return;
  }
  if (wasBeacon && !correct) {
    log('Beacon lock remains unsolved. Return and solve to secure relay.');
  }

  updateHud();
  render();
}

function unlockFragment(name) {
  if (state.unlockedAt.has(name)) return;
  state.fragments.push(name);
  state.unlockedAt.add(name);
  state.recentUnlocks.push(name);
  log(`Unlocked fragment: ${name}`);
}

function bestDeltaLine(previous, nextValue, label, prefix) {
  if (nextValue > previous) {
    return `${prefix} new personal best ${label}: ${nextValue}!`;
  }
  if (nextValue === previous) {
    return `Matched best ${label}.`;
  }
  return '';
}

function buildRunSummary(previousState = state) {
  const safety = Math.max(0, MAX_DRIFT - state.drift);
  const status = state.runCompleted ? 'beacon secured' : 'route ended before stabilization';
  const outcome = state.runCompleted ? 'Relay secured.' : 'Relay failure.';
  const unlockLine = state.recentUnlocks.length
    ? `Recovered fragments this run: ${state.recentUnlocks.join(', ')}`
    : 'No new fragments this run.';
  const scoreLine = bestDeltaLine(previousState.bestScore, state.runScore, 'score', 'Score');
  const distanceLine = bestDeltaLine(previousState.bestDistance, state.distance, 'distance', 'Distance');
  const heatLine = bestDeltaLine(previousState.bestHeat, state.heat, 'heat', 'Heat');

  const summaryLines = [
    outcome,
    `Status: ${status}`,
    `Grade: ${scoreGrade(state.runScore)} (${state.runScore})`,
    `Flavor: ${runFlavorLine()}`,
    `Distance: ${state.distance} districts`,
    `Dispatched Solved: ${state.solved}`,
    `Heat: ${state.heat}`,
    `Drift: ${state.drift}/${MAX_DRIFT} (safety ${safety})`,
    `Shards: ${state.shards}`,
    `Deck cards remaining: ${remainingDeckCount()}`,
    `Decks: ${deckSnapshot()}`,
    unlockLine,
    scoreLine,
    distanceLine,
    heatLine,
  ];

  return summaryLines.filter(Boolean).join('\n');
}

function showRunOverlay(title, message) {
  runSummary.textContent = state.lastRunSummary || '';
  overlayTitle.textContent = title;
  overlayText.textContent = message;
  overlay.classList.remove('hidden');
}

function gameOver(message) {
  if (state.runOver) return;
  state.runOver = true;
  state.runCompleted = false;
  state.runScore = Math.max(computeRunScore(), state.runScore, 0);
  const previousBest = {
    bestScore: state.bestScore,
    bestDistance: state.bestDistance,
    bestHeat: state.bestHeat,
  };
  state.totalRuns += 1;
  log(`Run failed: ${message}`);

  if (state.distance > state.bestDistance) state.bestDistance = state.distance;
  if (state.heat > state.bestHeat) state.bestHeat = state.heat;
  if (state.runScore > state.bestScore) state.bestScore = state.runScore;
  state.lastRunSummary = buildRunSummary(previousBest);
  saveProgress();

  showRunOverlay('Relay Lost', message);

  updateHud();
}

function computeRunScore() {
  const driftSafety = Math.max(0, MAX_DRIFT - state.drift);
  return state.distance * 11 + state.solved * 9 + state.shards * 5 + driftSafety;
}

function completeRun(message) {
  if (state.runOver) return;
  state.runOver = true;
  state.runCompleted = true;
  state.runScore = computeRunScore();
  const previousBest = {
    bestScore: state.bestScore,
    bestDistance: state.bestDistance,
    bestHeat: state.bestHeat,
  };
  state.totalRuns += 1;
  log(`Run secured with score ${state.runScore}.`);
  if (state.distance > state.bestDistance) state.bestDistance = state.distance;
  if (state.heat > state.bestHeat) state.bestHeat = state.heat;
  if (state.runScore > state.bestScore) state.bestScore = state.runScore;
  state.lastRunSummary = buildRunSummary(previousBest);

  saveProgress();
  showRunOverlay('Relay Secured', message);

  updateHud();
}

function updateHud() {
  const completionRate = Math.min(100, Math.round((state.solved / DISPATCH_TARGET) * 100));

  hud.innerHTML = `
    <div><strong>Heat</strong><br>${state.heat}</div>
    <div><strong>Heat Shards</strong><br>${state.shards}</div>
    <div><strong>Score</strong><br>${state.runScore}</div>
    <div><strong>Deck</strong><br>${remainingDeckCount()} cards (${deckSnapshot()})</div>
    <div><strong>Rerolls</strong><br>${state.rerollsLeft}</div>
    <div><strong>Momentum</strong><br>${state.momentum}</div>
    <div><strong>Distance</strong><br>${state.distance}</div>
    <div><strong>Beacon Distance</strong><br>${distanceToBeacon()}</div>
    <div><strong>Turns</strong><br>${state.turns}</div>
    <div><strong>Runs</strong><br>${state.totalRuns}</div>
    <div><strong>Dispatch Solved</strong><br>${state.solved}</div>
  `;

  driftFill.style.width = `${Math.min(100, state.drift)}%`;
  completionFill.style.width = `${Math.min(100, completionRate)}%`;

  bestStats.textContent = `Best Distance ${state.bestDistance} | Best Heat ${state.bestHeat} | Best Score ${state.bestScore} | Runs ${state.totalRuns}`;
  fragmentsList.innerHTML = '';
  FRAGMENT_UNLOCKS.forEach((unlock) => {
    const unlocked = state.unlockedAt.has(unlock.name);
    const li = document.createElement('li');
    li.textContent = `${unlocked ? '✓' : '•'} ${unlock.name} — ${unlock.bonus}`;
    if (!unlocked) li.style.opacity = '0.65';
    fragmentsList.appendChild(li);
  });

  const status = state.runOver
    ? (state.runCompleted
      ? 'Status: Relay secured. Restart for next route.'
      : 'Status: Relay ended. Restart to try again.')
    : state.cardActive
      ? 'Status: Solving dispatch lock.'
      : 'Status: Active route. Keep drift under 100.';

  const logBlock = document.createElement('div');
  logBlock.style.marginTop = '8px';
  logBlock.innerHTML = `<strong>System Log</strong><br>${state.runLog.join('<br>') || 'No recent events.'}`;
  hud.appendChild(logBlock);

  if (runStatusLine) {
    runStatusLine.textContent = buildRunStatusLine();
  }
  if (runMechanicsLine) {
    runMechanicsLine.textContent = buildRunMechanicsLine();
  }
  if (beaconCompassLine) {
    const direction = buildBeaconDirection();
    const distance = distanceToBeacon();
    const arrow = buildCompassArrow(direction);
    beaconCompassLine.textContent = `Bearing ${arrow} ${distance} tile(s) ${direction !== 'here' ? direction : ''}`.trim();
  }

  const statusNode = document.createElement('div');
  statusNode.style.marginTop = '8px';
  statusNode.innerHTML = `<strong>${status}</strong>`;
  hud.appendChild(statusNode);
}

function log(message) {
  state.runLog.unshift(message);
  if (state.runLog.length > 5) state.runLog.pop();
}

function hideCard() {
  state.cardActive = false;
  cardModal.classList.add('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  runSummary.textContent = '';
}

function movePlayer(dx, dy) {
  if (state.runOver || state.cardActive) return;

  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;

  if (nextX < 0 || nextX >= GRID_W || nextY < 0 || nextY >= GRID_H) {
    log('That tram line has collapsed.');
    updateHud();
    return;
  }

  state.player = { x: nextX, y: nextY };
  enterDistrict(nextX, nextY);
}

function bindTouchControl(button, dx, dy) {
  if (!button) return;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    movePlayer(dx, dy);
  });
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const t = grid[y][x];
      const px = x * TILE;
      const py = y * TILE;

      ctx.fillStyle = t.discovered ? t.color : '#061d2d';
      ctx.fillRect(px, py, TILE - 1, TILE - 1);

      ctx.fillStyle = t.discovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(px + TILE - 18, py + 8, 10, 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      const alpha = 0.09 * t.hazard;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(px + 4, py + TILE - 12, TILE - 8, 8);

      if (t.discovered) {
        ctx.fillStyle = '#f7fcff';
        ctx.font = '12px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${t.hazard}`, px + TILE / 2, py + 4);
      }

      if (t.discovered && t.dispatch) {
        ctx.fillStyle = t.cleared ? '#6ee7b7' : '#f7ff92';
        ctx.beginPath();
        ctx.arc(px + TILE - 12, py + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (t.isBeacon) {
        ctx.strokeStyle = t.discovered ? '#ffe27a' : 'rgba(255, 226, 122, 0.45)';
        ctx.lineWidth = t.discovered ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(px + TILE / 2, py + 6);
        ctx.lineTo(px + TILE - 8, py + TILE / 2);
        ctx.lineTo(px + TILE / 2, py + TILE - 6);
        ctx.lineTo(px + 8, py + TILE / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = t.discovered ? '#ffefbc' : '#ffd966';
        ctx.font = '11px Trebuchet MS, sans-serif';
        ctx.fillText(t.discovered ? 'BEACON' : 'BEACON?', px + 2, py + TILE - 18);
      }
    }
  }

  // player
  const px = state.player.x * TILE + TILE / 2;
  const py = state.player.y * TILE + TILE / 2;
  ctx.fillStyle = '#ffda67';
  ctx.beginPath();
  ctx.moveTo(px, py - 18);
  ctx.lineTo(px + 14, py + 16);
  ctx.lineTo(px - 14, py + 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px + 4, py - 6, 4, 0, Math.PI * 2);
  ctx.arc(px - 4, py - 6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function render() {
  drawMap();
}

function keyHandler(event) {
  const key = event.key;
  if (
    key === 'ArrowUp' ||
    key === 'w' ||
    key === 'W' ||
    key === 'ArrowDown' ||
    key === 's' ||
    key === 'S' ||
    key === 'ArrowLeft' ||
    key === 'a' ||
    key === 'A' ||
    key === 'ArrowRight' ||
    key === 'd' ||
    key === 'D'
  ) {
    event.preventDefault();
  }

  if (key === 'ArrowUp' || key === 'w' || key === 'W') movePlayer(0, -1);
  else if (key === 'ArrowDown' || key === 's' || key === 'S') movePlayer(0, 1);
  else if (key === 'ArrowLeft' || key === 'a' || key === 'A') movePlayer(-1, 0);
  else if (key === 'ArrowRight' || key === 'd' || key === 'D') movePlayer(1, 0);
  else if (key === 'r' || key === 'R') {
    startRun();
  }
}

function bootstrap() {
  loadProgress();
  startRun();
  window.addEventListener('keydown', keyHandler);
  $('newRunBtn').addEventListener('click', startRun);
  $('retryBtn').addEventListener('click', startRun);
  bindTouchControl(touchUp, 0, -1);
  bindTouchControl(touchLeft, -1, 0);
  bindTouchControl(touchDown, 0, 1);
  bindTouchControl(touchRight, 1, 0);
  requestAnimationFrame(() => {
    render();
  });
  requestAnimationFrame(loop);
}

function loop() {
  render();
  requestAnimationFrame(loop);
}

function installTestHooks() {
  if (typeof window === 'undefined') return;
  window.__cinderRoute = {
    state,
    MAX_DRIFT,
    FRAGMENTS,
    FRAGMENT_UNLOCKS,
    DECK_BLUEPRINT,
    BASE_REROLLS,
    CARD_LIBRARY,
    RULES,
    buildRuleDeck,
    ensureRunDecks,
    drawCard,
    remainingDeckCount,
    deckSnapshot,
    scoreGrade,
    bestDeltaLine,
    runFlavorLine,
    buildRunSummary,
    computeRunScore,
    startRun,
    shuffleDeck,
  };
}

installTestHooks();
  if (!globalThis.__CINDER_TEST__) {
  bootstrap();
}
