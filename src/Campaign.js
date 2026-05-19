import { S, colors } from "./theme";

const REACTION_TYPES = [
  "Ketone reduction", "Reductive amination", "Epoxidation",
  "Hydroxylation", "Transamination", "Esterification", "Other"
];

const ENZYME_CLASSES = [
  "Alcohol dehydrogenase (ADH)", "Transaminase (TA)", "Monooxygenase",
  "Lipase", "Ene-reductase (ERED)", "Imine reductase (IRED)", "Other"
];

function getColor(conversion) {
  if (conversion === null || conversion === undefined || conversion === "") return null;
  const n = Number(conversion);
  if (n >= 90) return colors.green;
  if (n >= 50) return colors.orange;
  return colors.red;
}

export default function Campaign({ campaign, setCampaign, entries }) {
  function update(field, value) {
    setCampaign({ ...campaign, [field]: value });
  }

  const filled = Object.values(campaign).filter(Boolean).length;
  const total = Object.keys(campaign).length;

  // Best hit calculations
  const valid = entries.filter(e => e.conversion !== "" && e.conversion !== undefined);
  const top3 = [...valid].sort((a, b) => Number(b.conversion) - Number(a.conversion)).slice(0, 3);
  const bestEe = [...valid.filter(e => e.ee !== "" && e.ee !== undefined)]
    .sort((a, b) => Number(b.ee) - Number(a.ee))[0];
  const uniqueEnzymes = [...new Set(entries.map(e => e.enzyme).filter(Boolean))];
  const uniqueSubstrates = [...new Set(entries.map(e => e.substrate).filter(Boolean))];

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Campaign</h1>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>
          Project metadata — populates the SI title block and report header.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>Fields completed</span>
          <span style={{ fontSize: 12, color: colors.blue, fontWeight: 600 }}>{filled}/{total}</span>
        </div>
        <div style={{ height: 4, background: colors.bg, borderRadius: 2, border: `1px solid ${colors.borderStrong}` }}>
          <div style={{
            height: "100%", background: colors.blue, borderRadius: 2,
            width: `${(filled / total) * 100}%`, transition: "width 0.3s ease"
          }} />
        </div>
      </div>

      {/* Project details */}
      <div style={S.card}>
        <span style={S.label}>Project details</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { field: "title", label: "Campaign title", placeholder: "e.g. ADH screening for chiral alcohol synthesis" },
            { field: "researcher", label: "Researcher", placeholder: "Your name" },
            { field: "target", label: "Target molecule", placeholder: "e.g. (R)-1-phenylethan-1-ol" },
            { field: "startDate", label: "Start date", type: "date" },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label style={S.label}>{label}</label>
              <input
                type={type || "text"}
                value={campaign[field]}
                onChange={e => update(field, e.target.value)}
                placeholder={placeholder || ""}
                style={S.input}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reaction classification */}
      <div style={S.card}>
        <span style={S.label}>Reaction classification</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Reaction type</label>
            <select value={campaign.reactionType} onChange={e => update("reactionType", e.target.value)} style={S.input}>
              <option value="">Select…</option>
              {REACTION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Enzyme class</label>
            <select value={campaign.enzymeClass} onChange={e => update("enzymeClass", e.target.value)} style={S.input}>
              <option value="">Select…</option>
              {ENZYME_CLASSES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={S.label}>Transformation description</label>
          <textarea
            value={campaign.transformation}
            onChange={e => update("transformation", e.target.value)}
            placeholder="e.g. Asymmetric reduction of prochiral ketones to chiral secondary alcohols using NADPH-dependent ADHs. Cofactor regenerated using glucose/GDH system."
            style={S.textarea}
          />
        </div>
      </div>

      {/* SI preview */}
      {campaign.title && (
        <div style={{ ...S.card, background: colors.blueLight, border: `1px solid ${colors.blueBorder}` }}>
          <span style={{ ...S.label, color: colors.blue }}>SI title block preview</span>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{campaign.title}</div>
          {campaign.researcher && <div style={{ fontSize: 13, color: colors.textSecondary }}>Researcher: {campaign.researcher}</div>}
          {campaign.startDate && (
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              Date: {new Date(campaign.startDate).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
          {(campaign.reactionType || campaign.enzymeClass) && (
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              {[campaign.reactionType, campaign.enzymeClass].filter(Boolean).join(" · ")}
            </div>
          )}
          {campaign.target && <div style={{ fontSize: 13, color: colors.textSecondary }}>Target: {campaign.target}</div>}
          {campaign.transformation && (
            <div style={{ fontSize: 13, color: colors.text, marginTop: 8, fontStyle: "italic" }}>{campaign.transformation}</div>
          )}
        </div>
      )}

      {/* Best hit summary */}
      {entries.length > 0 && (
        <div style={S.card}>
          <span style={S.label}>Best hit summary</span>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { value: entries.length, label: "Reactions logged" },
              { value: uniqueEnzymes.length, label: "Enzymes screened" },
              { value: uniqueSubstrates.length, label: "Substrates tested" },
            ].map(({ value, label }) => (
              <div key={label} style={{
                flex: 1, minWidth: 140, padding: "16px 20px",
                borderRadius: 14, background: colors.blueLight,
                border: `1px solid ${colors.blueBorder}`
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: colors.blue }}>{value}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Top 3 by conversion */}
          {top3.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ ...S.label, marginBottom: 10 }}>Top hits by conversion</span>
              {top3.map((e, i) => {
                const c = getColor(e.conversion);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "12px 16px", borderRadius: 12,
                    background: i === 0 ? colors.greenLight : colors.bg,
                    border: `1px solid ${i === 0 ? colors.green + "40" : colors.borderStrong}`,
                    marginBottom: 8
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.green, width: 28 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {e.enzyme} <span style={{ color: colors.textSecondary, fontWeight: 400 }}>on</span> {e.substrate}
                      </div>
                      {e.conditions && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{e.conditions}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{e.conversion}%</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>conversion</div>
                    </div>
                    {e.ee && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: colors.blue }}>{e.ee}%</div>
                        <div style={{ fontSize: 11, color: colors.textSecondary }}>ee</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Best ee */}
          {bestEe && (
            <div>
              <span style={{ ...S.label, marginBottom: 10 }}>Best enantioselectivity</span>
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "12px 16px", borderRadius: 12,
                background: colors.blueLight, border: `1px solid ${colors.blueBorder}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {bestEe.enzyme} <span style={{ color: colors.textSecondary, fontWeight: 400 }}>on</span> {bestEe.substrate}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.blue }}>{bestEe.ee}%</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>ee</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: getColor(bestEe.conversion) }}>{bestEe.conversion}%</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>conversion</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}