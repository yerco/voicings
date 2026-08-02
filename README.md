# Chord Melody Cards

A guitar voicing finder for building chord melody arrangements. Given a chord
and a melody note pinned to a specific string and fret, it searches every
reasonable 3-6 string group on the neck and returns ranked "cards": concrete,
playable voicings that contain the melody note plus the chord's required
guide tones.

It's a from-scratch attempt at reproducing (and eventually extending) the
technique used by Jared (Sound Guitar Lessons / Fret Dojo) in his chord melody
method: pick the melody note and the chord root, then find a voicing that
contains that note — usually on the top two strings, since that's where a
melody lives on a solo guitar arrangement.

## Features

- **Auto string-group search**: no manual "string set" picker — the engine
  tries every physically reasonable 3-4 string group (adjacent and
  skip-string patterns, i.e. drop 2 / drop 3 style), always keeping the
  pinned melody note on the group's highest string. An opt-in toggle adds
  5-6 string barre-style chords, filtered by a playability check (max 4
  distinct simultaneous frets).
- **Chord quality table**: explicit base/tension/required-tones per quality
  (maj7, m7, dominant 7, altered dominant, 7sus4, m7b5, dim7, m6, m6/9,
  major/minor/sus2/sus4/aug/dim triads) — required tones are looked up per
  quality, not assumed to always be {3, 7}.
- **Tensions with two states**: click a tension chip to allow it (color
  tone, ranked higher but not mandatory), click again to require it (forces
  that tension into the voicing, like a guide tone).
- **Inversion label**: for every card, the engine compares real pitch
  (not just string number) to find the actual bass note and reports root
  position / 1st / 2nd / 3rd inversion, or "bass: <tension>" when the lowest
  note is a color tone rather than a chord tone.
- **Guitar-neck style diagrams**: every card is rendered as a 6-string
  fretboard (muted strings marked ×), fret markers, and three note colors —
  available catalog tones, the chosen voicing, and the pinned melody note.
- **Scales & arpeggios explorer**: a second mode (separate from the voicing
  finder) that lays out a chord's arpeggio or a scale over the whole neck
  (frets 0-12) for the selected root/quality. Scale choices are auto-suggested
  per chord quality (e.g. m7 → Dorian/Aeolian/Phrygian) from a fixed table of
  modes, pentatonics, and jazz minor modes (altered, lydian dominant, etc.).
- **Bilingual UI** (ES/EN toggle).

## Project structure

```
src/
  engine/
    theory.js   — note names, chord quality table, scale table, string tuning
                  data
    search.js   — pure search functions (no UI/state): candidate generation,
                  string-group enumeration, ranking
  i18n.js       — ES/EN string dictionaries + formatters for engine output
  App.jsx       — UI (Vite + React)
  FretboardCard.jsx — SVG fretboard diagram
scripts/
  validate-card1.mjs — regression check against a real chord-melody example
                        (Autumn Leaves intro, G minor) worked out by hand
```

The engine (`src/engine/`) is deliberately free of React/UI code, per the
original design goal: keep the theory/search logic reusable as a plain
library, so a CLI/PDF export path or a different UI can reuse it later
without a rewrite.

## Running it

```bash
npm install
npm run dev        # starts the app at http://localhost:5173
npm run validate:card1   # sanity-checks the engine against a known example
npm run build       # production build
```

## Status / what's not here yet

- **Sequence search / voice leading**: given a *sequence* of melody notes
  over a chord progression, rank card sequences by minimal finger movement
  between consecutive cards, not just by how compact each card is alone.
- **PDF export** of individual cards or a full arranged sequence.
- **Blank printable fretboard templates.**
- Chord substitution / reharmonization is explicitly out of scope for now.

---

# Chord Melody Cards (español)

Un buscador de voicings de guitarra para armar arreglos de chord melody.
Dado un acorde y una nota de melodía fijada en una cuerda y traste
específicos, busca en todos los grupos razonables de 3 a 6 cuerdas del
mástil y devuelve "cartas" rankeadas: voicings concretas y tocables que
contienen la nota de melodía más los tonos guía obligatorios del acorde.

Es un intento de reproducir (y eventualmente mejorar) desde cero la técnica
que usa Jared (Sound Guitar Lessons / Fret Dojo) en su método de chord
melody: se identifica la nota de melodía y la fundamental del acorde, y se
busca un voicing que contenga esa nota — generalmente en las dos cuerdas más
agudas, porque ahí vive la melodía en un arreglo de guitarra sola.

## Funcionalidades

- **Búsqueda automática de grupos de cuerdas**: no hay que elegir a mano un
  "set de cuerdas" — el motor prueba todos los subgrupos de 3-4 cuerdas
  físicamente razonables (adyacentes y con patrones de salto, tipo drop 2 /
  drop 3), siempre con la melodía fijada en la cuerda más aguda del grupo.
  Un toggle opcional suma acordes de 5-6 cuerdas tipo barré, filtrados por
  un chequeo de jugabilidad (máximo 4 trastes distintos simultáneos).
- **Tabla de calidades de acorde**: tonos base/tensiones/tonos requeridos
  explícitos por calidad (maj7, m7, dominante 7, dominante alterado, 7sus4,
  m7b5, dim7, m6, m6/9, tríadas mayor/menor/sus2/sus4/aumentada/disminuida)
  — los tonos requeridos se consultan por calidad, no se asume que siempre
  sean {3, 7}.
- **Tensiones con dos estados**: un click en una tensión la permite (tono de
  color, se prioriza en el ranking pero no es obligatoria), otro click la
  exige (fuerza que esa tensión esté en la voicing, igual que un tono guía).
- **Etiqueta de inversión**: para cada carta, el motor compara el tono real
  (no solo el número de cuerda) para encontrar la nota más grave real e
  informa posición fundamental / 1ª / 2ª / 3ª inversión, o "bajo: <tensión>"
  cuando la nota más grave es un tono de color y no un tono del acorde.
- **Diagramas estilo mástil de guitarra**: cada carta se dibuja como un
  mástil de 6 cuerdas (las mudas marcadas con ×), marcadores de traste, y
  tres colores de nota — tonos del catálogo disponible, la voicing elegida,
  y la nota de melodía fijada.
- **Explorador de escalas y arpegios**: un segundo modo (separado del
  buscador de voicings) que dibuja el arpegio del acorde o una escala sobre
  todo el mástil (trastes 0-12) para la fundamental/calidad elegidas. Las
  escalas sugeridas se auto-completan según la calidad del acorde (ej. m7 →
  Dorian/Aeolian/Phrygian) desde una tabla fija de modos, pentatónicas y
  modos de la menor melódica (alterada, lydian dominant, etc.).
- **Interfaz bilingüe** (toggle ES/EN).

## Estructura del proyecto

```
src/
  engine/
    theory.js   — nombres de nota, tabla de calidades de acorde, tabla de
                  escalas, afinación
    search.js   — funciones puras de búsqueda (sin UI/estado): generación
                  de candidatos, enumeración de grupos de cuerdas, ranking
  i18n.js       — diccionarios ES/EN + funciones de formato para lo que
                  devuelve el motor
  App.jsx       — interfaz (Vite + React)
  FretboardCard.jsx — diagrama de mástil en SVG
scripts/
  validate-card1.mjs — chequeo de regresión contra un caso real de chord
                        melody (intro de Autumn Leaves, Sol menor) resuelto
                        a mano
```

El motor (`src/engine/`) está deliberadamente libre de código de React/UI,
siguiendo el objetivo de diseño original: mantener la lógica de
teoría/búsqueda reusable como librería simple, para que un CLI/exportador de
PDF u otra interfaz la puedan reusar después sin reescribirla.

## Cómo correrlo

```bash
npm install
npm run dev        # levanta la app en http://localhost:5173
npm run validate:card1   # valida el motor contra un caso real conocido
npm run build       # build de producción
```

## Estado / lo que todavía falta

- **Búsqueda de secuencia / voice leading**: dada una *secuencia* de notas
  de melodía sobre una progresión de acordes, rankear secuencias de cartas
  por mínimo movimiento de dedos entre cartas consecutivas, no solo por
  cuán compacta es cada carta por separado.
- **Exportación a PDF** de cartas individuales o de una secuencia armada
  completa.
- **Plantillas de mástil en blanco imprimibles.**
- La sustitución de acordes / reharmonización queda explícitamente fuera de
  alcance por ahora.
