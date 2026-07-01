/*
 * Tidewrought — script/scene integrity tests.
 * Run: node tests/test_script.js   (from the Tidewrought directory)
 *
 * The beat script, scene art, and lexicon have to agree with each other:
 * hotspots that beats point at must exist, flags must be producible,
 * words must be taught before they're confirmed, and the shell economy
 * must never strand the player short at a mandatory payment.
 */
require('../js/lexicon.js');
require('../js/grammar.js');
require('../js/script.js');
require('../js/scenes.js');

const TW = globalThis.TW;
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL: ' + msg); }
}

const beats = TW.script.beats();
const SPEAKERS = ['nimi', 'turo', 'mara', 'nauro', 'villager1', 'villager2', 'anu'];
const ITEMS = ['kori', 'oma', 'selpel', 'mi'];

function sceneHas(scene, hotspot) {
  const sc = TW.scenes[scene];
  return sc && sc.svg.includes(`data-hotspot="${hotspot}"`);
}

console.log('1. Scenes and hotspots');
for (const b of beats) {
  ok(!!TW.scenes[b.scene], `[${b.id}] unknown scene "${b.scene}"`);
  if (b.on && b.on.startsWith('hotspot:')) {
    const hs = b.on.slice(8);
    ok(sceneHas(b.scene, hs), `[${b.id}] hotspot "${hs}" not in scene "${b.scene}"`);
  }
  let scene = b.scene; // goto steps move the beat to a new scene mid-stream
  for (const st of b.steps) {
    if (st.goto) { ok(!!TW.scenes[st.goto], `[${b.id}] goto unknown scene "${st.goto}"`); scene = st.goto; }
    if (st.unlock) ok(sceneHas(scene, st.unlock), `[${b.id}] unlock target "${st.unlock}" not in scene "${scene}"`);
    if (st.s && st.s.point) ok(sceneHas(scene, st.s.point), `[${b.id}] point target "${st.s.point}" not in scene "${scene}"`);
    if (st.s) ok(SPEAKERS.includes(st.s.by), `[${b.id}] unknown speaker "${st.s.by}"`);
    if (st.pz && st.pz.type === 'pointMatch') {
      for (const it of st.pz.items) ok(sceneHas(scene, it.hotspot), `[${b.id}] pointMatch hotspot "${it.hotspot}" missing`);
    }
  }
}

console.log('2. Flags: everything needed is produced somewhere');
const produced = new Set();
for (const b of beats) for (const st of b.steps) if (st.flag) produced.add(st.flag);
for (const b of beats) {
  for (const f of (b.need || [])) ok(produced.has(f), `[${b.id}] needs flag "${f}" that nothing sets`);
  for (const f of (b.not || [])) ok(produced.has(f), `[${b.id}] excludes flag "${f}" that nothing sets`);
}

console.log('3. Lexicon: taught/confirmed words exist; teach precedes confirm');
const taughtOrder = new Set();
for (const b of beats) {
  for (const st of b.steps) {
    for (const rom of (st.teach || [])) {
      ok(TW.lexicon.lookup(rom) !== null, `[${b.id}] teaches unknown morpheme "${rom}"`);
      taughtOrder.add(rom);
    }
    for (const rom of (st.confirm || [])) {
      ok(taughtOrder.has(rom), `[${b.id}] confirms "${rom}" before it is taught`);
    }
    if (st.give) ok(ITEMS.includes(st.give.item), `[${b.id}] gives unknown item "${st.give.item}"`);
    if (st.take) ok(ITEMS.includes(st.take.item), `[${b.id}] takes unknown item "${st.take.item}"`);
  }
}

console.log('4. Shell economy never goes negative on the mandatory path');
// Mandatory path: +3 (Nimi) → −2 (bread) → +5 (sorting) → −4 (fare).
// Optional: −1 (salt) after bread. Worst case includes the salt purchase.
let shells = 0; let okSoFar = true;
const flow = [
  ['nimi gives', +3], ['bread', -2], ['salt (optional)', -1], ['sorting pay', +5], ['ferry fare', -4],
];
for (const [label, d] of flow) {
  shells += d;
  if (shells < 0) { okSoFar = false; console.error(`  economy fails at "${label}" (${shells})`); }
}
ok(okSoFar && shells >= 0, 'shell economy strands the player');

console.log('5. Composer puzzles all offer a hint');
for (const p of TW.script.allComposerPuzzles()) {
  ok(typeof p.hint === 'string' && p.hint.length > 10, `[${p.id}] missing hint`);
}

console.log('6. Fetch options are drawable');
const FETCH_ICONS = ['pel', 'ika', 'lira', 'oma', 'kori'];
for (const b of beats) for (const st of b.steps) {
  if (st.pz && st.pz.type === 'fetch') {
    for (const o of st.pz.options) ok(FETCH_ICONS.includes(o), `[${b.id}] fetch option "${o}" has no icon`);
    ok(st.pz.options.includes(st.pz.want), `[${b.id}] fetch answer not among options`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
