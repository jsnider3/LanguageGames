# Tidewrought

*A decipherment adventure. You will wash ashore. No one will speak your language. That's the game.*

**Platform:** Web browser (no dependencies, no build step — open `index.html`)
**Genre:** Language-learning / puzzle / adventure
**Made by:** Claude Fable 5

## What this is

You are shipwrecked on a coast where everyone speaks **Selala** — a small constructed
language with its own grammar, writing system, and derivational morphology. Nothing is
ever translated for you. You learn the way a field linguist would: a child points at
the sea and says a word; a fisher eats a fish and narrates; a price board pairs
pictures with numerals. Puzzles are gated by *comprehension*, not keys — you can't pay
the ferryman until you can read his price, and you can't leave the island until you
can tell a tide-spirit, in its own language, what it is you want.

Your **field notebook** records every word you meet. You write your own glosses; the
game never confirms them directly — but puzzles you solve using a word mark it
"confirmed by use." At the end, your guesses are laid beside the truth.

## How to play

- Open `index.html` in a browser (or `python launcher.py Tidewrought` from the repo root).
- Click things in the world. Click-to-advance dialogue (Space/Enter also work).
- **Hover** any spoken word to see its romanization and your current gloss.
- **Click** a word to open the notebook and write what you think it means.
- When someone asks you a question, a sentence composer opens: build an answer
  from words you've learned. Ungrammatical attempts get a puzzled "sa?"; grammatical
  but wrong answers get a patient stare. After a couple of failures you'll get a hint.
- Progress saves automatically (localStorage).

A complete playthrough takes roughly 45–60 minutes and teaches ~45 words.

## The language (structural spoilers, no puzzle answers)

Selala is a real, if tiny, conlang — every line of dialogue in the game is *generated*
from a meaning tree by a grammar engine, and parsed back by the same engine when you
speak. Its shape:

- **VSO word order** — *moku tan ika* "the person eats a fish"
- **Zero copula** — *na Seltan* "I [am] Seltan"
- **Agglutinative suffixes** — plural *-mo*, possessive *-ka*, past *-ta*
- **Imperative prefix** *ru-*, negator *nai*, sentence-final question particle *sa*
- **Numerals precede the noun and block the plural** (like Hungarian)
- **Visible derivation** — compounds render as their component glyphs, so *seltan*
  is literally the sea-glyph plus the person-glyph, and the adjectivizer *-i* turns
  *sel* "sea" into *seli* "sea-colored"

The writing system is procedural but deterministic: each root gets a consistent glyph;
bound morphemes are small fixed marks, so you can *see* that a word carries the plural.

## Architecture

| File | Role |
|---|---|
| `js/lexicon.js` | Every morpheme, compound, and name in Selala |
| `js/grammar.js` | Generator + parser over meaning trees (the two must agree) |
| `js/glyphs.js` | Deterministic SVG script renderer |
| `js/script.js` | The game script — all dialogue authored as meaning trees, never strings |
| `js/scenes.js` | SVG scene art with hotspot groups, day/night variants |
| `js/notebook.js` | Player lexicon state + distributional "tide-mark" observations |
| `js/game.js` | Beat engine, puzzles, composer, notebook UI, save/load |

## Tests

```bash
cd Tidewrought
node tests/test_language.js   # grammar: surface forms, round-trips, 5000-case fuzz,
                              # every scripted line parses, every composer answer is
                              # grammatical AND buildable from words taught before it
node tests/test_script.js     # integrity: hotspots exist, flags are producible,
                              # teach-before-confirm, the shell economy never strands you
```

The invariant that makes the game fair: `parse(generate(tree)) == tree` for every
utterance in the script, and every comprehension gate is answerable using only words
the player has already been taught.
