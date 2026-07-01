/*
 * Tidewrought — game engine and UI.
 * Runs the beat script (js/script.js) against the scene art (js/scenes.js),
 * with all Selala rendered through the grammar engine and glyph script.
 */
(function () {
  const TW = window.TW;
  const G = TW.grammar;
  const NB = TW.notebook;
  const $ = (sel) => document.querySelector(sel);

  const SAVE_KEY = 'tidewrought_save_v1';

  const SPEAKERS = {
    nimi: { name: 'Nimi', color: '#c96f4a' },
    turo: { name: 'Turo', color: '#5d6b5a' },
    mara: { name: 'Mara', color: '#7d4f63' },
    nauro: { name: 'Nauro', color: '#3f5266' },
    villager1: { name: 'A villager', color: '#6b7d8f' },
    villager2: { name: 'Another villager', color: '#8f6b57' },
    anu: { name: 'The shape of mist and tide', color: '#5ec2b0' },
  };

  const ITEM_ICONS = { kori: '🐚', oma: '🍞', selpel: '🧂', mi: '💧' };

  const LOCKED_AT_START = {
    shore: ['turo', 'path'],
    village: ['baskets', 'saltpouch', 'pathJetty'],
    tower: ['stairs'],
  };

  // English flavor for hotspots with no active beat. Careful: never translate
  // Selala here — atmosphere only.
  const DEFAULTS = {
    shore: {
      sea: 'The sea. It got you into this. It is not apologizing.',
      fishflop: 'The little silver fish has flopped its way back toward the water. Respect.',
      rock: 'Grey rocks, furred with weed at the waterline.',
      bird: 'The bird watches the fish basket with a criminal\'s patience.',
      boat: 'A working skiff, mended more times than built.',
      wreck: 'Your former ship. The reef is still digesting it.',
      basket: 'Turo\'s fish basket. The bird is doing sums.',
      hut: 'A driftwood hut, tarred against the weather.',
      turo: 'The fisher works the net with half an eye on you.',
      nimi: 'Nimi watches you like you\'re the most interesting thing the tide has ever brought. You might be.',
      path: 'A sandy path climbs the dunes toward rooftops.',
    },
    village: {
      well: 'The village well. The bucket rope is worn glass-smooth.',
      stall: 'Mara\'s stall: fish, bread, bundles, and prices that are not negotiable.',
      saltpouch: 'Small pouches, stamped with a word.',
      baskets: 'Sorting baskets behind the stall.',
      villagers: 'Villagers going about their morning, trading the same two-word greeting.',
      mara: 'Mara counts stock without moving her lips. Formidable.',
      nimi: 'Nimi is introducing you to everyone by pointing at you and giggling.',
      pathShore: 'Back down the dunes to the shore.',
      pathJetty: 'A lane leads toward the water on the village\'s far side.',
    },
    jetty: {
      jetty: 'Barnacled planks. They hold. Probably.',
      ferryboat: 'The ferry: broad, tarred, and older than you.',
      towerFar: 'Across the strait, the black tower stands on its island like something the sea forgot to swallow.',
      nauro: 'The ferryman\'s hat is down over his eyes. The instruction stands.',
      nimi: 'Nimi skips stones. Four bounces. She looks smug.',
      pathVillage: 'Back toward the village square.',
    },
    tower: {
      towerbody: 'The tower has no windows and casts a shadow the sun doesn\'t explain.',
      door: 'The stone slab, and the three carved lines.',
      brazier: 'The iron brazier on its post.',
      pool: 'A tide pool in the black rock, clear as glass.',
      carvings: 'Rings of worn carvings: the same three words, hundreds of times.',
      stairs: 'Darkness where the door used to be, and the first steps of a spiral stair.',
      nauroBoat: 'Nauro waits with the boat, watching the water rather than the tower. On purpose.',
    },
    summit: {
      pool2: 'The still pool reflects a sea that isn\'t the one outside.',
      anu: 'The mist has eyes, and the eyes have tides in them.',
    },
  };

  // ------------------------------------------------------------------ state
  let S = null;
  function freshState() {
    return {
      scene: 'shore', flags: {}, doneBeats: {}, taught: {}, guesses: {},
      items: { kori: 0 }, unlocked: {}, night: false, ended: false, gift: false,
      composeFails: {},
    };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function isLocked(hs) {
    const base = (LOCKED_AT_START[S.scene] || []).includes(hs);
    return base && !S.unlocked[S.scene + ':' + hs];
  }

  // ------------------------------------------------------------- glyph text
  function glyphHTML(trees, opts) {
    const words = [];
    for (const t of Array.isArray(trees) ? trees : [trees]) {
      words.push(...G.generate(t));
    }
    return TW.glyphs.utteranceSVG(words, Object.assign({ wordClass: 'gword', scale: 1.7 }, opts || {}));
  }
  function glyphWordHTML(morphemes, scale) {
    return TW.glyphs.utteranceSVG([morphemes], { wordClass: 'gword', scale: scale || 1.4 });
  }

  function exposeTree(tree) {
    for (const w of G.generate(tree)) for (const m of w) NB.expose(S, m);
  }

  // Tooltip for glyph words
  const tip = document.createElement('div');
  tip.id = 'tip';
  document.body.appendChild(tip);
  document.addEventListener('mouseover', (e) => {
    const g = e.target.closest && e.target.closest('.gword');
    if (!g) { tip.style.display = 'none'; return; }
    const word = g.getAttribute('data-word');
    const parts = word.split('-');
    const bits = parts.map(m => {
      const known = S && S.taught[m];
      const guess = S && S.guesses[m];
      const name = TW.lexicon.nameByRom[m.toLowerCase()];
      if (name) return `${m} — a name`;
      if (guess) return `${m} — “${guess}”${known && known.confirmed ? ' ✓' : ''}`;
      if (known) return `${m} — ?`;
      return `${m}`;
    });
    tip.innerHTML = bits.join('<br>') + '<span class="tiphint">click to open notebook</span>';
    tip.style.display = 'block';
    const r = g.getBoundingClientRect();
    tip.style.left = Math.min(window.innerWidth - 240, r.left) + 'px';
    tip.style.top = (r.bottom + 8) + 'px';
  });
  document.addEventListener('click', (e) => {
    const g = e.target.closest && e.target.closest('.gword');
    if (!g) return;
    // glyphs inside buttons (composer chips, sort bins) act as the button
    if (g.closest('#composer') || g.closest('button')) return;
    e.stopPropagation();
    openNotebook(g.getAttribute('data-word').split('-')[0]);
  }, true);

  // ----------------------------------------------------------------- scene
  function renderScene() {
    const sc = TW.scenes[S.scene];
    $('#scene').innerHTML = `<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">${sc.svg}</svg>`;
    document.body.classList.toggle('night', !!S.night);
    // apply persistent scene mutations
    if (S.flags.doused && S.scene === 'tower') {
      const f = $('#scene .brazierFlame'); if (f) f.style.display = 'none';
      const d = $('#scene .doorOpen'); if (d) d.style.display = '';
    }
    for (const g of document.querySelectorAll('#scene [data-hotspot]')) {
      const id = g.getAttribute('data-hotspot');
      g.classList.add('hotspot');
      if (isLocked(id)) g.classList.add('locked');
      g.addEventListener('click', () => onHotspot(id));
    }
    renderHUD();
  }

  function flashHotspot(id) {
    const g = document.querySelector(`#scene [data-hotspot="${id}"]`);
    if (!g) return;
    g.classList.add('flash');
    setTimeout(() => g.classList.remove('flash'), 1800);
  }

  function renderHUD() {
    const inv = [];
    if (S.items.kori) inv.push(`<span class="invitem">${ITEM_ICONS.kori} ${S.items.kori}</span>`);
    for (const it of ['oma', 'selpel', 'mi']) {
      if (S.items[it]) inv.push(`<span class="invitem" title="">${ITEM_ICONS[it]}</span>`);
    }
    $('#inv').innerHTML = inv.join('');
  }

  // ------------------------------------------------------------- dialogue UI
  let advanceResolver = null;
  function waitClick() {
    return new Promise(res => { advanceResolver = res; });
  }
  $('#dialog').addEventListener('click', () => {
    if (advanceResolver) { const r = advanceResolver; advanceResolver = null; r(); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && advanceResolver && !$('#composer').classList.contains('open')
        && !$('#notebook').classList.contains('open')) {
      e.preventDefault();
      const r = advanceResolver; advanceResolver = null; r();
    }
  });

  function speakerChip(by) {
    const sp = SPEAKERS[by] || { name: '?', color: '#888' };
    return `<span class="chip" style="background:${sp.color}"></span><span class="spname">${sp.name}</span>`;
  }

  async function showNarration(text) {
    $('#dialog').innerHTML = `<div class="narr">${text}</div><div class="more">▸</div>`;
    await waitClick();
  }
  async function showSpeech(by, tree, opts) {
    exposeTree(tree);
    $('#dialog').innerHTML =
      `<div class="speech"><div class="speaker">${speakerChip(by)}</div>` +
      `<div class="gline">${glyphHTML(tree)}</div>` +
      ((opts && opts.note) ? `<div class="note">${opts.note}</div>` : '') +
      `</div><div class="more">▸</div>`;
    await waitClick();
  }
  async function showSign(sign) {
    for (const t of sign.trees) exposeTree(t);
    $('#dialog').innerHTML =
      `<div class="signblock"><div class="signlabel">✦ written ✦</div>` +
      `<div class="gline carved">${glyphHTML(sign.trees)}</div>` +
      `<div class="note">${sign.caption || ''}</div></div><div class="more">▸</div>`;
    await waitClick();
  }

  // ------------------------------------------------------------------ beats
  let busy = false;
  let pointMatchHandler = null;

  async function playBeat(beat) {
    busy = true;
    try {
      for (const st of beat.steps) {
        if (st.n) await showNarration(st.n);
        else if (st.s) {
          if (st.s.point) flashHotspot(st.s.point);
          await showSpeech(st.s.by, st.s.tree);
        }
        else if (st.sign) await showSign(st.sign);
        else if (st.teach) { NB.teach(S, st.teach); pulseNotebook(); }
        else if (st.confirm) { NB.confirm(S, st.confirm); }
        else if (st.give) { S.items[st.give.item] = (S.items[st.give.item] || 0) + st.give.n; renderHUD(); }
        else if (st.take) { S.items[st.take.item] = Math.max(0, (S.items[st.take.item] || 0) - st.take.n); renderHUD(); }
        else if (st.flag) { S.flags[st.flag] = true; }
        else if (st.unlock) { S.unlocked[S.scene + ':' + st.unlock] = true; const g = document.querySelector(`#scene [data-hotspot="${st.unlock}"]`); if (g) g.classList.remove('locked'); }
        else if (st.night) { S.night = true; document.body.classList.add('night'); }
        else if (st.dawn) { S.night = false; document.body.classList.remove('night'); }
        else if (st.goto) { S.scene = st.goto; renderScene(); }
        else if (st.pz) { await runPuzzle(st.pz); }
        else if (st.ending) { showEnding(); return; }
        // persistent visual: dousing
        if (st.flag === 'doused') {
          const f = $('#scene .brazierFlame'); if (f) f.style.display = 'none';
          const d = $('#scene .doorOpen'); if (d) d.style.display = '';
        }
      }
    } finally {
      busy = false;
      if (beat.once !== false) S.doneBeats[beat.id] = true;
      save();
    }
  }

  function beatMatches(b, hotspot) {
    if (b.scene !== S.scene) return false;
    const want = hotspot ? 'hotspot:' + hotspot : 'auto';
    if (b.on !== want) return false;
    if (b.once !== false && S.doneBeats[b.id]) return false;
    if (b.need && !b.need.every(f => S.flags[f])) return false;
    if (b.not && b.not.some(f => S.flags[f])) return false;
    return true;
  }

  async function onHotspot(id) {
    if (S.ended) return;
    if (pointMatchHandler) { pointMatchHandler(id); return; }
    if (busy) return;
    if (isLocked(id)) return;

    const beats = TW.script.beats();
    for (const b of beats) {
      if (!beatMatches(b, id)) continue;
      if (b.needItem && !(S.items[b.needItem] > 0)) {
        if (b.elseNarrate) { busy = true; await showNarration(b.elseNarrate); busy = false; }
        return;
      }
      await playBeat(b);
      await runAutos();
      return;
    }
    // second pass: beats blocked on need/needItem (but not consumed or
    // invalidated by `not` flags) show their elseNarrate
    for (const b of beats) {
      if (b.scene !== S.scene || b.on !== 'hotspot:' + id || !b.elseNarrate) continue;
      if (b.once !== false && S.doneBeats[b.id]) continue;
      if (b.not && b.not.some(f => S.flags[f])) continue;
      busy = true; await showNarration(b.elseNarrate); busy = false;
      return;
    }
    // navigation defaults
    const NAV = {
      'shore:path': 'village', 'village:pathShore': 'shore',
      'village:pathJetty': 'jetty', 'jetty:pathVillage': 'village',
    };
    const nav = NAV[S.scene + ':' + id];
    if (nav) { S.scene = nav; renderScene(); save(); await runAutos(); return; }
    const flavor = (DEFAULTS[S.scene] || {})[id];
    if (flavor) { busy = true; await showNarration(flavor); busy = false; }
  }

  async function runAutos() {
    if (S.ended) return;
    const beats = TW.script.beats();
    for (const b of beats) {
      if (beatMatches(b, null)) {
        await playBeat(b);
        return runAutos(); // flags may have enabled another auto beat
      }
    }
    idlePrompt();
  }

  function idlePrompt() {
    if (busy || advanceResolver) return;
    $('#dialog').innerHTML = `<div class="narr idle">— explore. Click what interests you. Words live in the <b>notebook</b>. —</div>`;
  }

  // ---------------------------------------------------------------- puzzles
  function runPuzzle(pz) {
    switch (pz.type) {
      case 'pointMatch': return pzPointMatch(pz);
      case 'fetch': return pzFetch(pz);
      case 'pay': return pzPay(pz, false);
      case 'buy': return pzPay(pz, true);
      case 'sort': return pzSort(pz);
      case 'compose': return pzCompose(pz);
      case 'offer': return pzOffer(pz);
    }
  }

  function pzPointMatch(pz) {
    return new Promise(resolve => {
      const queue = pz.items.slice();
      // deterministic-ish shuffle is unnecessary; script order is fine but rotate once
      queue.push(queue.shift());
      let cur = null;
      function next() {
        cur = queue.shift();
        if (!cur) {
          pointMatchHandler = null;
          resolve();
          return;
        }
        NB.expose(S, cur.rom);
        $('#dialog').innerHTML =
          `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
          `<div class="gline">${glyphWordHTML([cur.rom])}</div>` +
          `<div class="note">She waits for you to point. (Click it, out there in the world.)</div></div>`;
      }
      pointMatchHandler = (hotspotId) => {
        if (hotspotId === cur.hotspot) {
          flashHotspot(hotspotId);
          next();
        } else {
          const d = $('#dialog'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
          $('#dialog').innerHTML =
            `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
            `<div class="gline">${glyphWordHTML(['nai'])} &nbsp; ${glyphWordHTML([cur.rom])}</div>` +
            `<div class="note">A firm little headshake. She repeats the word.</div></div>`;
          NB.expose(S, 'nai');
        }
      };
      next();
    });
  }

  const FETCH_ICONS = { pel: '🪨', ika: '🐟', lira: '🐦', oma: '🍞', kori: '🐚' };
  function pzFetch(pz) {
    return new Promise(resolve => {
      function render(msg) {
        $('#dialog').innerHTML =
          `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
          `<div class="gline">${glyphHTML(G.clause('veno', { imp: true, o: G.np(pz.want) }))}</div>` +
          (msg ? `<div class="note">${msg}</div>` : '<div class="note">His palm stays out. Hand him something.</div>') +
          `<div class="options">` +
          pz.options.map(o => `<button class="opt" data-o="${o}">${FETCH_ICONS[o] || '?'}</button>`).join('') +
          `</div></div>`;
        for (const b of document.querySelectorAll('#dialog .opt')) {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const o = b.getAttribute('data-o');
            if (o === pz.want) { resolve(); }
            else {
              if (pz.wrongTree) exposeTree(pz.wrongTree);
              const fails = S.composeFails[pz.id] = (S.composeFails[pz.id] || 0) + 1;
              const extra = (fails >= 2 && pz.hint) ? '<br><i>' + pz.hint + '</i>' : '';
              render('“nai.” He pushes it back at you, unimpressed.' + extra);
            }
          });
        }
      }
      render(null);
    });
  }

  function pzPay(pz, optional) {
    return new Promise(resolve => {
      let offered = 0;
      function render(msg) {
        const have = S.items.kori || 0;
        $('#dialog').innerHTML =
          `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
          `<div class="gline">${glyphHTML(G.np('kori', { num: ['','ho','pa','sen','nara','lima'][pz.amount] }))}</div>` +
          `<div class="note">${msg || 'Shells on the counter. How many?'}</div>` +
          `<div class="payrow"><button class="pm" data-d="-1">−</button>` +
          `<span class="offer">${'🐚'.repeat(offered) || '<i>none</i>'}</span>` +
          `<button class="pm" data-d="1">＋</button>` +
          `<button class="confirm">offer</button>` +
          (optional ? `<button class="skip">step away</button>` : '') +
          `<span class="havenote">(you have ${have})</span></div></div>`;
        for (const b of document.querySelectorAll('#dialog .pm')) {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            offered = Math.max(0, Math.min(have, offered + parseInt(b.getAttribute('data-d'), 10)));
            render(msg);
          });
        }
        const c = $('#dialog .confirm');
        c.addEventListener('click', (e) => {
          e.stopPropagation();
          if (offered === pz.amount) {
            if (optional) {
              S.items.kori -= pz.amount;
              S.items[pz.item] = (S.items[pz.item] || 0) + 1;
              renderHUD();
            }
            resolve();
          } else {
            NB.expose(S, 'nai');
            const fails = S.composeFails[pz.id] = (S.composeFails[pz.id] || 0) + 1;
            render(`A flat look. “nai.” ${fails >= 2 && pz.hint ? '<br><i>' + pz.hint + '</i>' : ''}`);
          }
        });
        const sk = $('#dialog .skip');
        if (sk) sk.addEventListener('click', (e) => { e.stopPropagation(); resolve(); });
      }
      render(null);
    });
  }

  function pzSort(pz) {
    return new Promise(resolve => {
      const items = pz.items.slice();
      let idx = 0, mistakes = 0;
      function render(msg) {
        const it = items[idx];
        if (!it) { resolve(); return; }
        $('#dialog').innerHTML =
          `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
          `<div class="note">${msg || 'She points at the catch, then at the two marked baskets.'}</div>` +
          `<div class="sortitem">${'🐟'.repeat(it.count)}</div>` +
          `<div class="options">` +
          pz.bins.map((b, i) =>
            `<button class="opt bin" data-b="${i}">${glyphWordHTML(b.rom.split('-'))}</button>`).join('') +
          `</div></div>`;
        for (const b of document.querySelectorAll('#dialog .bin')) {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const chosen = parseInt(b.getAttribute('data-b'), 10);
            if (chosen === it.bin) { idx++; render(idx < items.length ? 'A curt nod. Next.' : null); }
            else {
              mistakes++;
              NB.expose(S, 'nai');
              render('“nai.” She moves it to the other basket herself, with theatrical patience.' +
                     (mistakes >= 2 && pz.hint ? '<br><i>' + pz.hint + '</i>' : ''));
              items[idx] = it; // retry same item
            }
          });
        }
      }
      render(null);
    });
  }

  function pzOffer(pz) {
    return new Promise(async resolve => {
      if (!(S.items[pz.item] > 0)) { resolve(); return; }
      $('#dialog').innerHTML =
        `<div class="speech"><div class="speaker">${speakerChip(pz.by)}</div>` +
        `<div class="note">${pz.prompt}</div>` +
        `<div class="options"><button class="opt" id="offerBtn">${ITEM_ICONS[pz.item]}</button>` +
        `<button class="skip" id="offerSkip">say nothing</button></div></div>`;
      $('#offerBtn').addEventListener('click', async (e) => {
        e.stopPropagation();
        S.items[pz.item] -= 1;
        S.gift = true;
        renderHUD();
        await showSpeech(pz.by, pz.thanksTree, { note: 'The mist takes the salt like the sea takes rain — as if it were always its.' });
        if (pz.thanksTree2) await showSpeech(pz.by, pz.thanksTree2);
        resolve();
      });
      $('#offerSkip').addEventListener('click', (e) => { e.stopPropagation(); resolve(); });
    });
  }

  // --------------------------------------------------------------- composer
  const AFFIX_BUTTONS = [
    { rom: 'ru', label: 'ru-', pos: 'v' },
    { rom: 'ta', label: '-ta', pos: 'v' },
    { rom: 'mo', label: '-mo', pos: 'n' },
    { rom: 'ka', label: '-ka', pos: 'any' },
  ];

  function composerChips() {
    // all taught free morphemes, in the order learned
    return NB.entries(S)
      .filter(e => !['mo', 'ka', 'ta', 'ru', 'i', 'sa'].includes(e.rom))
      .map(e => e.rom);
  }

  function buildWord(root, affixes) {
    const w = [];
    if (affixes.has('ru')) w.push('ru');
    w.push(root);
    if (affixes.has('mo')) w.push('mo');
    if (affixes.has('ta')) w.push('ta');
    if (affixes.has('ka')) w.push('ka');
    return w;
  }

  function pzCompose(pz) {
    return new Promise(resolve => {
      const comp = $('#composer');
      comp.classList.add('open');
      let sentence = []; // [{root, affixes:Set}]
      let selected = -1;
      let sa = false;

      function currentWords() {
        const words = sentence.map(w => buildWord(w.root, w.affixes));
        if (sa) words.push(['sa']);
        return words;
      }

      function render(msg) {
        const fails = S.composeFails[pz.id] || 0;
        const chips = composerChips();
        comp.innerHTML =
          `<div class="comp-head">Say something ${pz.by ? 'to ' + (SPEAKERS[pz.by] || {}).name : ''}</div>` +
          `<div class="comp-sentence">${
            sentence.length
              ? sentence.map((w, i) =>
                  `<span class="sword ${i === selected ? 'sel' : ''}" data-i="${i}">${glyphWordHTML(buildWord(w.root, w.affixes))}</span>`
                ).join('') + (sa ? `<span class="sword">${glyphWordHTML(['sa'])}</span>` : '')
              : '<span class="comp-empty">…build your sentence from the words below…</span>'
          }</div>` +
          `<div class="comp-tools">` +
            AFFIX_BUTTONS.filter(a => NB.knows(S, a.rom)).map(a =>
              `<button class="afx" data-a="${a.rom}" ${selected < 0 ? 'disabled' : ''}>${a.label}</button>`).join('') +
            (NB.knows(S, 'sa') ? `<button class="afx ${sa ? 'on' : ''}" data-a="sa">…sa?</button>` : '') +
            `<button class="afx" data-a="del" ${selected < 0 ? 'disabled' : ''}>✕ word</button>` +
            `<button class="afx" data-a="clear">clear</button>` +
          `</div>` +
          `<div class="comp-bank">${chips.map(rom => {
            const guess = S.guesses[rom];
            return `<button class="cword" data-rom="${rom}">${glyphWordHTML([rom])}<span class="cgloss">${guess ? guess : rom}</span></button>`;
          }).join('')}</div>` +
          `<div class="comp-actions">` +
            (msg ? `<div class="comp-msg">${msg}</div>` : '') +
            (fails >= 2 && pz.hint ? `<div class="comp-hint">✎ ${pz.hint}</div>` : '') +
            `<button id="speakBtn" ${sentence.length || sa ? '' : 'disabled'}>Speak</button>` +
          `</div>`;

        for (const b of comp.querySelectorAll('.cword')) {
          b.addEventListener('click', () => {
            sentence.push({ root: b.getAttribute('data-rom'), affixes: new Set() });
            selected = sentence.length - 1;
            render(msg);
          });
        }
        for (const sw of comp.querySelectorAll('.sword[data-i]')) {
          sw.addEventListener('click', () => { selected = parseInt(sw.getAttribute('data-i'), 10); render(msg); });
        }
        for (const b of comp.querySelectorAll('.afx')) {
          b.addEventListener('click', () => {
            const a = b.getAttribute('data-a');
            if (a === 'sa') { sa = !sa; }
            else if (a === 'clear') { sentence = []; selected = -1; sa = false; }
            else if (a === 'del') { if (selected >= 0) { sentence.splice(selected, 1); selected = -1; } }
            else if (selected >= 0) {
              const st = sentence[selected].affixes;
              st.has(a) ? st.delete(a) : st.add(a);
            }
            render(msg);
          });
        }
        const sb = comp.querySelector('#speakBtn');
        if (sb) sb.addEventListener('click', async () => {
          const words = currentWords();
          const tree = G.parse(words);
          if (!tree) {
            S.composeFails[pz.id] = (S.composeFails[pz.id] || 0) + 1;
            render(`You say it. ${SPEAKERS[pz.by] ? SPEAKERS[pz.by].name : 'They'} tilts their head: <b>“sa?”</b> — that wasn't Selala.`);
            return;
          }
          if (G.matchesAny(tree, pz.accept)) {
            comp.classList.remove('open');
            comp.innerHTML = '';
            resolve();
          } else {
            S.composeFails[pz.id] = (S.composeFails[pz.id] || 0) + 1;
            render('Grammatical — you can tell, because they clearly UNDERSTOOD you. They just wait, unpersuaded. That wasn\'t an answer to what they asked.');
          }
        });
      }
      render(null);
    });
  }

  // --------------------------------------------------------------- notebook
  function pulseNotebook() {
    const b = $('#nbBtn');
    b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
  }

  function openNotebook(focusRom) {
    const nb = $('#notebook');
    nb.classList.add('open');
    const ents = NB.entries(S);
    const obs = NB.observations(S);
    nb.innerHTML =
      `<div class="nb-head"><span>✎ Field Notebook — ${ents.length} words</span><button id="nbClose">✕</button></div>` +
      `<div class="nb-list">` +
      ents.map(e => {
        const morphs = e.rom.split('-');
        return `<div class="nb-entry ${focusRom === e.rom ? 'focus' : ''}" id="nb-${e.rom}">` +
          `<span class="nb-glyph">${glyphWordHTML(morphs)}</span>` +
          `<span class="nb-rom">${e.rom}</span>` +
          `<input class="nb-guess" data-rom="${e.rom}" value="${(e.guess || '').replace(/"/g, '&quot;')}" placeholder="your guess…">` +
          `<span class="nb-mark">${e.confirmed ? '✓' : '·'.repeat(Math.min(e.count, 5))}</span>` +
          `</div>`;
      }).join('') +
      `</div>` +
      (obs.length ? `<div class="nb-obs"><div class="nb-obshead">Tide-marks — things you\'ve noticed</div>` +
        obs.map(o => `<div class="nb-ob">${glyphWordHTML([o.rom])}<span>${o.text}</span></div>`).join('') + `</div>` : '');
    $('#nbClose').addEventListener('click', () => { nb.classList.remove('open'); save(); });
    for (const inp of nb.querySelectorAll('.nb-guess')) {
      inp.addEventListener('input', () => { S.guesses[inp.getAttribute('data-rom')] = inp.value.trim(); });
      inp.addEventListener('change', () => save());
    }
    if (focusRom) {
      const el = document.getElementById('nb-' + focusRom);
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }
  $('#nbBtn').addEventListener('click', () => {
    if ($('#notebook').classList.contains('open')) { $('#notebook').classList.remove('open'); save(); }
    else openNotebook(null);
  });

  // ----------------------------------------------------------------- ending
  function showEnding() {
    S.ended = true;
    save();
    const ents = NB.entries(S);
    const confirmed = ents.filter(e => e.confirmed).length;
    const judged = ents.filter(e => (S.guesses[e.rom] || '').trim());
    let right = 0;
    const rows = ents.map(e => {
      const m = TW.lexicon.lookup(e.rom);
      const truth = m ? (m.gloss === 'Q' ? 'question-mark' : m.gloss) : '?';
      const guess = (S.guesses[e.rom] || '').trim();
      const hit = guess && truth.toLowerCase().includes(guess.toLowerCase().split(/[ ,/]/)[0]) && guess.length > 1;
      if (hit) right++;
      return `<tr><td>${glyphWordHTML(e.rom.split('-'))}</td><td>${e.rom}</td><td>${guess || '—'}</td><td>${truth}</td></tr>`;
    }).join('');
    $('#overlay').innerHTML =
      `<div class="endcard">` +
      `<h1>suru hana</h1>` +
      `<p>You wake on a shore you know, under a sun that rises the correct way, in a country where you understand every word anyone says — and for weeks, that will feel like the strange part.</p>` +
      `<p>${S.gift
          ? 'In your pocket: a small white shell that is always faintly wet, and always smells of salt. Sometimes, held to your ear, it says the greeting back to you.'
          : 'In your pocket: sand, and a child\'s lucky shell. You hope she\'s telling the story right — the one about the sea-person she taught to speak.'}</p>` +
      `<p class="endstats">Words met: <b>${ents.length}</b> · confirmed by use: <b>${confirmed}</b> · glossed in your notebook: <b>${judged.length}</b></p>` +
      `<details><summary>Open the notebook one last time (the truth, next to your guesses)</summary>` +
      `<table class="endtable"><tr><th></th><th>word</th><th>you wrote</th><th>it meant</th></tr>${rows}</table></details>` +
      `<button id="restart">Begin again (new save)</button>` +
      `</div>`;
    $('#overlay').classList.add('open');
    $('#restart').addEventListener('click', () => {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    });
  }

  // ------------------------------------------------------------------ title
  function showTitle(hasSave) {
    $('#overlay').innerHTML =
      `<div class="titlecard">` +
      `<div class="titleglyphs">${glyphHTML(G.np('selala'))}</div>` +
      `<h1>TIDEWROUGHT</h1>` +
      `<p class="tagline">You will wash ashore. No one will speak your language.<br>That's the game.</p>` +
      `<p class="howto">Click the world. Hover words to check your notes; click a word to write what you think it means.<br>Nothing is ever translated for you — but nothing is unfair, either.</p>` +
      `<div class="titlebtns">` +
      (hasSave ? `<button id="contBtn">Continue</button>` : '') +
      `<button id="newBtn">${hasSave ? 'New game' : 'Wash ashore'}</button>` +
      `</div></div>`;
    $('#overlay').classList.add('open');
    if (hasSave) $('#contBtn').addEventListener('click', () => {
      $('#overlay').classList.remove('open'); $('#overlay').innerHTML = '';
      start(load());
    });
    $('#newBtn').addEventListener('click', () => {
      localStorage.removeItem(SAVE_KEY);
      $('#overlay').classList.remove('open'); $('#overlay').innerHTML = '';
      start(null);
    });
  }

  // ------------------------------------------------------------------ start
  async function start(saved) {
    S = saved || freshState();
    window.TWSTATE = S; // debugging aid
    renderScene();
    if (S.ended) { showEnding(); return; }
    await runAutos();
  }

  const existing = load();
  showTitle(!!(existing && Object.keys(existing.taught || {}).length));
})();
