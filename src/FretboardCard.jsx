import { OPEN_PC, mod12 } from "./engine/theory.js";

const FULL_STRINGS = [1, 2, 3, 4, 5, 6];
const STRING_STROKE = { 6: 2.6, 5: 2.2, 4: 1.8, 3: 1.4, 2: 1.1, 1: 0.9 };
const MARKER_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_MARKER_FRETS = new Set([12, 24]);

// Diagrama de mástil horizontal: 6 cuerdas siempre visibles (las que no
// pertenecen al set activo se marcan "x"), notas del catálogo activo en gris
// claro (alternativas disponibles), la voicing elegida en oscuro, la melodía
// fijada en dorado. Estilo replicado del prototipo matplotlib de referencia.
export default function FretboardCard({ rootPc, toneMap, combo, activeStrings, pin, fretMin, fretMax, title }) {
  const n = fretMax - fretMin + 1;
  const labelW = 26;
  const cellW = 42;
  const cellH = 32;
  const topPad = 20;
  const bottomPad = 20;
  const width = labelW + cellW * n;
  const height = topPad + cellH * 6 + bottomPad;

  return (
    <div className="fret-card">
      {title && <div className="fret-card-title">{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img">
        {Array.from({ length: n }).map((_, j) => {
          const fret = fretMin + j;
          const cx = labelW + cellW * j + cellW / 2;
          if (DOUBLE_MARKER_FRETS.has(fret)) {
            return (
              <g key={"m" + j}>
                <circle cx={cx - 4} cy={topPad - 10} r={2.2} fill="#c7c2ba" />
                <circle cx={cx + 4} cy={topPad - 10} r={2.2} fill="#c7c2ba" />
              </g>
            );
          }
          if (MARKER_FRETS.has(fret)) {
            return <circle key={"m" + j} cx={cx} cy={topPad - 10} r={2.5} fill="#c7c2ba" />;
          }
          return null;
        })}

        {Array.from({ length: n + 1 }).map((_, j) => {
          const x = labelW + cellW * j;
          const isNut = j === 0 && fretMin === 0;
          return (
            <line
              key={"f" + j}
              x1={x}
              y1={topPad}
              x2={x}
              y2={topPad + cellH * 6}
              stroke={isNut ? "#57534e" : "#c7c2ba"}
              strokeWidth={isNut ? 4 : 1}
            />
          );
        })}

        {FULL_STRINGS.map((s, i) => {
          const y = topPad + cellH * i + cellH / 2;
          const active = activeStrings.includes(s);
          return (
            <g key={"s" + s}>
              <text x={labelW / 2} y={y + 4} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#78716c">
                {active ? s : "×"}
              </text>
              <line
                x1={labelW}
                y1={y}
                x2={width}
                y2={y}
                stroke={active ? "#8a8378" : "#e7e5e4"}
                strokeWidth={active ? STRING_STROKE[s] : 1}
                strokeDasharray={active ? undefined : "3,3"}
              />
              {active &&
                Array.from({ length: n }).map((_, j) => {
                  const fret = fretMin + j;
                  const openPc = OPEN_PC[s];
                  const pc = mod12(openPc + fret);
                  const interval = mod12(pc - rootPc);
                  const inTone = interval in toneMap;
                  const isComboCell = combo[s] && combo[s].fret === fret;
                  const isPinCell = pin && pin.string === s && fret === pin.fret;
                  if (!inTone && !isPinCell) return null;

                  let fill, textColor, label, ring;
                  if (isPinCell) {
                    fill = "#b45309";
                    textColor = "#fffbeb";
                    label = combo[s] ? combo[s].degree : "?";
                    ring = true;
                  } else if (isComboCell) {
                    fill = "#292524";
                    textColor = "#fafaf9";
                    label = toneMap[interval];
                  } else {
                    fill = "#e7e2da";
                    textColor = "#78716c";
                    label = toneMap[interval];
                  }
                  const cx = labelW + cellW * j + cellW / 2;
                  return (
                    <g key={"n" + s + fret}>
                      <circle cx={cx} cy={y} r={13} fill={fill} stroke={ring ? "#fcd34d" : "none"} strokeWidth={ring ? 2.5 : 0} />
                      <text
                        x={cx}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="600"
                        fontFamily="ui-monospace, monospace"
                        fill={textColor}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}

        {Array.from({ length: n }).map((_, j) => {
          const fret = fretMin + j;
          const cx = labelW + cellW * j + cellW / 2;
          return (
            <text key={"fn" + j} x={cx} y={height - 6} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#a8a29e">
              {fret}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
