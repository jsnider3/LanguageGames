/*
 * Tidewrought — language engine tests.
 * Run: node tests/test_language.js   (from the Tidewrought directory)
 *
 * Validates that Selala is internally consistent:
 *   1. Hand-picked sentences generate the expected surface forms.
 *   2. Every generated sentence parses back to the same meaning tree.
 *   3. Fuzz: thousands of random meaning trees round-trip generate→parse.
 *   4. Every scripted dialogue line in the game parses.
 *   5. Every puzzle's acceptable answers are grammatical and distinct.
 */
require('../js/lexicon.js');
require('../js/grammar.js');
require('../js/script.js');

const TW = globalThis.TW;
const G = TW.grammar;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL: ' + msg); }
}

// ------------------------------------------------ 1. surface form spot checks
console.log('1. Surface forms');
const cases = [
  [G.clause('moku', { s: G.np('tan'), o: G.np('ika') }), 'moku tan ika'],
  [G.clause('veno', { imp: true, o: G.np('pel') }), 'ru-veno pel'],
  [G.clause('tavi', { s: G.np('nau'), neg: true }), 'nai tavi nau'],
  [G.clause('tavi', { s: G.np('tan', { adj: 'puru' }), past: true, o: G.np('hest') }), 'tavi-ta tan puru hest'],
  [G.clause('nelu', { s: G.np('ke'), o: G.np('ika'), q: true }), 'nelu ke ika sa'],
  [G.clause('nelu', { s: G.np('na'), comp: G.clause('tavi', { o: G.np('toma') }) }), 'nelu na tavi toma'],
  [G.clause(null, { s: G.np('ti'), o: G.np('ika') }), 'ti ika'],
  [G.clause(null, { s: G.np('ren', { poss: G.np('ke') }), q: true }), 'ke-ka ren sa'],
  [G.clause(null, { s: G.np('na'), o: G.np('seltan') }), 'na seltan'],
  [G.np('kori', { num: 'pa' }), 'pa kori'],
  [G.np('ika', { pl: true }), 'ika-mo'],
  [G.np('nau', { poss: G.np('na'), adj: 'boro' }), 'na-ka nau boro'],
  [G.clause(null, { s: G.np('suru'), o: G.adjp('hana'), neg: true }), 'suru nai hana'],
  [G.clause('hama', { s: G.np('na'), o: G.np('kori', { num: 'sen' }) }), 'hama na sen kori'],
  [G.part('ai'), 'ai'],
  [G.clause('oto', { s: G.np('ke'), o: G.np('sel'), past: true, q: true }), 'oto-ta ke sel sa'],
];
for (const [tree, expected] of cases) {
  const got = G.romanize(G.generate(tree));
  ok(got === expected, `expected "${expected}", got "${got}"`);
}

// ------------------------------------------------ 2. round-trip the spot checks
console.log('2. Round-trip parse of spot checks');
for (const [tree, surface] of cases) {
  const back = G.parse(surface);
  ok(back !== null, `"${surface}" failed to parse`);
  if (back) ok(G.treeEquals(tree, back), `"${surface}" round-trip mismatch:\n    want ${JSON.stringify(G.normalize(tree))}\n    got  ${JSON.stringify(G.normalize(back))}`);
}

// ------------------------------------------------ 3. fuzz round-trip
console.log('3. Fuzz round-trip');
// Deterministic PRNG so failures are reproducible.
let seed = 42;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

const NOUNS = TW.lexicon.MORPHEMES.filter(m => m.pos === 'n').map(m => m.rom);
const VERBS = TW.lexicon.MORPHEMES.filter(m => m.pos === 'v').map(m => m.rom);
const ADJS = TW.lexicon.MORPHEMES.filter(m => m.pos === 'adj').map(m => m.rom);
const NUMS = TW.lexicon.MORPHEMES.filter(m => m.pos === 'num').map(m => m.rom);
const PRONS = ['na', 'ke', 'ti', 'za'];

function randNP(allowPoss) {
  const t = G.np(rnd() < 0.25 ? pick(PRONS) : pick(NOUNS));
  const isPron = PRONS.includes(t.n);
  if (!isPron) {
    if (rnd() < 0.25) t.num = pick(NUMS);
    else if (rnd() < 0.25) t.pl = true;
    if (rnd() < 0.3) t.adj = pick(ADJS);
    if (allowPoss && rnd() < 0.25) t.poss = G.np(rnd() < 0.5 ? pick(PRONS) : pick(NOUNS));
  }
  return t;
}

function randClause() {
  if (rnd() < 0.15) {
    // copular: S PRED  (affirmative adj predication is authored as NP+adj,
    // so only NP predicates and negated adj predicates here)
    const s = randNP(true);
    if (rnd() < 0.4) return G.clause(null, { s, o: G.adjp(pick(ADJS)), neg: true, q: rnd() < 0.3 });
    // predicate NP: keep it simple (no trailing-adj predicate, which would
    // reattach to the predicate NP identically — semantically equivalent)
    const pred = G.np(pick(NOUNS));
    return G.clause(null, { s, o: pred, q: rnd() < 0.3 });
  }
  const t = G.clause(pick(VERBS));
  t.imp = rnd() < 0.2;
  if (!t.imp) {
    t.past = rnd() < 0.3;
    t.s = randNP(true);
    t.neg = rnd() < 0.2;
  }
  if (rnd() < 0.6) t.o = randNP(true);
  if (t.v === 'nelu' && rnd() < 0.4) {
    t.comp = G.clause(pick(VERBS), { o: rnd() < 0.6 ? G.np(pick(NOUNS)) : null });
    if (t.comp.v === t.v) t.comp = null; // avoid "want want"
  }
  t.q = !t.imp && rnd() < 0.25;
  return t;
}

let fuzzFails = 0;
for (let i = 0; i < 5000; i++) {
  const tree = randClause();
  const surface = G.romanize(G.generate(tree));
  const back = G.parse(surface);
  if (!back || !G.treeEquals(tree, back)) {
    fuzzFails++;
    if (fuzzFails <= 5) {
      console.error(`  FUZZ FAIL: "${surface}"\n    want ${JSON.stringify(G.normalize(tree))}\n    got  ${back ? JSON.stringify(G.normalize(back)) : 'null'}`);
    }
  }
}
ok(fuzzFails === 0, `${fuzzFails}/5000 fuzz round-trips failed`);

// ------------------------------------------------ 4. all scripted dialogue parses
console.log('4. Scripted dialogue');
const lines = TW.script.allSelalaLines();
ok(lines.length > 0, 'script exposes Selala lines');
for (const { id, tree } of lines) {
  const surface = G.romanize(G.generate(tree));
  const back = G.parse(surface);
  ok(back !== null, `[${id}] "${surface}" does not parse`);
  if (back) ok(G.treeEquals(tree, back), `[${id}] "${surface}" round-trip mismatch`);
  // every morpheme must exist in the lexicon
  for (const w of G.generate(tree)) {
    for (const m of w) {
      ok(TW.lexicon.lookup(m) !== null, `[${id}] unknown morpheme "${m}" in "${surface}"`);
    }
  }
}

// ------------------------------------------------ 5. puzzle answers are valid
console.log('5. Puzzle answers');
for (const p of TW.script.allComposerPuzzles()) {
  ok(p.accept.length > 0, `[${p.id}] has no acceptable answers`);
  for (const t of p.accept) {
    const surface = G.romanize(G.generate(t));
    const back = G.parse(surface);
    ok(back !== null && G.treeEquals(t, back), `[${p.id}] answer "${surface}" is not grammatical/round-trippable`);
  }
}

// Every composer answer must be buildable from words taught BEFORE the puzzle
// (otherwise the player can be softlocked at a comprehension gate).
console.log('6. Word availability at each composer gate');
const taught = new Set(['sa']); // the composer's question-mark toggle is always shown
for (const ev of TW.script.teachTimeline()) {
  if (ev.kind === 'teach') { ev.roms.forEach(r => taught.add(r)); continue; }
  for (const t of ev.pz.accept) {
    const morphemes = G.generate(t).flat();
    for (const m of morphemes) {
      ok(taught.has(m) || TW.lexicon.nameByRom[m.toLowerCase()],
         `[${ev.pz.id}] answer needs "${m}" which is not yet taught at beat "${ev.beat}"`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
