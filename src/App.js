import { useState, useRef } from "react";
import { colors, S, fonts } from "./theme";
import Campaign from "./Campaign";
import Screening from "./Screening";
import SubstrateScope from "./SubstrateScope";
import DoE from "./DoE";
import Reports from "./Reports";

const MODULES = [
  { id: "campaign", label: "Campaign", icon: "⬡" },
  { id: "screening", label: "Enzyme Screening", icon: "⊞" },
  { id: "scope", label: "Substrate Scope", icon: "◈" },
  { id: "doe", label: "DoE Planner", icon: "◎" },
  { id: "reports", label: "Report Generation", icon: "⊟" },
];

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const EMPTY_CAMPAIGN = {
  title: "", target: "", reactionType: "", enzymeClass: "",
  transformation: "", startDate: "", researcher: "",
};

function Placeholder({ title }) {
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.15 }}>⬡</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: colors.text, margin: 0 }}>{title}</h2>
      <p style={{ color: colors.textSecondary, marginTop: 8, fontSize: 15 }}>Coming soon.</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("campaign");
  const [unsaved, setUnsaved] = useState(false);
  const fileInputRef = useRef();

  // All shared state lives here
  const [campaign, setCampaign] = useState(() => load("bx_campaign", EMPTY_CAMPAIGN));
  const [entries, setEntries] = useState(() => load("bx_entries", []));
  const [scopeEnzymes, setScopeEnzymes] = useState(() => load("bx_scopeEnzymes", []));
  const [scopeSubstrates, setScopeSubstrates] = useState(() => load("bx_scopeSubstrates", []));
  const [scopeResults, setScopeResults] = useState(() => load("bx_scopeResults", {}));
  const [doeFactors, setDoeFactors] = useState(() => load("bx_doeFactors", []));
  const [doeRuns, setDoeRuns] = useState(() => load("bx_doeRuns", []));

  // Updaters — save to localStorage and mark unsaved
  function u(setter, key) {
    return (v) => { setter(v); save(key, v); setUnsaved(true); };
  }
  const updateCampaign = u(setCampaign, "bx_campaign");
  const updateEntries = u(setEntries, "bx_entries");
  const updateScopeEnzymes = u(setScopeEnzymes, "bx_scopeEnzymes");
  const updateScopeSubstrates = u(setScopeSubstrates, "bx_scopeSubstrates");
  const updateScopeResults = u(setScopeResults, "bx_scopeResults");
  const updateDoeFactors = u(setDoeFactors, "bx_doeFactors");
  const updateDoeRuns = u(setDoeRuns, "bx_doeRuns");

  // Save campaign to .bcx file
  function saveCampaignFile() {
    const data = {
      version: "1.0",
      savedAt: new Date().toISOString(),
      campaign, entries, scopeEnzymes, scopeSubstrates,
      scopeResults, doeFactors, doeRuns,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const filename = campaign.title
      ? campaign.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".bcx"
      : "biocatalyx_campaign.bcx";
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setUnsaved(false);
  }

  // Open .bcx file
  function openCampaignFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.campaign) { setCampaign(d.campaign); save("bx_campaign", d.campaign); }
        if (d.entries) { setEntries(d.entries); save("bx_entries", d.entries); }
        if (d.scopeEnzymes) { setScopeEnzymes(d.scopeEnzymes); save("bx_scopeEnzymes", d.scopeEnzymes); }
        if (d.scopeSubstrates) { setScopeSubstrates(d.scopeSubstrates); save("bx_scopeSubstrates", d.scopeSubstrates); }
        if (d.scopeResults) { setScopeResults(d.scopeResults); save("bx_scopeResults", d.scopeResults); }
        if (d.doeFactors) { setDoeFactors(d.doeFactors); save("bx_doeFactors", d.doeFactors); }
        if (d.doeRuns) { setDoeRuns(d.doeRuns); save("bx_doeRuns", d.doeRuns); }
        setUnsaved(false);
        setActive("campaign");
      } catch {
        alert("Could not read file. Make sure it is a valid .bcx file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // New campaign
  function newCampaign() {
    if (unsaved && !window.confirm("You have unsaved changes. Start a new campaign anyway?")) return;
    [
      [setCampaign, "bx_campaign", EMPTY_CAMPAIGN],
      [setEntries, "bx_entries", []],
      [setScopeEnzymes, "bx_scopeEnzymes", []],
      [setScopeSubstrates, "bx_scopeSubstrates", []],
      [setScopeResults, "bx_scopeResults", {}],
      [setDoeFactors, "bx_doeFactors", []],
      [setDoeRuns, "bx_doeRuns", []],
    ].forEach(([setter, key, empty]) => { setter(empty); save(key, empty); });
    setUnsaved(false);
    setActive("campaign");
  }

  const totalRecords = entries.length + doeRuns.length;

  const sideBtn = (color = colors.blue) => ({
    width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
    background: color, color: "#fff", fontSize: 12, fontWeight: 500,
    cursor: "pointer", fontFamily: fonts.base, textAlign: "center", marginBottom: 6,
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: colors.bg, fontFamily: fonts.base }}>

      {/* Sidebar */}
      <div style={{
        width: 240, flexShrink: 0,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: `1px solid ${colors.border}`,
        padding: "28px 16px",
        display: "flex", flexDirection: "column",
      }}>

        {/* Logo */}
        <div style={{ padding: "0 12px", marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, letterSpacing: "-0.3px" }}>Biocatalyx</div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3, letterSpacing: "0.3px", textTransform: "uppercase" }}>Research Platform</div>
        </div>

        {/* File controls */}
        <div style={{ padding: "0 4px", marginBottom: 20 }}>
          <button onClick={saveCampaignFile} style={sideBtn(colors.blue)}>
            {unsaved ? "⬤ Save campaign" : "↓ Save campaign"}
          </button>
          <button onClick={() => fileInputRef.current.click()} style={sideBtn("#555555")}>
            ↑ Open campaign
          </button>
          <button onClick={newCampaign} style={sideBtn(colors.textSecondary)}>
            + New campaign
          </button>
          <input ref={fileInputRef} type="file" accept=".bcx,.json"
            onChange={openCampaignFile} style={{ display: "none" }} />
        </div>

        {/* Active campaign */}
        {campaign.title && (
          <div style={{
            margin: "0 4px 20px 4px", padding: "10px 12px",
            background: colors.blueLight, borderRadius: 10,
            border: `1px solid ${colors.blueBorder}`,
          }}>
            <div style={{ fontSize: 11, color: colors.blue, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>Active campaign</div>
            <div style={{ fontSize: 13, color: colors.text, fontWeight: 500, lineHeight: 1.3 }}>{campaign.title}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "10px 14px", marginBottom: 2,
              background: active === m.id ? colors.blue : "transparent",
              border: "none", borderRadius: 10,
              color: active === m.id ? "#ffffff" : colors.text,
              cursor: "pointer", fontSize: 14,
              fontWeight: active === m.id ? 500 : 400,
              textAlign: "left", transition: "all 0.15s ease",
            }}>
              <span style={{ fontSize: 16, opacity: active === m.id ? 1 : 0.5 }}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 14px", background: colors.bg, borderRadius: 10, fontSize: 12, color: colors.textSecondary }}>
          <div style={{ fontWeight: 500, color: colors.text, fontSize: 13 }}>Biocatalyx v1.0</div>
          <div style={{ marginTop: 2 }}>{totalRecords > 0 ? `${totalRecords} records` : "No data yet"}</div>
          <div style={{ marginTop: 6, fontSize: 11, color: unsaved ? colors.orange : colors.green, display: "flex", alignItems: "center", gap: 4 }}>
            <span>●</span>{unsaved ? " Unsaved changes" : " All changes saved"}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: "40px 48px" }}>
        {active === "campaign" && (
  <Campaign
    campaign={campaign}
    setCampaign={updateCampaign}
    entries={entries} 
      />
      )}
        {active === "screening" && (
       <Screening entries={entries} setEntries={updateEntries} />
       )}
        {active === "scope" && (
       <SubstrateScope
         entries={entries}
         selectedEnzymes={scopeEnzymes}
         setSelectedEnzymes={updateScopeEnzymes}
         substrates={scopeSubstrates}
         setSubstrates={updateScopeSubstrates}
         results={scopeResults}
         setResults={updateScopeResults}
         />
          )}
        {active === "doe" && (
        <DoE
        factors={doeFactors}
        setFactors={updateDoeFactors}
        runs={doeRuns}
        setRuns={updateDoeRuns}
        />
        )}
         {active === "reports" && (<Reports
         campaign={campaign}
         entries={entries}
         scopeEnzymes={scopeEnzymes}
         scopeSubstrates={scopeSubstrates}
         scopeResults={scopeResults}
         doeFactors={doeFactors}
         doeRuns={doeRuns}
         />
    )}
      </div>

    </div>
  );
}