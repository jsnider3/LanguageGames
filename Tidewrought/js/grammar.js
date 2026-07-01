/*
 * Tidewrought — Grammar engine for Selala.
 *
 * Selala in brief:
 *   - Word order: VSO.            "moku tan ika"  = the person eats fish
 *   - Zero copula.                "na Seltan"     = I [am] Seltan
 *   - Adjective follows noun.     "nau boro"      = big boat
 *   - Numeral precedes noun,      "pa kori"       = two shells
 *     and blocks the plural (no "pa kori-mo").
 *   - Possessor + -ka precedes.   "na-ka nau"     = my boat
 *   - Plural -mo.                 "ika-mo"        = fishes
 *   - Past -ta.                   "tavi-ta"       = went
 *   - Imperative ru-.             "ru-veno"       = give!
 *   - Negator nai before verb.    "nai kena na"   = I don't know
 *   - Question particle sa, sentence-final.
 *   - "want" takes a bare-verb complement: "nelu na tavi toma" = I want to go home.
 *
 * Meaning trees:
 *   Clause: { kind:'clause', v, s, o, comp, neg, past, imp, q }
 *     v: verb rom or null (null = copular clause; o is the predicate)
 *   NP:     { kind:'np', n, pl, adj, num, poss, proper }
 *     n: noun/pronoun rom, or proper name when `proper` is true
 *   AdjP:   { kind:'adjp', adj }              (copular predicate: "suru hana")
 *   Part:   { kind:'part', p, q }             (bare "ai" / "nai")
 *
 * Surface form: array of words; each word is an array of morpheme roms,
 * e.g. [['ru','veno'],['pel']] for "ru-veno pel".
 */
(function (root) {
  const TW = (root.TW = root.TW || {});
  const lex = () => TW.lexicon;

  // ---------------------------------------------------------------- helpers

  function np(n, opts) {
    return Object.assign({ kind: 'np', n, pl: false, adj: null, num: null, poss: null, proper: false }, opts || {});
  }
  function clause(v, opts) {
    return Object.assign({ kind: 'clause', v: v || null, s: null, o: null, comp: null, neg: false, past: false, imp: false, q: false }, opts || {});
  }
  function adjp(adj) { return { kind: 'adjp', adj }; }
  function part(p, q) { return { kind: 'part', p, q: !!q }; }

  function isVerbRom(rom) {
    const m = lex().byRom[rom];
    return !!m && m.pos === 'v';
  }
  function posOf(rom) {
    const m = lex().lookup(rom);
    if (!m) return null;
    return m.pos || 'name';
  }

  // ---------------------------------------------------------------- generate

  function genNP(t) {
    const words = [];
    if (t.poss) {
      const possWords = genNP(t.poss);
      // -ka attaches to the last word of the possessor NP
      possWords[possWords.length - 1] = possWords[possWords.length - 1].concat(['ka']);
      words.push(...possWords);
    }
    if (t.num) words.push([t.num]);
    const head = [t.n];
    if (t.pl && !t.num) head.push('mo');
    words.push(head);
    if (t.adj) words.push([t.adj]);
    return words;
  }

  function genClause(t) {
    const words = [];
    if (t.v) {
      if (t.neg) words.push(['nai']);
      const vw = [];
      if (t.imp) vw.push('ru');
      vw.push(t.v);
      if (t.past) vw.push('ta');
      words.push(vw);
      if (t.s) words.push(...genNP(t.s));
      if (t.o) words.push(...genNP(t.o));
      if (t.comp) {
        // bare-verb complement: verb [+object], subject omitted
        const c = t.comp;
        const cw = [c.v];
        if (c.past) cw.push('ta');
        words.push(cw);
        if (c.o) words.push(...genNP(c.o));
      }
    } else {
      // copular: SUBJECT PREDICATE
      if (t.s) words.push(...genNP(t.s));
      if (t.neg) words.push(['nai']);
      if (t.o) {
        if (t.o.kind === 'adjp') words.push([t.o.adj]);
        else words.push(...genNP(t.o));
      }
    }
    if (t.q) words.push(['sa']);
    return words;
  }

  function generate(tree) {
    if (tree.kind === 'part') {
      const words = [[tree.p]];
      if (tree.q) words.push(['sa']);
      return words;
    }
    if (tree.kind === 'np' || tree.kind === 'adjp') {
      // bare NP utterance (pointing at things): "ika", "nau boro"
      return tree.kind === 'np' ? genNP(tree) : [[tree.adj]];
    }
    return genClause(tree);
  }

  // Romanized surface string, morphemes hyphen-joined within words.
  function romanize(words) {
    return words.map(w => w.join('-')).join(' ');
  }

  // ------------------------------------------------------------------ parse

  // Split a romanized string into word-morpheme arrays.
  function tokenize(str) {
    return str.trim().toLowerCase().split(/\s+/).filter(Boolean).map(w => w.split('-').filter(Boolean));
  }

  // Parse one NP starting at index i in `words`. Returns [npTree, nextIndex] or null.
  function parseNP(words, i) {
    let idx = i;
    let poss = null;
    let num = null;

    // possessor: NP whose last word carries -ka (only simple possessors: pron/noun word + ka)
    if (idx < words.length && words[idx][words[idx].length - 1] === 'ka' && words[idx].length > 1) {
      const inner = words[idx].slice(0, -1);
      const headRom = inner[0];
      const pos = posOf(headRom);
      if (pos === 'pron' || pos === 'n' || pos === 'name') {
        poss = np(headRom, { pl: inner.includes('mo'), proper: pos === 'name' });
        idx++;
      }
    }
    if (idx < words.length && words[idx].length === 1 && posOf(words[idx][0]) === 'num') {
      num = words[idx][0];
      idx++;
    }
    if (idx >= words.length) return null;

    const w = words[idx];
    const headRom = w[0];
    const pos = posOf(headRom);
    if (pos !== 'n' && pos !== 'pron' && pos !== 'name') return null;
    const head = np(headRom, {
      pl: w.includes('mo'),
      num,
      poss,
      proper: pos === 'name',
    });
    idx++;

    // trailing adjective attaches to this NP
    if (idx < words.length && words[idx].length === 1 && posOf(words[idx][0]) === 'adj') {
      head.adj = words[idx][0];
      idx++;
    }
    return [head, idx];
  }

  // Parse a full utterance (array of word-morpheme-arrays, or a romanized string).
  // Returns a meaning tree, or null if ungrammatical.
  function parse(input) {
    let words = typeof input === 'string' ? tokenize(input) : input.map(w => w.slice());
    if (!words.length) return null;

    let q = false;
    const last = words[words.length - 1];
    if (last.length === 1 && last[0] === 'sa') {
      q = true;
      words = words.slice(0, -1);
      if (!words.length) return part('sa', false); // bare "sa?" — puzzled noise
    }

    // bare particle: "ai" / "nai"
    if (words.length === 1 && words[0].length === 1 && (words[0][0] === 'ai' || words[0][0] === 'nai')) {
      return part(words[0][0], q);
    }

    // find the verb word
    let neg = false;
    let vIdx = -1;
    for (let i = 0; i < words.length; i++) {
      const core = words[i].filter(m => m !== 'ru' && m !== 'ta');
      if (core.length === 1 && isVerbRom(core[0])) { vIdx = i; break; }
    }

    if (vIdx === -1) {
      // single-word specials: bare adjective ("hana!") or bare numeral ("sen!")
      if (words.length === 1 && words[0].length === 1) {
        const pos0 = posOf(words[0][0]);
        if (pos0 === 'adj') return q ? clause(null, { o: adjp(words[0][0]), q }) : adjp(words[0][0]);
        if (pos0 === 'num') return q ? clause(null, { s: np(words[0][0]), q }) : np(words[0][0]);
      }
      // copular / bare-NP utterance: NP [nai] (NP | ADJ)
      const first = parseNP(words, 0);
      if (!first) return null;
      let [subj, idx] = first;
      if (idx === words.length) {
        // bare NP ("ika!") — pointing/naming
        return q ? clause(null, { s: subj, q }) : subj;
      }
      if (words[idx].length === 1 && words[idx][0] === 'nai') { neg = true; idx++; }
      if (idx >= words.length) return null;
      // predicate: adjective or NP
      if (words[idx].length === 1 && posOf(words[idx][0]) === 'adj') {
        if (idx !== words.length - 1) return null;
        return clause(null, { s: subj, o: adjp(words[idx][0]), neg, q });
      }
      const pred = parseNP(words, idx);
      if (!pred || pred[1] !== words.length) return null;
      return clause(null, { s: subj, o: pred[0], neg, q });
    }

    // verbal clause
    if (vIdx > 0) {
      // only 'nai' may precede the verb
      if (vIdx === 1 && words[0].length === 1 && words[0][0] === 'nai') neg = true;
      else return null;
    }
    const vw = words[vIdx];
    const imp = vw[0] === 'ru';
    const past = vw[vw.length - 1] === 'ta';
    const v = vw.filter(m => m !== 'ru' && m !== 'ta')[0];
    if (!isVerbRom(v)) return null;
    if (imp && past) return null; // no past imperatives

    let idx = vIdx + 1;
    const nps = [];
    let comp = null;
    while (idx < words.length) {
      // bare-verb complement clause (e.g. "nelu na TAVI TOMA")
      const core = words[idx].filter(m => m !== 'ta');
      if (core.length === 1 && isVerbRom(core[0])) {
        const cPast = words[idx][words[idx].length - 1] === 'ta';
        idx++;
        let cObj = null;
        if (idx < words.length) {
          const r = parseNP(words, idx);
          if (!r || r[1] !== words.length) return null;
          cObj = r[0];
          idx = r[1];
        }
        comp = clause(core[0], { o: cObj, past: cPast });
        break;
      }
      const r = parseNP(words, idx);
      if (!r) return null;
      nps.push(r[0]);
      idx = r[1];
      if (nps.length > 2) return null;
    }
    if (idx !== words.length) return null;

    let s = null, o = null;
    if (nps.length === 2) { s = nps[0]; o = nps[1]; }
    else if (nps.length === 1) {
      // imperatives drop the subject; lone NP is the object.
      if (imp) o = nps[0];
      else s = nps[0];
    }
    return clause(v, { s, o, comp, neg, past, imp, q });
  }

  // -------------------------------------------------------------- comparison

  // Normalize a tree so that default/false/null fields don't affect equality.
  function normalize(t) {
    if (t == null) return null;
    if (t.kind === 'part') return { kind: 'part', p: t.p.toLowerCase(), q: !!t.q };
    if (t.kind === 'adjp') return { kind: 'adjp', adj: t.adj.toLowerCase() };
    if (t.kind === 'np') {
      const o = { kind: 'np', n: t.n.toLowerCase() };
      if (t.pl) o.pl = true;
      if (t.adj) o.adj = t.adj;
      if (t.num) o.num = t.num;
      if (t.poss) o.poss = normalize(t.poss);
      return o;
    }
    if (t.kind === 'clause') {
      const o = { kind: 'clause', v: t.v || null };
      if (t.s) o.s = normalize(t.s);
      if (t.o) o.o = normalize(t.o);
      if (t.comp) o.comp = normalize(t.comp);
      if (t.neg) o.neg = true;
      if (t.past) o.past = true;
      if (t.imp) o.imp = true;
      if (t.q) o.q = true;
      return o;
    }
    return t;
  }

  function treeEquals(a, b) {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  }

  // Does `tree` match any of the acceptable trees?
  function matchesAny(tree, acceptable) {
    return acceptable.some(t => treeEquals(tree, t));
  }

  TW.grammar = { np, clause, adjp, part, generate, romanize, tokenize, parse, normalize, treeEquals, matchesAny };
})(typeof window !== 'undefined' ? window : globalThis);
