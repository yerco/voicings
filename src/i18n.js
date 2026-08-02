// Textos de interfaz en español/inglés. El motor (src/engine) no conoce idiomas: devuelve
// datos neutros (pattern.type, inversion.ordinal, etc.) y acá se traducen a texto legible.

export const STRINGS = {
  es: {
    title: "Buscador de voicings",
    subtitle:
      "Fijá una nota de melodía en una cuerda y traste, elegí el acorde, y el buscador arma los voicings disponibles en esa zona del mástil.",
    root: "Fundamental",
    useFlats: "Usar bemoles (b) en vez de sostenidos (#)",
    includeFullChords: "Incluir acordes de 5-6 cuerdas (tipo barré)",
    quality: "Calidad",
    tensionsHint: "Tensiones (click: permitir · click de nuevo: exigir · click de nuevo: apagar):",
    pinMelody: "Fijar nota de melodía",
    string: "Cuerda",
    fret: "Traste",
    windowRadius: "Ventana ±",
    frets: "trastes",
    basePosition: "Posición base",
    outOfCatalog: "fuera del catálogo activo",
    empty: "No se encontró voicing con los tonos requeridos presentes en esta zona del mástil. Probá ampliar la posición.",
    targetMelody: "melodía objetivo",
    strings: "cuerdas",
    span: "apertura",
    distinctTones: "tonos distintos",
    tension: "tensión",
    tensions: "tensiones",
    footnote:
      "Círculo oscuro = tono del acorde/tensión activa · círculo dorado = tu nota de melodía fijada · círculo gris = nota fuera del catálogo pero presente porque la fijaste vos. El motor prueba todos los grupos de 3-4 cuerdas razonables (adyacentes y con salto, tipo drop 2/drop 3) con la melodía en la cuerda más aguda del grupo, y ordena por menor apertura de trastes, luego más tensiones activas presentes (★ = exigida), luego más tonos distintos cubiertos.",
    modeVoicings: "Voicings",
    modeExplore: "Escalas y arpegios",
    exploreType: "Tipo",
    exploreTypeArpeggio: "Arpegio",
    exploreTypeScale: "Escala",
    scaleLabel: "Escala",
    tensionsHintExplore: "Tensiones a incluir en el arpegio:",
    exploreFootnote:
      "Círculo oscuro = fundamental · círculo gris = resto de las notas de la escala/arpegio activo, en todo el mástil (trastes 0-12).",
    pattern: {
      adjacent: "adyacente",
      skip: (n) => `salta ${n} cuerda${n > 1 ? "s" : ""}`,
    },
    inversion: {
      ordinals: ["posición fundamental", "1ª inversión", "2ª inversión", "3ª inversión"],
      fallback: (ord) => `${ord + 1}ª inversión`,
      color: (degree) => `bajo: ${degree}`,
    },
    qualityDescriptor: { dominant: "dominante", triad: "tríada" },
  },
  en: {
    title: "Voicing finder",
    subtitle:
      "Pin a melody note on a string and fret, pick the chord, and the finder builds the voicings available in that area of the neck.",
    root: "Root",
    useFlats: "Use flats (b) instead of sharps (#)",
    includeFullChords: "Include 5-6 string chords (barre-style)",
    quality: "Quality",
    tensionsHint: "Tensions (click: allow · click again: require · click again: off):",
    pinMelody: "Pin melody note",
    string: "String",
    fret: "Fret",
    windowRadius: "Window ±",
    frets: "frets",
    basePosition: "Base position",
    outOfCatalog: "outside the active catalog",
    empty: "No voicing found with the required tones present in this area of the neck. Try widening the position.",
    targetMelody: "target melody",
    strings: "strings",
    span: "span",
    distinctTones: "distinct tones",
    tension: "tension",
    tensions: "tensions",
    footnote:
      "Dark circle = active chord tone/tension · gold circle = your pinned melody note · gray circle = note outside the catalog but present because you pinned it. The engine tries every reasonable 3-4 string group (adjacent and skipped, drop 2/drop 3 style) with the melody on the group's highest string, and ranks by smaller fret span, then more active tensions present (★ = required), then more distinct tones covered.",
    modeVoicings: "Voicings",
    modeExplore: "Scales & arpeggios",
    exploreType: "Type",
    exploreTypeArpeggio: "Arpeggio",
    exploreTypeScale: "Scale",
    scaleLabel: "Scale",
    tensionsHintExplore: "Tensions to include in the arpeggio:",
    exploreFootnote:
      "Dark circle = root · gray circle = the rest of the active scale/arpeggio notes, across the whole neck (frets 0-12).",
    pattern: {
      adjacent: "adjacent",
      skip: (n) => `skips ${n} string${n > 1 ? "s" : ""}`,
    },
    inversion: {
      ordinals: ["root position", "1st inversion", "2nd inversion", "3rd inversion"],
      fallback: (ord) => `${ord + 1}th inversion`,
      color: (degree) => `bass: ${degree}`,
    },
    qualityDescriptor: { dominant: "dominant", triad: "triad" },
  },
};

export function formatPattern(pattern, t) {
  return pattern.type === "adjacent" ? t.pattern.adjacent : t.pattern.skip(pattern.count);
}

export function formatInversion(inversion, t) {
  if (inversion.ordinal === null) return t.inversion.color(inversion.degree);
  return t.inversion.ordinals[inversion.ordinal] ?? t.inversion.fallback(inversion.ordinal);
}

export function qualityLabel(q, t) {
  return q.descriptor ? `${q.label} (${t.qualityDescriptor[q.descriptor]})` : q.label;
}
