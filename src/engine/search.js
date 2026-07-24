// Motor de búsqueda de voicings, portado de voicing-finder.jsx.
// Funciones puras: nada de estado ni de presentación acá.

import { OPEN_PC, OPEN_ABS, QUALITIES, buildToneMap, mod12, GENERIC_INTERVAL } from "./theory.js";

// determina qué nota suena más grave en la voicing (comparando tono absoluto real, no solo
// número de cuerda) y a qué tono base de la calidad corresponde -> esa es la inversión.
// Devuelve datos neutros (sin idioma): { ordinal, degree } — ordinal 0 = fundamental,
// 1/2/3 = 1ª/2ª/3ª inversión, null si el bajo cae en una tensión y no en un tono base
// (la capa de presentación decide cómo redactar cada caso, en el idioma que corresponda).
function bassInversion(quality, strings, combo) {
  let bass = null;
  strings.forEach((s) => {
    const abs = OPEN_ABS[s] + combo[s].fret;
    if (!bass || abs < bass.abs) bass = { abs, degree: combo[s].degree };
  });
  const baseSorted = Object.entries(QUALITIES[quality].base)
    .sort((a, b) => a[1] - b[1])
    .map(([deg]) => deg);
  const idx = baseSorted.indexOf(bass.degree);
  return { ordinal: idx >= 0 ? idx : null, degree: bass.degree };
}

export function candidatesForString(rootPc, stringNum, fretMin, fretMax, toneMap, pin) {
  const openPc = OPEN_PC[stringNum];
  const out = [];
  for (let f = Math.max(0, fretMin); f <= fretMax; f++) {
    const pc = mod12(openPc + f);
    const interval = mod12(pc - rootPc);
    if (pin && pin.string === stringNum) {
      // nota fijada por el usuario: forzamos ese traste exacto
      if (f === pin.fret) {
        out.push({
          fret: f,
          degree: toneMap[interval] ?? GENERIC_INTERVAL[interval],
          forced: true,
          inTone: interval in toneMap,
        });
      }
      continue;
    }
    if (interval in toneMap) {
      out.push({ fret: f, degree: toneMap[interval], forced: false, inTone: true });
    }
  }
  return out;
}

export function findVoicings(rootPc, quality, activeExt, strings, fretMin, fretMax, pin, requiredExtra = []) {
  const toneMap = buildToneMap(quality, activeExt);
  const extKeys = QUALITIES[quality].ext;
  const required = [...QUALITIES[quality].required, ...requiredExtra];

  const perString = strings.map((s) =>
    candidatesForString(rootPc, s, fretMin, fretMax, toneMap, pin && pin.string === s ? pin : null)
  );

  if (perString.some((list) => list.length === 0)) return [];

  // producto cartesiano (listas cortas, es barato)
  let combos = [{}];
  strings.forEach((s, idx) => {
    const next = [];
    perString[idx].forEach((cand) => {
      combos.forEach((c) => next.push({ ...c, [s]: cand }));
    });
    combos = next;
  });

  const seen = new Set();
  const results = [];
  combos.forEach((combo) => {
    const degrees = strings.map((s) => combo[s].degree);
    const hasRequired = required.every((r) => degrees.includes(r));
    if (!hasRequired) return;
    const frets = strings.map((s) => combo[s].fret).filter((f) => f > 0);
    // jugabilidad: con más de 4 trastes no-al-aire distintos ya no alcanzan 4 dedos,
    // ni siquiera usando un barré (el barré cubre un mismo traste en varias cuerdas,
    // pero no reduce la cantidad de trastes *distintos* que hacen falta)
    if (new Set(frets).size > 4) return;
    const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
    const key = strings.map((s) => `${s}:${combo[s].fret}`).join("|");
    if (seen.has(key)) return;
    seen.add(key);
    const distinct = new Set(degrees).size;
    // evita shapes degeneradas (ej. la raíz repetida en todas las cuerdas y nada más),
    // más relevante ahora que las tríadas solo exigen un tono decisivo
    if (distinct < 3) return;
    const hasRoot = degrees.includes("R");
    // cuántas tensiones activas distintas (9/11/13/...) trae esta shape — los
    // guitarristas profesionales suelen buscar activamente meter alguna aunque
    // el acorde no la exija, así que la premiamos en el ranking, no solo la toleramos
    const tensionCount = new Set(degrees.filter((d) => d in extKeys)).size;
    const inversion = bassInversion(quality, strings, combo);
    results.push({ combo, span, distinct, hasRoot, tensionCount, inversion, key });
  });

  results.sort(
    (a, b) => a.span - b.span || b.tensionCount - a.tensionCount || b.distinct - a.distinct || (b.hasRoot - a.hasRoot)
  );
  return results.slice(0, 8);
}

export const ALL_STRINGS = [1, 2, 3, 4, 5, 6];
const MAX_SPAN = 4; // apertura máxima físicamente razonable entre la cuerda más aguda y más grave del grupo

function combinations(arr, size) {
  const out = [];
  const combo = [];
  function go(start) {
    if (combo.length === size) {
      out.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      go(i + 1);
      combo.pop();
    }
  }
  go(0);
  return out;
}

// datos neutros: { type: "adjacent" } o { type: "skip", count }, sin texto en ningún idioma
function groupPattern(combo, min, max) {
  const missing = max - min + 1 - combo.length;
  return missing === 0 ? { type: "adjacent" } : { type: "skip", count: missing };
}

// Genera todos los subgrupos de cuerdas físicamente razonables (apertura <= MAX_SPAN, ver
// arriba). Por default solo grupos de 3-4 cuerdas (lo normal en chord melody). Si hay melodía
// fijada, se exige que quede en la cuerda más aguda del grupo (menor número) — es la regla
// real que usa Jared para armar chord melody, y reemplaza tener que elegir a mano un "set de
// cuerdas": el motor prueba drop 2, drop 3 y cualquier patrón de salto que quepa en esa
// apertura. Con includeFullChords=true también prueba 5-6 cuerdas (acordes tipo barré/bloque,
// poco habituales en el flujo nota a nota pero válidos como acorde de llegada o cierre).
export function candidateStringGroups(pin, includeFullChords = false) {
  const sizes = includeFullChords ? [3, 4, 5, 6] : [3, 4];
  const groups = [];
  for (const size of sizes) {
    for (const combo of combinations(ALL_STRINGS, size)) {
      const min = Math.min(...combo);
      const max = Math.max(...combo);
      // el chequeo de apertura de cuerdas solo aplica a grupos chicos (3-4): ahí
      // filtra combinaciones poco realistas. Con 5-6 cuerdas no hay margen para elegir
      // (son casi todas las cuerdas), así que se acepta y la jugabilidad real la filtra
      // más abajo el chequeo de trastes distintos en findVoicings.
      if (size <= 4 && max - min > MAX_SPAN) continue;
      if (pin) {
        if (!combo.includes(pin.string)) continue;
        if (min !== pin.string) continue;
      }
      groups.push({
        strings: [...combo].sort((a, b) => b - a),
        pattern: groupPattern(combo, min, max),
      });
    }
  }
  return groups;
}

export function findVoicingsAllGroups(rootPc, quality, activeExt, pin, fretMin, fretMax, options = {}) {
  const { limit = 12, includeFullChords = false, requiredExtra = [] } = options;
  const groups = candidateStringGroups(pin, includeFullChords);
  const all = [];
  groups.forEach(({ strings, pattern }) => {
    const results = findVoicings(rootPc, quality, activeExt, strings, fretMin, fretMax, pin, requiredExtra);
    results.forEach((r) => all.push({ ...r, strings, pattern, key: `${strings.join(",")}|${r.key}` }));
  });
  all.sort(
    (a, b) => a.span - b.span || b.tensionCount - a.tensionCount || b.distinct - a.distinct || (b.hasRoot - a.hasRoot)
  );
  return all.slice(0, limit);
}
