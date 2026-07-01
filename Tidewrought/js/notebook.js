/*
 * Tidewrought — the field notebook.
 *
 * The player's own lexicon: every word they've encountered, their guess at
 * its meaning, and whether the world has confirmed it (by a puzzle they
 * solved using it). The game NEVER shows true glosses until the epilogue.
 *
 * Also: "tide-marks" — observations the notebook writes for itself when a
 * bound morpheme has been seen enough times. Gentle, distributional hints.
 */
(function (root) {
  const TW = (root.TW = root.TW || {});

  const OBSERVATIONS = {
    mo:  { after: 3, text: 'This tail-mark keeps turning up when there is MORE THAN ONE of a thing.' },
    ka:  { after: 3, text: 'This hook seems to tie two words together — the second thing BELONGS to the first.' },
    ta:  { after: 2, text: 'These strata-lines appear on doing-words when the doing is ALREADY OVER.' },
    ru:  { after: 3, text: 'The spear-mark comes first, and always when someone is being TOLD to do something.' },
    sa:  { after: 3, text: 'This curl ends a sentence whenever the speaker\'s voice RISES. A question, surely.' },
    nai: { after: 3, text: 'Shouted at thieving birds and empty pockets alike. A refusal — no, not.' },
    i:   { after: 2, text: 'A little breath-curl that turns a THING into a QUALITY: sea into sea-colored, moon into moon-pale.' },
  };

  function ensure(state, rom) {
    if (!state.taught[rom]) state.taught[rom] = { count: 0, confirmed: false, order: Object.keys(state.taught).length };
    return state.taught[rom];
  }

  function teach(state, roms) {
    for (const rom of roms) ensure(state, rom).count++;
  }

  // Called for every morpheme in every heard/read utterance.
  function expose(state, rom) {
    if (state.taught[rom]) state.taught[rom].count++;
  }

  function confirm(state, roms) {
    for (const rom of roms) { ensure(state, rom).confirmed = true; }
  }

  function knows(state, rom) {
    return !!state.taught[rom];
  }

  function observations(state) {
    const out = [];
    for (const [rom, ob] of Object.entries(OBSERVATIONS)) {
      const t = state.taught[rom];
      if (t && t.count >= ob.after) out.push({ rom, text: ob.text });
    }
    return out;
  }

  // Entries in the order the player met them.
  function entries(state) {
    return Object.entries(state.taught)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([rom, t]) => ({ rom, ...t, guess: state.guesses[rom] || '' }));
  }

  TW.notebook = { teach, expose, confirm, knows, observations, entries, OBSERVATIONS };
})(typeof window !== 'undefined' ? window : globalThis);
