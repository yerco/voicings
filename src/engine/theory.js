// Datos armónicos base: nombres de nota, calidades de acorde, sets de cuerdas.
// Portado de voicing-finder.jsx + tabla de calidades del brief (agrega m6 / m6_9,
// que el prototipo React todavía no tenía).

export const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
// alias para no romper código existente que asumía solo sostenidos
export const NOTE_NAMES = NOTE_NAMES_SHARP;

export function noteName(pc, useFlats) {
  return (useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[mod12(pc)];
}

export const QUALITIES = {
  maj7: {
    label: "maj7",
    base: { R: 0, "3": 4, "5": 7, "7": 11 },
    ext: { "9": 2, "#11": 6, "13": 9 },
    required: ["3", "7"],
  },
  m7: {
    label: "m7",
    base: { R: 0, b3: 3, "5": 7, b7: 10 },
    ext: { "9": 2, "11": 5, "13": 9 },
    required: ["b3", "b7"],
  },
  "7": {
    label: "7",
    descriptor: "dominant",
    base: { R: 0, "3": 4, "5": 7, b7: 10 },
    ext: { "9": 2, "#9": 3, "#11": 6, "13": 9, b9: 1, b13: 8 },
    required: ["3", "b7"],
  },
  "7alt": {
    label: "7alt",
    // dominante alterado: sin 5ª ni 9ª/13ª naturales en la base — solo tensiones alteradas
    base: { R: 0, "3": 4, b7: 10 },
    ext: { b9: 1, "#9": 3, "#11": 6, b13: 8 },
    required: ["3", "b7"],
  },
  "7sus4": {
    label: "7sus4",
    base: { R: 0, "4": 5, "5": 7, b7: 10 },
    ext: { "9": 2, "13": 9 },
    required: ["4", "b7"],
  },
  m7b5: {
    label: "m7b5",
    base: { R: 0, b3: 3, b5: 6, b7: 10 },
    ext: { "9": 2, "11": 5, b13: 8, b9: 1 },
    required: ["b3", "b7"],
  },
  dim7: {
    label: "dim7",
    base: { R: 0, b3: 3, b5: 6, bb7: 9 },
    ext: {},
    required: ["b3", "bb7"],
  },
  m6: {
    label: "m6",
    base: { R: 0, b3: 3, "5": 7, "6": 9 },
    ext: { "9": 2, "11": 5 },
    required: ["b3", "6"],
  },
  m6_9: {
    label: "m6/9",
    base: { R: 0, b3: 3, "5": 7, "6": 9, "9": 2 },
    ext: { "11": 5 },
    required: ["b3", "6"],
  },
  // tríadas: la identidad la define un único tono decisivo (no dos guide tones
  // como en los acordes de séptima), el resto de las notas son color opcional.
  maj: {
    label: "maj",
    descriptor: "triad",
    base: { R: 0, "3": 4, "5": 7 },
    ext: { "9": 2, "6": 9 },
    required: ["3"],
  },
  min: {
    label: "m",
    descriptor: "triad",
    base: { R: 0, b3: 3, "5": 7 },
    ext: { "9": 2, "11": 5, "6": 9 },
    required: ["b3"],
  },
  sus2: {
    label: "sus2",
    base: { R: 0, "2": 2, "5": 7 },
    ext: {},
    required: ["2"],
  },
  sus4: {
    label: "sus4",
    base: { R: 0, "4": 5, "5": 7 },
    ext: {},
    required: ["4"],
  },
  aug: {
    label: "aug",
    base: { R: 0, "3": 4, "#5": 8 },
    ext: {},
    required: ["3", "#5"],
  },
  dim: {
    label: "dim",
    descriptor: "triad",
    base: { R: 0, b3: 3, b5: 6 },
    ext: {},
    required: ["b3", "b5"],
  },
};

// cuerda real (6=grave..1=agudo) -> clase de tono al aire, EADGBE, C=0
export const OPEN_PC = { 6: 4, 5: 9, 4: 2, 3: 7, 2: 11, 1: 4 };

// tono absoluto aproximado (MIDI) de cada cuerda al aire, afinación estándar E2 A2 D3 G3 B3 E4.
// Sirve para saber cuál nota realmente suena más grave en una voicing (no siempre es la de
// la cuerda con número más alto) y así determinar la inversión.
export const OPEN_ABS = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };

export const STRING_SETS = {
  "6543": { label: "6-5-4-3 (grave)", strings: [6, 5, 4, 3] },
  "5432": { label: "5-4-3-2 (medio)", strings: [5, 4, 3, 2] },
  "4321": { label: "4-3-2-1 (agudo)", strings: [4, 3, 2, 1] },
  "6432": { label: "6-4-3-2 (drop2, salta 5ta)", strings: [6, 4, 3, 2] },
  "5321": { label: "5-3-2-1 (drop2, salta 4ta)", strings: [5, 3, 2, 1] },
};

export const mod12 = (n) => ((n % 12) + 12) % 12;

// nombre genérico de intervalo, usado cuando la nota fijada por el usuario
// no pertenece al set de tonos/tensiones activo para ese acorde
export const GENERIC_INTERVAL = [
  "R", "b9", "9", "#9/b3", "3", "11", "#11/b5", "5", "#5/b13", "13/6", "b7", "7",
];

export function buildToneMap(quality, activeExt) {
  const q = QUALITIES[quality];
  const map = {}; // semitono -> grado
  Object.entries(q.base).forEach(([deg, st]) => (map[st] = deg));
  Object.entries(q.ext).forEach(([deg, st]) => {
    if (activeExt[deg] && !(st in map)) map[st] = deg;
  });
  return map;
}
