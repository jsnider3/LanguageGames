const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function createElement() {
  return {
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      add() {},
      remove() {},
    },
    appendChild() {},
    addEventListener() {},
  };
}

function loadGameHarness() {
  const storage = {};
  const domElements = {};
  [
    'mapCanvas',
    'hud',
    'driftFill',
    'completionFill',
    'overlay',
    'overlayText',
    'overlayTitle',
    'bestStats',
    'fragments',
    'cardRule',
    'cardTitle',
    'cardPrompt',
    'cardOptions',
    'cardMessage',
    'runSummary',
    'newRunBtn',
    'retryBtn',
    'touchUp',
    'touchLeft',
    'touchDown',
    'touchRight',
  ].forEach((id) => {
    domElements[id] = createElement();
  });

  domElements.mapCanvas.getContext = () => ({
    clearRect() {},
    save() {},
    restore() {},
    fillRect() {},
    fillStyle: '',
    fillText() {},
    beginPath() {},
    arc() {},
    closePath() {},
    fill() {},
    strokeStyle: '',
    lineWidth: 0,
    moveTo() {},
    lineTo() {},
    stroke() {},
    set font(value) {
      this._font = value;
    },
    get font() {
      return this._font;
    },
    textAlign: '',
    textBaseline: '',
  });

  const context = {
    console,
    __CINDER_TEST__: true,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    Date,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
    },
    document: {
      getElementById(id) {
        return domElements[id];
      },
    },
    window: {
      addEventListener() {},
      __CINDER_TEST__: true,
    },
  };

  context.window.__cinderRoute = null;
  context.window.addEventListener = function () {};
  const vmContext = vm.createContext(context);
  const code = fs.readFileSync('app.js', 'utf8');
  vm.runInContext(code, vmContext, { filename: 'app.js' });
  return vmContext.window.__cinderRoute;
}

test('buildRuleDeck uses base copy count and applies deterministic unlock bonus floor', () => {
  const game = loadGameHarness();
  const { state, buildRuleDeck, FRAGMENTS, DECK_BLUEPRINT } = game;
  state.unlockedAt = new Set();
  const lockedDeck = buildRuleDeck('rhyme');
  assert.equal(lockedDeck.length, DECK_BLUEPRINT.rhyme * game.CARD_LIBRARY.rhyme.length);

  state.unlockedAt.add(FRAGMENTS[1]);
  const unlockedDeck = buildRuleDeck('rhyme');
  assert.ok(unlockedDeck.length >= 6);
  assert.ok(unlockedDeck.length <= 8);
});

test('drawCard replenishes an empty deck and returns a valid card', () => {
  const game = loadGameHarness();
  const { state, ensureRunDecks, drawCard, DECK_BLUEPRINT, CARD_LIBRARY } = game;
  state.unlockedAt = new Set();
  ensureRunDecks();
  state.ruleDecks.rhyme = [];
  const card = drawCard('rhyme');
  assert.equal(card.ruleId, 'rhyme');
  assert.ok(card.title);
  assert.equal(state.ruleDecks.rhyme.length, DECK_BLUEPRINT.rhyme * CARD_LIBRARY.rhyme.length - 1);
});

test('score grading thresholds map to expected ranks', () => {
  const game = loadGameHarness();
  const { scoreGrade } = game;
  assert.equal(scoreGrade(230), 'A+');
  assert.equal(scoreGrade(190), 'A');
  assert.equal(scoreGrade(145), 'B');
  assert.equal(scoreGrade(110), 'C');
  assert.equal(scoreGrade(65), 'D');
  assert.equal(scoreGrade(15), 'E');
});

test('best delta lines and summary include unlocked fragments when present', () => {
  const game = loadGameHarness();
  const {
    state,
    buildRunSummary,
    remainingDeckCount,
    ensureRunDecks,
  } = game;
  state.runCompleted = true;
  state.distance = 12;
  state.heat = 9;
  state.shards = 3;
  state.drift = 15;
  state.runScore = 250;
  state.solved = 4;
  state.recentUnlocks = ['Steady Rudder', 'Silent Wake'];
  state.beacon = { x: 0, y: 0 };
  state.player = { x: 1, y: 1 };
  ensureRunDecks();

  const summary = buildRunSummary({
    bestScore: 120,
    bestDistance: 10,
    bestHeat: 5,
  });

  assert.ok(summary.includes('Score new personal best score: 250!'));
  assert.ok(summary.includes('Distance new personal best distance: 12!'));
  assert.ok(summary.includes('Heat new personal best heat: 9!'));
  assert.ok(summary.includes('Recovered fragments this run: Steady Rudder, Silent Wake'));
  assert.ok(summary.includes(`Deck cards remaining: ${remainingDeckCount()}`));
});

test('run flavor text can identify major failure states', () => {
  const game = loadGameHarness();
  const { state, runFlavorLine, MAX_DRIFT } = game;
  state.runCompleted = false;
  state.player = { x: 1, y: 1 };
  state.beacon = { x: 1, y: 2 };
  state.drift = MAX_DRIFT;
  state.shards = 9;
  assert.equal(
    runFlavorLine(),
    'A collapse edge was crossed. The district grid flinched and swallowed the route.',
  );
});
