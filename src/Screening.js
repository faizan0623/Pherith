import { useState } from "react";
import { S, colors, fonts } from "./theme";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);

const EMPTY_ENTRY = {
  enzyme: "", substrate: "", conversion: "", ee: "",
  ph: "", temperature: "", time: "", cosolvent: "", notes: "", well: ""
};

function convColor(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (n >= 90) return colors.green;
  if (n >= 50) return colors.orange;
  return colors.red;
}

const WELL_SIZE = 32;
const WELL_MARGIN = 1;
const WELL_TOTAL = WELL_SIZE + WELL_MARGIN * 6;
const ROW_LABEL_WIDTH = 24;

export default function Screening({ entries, setEntries }) {
  const [format, setFormat] = useState("vial");
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [hovered, setHovered] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_ENTRY);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleAdd() {
    if (!form.enzyme || !form.substrate) return;
    setEntries([...entries, { ...form, id: Date.now() }]);
    setForm(EMPTY_ENTRY);
  }

  function handleDelete(id) {
    setEntries(entries.filter(e => e.id !== id));
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditForm({ ...entry });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_ENTRY);
  }

  function saveEdit() {
    setEntries(entries.map(e => e.id === editingId ? { ...editForm, id: editingId } : e));
    setEditingId(null);
    setEditForm(EMPTY_ENTRY);
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  const wellMap = {};
  entries.forEach(e => { if (e.well) wellMap[e.well.toUpperCase()] = e; });

  const fields = [
    { name: "enzyme", label: "Enzyme", placeholder: "e.g. ADH-A" },
    { name: "substrate", label: "Substrate", placeholder: "e.g. acetophenone" },
    { name: "conversion", label: "Conversion (%)", placeholder: "e.g. 85", type: "number" },
    { name: "ee", label: "ee (%)", placeholder: "e.g. 98", type: "number" },
    { name: "ph", label: "pH", placeholder: "e.g. 7.0", type: "number" },
    { name: "temperature", label: "Temperature (°C)", placeholder: "e.g. 30", type: "number" },
    { name: "time", label: "Time (h)", placeholder: "e.g. 24", type: "number" },
    { name: "cosolvent", label: "Cosolvent", placeholder: "e.g. 5% DMSO" },
    { name: "notes", label: "Notes", placeholder: "e.g. precipitation observed" },
    ...(format === "plate" ? [{ name: "well", label: "Well position", placeholder: "e.g. A1, B3" }] : []),
  ];

  const tableHeaders = ["Enzyme", "Substrate", "Conv %", "ee %", "pH", "Temp", "Time", "Cosolvent", format === "plate" ? "Well" : null, "Notes", ""].filter(Boolean);

  const cellStyle = { padding: "10px 12px" };
  const editInputStyle = { ...S.input, padding: "5px 8px", fontSize: 12 };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Enzyme Screening</h1>
          <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>
            Log reactions across enzyme and substrate combinations.
          </p>
        </div>
        <div style={{ display: "flex", background: colors.bg, borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${colors.borderStrong}` }}>
          {["vial", "plate"].map(f => (
            <button key={f} onClick={() => setFormat(f)} style={S.tab(format === f)}>
              {f === "vial" ? "⊙ Vial" : "⊞ Plate"}
            </button>
          ))}
        </div>
      </div>

      {/* Entry form */}
      <div style={S.card}>
        <span style={S.label}>Add entry</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {fields.map(f => (
            <div key={f.name}>
              <label style={S.label}>{f.label}</label>
              <input
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                type={f.type || "text"}
                style={S.input}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
            </div>
          ))}
        </div>
        <button onClick={handleAdd} style={S.btn(colors.blue, !form.enzyme || !form.substrate)}>
          + Add entry
        </button>
      </div>

      {/* Plate view */}
      {format === "plate" && entries.some(e => e.well) && (
        <div style={S.card}>
          <span style={S.label}>96-well plate view</span>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4, paddingLeft: ROW_LABEL_WIDTH }}>
            {COLS.map(c => (
              <div key={c} style={{
                width: WELL_TOTAL, textAlign: "center", fontSize: 11,
                color: colors.textSecondary, fontWeight: 500, flexShrink: 0,
              }}>{c}</div>
            ))}
          </div>

          {/* Plate rows */}
          {ROWS.map(row => (
            <div key={row} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <div style={{ width: ROW_LABEL_WIDTH, flexShrink: 0, fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>{row}</div>
              {COLS.map(col => {
                const key = `${row}${col}`;
                const entry = wellMap[key];
                const conv = entry ? Number(entry.conversion) : null;
                const c = entry && entry.conversion !== "" ? convColor(entry.conversion) : null;
                const isHovered = hovered === key;
                return (
                  <div
                    key={col}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: WELL_SIZE, height: WELL_SIZE, borderRadius: "50%",
                      margin: `0 ${WELL_MARGIN}px`, flexShrink: 0,
                      background: c ? c + "22" : colors.bg,
                      border: `2px solid ${c || colors.borderStrong}`,
                      cursor: entry ? "pointer" : "default",
                      transition: "transform 0.1s ease, box-shadow 0.1s ease",
                      transform: isHovered && entry ? "scale(1.2)" : "scale(1)",
                      boxShadow: isHovered && entry ? `0 4px 12px ${c}44` : "none",
                      position: "relative", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {entry && entry.conversion !== "" && (
                      <div style={{ fontSize: 7, fontWeight: 700, color: c, lineHeight: 1, textAlign: "center" }}>
                        {conv}%
                      </div>
                    )}
                    {isHovered && entry && (
                      <div style={{
                        position: "absolute", bottom: "110%", left: "50%",
                        transform: "translateX(-50%)",
                        background: colors.text, color: "#fff",
                        borderRadius: 10, padding: "10px 14px",
                        fontSize: 12, whiteSpace: "nowrap", zIndex: 100,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                        pointerEvents: "none",
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{key} — {entry.enzyme}</div>
                        <div style={{ color: "rgba(255,255,255,0.7)" }}>{entry.substrate}</div>
                        <div style={{ marginTop: 4 }}>
                          {entry.conversion !== "" && <span style={{ color: c, fontWeight: 600 }}>{entry.conversion}% conv</span>}
                          {entry.ee !== "" && <span style={{ color: "#93c5fd", marginLeft: 8 }}>{entry.ee}% ee</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 12, color: colors.textSecondary }}>
            {[
              { color: colors.green, label: "≥ 90%" },
              { color: colors.orange, label: "50–89%" },
              { color: colors.red, label: "< 50%" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color + "30", border: `2px solid ${l.color}` }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      {entries.length > 0 && (
        <div style={S.card}>
          <span style={S.label}>{entries.length} entr{entries.length === 1 ? "y" : "ies"}</span>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: fonts.mono }}>
              <thead>
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left",
                      color: colors.textSecondary, borderBottom: `1px solid ${colors.borderStrong}`,
                      fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase", fontWeight: 600
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const isEditing = editingId === e.id;
                  return isEditing ? (
                    // Edit row
                    <tr key={e.id} style={{ background: colors.blueLight, borderBottom: `1px solid ${colors.blueBorder}` }}>
                      <td style={cellStyle}><input name="enzyme" value={editForm.enzyme} onChange={handleEditChange} style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="substrate" value={editForm.substrate} onChange={handleEditChange} style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="conversion" value={editForm.conversion} onChange={handleEditChange} type="number" style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="ee" value={editForm.ee} onChange={handleEditChange} type="number" style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="ph" value={editForm.ph} onChange={handleEditChange} type="number" style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="temperature" value={editForm.temperature} onChange={handleEditChange} type="number" style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="time" value={editForm.time} onChange={handleEditChange} type="number" style={editInputStyle} /></td>
                      <td style={cellStyle}><input name="cosolvent" value={editForm.cosolvent} onChange={handleEditChange} style={editInputStyle} /></td>
                      {format === "plate" && <td style={cellStyle}><input name="well" value={editForm.well} onChange={handleEditChange} style={editInputStyle} /></td>}
                      <td style={cellStyle}><input name="notes" value={editForm.notes} onChange={handleEditChange} style={editInputStyle} /></td>
                      <td style={{ ...cellStyle, display: "flex", gap: 6 }}>
                        <button onClick={saveEdit} style={{ ...S.btn(colors.green), padding: "4px 10px", fontSize: 12 }}>✓</button>
                        <button onClick={cancelEdit} style={{ ...S.btn(colors.textSecondary), padding: "4px 10px", fontSize: 12 }}>✕</button>
                      </td>
                    </tr>
                  ) : (
                    // Display row
                    <tr key={e.id} style={{ borderBottom: `1px solid ${colors.bg}` }}>
                      <td style={{ ...cellStyle, fontWeight: 600 }}>{e.enzyme}</td>
                      <td style={cellStyle}>{e.substrate}</td>
                      <td style={cellStyle}>
                        {e.conversion !== "" && (
                          <span style={{ color: convColor(e.conversion), fontWeight: 600 }}>{e.conversion}%</span>
                        )}
                      </td>
                      <td style={cellStyle}>{e.ee ? `${e.ee}%` : "—"}</td>
                      <td style={cellStyle}>{e.ph || "—"}</td>
                      <td style={cellStyle}>{e.temperature ? `${e.temperature}°C` : "—"}</td>
                      <td style={cellStyle}>{e.time ? `${e.time}h` : "—"}</td>
                      <td style={cellStyle}>{e.cosolvent || "—"}</td>
                      {format === "plate" && <td style={cellStyle}>{e.well || "—"}</td>}
                      <td style={{ ...cellStyle, color: colors.textSecondary }}>{e.notes || "—"}</td>
                      <td style={{ ...cellStyle, display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(e)} style={{
                          background: "transparent", border: `1px solid ${colors.borderStrong}`,
                          color: colors.textSecondary, borderRadius: 6,
                          padding: "3px 8px", cursor: "pointer", fontSize: 11,
                        }}>✎</button>
                        <button onClick={() => handleDelete(e.id)} style={{
                          background: "transparent", border: `1px solid ${colors.borderStrong}`,
                          color: colors.textSecondary, borderRadius: 6,
                          padding: "3px 8px", cursor: "pointer", fontSize: 11,
                        }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}