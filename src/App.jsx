import { useMemo, useState } from "react";
import {
  NOTE_NAMES_SHARP,
  NOTE_NAMES_FLAT,
  QUALITIES,
  OPEN_PC,
  mod12,
  buildToneMap,
  GENERIC_INTERVAL,
} from "./engine/theory.js";
import { ALL_STRINGS, findVoicingsAllGroups } from "./engine/search.js";
import FretboardCard from "./FretboardCard.jsx";
import { STRINGS, formatInversion, qualityLabel } from "./i18n.js";

export default function App() {
  const [lang, setLang] = useState("es");
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

            <label className="toggle">
              <input
                type="checkbox"
                checked={includeFullChords}
                onChange={(e) => setIncludeFullChords(e.target.checked)}
              />
              {t.includeFullChords}
            </label>

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

          {Object.keys(q.ext).length > 0 && (
            <div className="row">
              <span className="hint">{t.tensionsHint}</span>
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
        </div>

        {results.length === 0 ? (
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
        )}

        <p className="footnote">{t.footnote}</p>
      </div>
    </div>
  );
}
