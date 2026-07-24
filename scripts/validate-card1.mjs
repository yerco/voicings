// Valida el motor contra la Carta 1 real del video de Jared (Autumn Leaves, intro, Sol menor):
// Gm6, melodía G (R) fijada en cuerda 1 traste 3. Ya no se elige un set de cuerdas a mano:
// el motor prueba todos los subgrupos de 3-4 cuerdas razonables con la melodía como nota
// más aguda del grupo.
import { NOTE_NAMES } from "../src/engine/theory.js";
import { findVoicingsAllGroups } from "../src/engine/search.js";
import { STRINGS, formatPattern, formatInversion } from "../src/i18n.js";

const t = STRINGS.es;

const root = NOTE_NAMES.indexOf("G");
const quality = "m6";
const activeExt = {}; // sin tensiones activadas todavía
const pin = { string: 1, fret: 3 };
const window = { min: Math.max(0, pin.fret - 2), max: pin.fret + 2 }; // 1..5

const results = findVoicingsAllGroups(root, quality, activeExt, pin, window.min, window.max);

console.log(`Buscando Gm6, melodía G en cuerda ${pin.string} traste ${pin.fret}, ventana ${window.min}-${window.max}\n`);

results.forEach((r, i) => {
  const shape = r.strings.map((s) => `${s}:${r.combo[s].fret}(${r.combo[s].degree})`).join("  ");
  console.log(
    `#${i + 1}  strings=[${r.strings.join(",")}] (${formatPattern(r.pattern, t)})  ${formatInversion(r.inversion, t)}  span=${r.span}  distinct=${r.distinct}  root=${r.hasRoot}   ${shape}`
  );
});

const expected = { 4: 2, 3: 3, 2: 3, 1: 3 };
const match = results.find(
  (r) => r.strings.length === 4 && r.strings.every((s) => expected[s] !== undefined) && r.strings.every((s) => r.combo[s].fret === expected[s])
);

console.log("\n¿Aparece la Carta 1 esperada (4:2, 3:3, 2:3, 1:3)?", match ? `SÍ, en posición #${results.indexOf(match) + 1}` : "NO");
