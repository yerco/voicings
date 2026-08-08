# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A guitar voicing finder for building jazz chord-melody arrangements (Vite +
React, no backend). Given a chord and a melody note pinned to a specific
string/fret, it searches every reasonable 3-6 string group on the neck and
returns ranked "cards": concrete, playable voicings containing the melody
note plus the chord's required guide tones. It reproduces the technique used
by Jared (Sound Guitar Lessons / Fret Dojo) in his chord-melody method. A
second mode lays out a chord's arpeggio or a suggested scale across the
whole neck. See README.md for the full bilingual (ES/EN) feature list.

## Commands

```bash
npm install
npm run dev              # dev server at http://localhost:5173
npm run build             # production build (outputs dist/)
npm run preview           # preview the production build
npm run validate:card1    # regression check: engine output vs. a hand-worked
                           # real example (Autumn Leaves intro, Gm6)
```

There is no test framework wired up — `validate:card1` (`scripts/validate-card1.mjs`)
is the only automated check, a plain node script asserting the engine
reproduces one known-correct voicing. Run it after any change to
`src/engine/*` or `src/i18n.js`'s `formatPattern`/`formatInversion`.

There is no linter configured.

## Architecture

**Strict separation: `src/engine/` is pure logic, no React/UI, no
language-specific strings.** This is a deliberate design goal (stated in
README) so the engine can be reused later by a CLI, PDF export, or a
different UI. When adding features, keep new theory/search logic in
`src/engine/` and keep it returning neutral data (e.g. `{ordinal, degree}`
for an inversion, not a translated string) — translation happens only in
`src/i18n.js` / `App.jsx`.

- **`src/engine/theory.js`** — static data: note names (sharp/flat), the
  `QUALITIES` table (base tones + extensions + required tones per chord
  quality — required tones are looked up per quality, never assumed to be
  `{3, 7}`), string tuning (`OPEN_PC`/`OPEN_ABS`), the `SCALES` table (modes,
  pentatonics, jazz-minor modes) and `QUALITY_SCALES` (auto-suggested scales
  per chord quality), plus small pure helpers (`buildToneMap`,
  `buildScaleToneMap`, `fullNeckRootCombo`, `mod12`).
- **`src/engine/search.js`** — pure search functions, no state:
  - `candidateStringGroups` enumerates every physically reasonable 3-6
    string group (adjacent + skip-string/drop-2/drop-3 patterns, max span 4
    frets for 3-4 string groups); if a melody note is pinned, it must land
    on the group's highest string.
  - `findVoicings` does a cartesian product of per-string fret candidates,
    filters by required tones present + playability (≤4 distinct
    non-open frets) + no degenerate shapes (<3 distinct tones), computes
    real-pitch bass inversion (`bassInversion`, comparing `OPEN_ABS`, not
    string number), and ranks by span → tension count → distinct tones →
    has-root.
  - `findVoicingsAllGroups` runs `findVoicings` across all candidate string
    groups and returns the merged top N.
- **`src/i18n.js`** — ES/EN string dictionaries plus formatters
  (`formatPattern`, `formatInversion`, `qualityLabel`) that turn the
  engine's neutral output into display text. Any new engine-returned enum
  needs a formatter/dictionary entry here, in both languages.
- **`src/App.jsx`** — UI state and orchestration. Two top-level modes
  (`mode` state: `"voicings"` | `"explore"`):
  - *Voicings*: melody pin (string/fret/window), chord quality + tension
    chips (click cycles off → allowed → required), calls
    `findVoicingsAllGroups`, renders one `FretboardCard` per result card.
  - *Explore*: arpeggio (reuses the chord's `toneMap`) or scale (picks from
    `QUALITY_SCALES[quality]`, defaults to the first suggestion), rendered
    as a single `FretboardCard` spanning the whole neck (frets 0-12) with
    `fullNeckRootCombo` highlighting the root on each string.
- **`src/FretboardCard.jsx`** — pure SVG fretboard renderer, mode-agnostic:
  takes `rootPc`, `toneMap`, `combo` (the highlighted/dark notes), `pin`
  (optional gold-highlighted note), and a fret range: it just draws
  whatever tones fall in `toneMap` across `activeStrings`, muting the rest.
  Both app modes reuse this same component unchanged.
- **`scripts/validate-card1.mjs`** — regression script, see Commands above.

### Tension state machine

Chord extensions (`q.ext` in `QUALITIES`) have three states per degree,
cycled by clicking a chip in the UI: unset → `"on"` (color tone, ranked
higher but optional) → `"required"` (forced into the voicing like a guide
tone, shown with ★) → unset. `extState` in `App.jsx` holds this; only
`"required"` entries get passed to the engine as `requiredExtra`.
