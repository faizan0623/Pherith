import { useState } from "react";
import { S, colors } from "./theme";

function loadLibs(callback) {
  let loaded = 0;
  const check = () => { loaded++; if (loaded === 2) callback(); };
  if (!window.XLSX) {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = check; document.head.appendChild(s);
  } else check();
  if (!window.docx) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";
    s.onload = check; document.head.appendChild(s);
  } else check();
}

function exportExcel({ campaign, entries, scopeEnzymes, scopeSubstrates, scopeResults, doeFactors, doeRuns }) {
  const wb = window.XLSX.utils.book_new();

  // Campaign sheet
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet([
    ["Field", "Value"],
    ["Title", campaign.title],
    ["Researcher", campaign.researcher],
    ["Target molecule", campaign.target],
    ["Reaction type", campaign.reactionType],
    ["Enzyme class", campaign.enzymeClass],
    ["Start date", campaign.startDate],
    ["Transformation", campaign.transformation],
  ]), "Campaign");

  // Screening sheet
  if (entries.length > 0) {
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet([
      ["Enzyme", "Substrate", "Conversion (%)", "ee (%)", "pH", "Temperature (°C)", "Time (h)", "Cosolvent", "Notes", "Well"],
      ...entries.map(e => [e.enzyme, e.substrate, e.conversion, e.ee, e.ph, e.temperature, e.time, e.cosolvent, e.notes, e.well])
    ]), "Enzyme Screening");
  }

  // Substrate scope sheet
  if (scopeEnzymes.length > 0 && scopeSubstrates.length > 0) {
    const header = ["Enzyme / Substrate", ...scopeSubstrates];
    const rows = scopeEnzymes.map(enz => [
      enz,
      ...scopeSubstrates.map(sub => {
        const r = scopeResults[`${enz}|${sub}`];
        return r ? `Conv: ${r.conversion || "—"} / ee: ${r.ee || "—"}` : "—";
      })
    ]);
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet([header, ...rows]), "Substrate Scope");
  }

  // DoE sheet
  if (doeRuns.length > 0) {
    const header = ["Run", "Type", ...doeFactors.map(f => `${f.name} (${f.low}–${f.high})`), "Response"];
    const rows = doeRuns.map((r, i) => [
      r.type === "centre" ? "CP" : r.run,
      r.type,
      ...doeFactors.map(f => r[f.name]),
      r.response || "—"
    ]);
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet([header, ...rows]), "DoE");
  }

  const filename = campaign.title
    ? campaign.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_data.xlsx"
    : "biocatalyx_data.xlsx";
  window.XLSX.writeFile(wb, filename);
}

function exportWord({ campaign, entries, scopeEnzymes, scopeSubstrates, scopeResults, doeFactors, doeRuns }) {
  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType
  } = window.docx;

  const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
  const borders = { top: border, bottom: border, left: border, right: border };

  function hCell(text) {
    return new TableCell({
      borders,
      shading: { type: ShadingType.CLEAR, fill: "EEF4FF" },
      children: [new Paragraph({
        children: [new TextRun({ text: String(text ?? ""), bold: true, size: 20, font: "Calibri" })]
      })]
    });
  }

  function dCell(text) {
    return new TableCell({
      borders,
      children: [new Paragraph({
        children: [new TextRun({ text: String(text ?? "—"), size: 20, font: "Calibri" })]
      })]
    });
  }

  function h1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 160 },
      children: [new TextRun({ text, bold: true, size: 28, color: "0055CC", font: "Calibri" })]
    });
  }

  function h2(text) {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 22, font: "Calibri" })]
    });
  }

  function p(text, options = {}) {
    return new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: String(text ?? ""), size: 20, font: "Calibri", ...options })]
    });
  }

  function spacer() { return new Paragraph({ children: [] }); }

  function makeTable(headerRow, dataRows) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headerRow.map(hCell), tableHeader: true }),
        ...dataRows.map(row => new TableRow({ children: row.map(dCell) }))
      ]
    });
  }

  const children = [];

  // Title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({
      text: campaign.title || "Biocatalysis Research Report",
      bold: true, size: 52, font: "Calibri", color: "0055CC"
    })]
  }));

  if (campaign.researcher) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: campaign.researcher, size: 24, font: "Calibri", color: "555555" })]
    }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }),
      size: 20, font: "Calibri", color: "999999"
    })]
  }));

  if (campaign.reactionType || campaign.enzymeClass) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({
        text: [campaign.reactionType, campaign.enzymeClass].filter(Boolean).join(" · "),
        size: 20, font: "Calibri", color: "888888", italics: true
      })]
    }));
  }

  children.push(spacer());

  // Section 1 — Campaign
  children.push(h1("1. Campaign Overview"));
  if (campaign.target) children.push(p(`Target molecule: ${campaign.target}`));
  if (campaign.startDate) children.push(p(`Start date: ${campaign.startDate}`));
  if (campaign.transformation) {
    children.push(h2("Reaction description"));
    children.push(p(campaign.transformation, { italics: true }));
  }
  children.push(spacer());

  // Section 2 — Screening
  if (entries.length > 0) {
    const enzymes = [...new Set(entries.map(e => e.enzyme).filter(Boolean))];
    const substrates = [...new Set(entries.map(e => e.substrate).filter(Boolean))];
    const withConv = [...entries.filter(e => e.conversion !== "" && e.conversion !== undefined)]
      .sort((a, b) => Number(b.conversion) - Number(a.conversion));
    const best = withConv[0];

    children.push(h1("2. Enzyme Screening"));
    children.push(p(
      `A total of ${entries.length} reactions were screened across ${enzymes.length} enzyme(s) and ${substrates.length} substrate(s).` +
      (best ? ` The highest conversion observed was ${best.conversion}% with ${best.enzyme} on ${best.substrate}` +
        (best.ee ? `, giving ${best.ee}% ee` : "") + "." : "")
    ));
    children.push(spacer());
    children.push(h2("Table S1. Enzyme screening results."));
    children.push(makeTable(
      ["Enzyme", "Substrate", "Conv (%)", "ee (%)", "pH", "Temp (°C)", "Time (h)", "Cosolvent", "Notes"],
      entries.map(e => [e.enzyme, e.substrate, e.conversion, e.ee, e.ph, e.temperature, e.time, e.cosolvent, e.notes])
    ));
    children.push(spacer());
  }

  // Section 3 — Substrate Scope
  if (scopeEnzymes.length > 0 && scopeSubstrates.length > 0) {
    children.push(h1("3. Substrate Scope"));
    children.push(p(
      `Substrate scope was evaluated for ${scopeEnzymes.length} enzyme(s) against ${scopeSubstrates.length} substrate(s). ` +
      `Values shown as conversion / ee.`
    ));
    children.push(spacer());
    children.push(h2("Table S2. Substrate scope matrix (conversion % / ee %)."));
    children.push(makeTable(
      ["Enzyme / Substrate", ...scopeSubstrates],
      scopeEnzymes.map(enz => [
        enz,
        ...scopeSubstrates.map(sub => {
          const r = scopeResults[`${enz}|${sub}`];
          return r ? `${r.conversion || "—"} / ${r.ee || "—"}` : "—";
        })
      ])
    ));
    children.push(spacer());
  }

  // Section 4 — DoE
  if (doeRuns.length > 0) {
    const factorialRuns = doeRuns.filter(r => r.type === "factorial" && r.response !== "");
    const centreRuns = doeRuns.filter(r => r.type === "centre" && r.response !== "");
    const best = [...doeRuns.filter(r => r.response !== "")]
      .sort((a, b) => Number(b.response) - Number(a.response))[0];

    children.push(h1("4. Reaction Optimisation (DoE)"));
    children.push(p(
      `A two-level full factorial design with ${doeFactors.length} factor(s) was employed, generating ${doeRuns.filter(r => r.type === "factorial").length} factorial runs and ${doeRuns.filter(r => r.type === "centre").length} centre point(s).`
    ));

    if (best) {
      children.push(p(
        `Optimal conditions: ${doeFactors.map(f => `${f.name} = ${best[f.name]}`).join(", ")} (response: ${best.response}).`
      ));
    }

    if (factorialRuns.length > 0 && centreRuns.length > 0) {
      const factAvg = factorialRuns.reduce((s, r) => s + Number(r.response), 0) / factorialRuns.length;
      const centreAvg = centreRuns.reduce((s, r) => s + Number(r.response), 0) / centreRuns.length;
      const diff = centreAvg - factAvg;
      const hasCurvature = Math.abs(diff) > 0.05 * factAvg;
      children.push(p(
        `Curvature analysis: factorial average = ${factAvg.toFixed(2)}, centre point average = ${centreAvg.toFixed(2)}. ` +
        (hasCurvature ? "Significant curvature detected — response surface methodology recommended for further optimisation." : "No significant curvature detected.")
      ));
    }

    children.push(spacer());
    children.push(h2("Table S3. DoE run table and responses."));
    children.push(makeTable(
      ["Run", "Type", ...doeFactors.map(f => `${f.name} (${f.low}–${f.high})`), "Response"],
      doeRuns.map((r, i) => [
        r.type === "centre" ? "CP" : r.run,
        r.type,
        ...doeFactors.map(f => r[f.name]),
        r.response || "—"
      ])
    ));
  }

  // Footer
  children.push(spacer());
  children.push(new Paragraph({
    spacing: { before: 400 },
    children: [new TextRun({
      text: `Generated by Biocatalyx v1.0 · ${new Date().toLocaleDateString("en-GB")}`,
      size: 16, font: "Calibri", color: "AAAAAA", italics: true
    })]
  }));

  Packer.toBlob(new Document({ sections: [{ children }] })).then(blob => {
    const a = document.createElement("a");
    const filename = campaign.title
      ? campaign.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_SI.docx"
      : "biocatalyx_SI.docx";
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });
}

export default function Reports({ campaign, entries, scopeEnzymes, scopeSubstrates, scopeResults, doeFactors, doeRuns }) {
  const [libsReady, setLibsReady] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  useState(() => { loadLibs(() => setLibsReady(true)); }, []);

  const hasData = entries.length > 0 || scopeEnzymes.length > 0 || doeRuns.length > 0;

  function handleWord() {
    setLoadingWord(true);
    setTimeout(() => {
      exportWord({ campaign, entries, scopeEnzymes, scopeSubstrates, scopeResults, doeFactors, doeRuns });
      setLoadingWord(false);
    }, 100);
  }

  function handleExcel() {
    setLoadingExcel(true);
    setTimeout(() => {
      exportExcel({ campaign, entries, scopeEnzymes, scopeSubstrates, scopeResults, doeFactors, doeRuns });
      setLoadingExcel(false);
    }, 100);
  }

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Report Generation</h1>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>
          Export all campaign data as a Word SI document or Excel workbook.
        </p>
      </div>

      {/* Data summary */}
      <div style={S.card}>
        <span style={S.label}>Data available for export</span>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Screening entries", count: entries.length, icon: "⊞" },
            { label: "Scope combinations", count: scopeEnzymes.length * scopeSubstrates.length, icon: "◈" },
            { label: "DoE runs", count: doeRuns.length, icon: "◎" },
          ].map(({ label, count, icon }) => (
            <div key={label} style={{
              flex: 1, minWidth: 160, padding: "16px 20px", borderRadius: 14,
              background: count > 0 ? colors.blueLight : colors.bg,
              border: `1px solid ${count > 0 ? colors.blueBorder : colors.borderStrong}`
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: count > 0 ? colors.blue : colors.textSecondary }}>{count}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SI preview */}
      {hasData && (
        <div style={{ ...S.card, background: "#f9fafb", border: `1px solid ${colors.borderStrong}` }}>
          <span style={S.label}>SI document will include</span>
          <div style={{ fontSize: 14, color: colors.text, lineHeight: 2 }}>
            {campaign.title && <div>📄 <strong>{campaign.title}</strong></div>}
            <div>1. Campaign Overview{campaign.transformation ? " — with reaction description" : ""}</div>
            {entries.length > 0 && <div>2. Enzyme Screening — Table S1 ({entries.length} entries)</div>}
            {scopeEnzymes.length > 0 && <div>3. Substrate Scope — Table S2 ({scopeEnzymes.length} × {scopeSubstrates.length} matrix)</div>}
            {doeRuns.length > 0 && <div>4. DoE Optimisation — Table S3 ({doeRuns.length} runs, curvature analysis included)</div>}
          </div>
        </div>
      )}

      {!hasData && (
        <div style={{ ...S.card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 12 }}>⊟</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data yet</div>
          <div style={{ fontSize: 14, color: colors.textSecondary }}>Add data in Enzyme Screening, Substrate Scope, or DoE first.</div>
        </div>
      )}

      {/* Export buttons */}
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        <button onClick={handleWord} disabled={!hasData || !libsReady} style={S.btn(colors.blue, !hasData || !libsReady)}>
          {loadingWord ? "Generating…" : "↓ Word SI Document (.docx)"}
        </button>
        <button onClick={handleExcel} disabled={!hasData || !libsReady} style={S.btn(colors.green, !hasData || !libsReady)}>
          {loadingExcel ? "Generating…" : "↓ Excel Workbook (.xlsx)"}
        </button>
      </div>

      {!libsReady && (
        <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10 }}>Loading export libraries…</p>
      )}
    </div>
  );
}