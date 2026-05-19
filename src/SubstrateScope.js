import { useState } from "react";
import { S, colors } from "./theme";

function getColor(v) {
  if (v === null || v === "" || v === undefined) return { bg: colors.bg, text: colors.textSecondary };
  const n = Number(v);
  if (n >= 90) return { bg: colors.greenLight, text: colors.green };
  if (n >= 50) return { bg: colors.orangeLight, text: colors.orange };
  return { bg: colors.redLight, text: colors.red };
}

export default function SubstrateScope({ entries, selectedEnzymes, setSelectedEnzymes, substrates, setSubstrates, results, setResults }) {
  const screeningEnzymes = [...new Set(entries.map(e => e.enzyme).filter(Boolean))];
  const [newSubstrate, setNewSubstrate] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ conversion: "", ee: "" });
  const [metric, setMetric] = useState("conversion");

  function toggleEnzyme(e) {
    setSelectedEnzymes(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  }

  function addSubstrate() {
    const s = newSubstrate.trim();
    if (!s || substrates.includes(s)) return;
    setSubstrates([...substrates, s]);
    setNewSubstrate("");
  }

  function removeSubstrate(s) {
    setSubstrates(substrates.filter(x => x !== s));
    const updated = { ...results };
    selectedEnzymes.forEach(e => delete updated[`${e}|${s}`]);
    setResults(updated);
  }

  function openCell(key) {
    setEditing(key);
    setDraft(results[key] || { conversion: "", ee: "" });
  }

  function saveCell() {
    if (editing) {
      setResults({ ...results, [editing]: draft });
      setEditing(null);
    }
  }

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Substrate Scope</h1>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>
          Select lead enzymes and define substrates for the next round.
        </p>
      </div>

      {/* Step 1 — Enzyme selection */}
      <div style={S.card}>
        <span style={S.label}>Step 1 — Select enzymes from screening</span>
        {screeningEnzymes.length === 0 ? (
          <p style={{ color: colors.textSecondary, fontSize: 14 }}>No enzymes in screening yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {screeningEnzymes.map(e => (
              <button key={e} onClick={() => toggleEnzyme(e)} style={S.chip(selectedEnzymes.includes(e))}>{e}</button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — Substrate input */}
      <div style={S.card}>
        <span style={S.label}>Step 2 — Add substrates</span>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            value={newSubstrate}
            onChange={e => setNewSubstrate(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSubstrate()}
            placeholder="e.g. 4-fluoroacetophenone"
            style={{ ...S.input, flex: 1 }}
          />
          <button onClick={addSubstrate} style={S.btn(colors.blue)}>Add</button>
        </div>
        {substrates.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {substrates.map(s => (
              <div key={s} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 20,
                background: colors.bg, border: `1px solid ${colors.borderStrong}`, fontSize: 13
              }}>
                {s}
                <button onClick={() => removeSubstrate(s)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: colors.textSecondary, fontSize: 14, padding: 0, lineHeight: 1
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3 — Matrix */}
      {selectedEnzymes.length > 0 && substrates.length > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={S.label}>Step 3 — Enter results (click a cell)</span>
            <div style={{ display: "flex", background: colors.bg, borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${colors.borderStrong}` }}>
              {["conversion", "ee"].map(m => (
                <button key={m} onClick={() => setMetric(m)} style={S.tab(metric === m)}>
                  {m === "conversion" ? "Conv %" : "ee %"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 4, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 16px", textAlign: "left", color: colors.textSecondary, fontSize: 12, fontWeight: 500, minWidth: 130 }}>Enzyme</th>
                  {substrates.map(s => (
                    <th key={s} style={{ padding: "8px 14px", textAlign: "center", color: colors.text, fontSize: 12, fontWeight: 600, minWidth: 120 }}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedEnzymes.map(enzyme => (
                  <tr key={enzyme}>
                    <td style={{ padding: "8px 16px", fontWeight: 600, color: colors.text, fontSize: 13 }}>{enzyme}</td>
                    {substrates.map(substrate => {
                      const key = `${enzyme}|${substrate}`;
                      const res = results[key];
                      const value = res ? (metric === "conversion" ? res.conversion : res.ee) : null;
                      const { bg, text } = getColor(value);
                      const isEditing = editing === key;
                      return (
                        <td key={substrate} style={{ padding: 4, textAlign: "center", minWidth: 120 }}>
                          {isEditing ? (
                            <div style={{
                              background: colors.surface, border: `2px solid ${colors.blue}`,
                              borderRadius: 10, padding: "8px 10px",
                              display: "flex", flexDirection: "column", gap: 6
                            }}>
                              <input
                                autoFocus
                                placeholder="Conv %"
                                value={draft.conversion}
                                onChange={e => setDraft({ ...draft, conversion: e.target.value })}
                                style={{ ...S.input, fontSize: 12, padding: "5px 8px", textAlign: "center" }}
                              />
                              <input
                                placeholder="ee %"
                                value={draft.ee}
                                onChange={e => setDraft({ ...draft, ee: e.target.value })}
                                onKeyDown={e => e.key === "Enter" && saveCell()}
                                style={{ ...S.input, fontSize: 12, padding: "5px 8px", textAlign: "center" }}
                              />
                              <button onClick={saveCell} style={{ ...S.btn(colors.green), padding: "5px 10px", fontSize: 12 }}>✓</button>
                            </div>
                          ) : (
                            <div
                              onClick={() => openCell(key)}
                              style={{
                                padding: "12px 14px", borderRadius: 10,
                                background: bg, color: text,
                                fontWeight: 600, fontSize: 13, cursor: "pointer",
                                border: `1px solid ${value ? "transparent" : colors.borderStrong}`,
                                minHeight: 42, display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "opacity 0.1s",
                              }}
                            >
                              {value !== null && value !== "" ? `${value}%` : <span style={{ opacity: 0.3 }}>+</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.bg}`, display: "flex", gap: 20, fontSize: 12, color: colors.textSecondary }}>
            {[
              { color: colors.green, label: "≥ 90% (hit)" },
              { color: colors.orange, label: "50–89% (moderate)" },
              { color: colors.red, label: "< 50% (low)" },
              { color: colors.textSecondary, label: "— not tested" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color + "30", border: `1.5px solid ${l.color}` }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}