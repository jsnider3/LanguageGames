/*
 * Tidewrought — the game script.
 *
 * Every Selala utterance here is a MEANING TREE, not a string: the grammar
 * engine generates the surface form. English appears only in narration
 * (stage directions). The word-teaching order is deliberate:
 *
 *   Act 1 (shore):   ostension nouns → imperative ru- → first VSO clause
 *   Act 2 (village): numbers/money → questions (sa) → the composer
 *   Act 3 (jetty):   day/night, sleep → past tense -ta on the crossing
 *   Act 4 (tower):   reading (inscription) → the spirit's examination
 *
 * Beat format:
 *   { id, scene, on: 'auto' | 'hotspot:<id>', need: [flags], not: [flags],
 *     needItem: 'mi', once: true, elseNarrate: '...', steps: [...] }
 *
 * Steps:
 *   { n: 'narration' }                       English stage direction
 *   { s: { by, tree, point } }               NPC speaks Selala (point = hotspot to flash)
 *   { sign: { trees: [...], caption } }      written Selala the player can read
 *   { teach: [roms] } { confirm: [roms] }    notebook bookkeeping
 *   { pz: {...} }                            blocking puzzle (see game.js)
 *   { give/take: { item, n } } { flag: '...' } { unlock/lock: hotspot }
 *   { night: true } { dawn: true } { goto: scene } { ending: true }
 */
(function (root) {
  const TW = (root.TW = root.TW || {});
  const G = () => TW.grammar;

  function build() {
    const g = G();
    const C = g.clause, N = g.np, A = g.adjp, P = g.part;

    // Frequently used NPs
    const me = () => N('na');
    const you = () => N('ke');

    const BEATS = [

      // ================================================================
      // ACT 1 — THE SHORE
      // ================================================================
      {
        id: 'intro', scene: 'shore', on: 'auto', once: true,
        steps: [
          { n: 'Cold sand. The hiss of surf. You wake face-down among planks of your ship, and the sea that wrecked you goes on breathing behind you.' },
          { n: 'Bare feet pad down the beach and stop a safe distance away: a child, all elbows and salt-stiff hair, studying you the way you\'d study a washed-up jellyfish.' },
          { n: 'The child points at the water.' },
          { s: { by: 'nimi', tree: N('sel'), point: 'sea' } },
          { teach: ['sel'] },
          { n: 'A silver fish flops in the shallows. The child points.' },
          { s: { by: 'nimi', tree: N('ika'), point: 'fishflop' } },
          { teach: ['ika'] },
          { n: 'She scoops it up and holds it out to you, insistent.' },
          { s: { by: 'nimi', tree: C(null, { s: N('ti'), o: N('ika') }) } },
          { teach: ['ti'] },
          { s: { by: 'nimi', tree: N('nau'), point: 'boat' } },
          { teach: ['nau'] },
          { s: { by: 'nimi', tree: N('pel'), point: 'rock' } },
          { teach: ['pel'] },
          { n: 'A grey bird shrieks from the rocks. The child rolls her eyes at it.' },
          { s: { by: 'nimi', tree: N('lira'), point: 'bird' } },
          { teach: ['lira'] },
          { n: 'Now she looks at you expectantly, and says the words again — but this time she waits for YOU to point.' },
          { pz: { type: 'pointMatch', id: 'P1', by: 'nimi',
                  items: [
                    { rom: 'ika', hotspot: 'fishflop' },
                    { rom: 'sel', hotspot: 'sea' },
                    { rom: 'nau', hotspot: 'boat' },
                    { rom: 'pel', hotspot: 'rock' },
                    { rom: 'lira', hotspot: 'bird' },
                  ] } },
          { confirm: ['ika', 'sel', 'nau', 'pel', 'lira'] },
          { n: 'The child claps, delighted. She thumps her own chest.' },
          { s: { by: 'nimi', tree: C(null, { s: me(), o: N('Nimi', { proper: true }) }) } },
          { teach: ['na'] },
          { n: 'Then she points at you — at your soaked clothes, the seaweed in your hair — and laughs, sweeping her arm from the waves to your feet.' },
          { s: { by: 'nimi', tree: C(null, { s: you(), o: N('seltan') }) } },
          { teach: ['ke', 'seltan'] },
          { n: 'Sea-thing? Sea-person? Whatever it means, it appears to be your name now.' },
          { n: 'Nimi beckons hard, already trotting toward a skiff further up the beach.' },
          { s: { by: 'nimi', tree: C('oto', { imp: true }) } },
          { teach: ['oto', 'ru'] },
          { unlock: 'turo' },
          { flag: 'p1done' },
        ],
      },

      {
        id: 'meetTuro', scene: 'shore', on: 'hotspot:turo', need: ['p1done'], once: true,
        steps: [
          { n: 'A weathered fisher crouches by the skiff, mending a mess of knotted cord. He looks up at you with exactly no surprise, as if the sea leaves him a stranger every week.' },
          { s: { by: 'nimi', tree: N('Turo', { proper: true }), point: 'turo' } },
          { n: 'Nimi grabs a fold of the netting and shakes it.' },
          { s: { by: 'nimi', tree: N('kesh') } },
          { teach: ['kesh'] },
          { s: { by: 'nimi', tree: C(null, { s: N('Turo', { proper: true }), o: N('keshtan') }) } },
          { teach: ['keshtan'] },
          { n: 'The grey bird lands on the fish basket. Turo erupts, waving both arms.' },
          { s: { by: 'turo', tree: P('nai') } },
          { s: { by: 'turo', tree: P('nai') } },
          { teach: ['nai'] },
          { n: 'The bird retreats to a respectful distance. Turo spears a sliver of fish on his knife and eats it, then points at himself, the fish, his mouth — a full demonstration.' },
          { s: { by: 'turo', tree: C('moku', { s: me(), o: N('ika') }) } },
          { teach: ['moku'] },
          { n: 'He holds up two fish from the basket: one longer than his forearm, one barely a mouthful.' },
          { s: { by: 'turo', tree: N('ika', { adj: 'boro' }) } },
          { s: { by: 'turo', tree: N('ika', { adj: 'niki' }) } },
          { teach: ['boro', 'niki'] },
          { n: 'Then he sits back and holds out an open palm toward you.' },
          { s: { by: 'turo', tree: C('veno', { imp: true, o: N('ika') }) } },
          { teach: ['veno'] },
          { pz: { type: 'fetch', id: 'P2', by: 'turo', want: 'ika',
                  options: ['pel', 'ika', 'lira'],
                  wrongTree: P('nai'),
                  hint: 'He said "ru-veno ika." You have heard "ika" before — Nimi pointed at one.' } },
          { s: { by: 'turo', tree: A('hana') } },
          { teach: ['hana'] },
          { confirm: ['veno', 'nai', 'ru'] },
          { n: 'He splits the fish, chars it over a driftwood coal, and hands half back wrapped in a leaf.' },
          { s: { by: 'turo', tree: C('veno', { s: me(), o: N('oma') }) } },
          { s: { by: 'turo', tree: C('moku', { imp: true }) } },
          { teach: ['oma'] },
          { n: 'You eat. It is, without competition, the best thing that has happened to you today.' },
          { confirm: ['moku'] },
          { n: 'Turo points along the shore path, where rooflines show over the dunes, then at Nimi, then at you.' },
          { s: { by: 'turo', tree: C('tavi', { imp: true, o: N('toma') }) } },
          { teach: ['tavi', 'toma'] },
          { unlock: 'path' },
          { flag: 'shoreDone' },
        ],
      },

      // Shore flavor
      {
        id: 'wreck', scene: 'shore', on: 'hotspot:wreck', need: ['p1done'], once: true,
        steps: [
          { n: 'What\'s left of your ship: three ribs of hull and a snapped mast, chewed by the reef. Nimi surveys it and delivers her verdict solemnly.' },
          { s: { by: 'nimi', tree: N('nau', { adj: 'doro' }) } },
          { teach: ['doro'] },
          { n: 'You can guess that one. Yes. Bad boat.' },
        ],
      },
      {
        id: 'blueboat', scene: 'shore', on: 'hotspot:boat', need: ['shoreDone'], once: true,
        steps: [
          { n: 'Turo\'s skiff is painted the exact blue-green of deep water. Nimi pats it and glances at the sea, then back at the hull, as if the connection should be obvious.' },
          { s: { by: 'nimi', tree: N('nau', { adj: 'seli' }) } },
          { teach: ['seli'] },
          { n: '"Seli"... it sounds like "sel". Sea-colored?' },
        ],
      },

      // ================================================================
      // ACT 2 — THE VILLAGE
      // ================================================================
      {
        id: 'vintro', scene: 'village', on: 'auto', once: true,
        steps: [
          { n: 'The village is a dozen houses of driftwood and whitewashed stone, strung with drying nets. Two villagers pass each other by the well and trade the same two words like a coin worn smooth:' },
          { s: { by: 'villager1', tree: N('suru', { adj: 'hana' }) } },
          { s: { by: 'villager2', tree: N('suru', { adj: 'hana' }) } },
          { teach: ['suru'] },
          { n: '"...hana" you know — good. Good SOMETHING. A greeting.' },
          { n: 'Nimi stops at the well, hauls the bucket, and drinks messily. She holds the dripping bucket up to you.' },
          { s: { by: 'nimi', tree: N('mi'), point: 'well' } },
          { teach: ['mi'] },
          { n: 'She waves across the square at a woman presiding over a stall of fish, bread, and bundled goods.' },
          { s: { by: 'nimi', tree: N('Mara', { proper: true }), point: 'stall' } },
        ],
      },

      {
        id: 'market', scene: 'village', on: 'hotspot:stall', once: true,
        steps: [
          { n: 'Mara\'s price board is painted right onto the wood: ONE fish drawn beside TWO spiral shells, with words beneath each picture.' },
          { sign: { trees: [N('ika', { num: 'ho' }), N('kori', { num: 'pa' })],
                    caption: 'A painted fish, then two painted shells.' } },
          { teach: ['ho', 'pa', 'kori'] },
          { n: 'Mara sees you puzzling and counts three shells from her till into her palm, one at a time, naming each.' },
          { s: { by: 'mara', tree: N('ho') } },
          { s: { by: 'mara', tree: N('pa') } },
          { s: { by: 'mara', tree: N('sen') } },
          { teach: ['sen'] },
          { n: 'She turns to Nimi first and nods at a heel of bread. Her voice rises at the end, eyebrows up — unmistakably a question.' },
          { s: { by: 'mara', tree: C('nelu', { s: you(), o: N('oma'), q: true }) } },
          { s: { by: 'nimi', tree: P('ai') } },
          { teach: ['nelu', 'sa', 'ai'] },
          { n: 'Nimi gets her crust and demolishes it. Now Mara sweeps a hand across the whole stall and looks at you, eyebrows up again.' },
          { s: { by: 'mara', tree: C('nelu', { s: you(), o: N('ki'), q: true }) } },
          { teach: ['ki'] },
          { n: 'Your turn to speak. (Build an answer from the words in your notebook.)' },
          { pz: { type: 'compose', id: 'C1', by: 'mara',
                  accept: [P('ai'), P('nai')],
                  hint: 'She asked if you WANT something. Nimi just answered the same kind of question with one word.' } },
          { n: 'Mara rubs two fingers together — a gesture that needs no translation — and asks:' },
          { s: { by: 'mara', tree: C('hama', { s: you(), o: N('kori'), q: true }) } },
          { teach: ['hama'] },
          { n: 'You turn out your pockets: sand, one very dead crab. You do not have shells. Tell her so.' },
          { pz: { type: 'compose', id: 'C2', by: 'mara',
                  accept: [P('nai'), C('hama', { s: me(), o: N('kori'), neg: true })],
                  hint: 'One word will do. What did Turo shout at the bird?' } },
          { n: 'Nimi sighs at your poverty, digs in her belt-pouch, and presses three warm shells into your hand.' },
          { s: { by: 'nimi', tree: C('kapu', { imp: true }) } },
          { teach: ['kapu'] },
          { s: { by: 'nimi', tree: C('veno', { s: me(), o: N('kori', { num: 'sen' }) }) } },
          { give: { item: 'kori', n: 3 } },
          { confirm: ['sen', 'hama'] },
          { n: 'Bread, then. Mara taps the loaf, then the board.' },
          { s: { by: 'mara', tree: N('kori', { num: 'pa' }) } },
          { pz: { type: 'pay', id: 'P4', by: 'mara', amount: 2,
                  hint: 'She wants "pa kori". The price board shows how many shells that is.' } },
          { take: { item: 'kori', n: 2 } },
          { give: { item: 'oma', n: 1 } },
          { s: { by: 'mara', tree: A('hana') } },
          { confirm: ['pa', 'kori', 'nelu', 'sa', 'ho', 'ai'] },
          { n: 'Nimi beams at you and announces it to the square at large:' },
          { s: { by: 'nimi', tree: C('lala', { s: you(), o: N('selala') }) } },
          { teach: ['lala', 'selala'] },
          { n: 'Sel-lala. Sea-speech. So that\'s what this language is called — and apparently you speak it now.' },
          { flag: 'marketDone' },
          { unlock: 'baskets' },
          { unlock: 'saltpouch' },
        ],
      },

      {
        id: 'sortfish', scene: 'village', on: 'hotspot:baskets', need: ['marketDone'], once: true,
        steps: [
          { n: 'Behind the stall, Turo\'s morning catch waits in a heap, and two baskets stand ready — each marked with painted words. The marks are ALMOST the same. Almost.' },
          { sign: { trees: [N('ika'), N('ika', { pl: true })],
                    caption: 'Two baskets. The second word has an extra mark at the end.' } },
          { teach: ['mo'] },
          { n: 'Mara mimes it: sort the catch. Singles here, bundles there. She watches with the eyes of a woman who has fired people for less.' },
          { pz: { type: 'sort', id: 'P5', by: 'mara',
                  bins: [{ rom: 'ika' }, { rom: 'ika-mo' }],
                  items: [
                    { label: 'one fish', count: 1, bin: 0 },
                    { label: 'three fish tied with cord', count: 3, bin: 1 },
                    { label: 'one fat fish', count: 1, bin: 0 },
                    { label: 'a pair of fish', count: 2, bin: 1 },
                  ],
                  hint: 'One basket is "ika". The other is "ika" plus something more. What might the extra bit mean?' } },
          { confirm: ['mo'] },
          { n: 'Mara counts your pay into your hand, shell by shell — and the counting-words keep going past the ones you know.' },
          { s: { by: 'mara', tree: N('ho') } },
          { s: { by: 'mara', tree: N('pa') } },
          { s: { by: 'mara', tree: N('sen') } },
          { s: { by: 'mara', tree: N('nara') } },
          { s: { by: 'mara', tree: N('lima') } },
          { teach: ['nara', 'lima'] },
          { give: { item: 'kori', n: 5 } },
          { s: { by: 'mara', tree: A('hana') } },
          { n: 'Five shells. You are, by local standards, employed.' },
          { flag: 'sorted' },
          { unlock: 'pathJetty' },
          { n: 'Nimi tugs your sleeve and points down the lane, where a jetty pokes into the strait — and beyond it, far across the water, a black spike on its own island.' },
        ],
      },

      {
        id: 'salt', scene: 'village', on: 'hotspot:saltpouch', need: ['marketDone'], once: true,
        steps: [
          { n: 'A row of small cloth pouches, each stamped with a word — a word built from two you know: SEA and STONE.' },
          { sign: { trees: [N('selpel'), N('kori', { num: 'ho' })],
                    caption: 'Sea-stone? Mara opens one: white crystals. She touches a grain to her tongue and gestures at the whole ocean.' } },
          { teach: ['selpel'] },
          { pz: { type: 'buy', id: 'P6', by: 'mara', amount: 1, item: 'selpel', optional: true,
                  hint: 'One shell, if you want it. The old folk say you don\'t visit a spirit empty-handed.' } },
        ],
      },

      // ================================================================
      // ACT 3 — THE JETTY & THE CROSSING
      // ================================================================
      {
        id: 'jintro', scene: 'jetty', on: 'auto', once: true,
        steps: [
          { n: 'The jetty leans into the strait on barnacled legs. At its end, a broad man sits against a mooring post, hat over his eyes, next to a boat that has clearly survived several arguments with the sea.' },
          { n: 'Nimi points across the water at the black tower on its island.' },
          { s: { by: 'nimi', tree: N('za', { }), point: 'towerFar' } },
          { s: { by: 'nimi', tree: N('hest'), point: 'towerFar' } },
          { teach: ['za', 'hest'] },
          { s: { by: 'nimi', tree: C(null, { s: N('Nauro', { proper: true }), o: N('nautan') }), point: 'nauro' } },
          { teach: ['nautan'] },
          { n: 'Boat-person. The ferryman tips his hat back, follows your gaze to the tower, and spits neatly into the water.' },
          { s: { by: 'nauro', tree: N('hest', { adj: 'doro' }) } },
          { n: 'He pats his boat like an old dog.' },
          { s: { by: 'nauro', tree: N('nau', { adj: 'puru' }) } },
          { s: { by: 'nauro', tree: A('hana') } },
          { teach: ['puru'] },
        ],
      },

      {
        id: 'fare', scene: 'jetty', on: 'hotspot:nauro', need: ['sorted'], once: true,
        steps: [
          { n: 'You point at the tower. Nauro looks at you, at your notebook, at the tower, and holds up four blunt fingers.' },
          { s: { by: 'nauro', tree: N('kori', { num: 'nara' }) } },
          { pz: { type: 'pay', id: 'P7', by: 'nauro', amount: 4,
                  hint: '"Nara kori." Mara counted to five when she paid you: ho, pa, sen, NARA, lima.' } },
          { take: { item: 'kori', n: 4 } },
          { confirm: ['nara'] },
          { n: 'He pockets the shells — then squints at the sky, where the light has gone the color of old honey and the moon is already up. He points at it.' },
          { night: true },
          { s: { by: 'nauro', tree: N('ilu') } },
          { teach: ['ilu'] },
          { n: 'Then he sweeps his arm across the whole darkening sky, moon and all:' },
          { s: { by: 'nauro', tree: N('ilutu') } },
          { teach: ['ilutu'] },
          { s: { by: 'nauro', tree: C('tavi', { s: N('nau'), neg: true }) } },
          { n: 'No boat at moon-time, then. He mimes the sun instead — a fist arcing up from the east horizon — and names it:' },
          { s: { by: 'nauro', tree: N('sha') } },
          { s: { by: 'nauro', tree: N('shatu') } },
          { teach: ['sha', 'shatu'] },
          { s: { by: 'nauro', tree: C('tavi', { s: N('nau') }) } },
          { n: 'Sun-time: boat goes. He settles back against the post, pulls his hat down, and issues one final instruction, palms pressed together beneath his cheek:' },
          { s: { by: 'nauro', tree: C('dima', { imp: true }) } },
          { teach: ['dima'] },
          { flag: 'mustSleep' },
          { n: 'Nimi yawns hugely and tugs you back up the lane.' },
        ],
      },

      {
        id: 'nightwalk', scene: 'village', on: 'auto', need: ['mustSleep'], not: ['slept'], once: true,
        steps: [
          { n: 'The village is packing itself away for the night. Mara wrestles her stall shutters closed and announces to nobody in particular:' },
          { s: { by: 'mara', tree: N('ilutu') } },
          { s: { by: 'mara', tree: C('supu', { s: me(), o: N('toma') }) } },
          { teach: ['supu'] },
          { n: 'Nimi stops dead in the lane, grabs your arm, and points straight up, where the whole cold host of the night sky is out.' },
          { s: { by: 'nimi', tree: C('sim', { imp: true }) } },
          { s: { by: 'nimi', tree: N('tila', { pl: true }) } },
          { teach: ['sim', 'tila'] },
          { n: 'Stars — many of them, hence the ending, you suspect. She points at the moon, pale as bone:' },
          { s: { by: 'nimi', tree: N('ilu', { adj: 'ili' }) } },
          { teach: ['ili'] },
          { n: '"Ili" — moon-like, moon-pale. This language builds itself out of itself, like coral.' },
        ],
      },

      {
        id: 'sleep', scene: 'shore', on: 'hotspot:hut', need: ['mustSleep'], not: ['slept'], once: true,
        steps: [
          { n: 'Turo\'s hut glows from inside. He\'s feeding driftwood to the hearth, and the flames spit green with salt. He nods at the fire.' },
          { s: { by: 'turo', tree: N('ur') } },
          { teach: ['ur'] },
          { n: 'He notices the notebook in your hands — the lists, the guesses, the crossings-out — and taps it once with a scarred finger.' },
          { s: { by: 'turo', tree: C('kena', { s: you(), o: N('selala') }) } },
          { s: { by: 'turo', tree: A('hana') } },
          { teach: ['kena'] },
          { n: 'You know sea-speech. Generous of him. He points at the sleeping mat by the wall.' },
          { s: { by: 'turo', tree: C('dima', { imp: true }) } },
          { n: 'You sleep. You dream of words with wet roots, growing toward each other in the dark: sea into blue, moon into pale, sun into day...' },
          { dawn: true },
          { flag: 'slept' },
          { n: 'Dawn. Turo is already outside, mending the endless net. He nods at the sun climbing off the water.' },
          { s: { by: 'turo', tree: N('sha', { adj: 'shai' }) } },
          { teach: ['shai'] },
          { confirm: ['dima', 'ilutu', 'shatu'] },
        ],
      },

      {
        id: 'dawnshutters', scene: 'village', on: 'auto', need: ['slept'], not: ['sawDawn'], once: true,
        steps: [
          { n: 'Mara throws her shutters open with a bang, the mirror of last night:' },
          { s: { by: 'mara', tree: N('shatu') } },
          { s: { by: 'mara', tree: C('peku', { s: me(), o: N('toma') }) } },
          { teach: ['peku'] },
          { n: 'Open and close, day and night, peku and supu. Noted. Literally.' },
          { flag: 'sawDawn' },
        ],
      },

      {
        id: 'board', scene: 'jetty', on: 'hotspot:nauro', need: ['slept'], once: true,
        steps: [
          { n: 'Nauro is awake, upright, and rolling the stiffness out of his shoulders. He glances at the climbing sun with professional approval.' },
          { s: { by: 'nauro', tree: N('shatu') } },
          { s: { by: 'nauro', tree: A('hana') } },
          { s: { by: 'nauro', tree: C('oto', { imp: true }) } },
          { n: 'Nimi stops at the edge of the jetty. She isn\'t coming. She presses something into your palm — a small white shell, her lucky one, you\'d bet — and steps back.' },
          { n: 'The boat pulls out. She waves until she\'s a speck.' },
          { goto: 'crossing' },
          { n: 'Mid-strait, the water goes deep-green and quiet. The tower grows. Nauro speaks without looking at you, low, like a man reporting weather he doesn\'t like.' },
          { s: { by: 'nauro', tree: C('tavi', { s: N('tan'), o: N('hest'), past: true }) } },
          { teach: ['ta'] },
          { n: '"Tavi-TA"... went? A person WENT to the tower. He lets the oars rest, and finishes:' },
          { s: { by: 'nauro', tree: C('oto', { neg: true, past: true }) } },
          { n: 'Did not come back. He looks at you now, steady, and asks — voice rising at the end:' },
          { s: { by: 'nauro', tree: C('tavi', { s: you(), o: N('hest'), q: true }) } },
          { pz: { type: 'compose', id: 'C3', by: 'nauro',
                  accept: [P('ai'),
                           C('tavi', { s: me(), o: N('hest') }),
                           C('nelu', { s: me(), comp: C('tavi', { o: N('hest') }) })],
                  hint: 'He asked: go you tower? You could answer with the little word for yes — or say it back: go I tower.' } },
          { confirm: ['tavi', 'hest', 'ke', 'na'] },
          { n: 'He takes up the oars again. Just before the island\'s shadow swallows the boat, he says, mostly to the sea:' },
          { s: { by: 'nauro', tree: N('seltan', { adj: 'boro' }) } },
          { goto: 'tower' },
          { flag: 'atTower' },
        ],
      },

      // ================================================================
      // ACT 4 — THE TOWER
      // ================================================================
      {
        id: 'tintro', scene: 'tower', on: 'auto', once: true,
        steps: [
          { n: 'The island is bare black rock and the tower stands on it like a nail driven into the world. No birds. No wind. Even the surf here keeps its voice down.' },
          { n: 'Nauro stays with the boat. He\'ll wait — his face says he\'s done it before, and says how those waits ended.' },
        ],
      },

      {
        id: 'door', scene: 'tower', on: 'hotspot:door', once: true,
        steps: [
          { n: 'The door is a single slab of stone, taller than three of you and sealed seamless. Nauro calls from the boat, pointing at it:' },
          { s: { by: 'nauro', tree: N('teka') } },
          { s: { by: 'nauro', tree: C('supu', {}) } },
          { teach: ['teka'] },
          { n: 'Door. Closed. Thank you, Nauro. Above the lintel a figure is carved: a shape of mist and curling water, half-person, half-wave. Beneath it, three lines are cut deep into the stone:' },
          { sign: { trees: [N('toma', { poss: N('anu') })],
                    caption: 'First line — beneath the carved figure of mist and tide.' } },
          { teach: ['anu', 'ka'] },
          { sign: { trees: [C('nelu', { s: N('anu'), o: N('yul') })],
                    caption: 'Second line — beside two small panels: a sun with rays chiseled OFF, and a lamp lying broken.' } },
          { teach: ['yul'] },
          { sign: { trees: [C('supu', { imp: true, o: N('ur') })],
                    caption: 'Third line — and this one you can read every word of.' } },
          { n: 'The spirit\'s house. The spirit wants... something — the defaced sun, the broken lamp. And an instruction: CLOSE THE FIRE.' },
          { n: 'Behind you, in an iron basket on a post, a flame burns steady and white. It has clearly burned a long time. The same word is stamped into the brazier\'s rim: "ur".' },
          { flag: 'readDoor' },
        ],
      },

      {
        id: 'carvings', scene: 'tower', on: 'hotspot:carvings', once: true,
        steps: [
          { n: 'Older carvings wrap the tower\'s base, worn soft by salt. One line repeats, over and over, ring after ring:' },
          { sign: { trees: [C('oto', { s: N('suru', { adj: 'boro' }) })],
                    caption: 'The same three words, hundreds of times.' } },
          { n: 'The great tide comes. The great tide comes. The great tide comes. You decide not to read the rest.' },
        ],
      },

      {
        id: 'pool', scene: 'tower', on: 'hotspot:pool',
        elseNarrate: 'A tide pool in the black rock, clear as glass. Small silver fish flicker in it.',
        need: ['readDoor'], not: ['doused'], once: false,
        steps: [
          { n: 'A tide pool in the black rock. Water. "Mi," as Nimi would say, hauling her bucket. You cup your hands and fill them.' },
          { give: { item: 'mi', n: 1 } },
        ],
      },

      {
        id: 'douse', scene: 'tower', on: 'hotspot:brazier', needItem: 'mi', not: ['doused'],
        elseNarrate: 'The white flame burns without smoke and without fuel. The heat pushes your face away. The word "ur" is stamped on the rim. If you\'re meant to CLOSE it, you\'ll need something to close it WITH.',
        once: true,
        steps: [
          { n: 'You pour the seawater over the white flame. It goes out like an eye shutting — no hiss, no steam. Just dark.' },
          { take: { item: 'mi', n: 1 } },
          { confirm: ['supu', 'ur', 'yul', 'anu', 'mi'] },
          { n: 'And the dark moves. The shadow of the tower deepens, gathers, pours itself against the stone slab — and the door grinds open on a spiral stair.' },
          { flag: 'doused' },
          { unlock: 'stairs' },
        ],
      },

      {
        id: 'ascend', scene: 'tower', on: 'hotspot:stairs', need: ['doused'], once: true,
        steps: [
          { n: 'You climb. The stair turns and turns, and the sea-sound climbs with you, though there are no windows. At the top: a round chamber, open to the sky, with a pool of still water at its center.' },
          { goto: 'summit' },
        ],
      },

      // ================================================================
      // FINALE — THE TIDE-SPIRIT
      // ================================================================
      {
        id: 'finale', scene: 'summit', on: 'auto', once: true,
        steps: [
          { n: 'The pool does not reflect the sky. It reflects the sea — a deep, moving green, though the water is still. Mist stands up out of it, and the mist has a shape you recognize from the lintel.' },
          { n: 'When it speaks, the voice is the sound the tide makes leaving stones.' },
          { s: { by: 'anu', tree: C('sim', { s: me(), o: you() }) } },
          { s: { by: 'anu', tree: N('suru', { adj: 'hana' }) } },
          { n: 'It greets you with the villagers\' greeting. It KNOWS the greeting. Then, softly — and you hear the question rise at the end:' },
          { s: { by: 'anu', tree: N('seltan') } },
          { s: { by: 'anu', tree: C('oto', { s: you(), o: N('sel'), past: true, q: true }) } },
          { pz: { type: 'compose', id: 'C4', by: 'anu',
                  accept: [P('ai'),
                           C('oto', { s: me(), o: N('sel'), past: true }),
                           C('oto', { s: me(), past: true })],
                  hint: 'Came you [from the] sea? — Nauro used that "-ta" ending for things already done.' } },
          { n: 'The mist stirs, pleased, like water when a stone goes in. It leans closer.' },
          { s: { by: 'anu', tree: C('kena', { s: you(), o: me(), q: true }) } },
          { pz: { type: 'compose', id: 'C5', by: 'anu',
                  accept: [P('ai'), P('nai'),
                           C(null, { s: N('ke'), o: N('anu') }),
                           C('kena', { s: me(), o: N('ke') })],
                  hint: 'Know you me? Honesty is acceptable. So is what the door told you it was.' } },
          { n: 'A sound moves through the chamber that might be the tide\'s idea of laughter. The spirit spreads wide, filling the room\'s edges, and asks the question everything has been walking toward — the same words Mara used across her market stall:' },
          { s: { by: 'anu', tree: C('nelu', { s: you(), o: N('ki'), q: true }) } },
          { pz: { type: 'compose', id: 'C6', by: 'anu',
                  accept: [C('nelu', { s: me(), comp: C('tavi', { o: N('toma') }) }),
                           C('nelu', { s: me(), o: N('toma') }),
                           C('tavi', { s: me(), o: N('toma') })],
                  hint: 'What do you want? You know "want". You know "go". And Turo taught you the word for home the day you arrived.' } },
          { confirm: ['nelu', 'oto', 'kena', 'ki', 'ta', 'toma'] },
          { n: 'Stillness. Even the sea-sound stops. Then the spirit bows — the whole shape of it, like a wave folding.' },
          { s: { by: 'anu', tree: C('kena', { s: me() }) } },
          { s: { by: 'anu', tree: C('oto', { s: you(), o: N('sel'), past: true }) } },
          { s: { by: 'anu', tree: C('tavi', { s: you(), o: N('toma') }) } },
          { pz: { type: 'offer', id: 'P9', by: 'anu', item: 'selpel', optional: true,
                  prompt: 'You still have the pouch of salt. (Offer it? Click it in your satchel, or continue.)',
                  thanksTree: N('selpel'),
                  thanksTree2: A('hana'),
                  } },
          { s: { by: 'anu', tree: C('dima', { imp: true }) } },
          { n: 'The mist closes over you gently, like the sea closing over a returning swimmer, and the last thing you hear is the greeting, given back to the world:' },
          { s: { by: 'anu', tree: N('suru', { adj: 'hana' }) } },
          { ending: true },
        ],
      },
    ];

    return BEATS;
  }

  // ---------------------------------------------------------------- exports

  let _beats = null;
  function beats() {
    if (!_beats) _beats = build();
    return _beats;
  }

  // Every Selala tree in the script (speech + signs + puzzle prompts), for tests.
  function allSelalaLines() {
    const out = [];
    for (const b of beats()) {
      b.steps.forEach((st, i) => {
        if (st.s) out.push({ id: `${b.id}#${i}`, tree: st.s.tree });
        if (st.sign) st.sign.trees.forEach((t, j) => out.push({ id: `${b.id}#${i}.sign${j}`, tree: t }));
        if (st.pz) {
          if (st.pz.wrongTree) out.push({ id: `${b.id}#${i}.wrong`, tree: st.pz.wrongTree });
          if (st.pz.thanksTree) out.push({ id: `${b.id}#${i}.thanks`, tree: st.pz.thanksTree });
          if (st.pz.thanksTree2) out.push({ id: `${b.id}#${i}.thanks2`, tree: st.pz.thanksTree2 });
          if (st.pz.type === 'pointMatch') {
            st.pz.items.forEach((it, j) => out.push({ id: `${b.id}#${i}.pm${j}`, tree: TW.grammar.np(it.rom) }));
          }
        }
      });
    }
    return out;
  }

  function allComposerPuzzles() {
    const out = [];
    for (const b of beats()) {
      for (const st of b.steps) {
        if (st.pz && st.pz.type === 'compose') out.push(st.pz);
      }
    }
    return out;
  }

  // Ordered list of {beat, teach[]} — used by tests to verify that every
  // composer answer is buildable from words taught before that puzzle.
  function teachTimeline() {
    const out = [];
    for (const b of beats()) {
      for (const st of b.steps) {
        if (st.teach) out.push({ beat: b.id, kind: 'teach', roms: st.teach });
        if (st.pz && st.pz.type === 'compose') out.push({ beat: b.id, kind: 'puzzle', pz: st.pz });
      }
    }
    return out;
  }

  TW.script = { beats, allSelalaLines, allComposerPuzzles, teachTimeline };
})(typeof window !== 'undefined' ? window : globalThis);
