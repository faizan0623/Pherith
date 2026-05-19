import { useState } from "react";
import { S, colors, fonts } from "./theme";

const PRESETS = ["pH", "Temperature (°C)", "Time (h)", "Cosolvent (%)"];

function fullFactorial(factors) {
  if (factors.length === 0) return [];
  let runs = [[]];
  for (const f of factors) {
    const next = [];
    for (const run of runs) {
      next.push([...run, { name: f.name, value: Number(f.low) }]);
      next.push([...run, { name: f.name, value: Number(f.high) }]);
    }
    runs = next;
  }
  return runs.map((run, i) => {
    const row = { run: i + 1, response: "", type: "factorial" };
    run.forEach(r => { row[r.name] = r.value; });
    return row;
  });
}

function centrePoints(factors, count = 3) {
  return Array.from({ length: count }, (_, i) => {
    const row = { run: null, response: "", type: "centre" };
    factors.forEach(f => {
      row[f.name] = (Number(f.low) + Number(f.high)) / 2;
    });
    return row;
  });
}

function getResponseColor(v, min, max) {
  if (v === "" || v === null || v === undefined) return colors.borderStrong;
  const t = max === min ? 0.5 : (Number(v) - min) / (max - min);
  const r = Math.round(255 * (1 - t));
  const g = Math.round(200 * t);
  return `rgb(${r},${g},80)`;
}

function MainEffectsPlot({ runs, factors }) {
  const withResponse = runs.filter(r => r.type === "factorial" && r.response !== "" && r.response !== undefined);
  if (withResponse.length === 0) {
    return <p style={{ color: colors.textSecondary, fontSize: 14 }}>Enter responses in the Design table to see main effects.</p>;
  }

  const effects = factors.map(f => {
    const low = withResponse.filter(r => r[f.name] === Number(f.low));
    const high = withResponse.filter(r => r[f.name] === Number(f.high));
    const avgLow = low.length ? low.reduce((s, r) => s + Number(r.response), 0) / low.length : null;
    const avgHigh = high.length ? high.reduce((s, r) => s + Number(r.response), 0) / high.length : null;
    const effect = avgLow !== null && avgHigh !== null ? avgHigh - avgLow : null;
    return { name: f.name, low: f.low, high: f.high, avgLow, avgHigh, effect };
  });

  const allAvgs = effects.flatMap(e => [e.avgLow, e.avgHigh]).filter(v => v !== null);
  const minY = Math.min(...allAvgs);
  const maxY = Math.max(...allAvgs);
  const pad = (maxY - minY) * 0.2 || 1;
  const yMin = minY - pad;
  const yMax = maxY + pad;

  const W = 500, H = 280, LPAD = 52, RPAD = 20, TPAD = 20, BPAD = 60;
  const plotW = W - LPAD - RPAD;
  const plotH = H - TPAD - BPAD;
  const slotW = plotW / effects.length;
  const yScale = v => TPAD + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));

  return (
    <div style={{ marginBottom: 32 }}>
      <span style={{ ...S.label, marginBottom: 16 }}>Main effects — average response at low (−) and high (+)</span>
      <svg width={W} height={H} style={{ fontFamily: fonts.base, overflow: "visible" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={LPAD} y1={yScale(t)} x2={W - RPAD} y2={yScale(t)} stroke={colors.bg} strokeWidth={1.5} />
            <text x={LPAD - 6} y={yScale(t) + 4} textAnchor="end" fontSize={10} fill={colors.textSecondary}>{t.toFixed(1)}</text>
          </g>
        ))}
        <line x1={LPAD} y1={TPAD} x2={LPAD} y2={TPAD + plotH} stroke={colors.borderStrong} strokeWidth={1.5} />
        <text x={12} y={H / 2} textAnchor="middle" fontSize={11} fill={colors.textSecondary} transform={`rotate(-90,12,${H / 2})`}>Avg response</text>

        {effects.map((ef, i) => {
          const cx = LPAD + slotW * i + slotW / 2;
          const xLow = cx - 24;
          const xHigh = cx + 24;
          const yL = ef.avgLow !== null ? yScale(ef.avgLow) : null;
          const yH = ef.avgHigh !== null ? yScale(ef.avgHigh) : null;
          const lineColor = ef.effect === null ? colors.borderStrong : ef.effect >= 0 ? colors.green : colors.red;

          return (
            <g key={ef.name}>
              {yL !== null && yH !== null && (
                <line x1={xLow} y1={yL} x2={xHigh} y2={yH} stroke={lineColor} strokeWidth={2.5} />
              )}
              {yL !== null && (
                <g>
                  <circle cx={xLow} cy={yL} r={7} fill={colors.bg} stroke={colors.textSecondary} strokeWidth={2} />
                  <text x={xLow} y={yL - 12} textAnchor="middle" fontSize={9} fill={colors.textSecondary}>−</text>
                  <text x={xLow} y={yL + 22} textAnchor="middle" fontSize={9} fill={colors.textSecondary}>{ef.low}</text>
                </g>
              )}
              {yH !== null && (
                <g>
                  <circle cx={xHigh} cy={yH} r={7} fill={lineColor} stroke={lineColor} strokeWidth={2} fillOpacity={0.8} />
                  <text x={xHigh} y={yH - 12} textAnchor="middle" fontSize={9} fill={lineColor}>+</text>
                  <text x={xHigh} y={yH + 22} textAnchor="middle" fontSize={9} fill={colors.textSecondary}>{ef.high}</text>
                </g>
              )}
              {ef.effect !== null && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={10} fill={lineColor} fontWeight={600}>
                  {ef.effect >= 0 ? "+" : ""}{ef.effect.toFixed(1)}
                </text>
              )}
              <text x={cx} y={H - BPAD + 18} textAnchor="middle" fontSize={11} fill={colors.text} fontWeight={500}>{ef.name}</text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
        Effect size shown below each factor. Green = positive effect, red = negative.
      </p>
    </div>
  );
}

function CurvatureCheck({ runs, factors }) {
  const factorialRuns = runs.filter(r => r.type === "factorial" && r.response !== "" && r.response !== undefined);
  const centreRuns = runs.filter(r => r.type === "centre" && r.response !== "" && r.response !== undefined);
  if (factorialRuns.length === 0 || centreRuns.length === 0) return null;

  const factAvg = factorialRuns.reduce((s, r) => s + Number(r.response), 0) / factorialRuns.length;
  const centreAvg = centreRuns.reduce((s, r) => s + Number(r.response), 0) / centreRuns.length;
  const diff = centreAvg - factAvg;
  const hasCurvature = Math.abs(diff) > 0.05 * factAvg;

  return (
    <div style={{
      padding: "16px 20px", borderRadius: 14, marginBottom: 24,
      background: hasCurvature ? colors.orangeLight : colors.greenLight,
      border: `1px solid ${hasCurvature ? colors.orange + "40" : colors.green + "40"}`,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: colors.text, marginBottom: 4 }}>
        {hasCurvature ? "⚠ Curvature detected" : "✓ No significant curvature"}
      </div>
      <div style={{ fontSize: 13, color: colors.textSecondary }}>
        Factorial avg: <strong>{factAvg.toFixed(2)}</strong> · Centre point avg: <strong>{centreAvg.toFixed(2)}</strong> · Difference: <strong style={{ color: hasCurvature ? colors.orange : colors.green }}>{diff >= 0 ? "+" : ""}{diff.toFixed(2)}</strong>
      </div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
        {hasCurvature
          ? "The response surface is likely curved. Consider a response surface methodology (RSM) design for further optimisation."
          : "The linear model appears adequate for this region."}
      </div>
    </div>
  );
}

function RunsBarChart({ runs, factors }) {
  const withResponse = runs.filter(r => r.response !== "" && r.response !== undefined);
  if (withResponse.length === 0) return null;

  const sorted = [...withResponse].sort((a, b) => Number(b.response) - Number(a.response));
  const maxVal = Math.max(...sorted.map(r => Number(r.response)));
  const best = sorted[0];

  return (
    <div>
      <span style={{ ...S.label, marginBottom: 16 }}>All runs ranked by response</span>

      <div style={{
        padding: "14px 18px", borderRadius: 14,
        background: colors.greenLight, border: `1px solid ${colors.green}40`,
        marginBottom: 20, display: "flex", alignItems: "center", gap: 16
      }}>
        <div style={{ fontSize: 24 }}>🏆</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
            Best condition — {best.type === "centre" ? "Centre point" : `Run ${best.run}`} — Response: {best.response}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {factors.map(f => (
              <span key={f.name}>
                <span style={{ fontWeight: 600, color: colors.text }}>{f.name}:</span> {best[f.name]}
                {best.type === "factorial" && (
                  <span style={{ marginLeft: 4, fontSize: 10, color: best[f.name] === Number(f.high) ? colors.blue : colors.textSecondary }}>
                    ({best[f.name] === Number(f.high) ? "+" : "−"})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {sorted.map((r, i) => {
        const pct = maxVal > 0 ? (Number(r.response) / maxVal) * 100 : 0;
        const isBest = i === 0;
        const isCentre = r.type === "centre";
        return (
          <div key={`${r.run}-${i}`} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: colors.textSecondary, width: 60, textAlign: "right", flexShrink: 0 }}>
                {isCentre ? "Centre" : `Run ${r.run}`}
              </span>
              <div style={{ flex: 1, background: colors.bg, borderRadius: 6, height: 28, position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${pct}%`,
                  background: isBest ? colors.green : isCentre ? colors.blue : colors.blue,
                  borderRadius: 6, opacity: isBest ? 1 : 0.4 + (0.4 * (1 - i / sorted.length)),
                  transition: "width 0.4s ease",
                }} />
                <span style={{
                  position: "absolute", left: 10, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12, fontWeight: 600,
                  color: pct > 20 ? "#fff" : colors.text
                }}>
                  {r.response}
                </span>
              </div>
              <span style={{ fontSize: 11, color: colors.textSecondary, width: 140, flexShrink: 0 }}>
                {factors.map(f => `${f.name.split(" ")[0]}=${r[f.name]}`).join(", ")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DoE({ factors, setFactors, runs, setRuns }) {
  const [newFactor, setNewFactor] = useState({ name: "", low: "", high: "" });
  const [generated, setGenerated] = useState(runs.length > 0);
  const [tab, setTab] = useState("design");
  const [centrePointCount, setCentrePointCount] = useState(3);

  function addFactor() {
    const { name, low, high } = newFactor;
    if (!name || low === "" || high === "") return;
    if (factors.find(f => f.name === name)) return;
    setFactors([...factors, { name, low, high }]);
    setNewFactor({ name: "", low: "", high: "" });
    setGenerated(false);
  }

  function removeFactor(name) {
    setFactors(factors.filter(f => f.name !== name));
    setGenerated(false);
  }

  function generate() {
    const factorial = fullFactorial(factors);
    const centres = centrePoints(factors, centrePointCount);
    const allRuns = [
      ...factorial,
      ...centres,
    ].map((r, i) => ({ ...r, run: r.type === "factorial" ? r.run : null, _idx: i + 1 }));
    setRuns(allRuns);
    setGenerated(true);
    setTab("design");
  }

  function updateResponse(idx, value) {
    const updated = [...runs];
    updated[idx] = { ...updated[idx], response: value };
    setRuns(updated);
  }

  function downloadCSV() {
    if (!runs.length) return;
    const cols = ["run", "type", ...factors.map(f => f.name), "response"];
    const rows = runs.map((r, i) => [
      r.type === "factorial" ? r.run : `C${i}`,
      r.type,
      ...factors.map(f => r[f.name]),
      r.response
    ].join(","));
    const csv = [cols.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "doe_design.csv";
    a.click();
  }

  const factorialCount = Math.pow(2, factors.length);
  const totalRuns = factorialCount + centrePointCount;
  const responsesEntered = runs.filter(r => r.response !== "").length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>DoE Planner</h1>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>
          Two-level full factorial with centre points for curvature detection.
        </p>
      </div>

      {/* Factor builder */}
      <div style={S.card}>
        <span style={S.label}>Factors</span>

        {/* Presets */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setNewFactor({ ...newFactor, name: p })} style={S.chip(newFactor.name === p)}>{p}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 16 }}>
          <div>
            <span style={{ ...S.label, marginBottom: 4 }}>Factor name</span>
            <input value={newFactor.name} onChange={e => setNewFactor({ ...newFactor, name: e.target.value })} placeholder="e.g. pH" style={S.input} />
          </div>
          <div>
            <span style={{ ...S.label, marginBottom: 4 }}>Low (−)</span>
            <input value={newFactor.low} onChange={e => setNewFactor({ ...newFactor, low: e.target.value })} placeholder="e.g. 6" type="number" style={S.input} />
          </div>
          <div>
            <span style={{ ...S.label, marginBottom: 4 }}>High (+)</span>
            <input value={newFactor.high} onChange={e => setNewFactor({ ...newFactor, high: e.target.value })} placeholder="e.g. 8" type="number" style={S.input} onKeyDown={e => e.key === "Enter" && addFactor()} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={addFactor} style={S.btn(colors.blue)}>Add</button>
          </div>
        </div>

        {factors.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {factors.map(f => (
              <div key={f.name} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 12,
                background: colors.bg, border: `1px solid ${colors.borderStrong}`, fontSize: 13
              }}>
                <span style={{ fontWeight: 600 }}>{f.name}</span>
                <span style={{ color: colors.textSecondary }}>{f.low} → {f.high}</span>
                <button onClick={() => removeFactor(f.name)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: 14, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centre points + generate */}
      {factors.length > 0 && (
        <div style={S.card}>
          <span style={S.label}>Centre points</span>
          <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
            Centre points run at the midpoint of all factors. Used to detect curvature in the response surface. Standard practice is 3.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <span style={{ ...S.label, marginBottom: 4 }}>Number of centre points</span>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setCentrePointCount(n)} style={{
                    ...S.chip(centrePointCount === n),
                    padding: "6px 14px",
                  }}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={generate} style={S.btn(colors.blue)}>
              Generate {totalRuns} runs ({factorialCount} factorial + {centrePointCount} centre)
            </button>
            {factors.length > 4 && (
              <span style={{ fontSize: 13, color: colors.orange }}>⚠ {factorialCount} factorial runs — consider reducing factors</span>
            )}
            {generated && (
              <button onClick={downloadCSV} style={S.btn(colors.green)}>↓ CSV</button>
            )}
            {generated && responsesEntered > 0 && (
              <span style={{ fontSize: 13, color: colors.green }}>✓ {responsesEntered}/{runs.length} responses entered</span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {generated && (
        <div style={S.card}>
          <div style={{ display: "flex", background: colors.bg, borderRadius: 12, padding: 3, gap: 2, marginBottom: 24, width: "fit-content", border: `1px solid ${colors.borderStrong}` }}>
            <button style={S.tab(tab === "design")} onClick={() => setTab("design")}>Design table</button>
            <button style={S.tab(tab === "viz")} onClick={() => setTab("viz")}>
              Visualisation {responsesEntered > 0 ? `(${responsesEntered})` : ""}
            </button>
          </div>

          {/* Design table */}
          {tab === "design" && (
            <div>
              <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
                Perform experiments in any order, then enter response values below.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 4, fontSize: 13, width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: colors.textSecondary, fontSize: 12, fontWeight: 500 }}>Run</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: colors.textSecondary, fontSize: 12, fontWeight: 500 }}>Type</th>
                      {factors.map(f => (
                        <th key={f.name} style={{ padding: "8px 16px", textAlign: "center", color: colors.text, fontSize: 12, fontWeight: 600 }}>{f.name}</th>
                      ))}
                      <th style={{ padding: "8px 16px", textAlign: "center", color: colors.blue, fontSize: 12, fontWeight: 600 }}>Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r, i) => {
                      const isCentre = r.type === "centre";
                      return (
                        <tr key={i} style={{ background: r.response !== "" ? "#f0fff4" : isCentre ? colors.blueLight : "transparent" }}>
                          <td style={{ padding: "10px 12px", textAlign: "center", color: colors.textSecondary, fontWeight: 500 }}>
                            {isCentre ? "CP" : r.run}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: isCentre ? colors.blueLight : colors.bg,
                              color: isCentre ? colors.blue : colors.textSecondary,
                            }}>
                              {isCentre ? "centre" : "factorial"}
                            </span>
                          </td>
                          {factors.map(f => {
                            const isHigh = !isCentre && r[f.name] === Number(f.high);
                            const isMid = isCentre;
                            return (
                              <td key={f.name} style={{ padding: "10px 16px", textAlign: "center" }}>
                                <span style={{
                                  padding: "4px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                  background: isMid ? colors.blueLight : isHigh ? colors.blueLight : colors.bg,
                                  color: isMid ? colors.blue : isHigh ? colors.blue : colors.textSecondary,
                                }}>
                                  {isMid ? `○ ${r[f.name]}` : isHigh ? `+ ${r[f.name]}` : `− ${r[f.name]}`}
                                </span>
                              </td>
                            );
                          })}
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <input
                              value={r.response}
                              onChange={e => updateResponse(i, e.target.value)}
                              placeholder="—"
                              type="number"
                              style={{ ...S.input, width: 100, textAlign: "center", padding: "6px 10px", background: r.response !== "" ? "#fff" : colors.bg }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Visualisation */}
          {tab === "viz" && (
            <div>
              {responsesEntered === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>◎</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 6 }}>No responses yet</div>
                  <div style={{ fontSize: 14, color: colors.textSecondary }}>Enter experimental results in the Design table first.</div>
                </div>
              ) : (
                <>
                  <CurvatureCheck runs={runs} factors={factors} />
                  <MainEffectsPlot runs={runs} factors={factors} />
                  <RunsBarChart runs={runs} factors={factors} />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}