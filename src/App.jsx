import { useMemo, useState } from "react";
import {
  NOTE_NAMES_SHARP,
  NOTE_NAMES_FLAT,
  QUALITIES,
  QUALITY_SCALES,
  SCALES,
  OPEN_PC,
  mod12,
  buildToneMap,
  buildScaleToneMap,
  fullNeckRootCombo,
  GENERIC_INTERVAL,
} from "./engine/theory.js";
import { ALL_STRINGS, findVoicingsAllGroups } from "./engine/search.js";
import FretboardCard from "./FretboardCard.jsx";
import { STRINGS, formatInversion, qualityLabel } from "./i18n.js";

export default function App() {
  const [lang, setLang] = useState("es");
  const [mode, setMode] = useState("voicings"); // "voicings" | "explore"
  const [root, setRoot] = useState(7); // G
  const [quality, setQuality] = useState("m6");
  const [extState, setExtState] = useState({}); // deg -> "on" | "required"
  const [baseFret, setBaseFret] = useState(1);
  const [pinOn, setPinOn] = useState(true);
  const [pinString, setPinString] = useState(1);
  const [pinFret, setPinFret] = useState(3);
  const [windowRadius, setWindowRadius] = useState(4);
  const [useFlats, setUseFlats] = useState(true);
  const [includeFullChords, setIncludeFullChords] = useState(false);
  const [exploreType, setExploreType] = useState("arpeggio"); // "arpeggio" | "scale"
  const [scaleKey, setScaleKey] = useState(null);

  const t = STRINGS[lang];
  const noteNames = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  const q = QUALITIES[quality];
  const pin = pinOn ? { string: pinString, fret: pinFret } : null;

  const window_ = useMemo(() => {
    if (pin) return { min: Math.max(0, pin.fret - windowRadius), max: pin.fret + windowRadius };
    return { min: baseFret, max: baseFret + 4 };
  }, [pin, baseFret, windowRadius]);

  const requiredExtra = useMemo(
    () => Object.entries(extState).filter(([, v]) => v === "required").map(([deg]) => deg),
    [extState]
  );

  const results = useMemo(
    () =>
      findVoicingsAllGroups(root, quality, extState, pin, window_.min, window_.max, {
        includeFullChords,
        requiredExtra,
      }),
    [root, quality, extState, pin, window_, includeFullChords, requiredExtra]
  );

  const toneMap = useMemo(() => buildToneMap(quality, extState), [quality, extState]);

  const melodyDegree = useMemo(() => {
    if (!pin) return null;
    const pc = mod12(OPEN_PC[pin.string] + pin.fret);
    const interval = mod12(pc - root);
    const known = toneMap[interval];
    return {
      note: noteNames[pc],
      degree: known ?? `${GENERIC_INTERVAL[interval]} (${t.outOfCatalog})`,
    };
  }, [pin, root, toneMap, noteNames, t]);

  const chordSymbol = noteNames[root] + q.label;

  const scaleOptions = QUALITY_SCALES[quality] ?? [];
  const effectiveScaleKey = scaleOptions.includes(scaleKey) ? scaleKey : scaleOptions[0];
  const exploreToneMap = exploreType === "scale" ? buildScaleToneMap(effectiveScaleKey) : toneMap;
  const exploreLabel = exploreType === "scale" ? SCALES[effectiveScaleKey].label : t.exploreTypeArpeggio;
  const rootCombo = useMemo(() => fullNeckRootCombo(root, 0, 12), [root]);

  // click cicla: apagado -> permitida -> exigida -> apagado
  const toggleExt = (deg) =>
    setExtState((prev) => {
      const next = { ...prev };
      if (!prev[deg]) next[deg] = "on";
      else if (prev[deg] === "on") next[deg] = "required";
      else delete next[deg];
      return next;
    });

  return (
    <div className="app">
      <div className="app-inner">
        <div className="lang-switch">
          <button className={"chip " + (lang === "es" ? "chip--active" : "")} onClick={() => setLang("es")}>
            ES
          </button>
          <button className={"chip " + (lang === "en" ? "chip--active" : "")} onClick={() => setLang("en")}>
            EN
          </button>
        </div>

        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>

        <div className="mode-switch">
          <button className={"chip " + (mode === "voicings" ? "chip--active" : "")} onClick={() => setMode("voicings")}>
            {t.modeVoicings}
          </button>
          <button className={"chip " + (mode === "explore" ? "chip--active" : "")} onClick={() => setMode("explore")}>
            {t.modeExplore}
          </button>
        </div>

        <div className="panel">
          <div className="row">
            <label>
              {t.root}{" "}
              <select value={root} onChange={(e) => setRoot(Number(e.target.value))}>
                {noteNames.map((n, i) => (
                  <option key={i} value={i}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="toggle">
              <input type="checkbox" checked={useFlats} onChange={(e) => setUseFlats(e.target.checked)} />
              {t.useFlats}
            </label>

            {mode === "voicings" && (
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeFullChords}
                  onChange={(e) => setIncludeFullChords(e.target.checked)}
                />
                {t.includeFullChords}
              </label>
            )}

            <label>
              {t.quality}{" "}
              <select
                value={quality}
                onChange={(e) => {
                  setQuality(e.target.value);
                  setExtState({});
                }}
              >
                {Object.entries(QUALITIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {qualityLabel(v, t)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {Object.keys(q.ext).length > 0 && (mode === "voicings" || exploreType === "arpeggio") && (
            <div className="row">
              <span className="hint">{mode === "voicings" ? t.tensionsHint : t.tensionsHintExplore}</span>
              {Object.keys(q.ext).map((deg) => (
                <button
                  key={deg}
                  onClick={() => toggleExt(deg)}
                  className={
                    "chip " +
                    (extState[deg] === "required" ? "chip--required" : extState[deg] === "on" ? "chip--active" : "")
                  }
                >
                  {deg}
                  {extState[deg] === "required" ? " ★" : ""}
                </button>
              ))}
            </div>
          )}

          {mode === "voicings" ? (
            <div className="row row--border">
              <label className="toggle">
                <input type="checkbox" checked={pinOn} onChange={(e) => setPinOn(e.target.checked)} />
                {t.pinMelody}
              </label>
              {pinOn && (
                <>
                  <label>
                    {t.string}{" "}
                    <select value={pinString} onChange={(e) => setPinString(Number(e.target.value))}>
                      {ALL_STRINGS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t.fret}{" "}
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={pinFret}
                      onChange={(e) => setPinFret(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    {t.windowRadius}{" "}
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={windowRadius}
                      onChange={(e) => setWindowRadius(Number(e.target.value))}
                    />
                    <span className="hint"> {t.frets}</span>
                  </label>
                  {melodyDegree && (
                    <span className="hint hint--mono">
                      → {melodyDegree.note} = {melodyDegree.degree}
                    </span>
                  )}
                </>
              )}
              {!pinOn && (
                <label>
                  {t.basePosition}{" "}
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={baseFret}
                    onChange={(e) => setBaseFret(Number(e.target.value))}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="row row--border">
              <span className="hint">{t.exploreType}</span>
              <button
                className={"chip " + (exploreType === "arpeggio" ? "chip--active" : "")}
                onClick={() => setExploreType("arpeggio")}
              >
                {t.exploreTypeArpeggio}
              </button>
              <button
                className={"chip " + (exploreType === "scale" ? "chip--active" : "")}
                onClick={() => setExploreType("scale")}
              >
                {t.exploreTypeScale}
              </button>
              {exploreType === "scale" && (
                <label>
                  {t.scaleLabel}{" "}
                  <select value={effectiveScaleKey} onChange={(e) => setScaleKey(e.target.value)}>
                    {scaleOptions.map((key) => (
                      <option key={key} value={key}>
                        {SCALES[key].label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>

        {mode === "voicings" ? (
          results.length === 0 ? (
            <div className="empty">{t.empty}</div>
          ) : (
            <>
              <h2 className="results-title">
                {chordSymbol}
                {melodyDegree && (
                  <span className="results-title-sub">
                    {" "}
                    — {t.targetMelody}: {melodyDegree.note} ({melodyDegree.degree})
                  </span>
                )}
              </h2>
              <div className="results-grid">
                {results.map((r, i) => (
                  <FretboardCard
                    key={r.key}
                    title={`#${i + 1} · ${formatInversion(r.inversion, t)}`}
                    rootPc={root}
                    toneMap={toneMap}
                    combo={r.combo}
                    activeStrings={r.strings}
                    pin={pin}
                    fretMin={window_.min}
                    fretMax={window_.max}
                  />
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <h2 className="results-title">
              {chordSymbol}
              <span className="results-title-sub"> — {exploreLabel}</span>
            </h2>
            <div className="fret-card-wide">
              <FretboardCard
                rootPc={root}
                toneMap={exploreToneMap}
                combo={rootCombo}
                activeStrings={ALL_STRINGS}
                pin={null}
                fretMin={0}
                fretMax={12}
              />
            </div>
          </>
        )}

        <p className="footnote">{mode === "voicings" ? t.footnote : t.exploreFootnote}</p>
      </div>
    </div>
  );
}
