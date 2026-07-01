/*
 * Tidewrought — the Selala script.
 *
 * Every root morpheme gets a deterministic glyph: a main "spine" stroke plus
 * secondary strokes, chosen by a seeded PRNG from the morpheme's romanization.
 * Affixes are small fixed marks that attach to the root — so the player can
 * SEE that "ika-mo" is the fish-glyph plus something extra, and that
 * "sel-tan" is sea + person.
 *
 * All coordinates live in a per-glyph box of GW x GH; words are rows of
 * glyph boxes with a shared baseline. Rendering returns SVG markup strings
 * that inherit `currentColor`.
 */
(function (root) {
  const TW = (root.TW = root.TW || {});

  const GW = 22, GH = 30;       // root glyph box
  const AW = 11;                // affix mark width

  // ------------------------------------------------------------- seeded PRNG
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ------------------------------------------------------------- stroke bank
  // Spines: the main stroke of a root glyph (tall, flowing, tide-like).
  const SPINES = [
    () => `M 6 3 C 16 6, 2 14, 11 19 C 16 22, 12 26, 8 27`,          // s-wave
    () => `M 14 3 C 4 7, 4 13, 12 15 C 20 17, 16 25, 6 27`,          // reverse s
    () => `M 5 4 C 5 14, 5 20, 10 24 C 13 26, 17 25, 18 21`,         // hook up
    () => `M 16 3 C 8 3, 5 9, 8 14 C 11 19, 6 22, 6 27`,             // crook
    () => `M 4 6 C 10 1, 18 5, 15 12 L 15 20 C 15 25, 10 28, 6 25`,  // loop-tail
    () => `M 11 3 L 11 17 C 11 23, 15 26, 19 24`,                    // staff-curl
    () => `M 4 24 C 4 12, 9 4, 18 4 C 13 10, 13 16, 18 22`,          // swell
  ];
  // Secondary strokes: smaller marks layered over/near the spine.
  const SECONDARIES = [
    () => `M 3 10 L 15 10`,                    // crossbar high
    () => `M 6 17 L 18 17`,                    // crossbar low
    () => `M 15 6 C 19 8, 19 12, 15 14`,       // right arc
    () => `M 6 6 C 2 9, 2 12, 6 14`,           // left arc
    () => `M 5 22 C 9 19, 14 19, 18 22`,       // smile
    () => `M 14 4 L 19 9`,                     // tick
    () => `M 3 27 L 19 27`,                    // baseline bar
    () => `M 16 16 C 20 18, 20 23, 15 24`,     // lower hook
  ];
  const DOTS = [
    [18, 5], [4, 5], [19, 14], [3, 15], [11, 12],
  ];

  // Hand-drawn marks for the bound morphemes — always the same, so the
  // player learns to spot them.
  const AFFIX_MARKS = {
    mo: { w: AW, d: [`M 3 22 L 3 27`, `M 8 22 L 8 27`], dots: [] },            // twin strokes: "many"
    ka: { w: AW, d: [`M 3 12 C 9 12, 9 18, 3 20 L 8 26`], dots: [] },          // grasping hook: "of"
    ta: { w: AW, d: [`M 2 18 L 9 18`, `M 2 23 L 9 23`], dots: [] },            // strata: "past"
    i:  { w: AW, d: [`M 2 8 C 4 5, 7 5, 9 8`], dots: [] },                     // breath curl: "-like"
    ru: { w: AW, d: [`M 5 4 L 5 27`, `M 2 8 L 5 4 L 8 8`], dots: [] },         // spear: command
    sa: { w: GW, d: [`M 6 6 C 14 4, 18 10, 12 14 C 9 16, 9 18, 11 20`], dots: [[11, 26]] }, // rising curl: question
    nai: { w: GW, d: [`M 4 6 L 18 24`, `M 18 6 L 4 24`], dots: [] },           // crossed out: no
    ai: { w: GW, d: [`M 4 16 C 8 24, 14 24, 18 14`], dots: [[11, 7]] },        // open bowl: yes
    en: { w: AW, d: [`M 5 10 L 5 20`], dots: [[5, 25]] },                      // joiner
  };

  const _cache = {};

  // Build stroke set for a root morpheme.
  function rootStrokes(rom) {
    if (_cache[rom]) return _cache[rom];
    const special = AFFIX_MARKS[rom];
    if (special) {
      _cache[rom] = { w: special.w, paths: special.d.slice(), dots: special.dots.slice() };
      return _cache[rom];
    }
    const rnd = mulberry32(hash('selala:' + rom));
    const paths = [SPINES[Math.floor(rnd() * SPINES.length)]()];
    const nSec = 1 + (rnd() < 0.45 ? 1 : 0);
    const used = new Set();
    for (let i = 0; i < nSec; i++) {
      let k = Math.floor(rnd() * SECONDARIES.length);
      if (used.has(k)) k = (k + 3) % SECONDARIES.length;
      used.add(k);
      paths.push(SECONDARIES[k]());
    }
    const dots = [];
    if (rnd() < 0.4) dots.push(DOTS[Math.floor(rnd() * DOTS.length)]);
    _cache[rom] = { w: GW, paths, dots };
    return _cache[rom];
  }

  // Decompose a display morpheme into visual parts: compounds show their
  // component roots, so derivation is visible in the script itself.
  function visualParts(rom) {
    const lower = rom.toLowerCase();
    const compound = TW.lexicon.compoundByRom[lower];
    if (compound) return compound.parts.slice();
    return [lower];
  }

  const AFFIX_SET = new Set(['mo', 'ka', 'ta', 'i', 'ru']);

  /*
   * Render one word (array of morpheme roms) to SVG inner markup.
   * Returns { svg, width, height }. Affixes render at reduced scale,
   * lowered toward the baseline; compounds unfold into their roots.
   */
  function wordMarkup(morphemes, opts) {
    const scale = (opts && opts.scale) || 1;
    let x = 0;
    let out = '';
    const stroke = `fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;

    for (const m of morphemes) {
      for (const part of visualParts(m)) {
        const g = rootStrokes(part);
        const isAffix = AFFIX_SET.has(part) && morphemes.length + visualParts(m).length > 1;
        const s = isAffix ? 0.72 : 1;
        const dy = isAffix ? GH * (1 - 0.72) : 0;
        out += `<g transform="translate(${x.toFixed(1)},${dy.toFixed(1)}) scale(${s})">`;
        for (const d of g.paths) out += `<path d="${d}" ${stroke}/>`;
        for (const [dx2, dy2] of g.dots) out += `<circle cx="${dx2}" cy="${dy2}" r="1.9" fill="currentColor"/>`;
        out += `</g>`;
        x += (g.w + 3) * s;
      }
      x += 2; // slight gap between morphemes within a word
    }
    return { svg: out, width: Math.max(x * scale, 8), height: GH * scale };
  }

  /*
   * Render a full utterance (array of words) as a self-contained <svg>
   * element string with per-word hover targets. `wordMeta` (optional)
   * is an array parallel to words: { title } tooltips.
   */
  function utteranceSVG(words, opts) {
    opts = opts || {};
    const scale = opts.scale || 1;
    const gap = 14 * scale;
    let x = 0;
    let inner = '';
    const layout = [];
    for (let i = 0; i < words.length; i++) {
      const wm = wordMarkup(words[i], {});
      layout.push({ x, width: wm.width, svg: wm.svg, word: words[i] });
      x += wm.width + gap;
    }
    const totalW = Math.max(x - gap, 10);
    for (let i = 0; i < layout.length; i++) {
      const L = layout[i];
      const cls = opts.wordClass ? ` class="${opts.wordClass}"` : '';
      const data = ` data-word="${L.word.join('-')}"`;
      inner += `<g${cls}${data} transform="translate(${L.x},0)">` +
               `<rect x="-4" y="-2" width="${L.width + 6}" height="${GH + 4}" fill="transparent"/>` +
               L.svg + `</g>`;
    }
    const w = totalW * scale, h = (GH + 4) * scale;
    return `<svg class="glyphs" viewBox="0 0 ${totalW} ${GH + 4}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" ` +
           `xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${inner}</svg>`;
  }

  TW.glyphs = { wordMarkup, utteranceSVG, visualParts, GW, GH };
})(typeof window !== 'undefined' ? window : globalThis);
