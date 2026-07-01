/*
 * Tidewrought — Lexicon of Selala, the sea-speech.
 *
 * Every morpheme in the language lives here. The `gloss` field is the
 * ground-truth meaning used by the grammar engine and puzzle validation;
 * the player never sees it directly — they build their own lexicon in
 * the notebook.
 *
 * Attaches to globalThis.TW so the same files run in the browser
 * (classic script tags, file:// friendly) and under Node for tests.
 */
(function (root) {
  const TW = (root.TW = root.TW || {});

  // pos: n = noun, v = verb, adj = adjective, pron = pronoun,
  //      num = numeral, part = particle, affix = bound morpheme
  const MORPHEMES = [
    // --- Nouns ---
    { rom: 'sel',  pos: 'n', gloss: 'sea' },
    { rom: 'mi',   pos: 'n', gloss: 'water' },
    { rom: 'ika',  pos: 'n', gloss: 'fish' },
    { rom: 'nau',  pos: 'n', gloss: 'boat' },
    { rom: 'kesh', pos: 'n', gloss: 'net' },
    { rom: 'tan',  pos: 'n', gloss: 'person' },
    { rom: 'nim',  pos: 'n', gloss: 'child' },
    { rom: 'toma', pos: 'n', gloss: 'house' },
    { rom: 'ur',   pos: 'n', gloss: 'fire' },
    { rom: 'pel',  pos: 'n', gloss: 'stone' },
    { rom: 'lira', pos: 'n', gloss: 'bird' },
    { rom: 'ilu',  pos: 'n', gloss: 'moon' },
    { rom: 'sha',  pos: 'n', gloss: 'sun' },
    { rom: 'tila', pos: 'n', gloss: 'star' },
    { rom: 'kori', pos: 'n', gloss: 'shell' },   // also the local currency
    { rom: 'oma',  pos: 'n', gloss: 'food' },
    { rom: 'teka', pos: 'n', gloss: 'door' },
    { rom: 'ren',  pos: 'n', gloss: 'name' },
    { rom: 'hest', pos: 'n', gloss: 'tower' },
    { rom: 'anu',  pos: 'n', gloss: 'spirit' },
    { rom: 'suru', pos: 'n', gloss: 'tide' },
    { rom: 'ki',   pos: 'n', gloss: 'thing' },
    { rom: 'tu',   pos: 'n', gloss: 'time' },

    // --- Verbs ---
    { rom: 'moku', pos: 'v', gloss: 'eat' },
    { rom: 'tavi', pos: 'v', gloss: 'go' },
    { rom: 'oto',  pos: 'v', gloss: 'come' },
    { rom: 'veno', pos: 'v', gloss: 'give' },
    { rom: 'kapu', pos: 'v', gloss: 'take' },
    { rom: 'sim',  pos: 'v', gloss: 'see' },
    { rom: 'nelu', pos: 'v', gloss: 'want' },
    { rom: 'hama', pos: 'v', gloss: 'have' },
    { rom: 'peku', pos: 'v', gloss: 'open' },
    { rom: 'supu', pos: 'v', gloss: 'close' },
    { rom: 'kena', pos: 'v', gloss: 'know' },
    { rom: 'lala', pos: 'v', gloss: 'speak' },
    { rom: 'dima', pos: 'v', gloss: 'sleep' },
    { rom: 'matu', pos: 'v', gloss: 'wait' },

    // --- Adjectives ---
    { rom: 'boro', pos: 'adj', gloss: 'big' },
    { rom: 'niki', pos: 'adj', gloss: 'small' },
    { rom: 'hana', pos: 'adj', gloss: 'good' },
    { rom: 'doro', pos: 'adj', gloss: 'bad' },
    { rom: 'puru', pos: 'adj', gloss: 'old' },
    { rom: 'yul',  pos: 'n',   gloss: 'dark' },  // "darkness" — a thing, to the tide-folk

    // --- Pronouns / demonstratives ---
    { rom: 'na', pos: 'pron', gloss: 'I' },
    { rom: 'ke', pos: 'pron', gloss: 'you' },
    { rom: 'ti', pos: 'pron', gloss: 'this' },
    { rom: 'za', pos: 'pron', gloss: 'that' },

    // --- Numerals (numeral precedes noun; no plural with numeral) ---
    { rom: 'ho',   pos: 'num', gloss: 'one',   value: 1 },
    { rom: 'pa',   pos: 'num', gloss: 'two',   value: 2 },
    { rom: 'sen',  pos: 'num', gloss: 'three', value: 3 },
    { rom: 'nara', pos: 'num', gloss: 'four',  value: 4 },
    { rom: 'lima', pos: 'num', gloss: 'five',  value: 5 },

    // --- Particles ---
    { rom: 'ai',  pos: 'part', gloss: 'yes' },
    { rom: 'nai', pos: 'part', gloss: 'not' },  // negator and "no"
    { rom: 'sa',  pos: 'part', gloss: 'Q' },    // sentence-final question particle
    { rom: 'en',  pos: 'part', gloss: 'and' },

    // --- Affixes ---
    { rom: 'mo', pos: 'affix', gloss: 'PL',   kind: 'suffix' },  // plural
    { rom: 'ka', pos: 'affix', gloss: 'POSS', kind: 'suffix' },  // possessive
    { rom: 'ta', pos: 'affix', gloss: 'PAST', kind: 'suffix' },  // past tense
    { rom: 'ru', pos: 'affix', gloss: 'IMP',  kind: 'prefix' },  // imperative
    { rom: 'i',  pos: 'affix', gloss: 'LIKE', kind: 'suffix' },  // adjectivizer: "-ish"
  ];

  // Derived / compound words. These behave as single lexical items but
  // their glyphs are rendered from their parts, so the player can SEE
  // the derivation (shatu = sun+time, seltan = sea+person...).
  const COMPOUNDS = [
    { rom: 'shatu',   parts: ['sha', 'tu'],   pos: 'n',   gloss: 'day' },
    { rom: 'ilutu',   parts: ['ilu', 'tu'],   pos: 'n',   gloss: 'night' },
    { rom: 'nautan',  parts: ['nau', 'tan'],  pos: 'n',   gloss: 'ferryman' },
    { rom: 'keshtan', parts: ['kesh', 'tan'], pos: 'n',   gloss: 'fisher' },
    { rom: 'seltan',  parts: ['sel', 'tan'],  pos: 'n',   gloss: 'sea-person' }, // the player's given name
    { rom: 'selpel',  parts: ['sel', 'pel'],  pos: 'n',   gloss: 'salt' },       // "sea-stone"
    { rom: 'selala',  parts: ['sel', 'lala'], pos: 'n',   gloss: 'sea-speech' }, // the language itself
    { rom: 'seli',    parts: ['sel', 'i'],    pos: 'adj', gloss: 'blue' },       // "sea-like"
    { rom: 'shai',    parts: ['sha', 'i'],    pos: 'adj', gloss: 'bright' },     // "sun-like"
    { rom: 'ili',     parts: ['ilu', 'i'],    pos: 'adj', gloss: 'pale' },       // "moon-like" (ilu+i elides)
  ];

  // Proper names (rendered in glyphs, but not part of the lexicon puzzle)
  const NAMES = [
    { rom: 'Nimi',  gloss: 'Nimi (the child)' },
    { rom: 'Turo',  gloss: 'Turo (the fisher)' },
    { rom: 'Mara',  gloss: 'Mara (the trader)' },
    { rom: 'Nauro', gloss: 'Nauro (the ferryman)' },
  ];

  const byRom = {};
  for (const m of MORPHEMES) byRom[m.rom] = m;
  const compoundByRom = {};
  for (const c of COMPOUNDS) compoundByRom[c.rom] = c;
  const nameByRom = {};
  for (const n of NAMES) nameByRom[n.rom.toLowerCase()] = n;

  TW.lexicon = {
    MORPHEMES,
    COMPOUNDS,
    NAMES,
    byRom,
    compoundByRom,
    nameByRom,
    lookup(rom) {
      return byRom[rom] || compoundByRom[rom] || nameByRom[rom.toLowerCase()] || null;
    },
    numberValue(rom) {
      const m = byRom[rom];
      return m && m.pos === 'num' ? m.value : null;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
