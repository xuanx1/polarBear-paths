/* Panels.jsx — Side panels for PolarBearPaths */
/* global React, PBP_DATA */

const { useMemo: useMemoP } = React;

// ----------------- LEFT PANEL: layers, encounters, bears -----------------
const LeftPanel = ({ layers, setLayers, bufferKm, setBufferKm, bears, encounters, selection, setSelection, setHoveredEnc }) => {
  return (
    <aside className="left">
      <div className="sec">
        <div className="eyebrow">Map layers</div>
        <div className="layers">
          {[
            { k: "ice",     label: "Sea Ice Extent",     count: "" },
            { k: "glaciers", label: "Glaciers",           count: window.PBP_DATA.GLACIERS.length },
            { k: "lanes",   label: "Shipping Lanes",     count: window.PBP_DATA.LANES.length },
            { k: "vessels", label: "Vessels",   count: window.PBP_DATA.VESSELS.length },
            { k: "bears",   label: "Bears, Collared",   count: window.PBP_DATA.BEARS.length },
            { k: "risk",    label: "Risk Overlay",       count: "" },
          ].map(L => (
            <div key={L.k} className={"layer " + (layers[L.k] ? "on" : "")}
              onClick={() => setLayers({ ...layers, [L.k]: !layers[L.k] })}>
              <div className="swatch"></div>
              <div className="name">{L.label}</div>
              <div className="count">{L.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="eyebrow">Wildlife buffer radius</div>
        <div className="slider-row">
          <input type="range" min="5" max="60" step="1" value={bufferKm}
            onChange={(e) => setBufferKm(+e.target.value)} />
          <div className="v">{bufferKm} km</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.4 }}>
          IUCN advisory: ≥ 25 km from confirmed denning sites during pup-out.
        </div>
      </div>

      <div className="sec tight">
        <h3>Predicted encounters</h3>
        <div className="lede">Next 24h · {encounters.length} alerts</div>
      </div>
      <div className="encounter-list">
        {encounters.map(e => {
          const b = window.PBP_DATA.BEARS.find(x => x.id === e.bear);
          const v = window.PBP_DATA.VESSELS.find(x => x.id === e.vessel);
          return (
            <div key={e.id}
              className={"encounter " + e.severity}
              onMouseEnter={() => setHoveredEnc(e)}
              onMouseLeave={() => setHoveredEnc(null)}
              onClick={() => setSelection({ kind: "bear", id: e.bear })}
            >
              <div className="sev"></div>
              <div className="body">
                <div className="h">{b?.name} <span style={{color:"var(--ink-3)", fontWeight:400}}>×</span> {v?.name}</div>
                <div className="d">closest approach <b>{e.closest_m} m</b> · {e.severity}</div>
              </div>
              <div className="when">T+{e.in_hours.toFixed(1)}h<small>ETA</small></div>
            </div>
          );
        })}
      </div>

      <div className="sec tight" style={{ borderTop: "1px solid var(--rule)" }}>
        <h3>Collared population</h3>
        <div className="lede">8 individuals · last fix &lt; 2h</div>
      </div>
      <div className="bear-list">
        {window.PBP_DATA.BEARS.map(b => (
          <div key={b.id}
            className={"bear-row " + (selection?.kind === "bear" && selection.id === b.id ? "active" : "")}
            onClick={() => setSelection({ kind: "bear", id: b.id })}>
            <div className="glyph">
              <svg width="22" height="22" viewBox="-12 -12 24 24">
                <ellipse cx="0" cy="2" rx="4" ry="3.6" fill="var(--ink)" />
                <ellipse cx="-3.6" cy="-2.6" rx="1.5" ry="1.7" fill="var(--ink)" />
                <ellipse cx="-1.3" cy="-4.6" rx="1.4" ry="1.6" fill="var(--ink)" />
                <ellipse cx="1.5" cy="-4.6" rx="1.4" ry="1.6" fill="var(--ink)" />
                <ellipse cx="3.8" cy="-2.6" rx="1.5" ry="1.7" fill="var(--ink)" />
              </svg>
            </div>
            <div>
              <div className="nm">{b.name} <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: 11 }}>{b.sex}{b.age}</span></div>
              <div className="id">{b.id} · {b.home_floe}</div>
            </div>
            <div className="stress">
              {(b.stress_idx*100).toFixed(0)}<small>stress</small>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

// ----------------- RIGHT PANEL: bear profile or vessel reroute -----------------
const RightPanel = ({ selection, setSelection, showProposed, setShowProposed, reroutePresentation }) => {
  const D = window.PBP_DATA;

  if (!selection) {
    return (
      <aside className="right">
        <div className="sec">
          <div className="eyebrow">Inspector</div>
          <h3>Select a bear or vessel</h3>
          <div className="lede" style={{ marginTop: 4 }}>
            Click any glyph on the map, or pick from the list at left, to open detail and reroute proposals.
          </div>
        </div>
        <div className="sec" style={{ borderBottom: 0 }}>
          <div className="eyebrow">Today at a glance</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginTop: 8 }}>
            <Stat lbl="Active alerts"      val="6"   sub="2 critical" />
            <Stat lbl="Bears in buffer"    val="3"   sub="of 8 collared" />
            <Stat lbl="Vessels routed"     val="1/5" sub="MV-Nordlys" />
            <Stat lbl="CO₂ overhead"       val="+16.9 t" sub="vs. baseline" />
            <Stat lbl="Sea ice anomaly"    val="−1.46 M km²" sub="vs. 1991–2020" />
            <Stat lbl="Albedo (Jun)"       val="0.54" sub="−34% since '00" />
          </div>
        </div>
      </aside>
    );
  }

  if (selection.kind === "bear") {
    const b = D.BEARS.find(x => x.id === selection.id);
    if (!b) return null;
    return (
      <aside className="right">
        <div className="profile">
          <div className="hdr">
            <div>
              <div className="nm">{b.name}</div>
              <div className="id">{b.id} · collared {b.collar_since}</div>
            </div>
            <button className="btn ghost" onClick={() => setSelection(null)}>Close</button>
          </div>
          <div className="meta">
            <div><div className="k">Sex / age</div><div className="v">{b.sex} · {b.age} yrs</div></div>
            <div><div className="k">Weight</div><div className="v">{b.weight_kg} kg</div></div>
            <div><div className="k">Cubs</div><div className="v">{b.cubs}</div></div>
            <div><div className="k">Body condition</div><div className="v">{b.condition}</div></div>
            <div><div className="k">Home range</div><div className="v">{b.home_floe}</div></div>
            <div><div className="k">Last kill</div><div className="v">{b.last_kill}</div></div>
            <div><div className="k">Collar</div><div className="v">{b.collar}</div></div>
            <div>
              <div className="k">Stress index</div>
              <div className="v">{(b.stress_idx*100).toFixed(0)}<small style={{color:"var(--ink-3)", fontSize:10, marginLeft:4}}>/100</small></div>
              <div className="stress-bar"><i style={{ width: `${b.stress_idx*100}%` }}></i></div>
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="eyebrow">Movement · 7-day track</div>
          <BearTrackChart bear={b} />
        </div>

        <div className="sec">
          <div className="eyebrow">Predicted encounters</div>
          {D.ENCOUNTERS.filter(e => e.bear === b.id).length === 0 && (
            <div className="lede">No predicted vessel breaches in next 24h.</div>
          )}
          {D.ENCOUNTERS.filter(e => e.bear === b.id).map(e => {
            const v = D.VESSELS.find(x => x.id === e.vessel);
            return (
              <div key={e.id} className={"encounter " + e.severity} style={{margin:"0 -18px"}} onClick={() => setSelection({kind:"vessel", id: e.vessel})}>
                <div className="sev"></div>
                <div className="body">
                  <div className="h">{v?.name}</div>
                  <div className="d">{e.closest_m} m · {e.severity}</div>
                </div>
                <div className="when">T+{e.in_hours.toFixed(1)}h</div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  if (selection.kind === "vessel") {
    const v = D.VESSELS.find(x => x.id === selection.id);
    if (!v) return null;
    // A vessel has its OWN reroute attached (v.reroute) when A* found a useful
    // detour for it. We display the hero based on this vessel's reroute, not
    // a single global one. D.REROUTE remains as the showcase for first-load.
    const hasReroute = v.reroute && v.reroute.useful;
    const isReroute = hasReroute;
    return (
      <aside className="right">
        <div className="profile">
          <div className="hdr">
            <div>
              <div className="nm">{v.name}</div>
              <div className="id">{v.id} · {v.flag} · {v.type}</div>
              {v.operator && <div className="id" style={{opacity: 0.7}}>{v.operator}</div>}
            </div>
            <button className="btn ghost" onClick={() => setSelection(null)}>Close</button>
          </div>
          <div className="meta">
            <div><div className="k">Length</div><div className="v">{v.length_m} m</div></div>
            <div><div className="k">Draft</div><div className="v">{v.draft_m} m</div></div>
            <div><div className="k">Speed</div><div className="v">{v.speed_kn} kn</div></div>
            <div><div className="k">Heading</div><div className="v">{v.heading}°</div></div>
            <div><div className="k">Cargo</div><div className="v">{v.cargo}</div></div>
            <div><div className="k">ETA</div><div className="v">{v.eta}</div></div>
            <div>
              <div className="k">Risk index</div>
              <div className="v" style={{color: v.risk > 0.7 ? "var(--risk-high)" : v.risk > 0.4 ? "var(--risk-mid)" : "var(--good)"}}>
                {(v.risk*100).toFixed(0)}<small style={{color:"var(--ink-3)", fontSize:10, marginLeft:4}}>/100</small>
              </div>
            </div>
            <div><div className="k">Encounters (24h)</div><div className="v">{v.encounters}</div></div>
          </div>
        </div>

        {hasReroute ? (
          <RerouteHero
            vessel={v}
            showProposed={showProposed}
            setShowProposed={setShowProposed}
            presentation={reroutePresentation}
          />
        ) : v.reroute ? (
          <div className="sec">
            <div className="eyebrow">Routing</div>
            <div className="lede" style={{marginBottom:6}}>
              No useful reroute for {v.name}.
            </div>
            <div style={{fontSize:11, color:"var(--ink-3)", lineHeight:1.5}}>
              {v.reroute.reason || "Geographic constraint"}
            </div>
          </div>
        ) : (
          <div className="sec">
            <div className="eyebrow">Routing</div>
            <div className="lede">No reroute required — no bears in {D.REROUTE.buffer_km || 25} km buffer of path.</div>
          </div>
        )}
      </aside>
    );
  }
  return null;
};

const Stat = ({ lbl, val, sub }) => (
  <div>
    <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-3)" }}>{lbl}</div>
    <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 2 }}>{val}</div>
    <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{sub}</div>
  </div>
);

// Mini bear track sparkline
const BearTrackChart = ({ bear }) => {
  const w = 320, h = 80;
  const pts = [...bear.track, ...bear.forecast];
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.min(...xs) - 10, maxX = Math.max(...xs) + 10;
  const minY = Math.min(...ys) - 10, maxY = Math.max(...ys) + 10;
  const sx = (x) => ((x - minX) / (maxX - minX)) * w;
  const sy = (y) => ((y - minY) / (maxY - minY)) * h;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
      <path d={bear.track.map((p,i)=>`${i===0?"M":"L"} ${sx(p[0])} ${sy(p[1])}`).join(" ")}
        fill="none" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="1.5 2" />
      <path d={bear.forecast.map((p,i)=>`${i===0?"M":"L"} ${sx(p[0])} ${sy(p[1])}`).join(" ")}
        fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="3 3" />
      {bear.track.map((p,i) => <circle key={"t"+i} cx={sx(p[0])} cy={sy(p[1])} r="1.5" fill="var(--ink-2)" />)}
      {bear.forecast.map((p,i) => <circle key={"f"+i} cx={sx(p[0])} cy={sy(p[1])} r="1.5" fill="var(--accent)" />)}
      <text x="4" y="12" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)">−7d</text>
      <text x={w-30} y="12" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)">+24h</text>
    </svg>
  );
};

// Reroute hero block — driven by the vessel's own A* result (vessel.reroute).
// Falls back to the global D.REROUTE only if no vessel was passed (legacy).
const RerouteHero = ({ vessel, showProposed, setShowProposed, presentation }) => {
  const R = (vessel && vessel.reroute && vessel.reroute.useful)
    ? vessel.reroute
    : window.PBP_DATA.REROUTE;
  const o = R.original, p = R.proposed;
  const dRisk = ((p.risk - o.risk) * 100).toFixed(0);
  const dDist = (p.distance_nm - o.distance_nm);
  const dCO2 = (p.co2_t - o.co2_t).toFixed(1);
  const dTransit = (p.transit_h - o.transit_h).toFixed(1);
  const bearsAvoided = o.bears_disturbed || [];
  const bearById = id => (window.PBP_DATA.BEARS.find(b => b.id === id) || {}).name || id;
  const avoidedNames = bearsAvoided.map(bearById);
  const avoidedJoined = avoidedNames.length === 0 ? "no bears"
    : avoidedNames.length === 1 ? avoidedNames[0]
    : avoidedNames.length === 2 ? avoidedNames.join(" and ")
    : avoidedNames.slice(0, -1).join(", ") + ", and " + avoidedNames[avoidedNames.length - 1];

  return (
    <div className="reroute">
      <div className="hdr">
        <h2>Proposed reroute</h2>
        <div className="for">PBP-MODEL-04 · 99.2% conf.</div>
      </div>

      {presentation === "split" && (
        <div className="compare">
          <div className="col">
            <div className="lbl bad">Original plan</div>
            <div className="big" style={{ color: "var(--risk-high)" }}>{(o.risk*100).toFixed(0)}<small>risk</small></div>
            <div className="stat"><span>Distance</span><b>{o.distance_nm} nm</b></div>
            <div className="stat"><span>Transit</span><b>{o.transit_h.toFixed(1)} h</b></div>
            <div className="stat"><span>Fuel</span><b>{o.fuel_t} t</b></div>
            <div className="stat"><span>CO₂</span><b>{o.co2_t} t</b></div>
            <div className="stat"><span>Encounters</span><b>{o.encounters}</b></div>
            {o.min_separation_km != null && <div className="stat"><span>Min sep.</span><b>{o.min_separation_km} km</b></div>}
          </div>
          <div className="col">
            <div className="lbl good">Proposed</div>
            <div className="big" style={{ color: "var(--good)" }}>{(p.risk*100).toFixed(0)}<small>risk</small></div>
            <div className="stat"><span>Distance</span><b>{p.distance_nm} nm</b></div>
            <div className="stat"><span>Transit</span><b>{p.transit_h.toFixed(1)} h</b></div>
            <div className="stat"><span>Fuel</span><b>{p.fuel_t} t</b></div>
            <div className="stat"><span>CO₂</span><b>{p.co2_t} t</b></div>
            <div className="stat"><span>Encounters</span><b>{p.encounters}</b></div>
            {p.min_separation_km != null && <div className="stat"><span>Min sep.</span><b>{p.min_separation_km} km</b></div>}
          </div>
        </div>
      )}

      {presentation === "overlay" && (
        <div style={{ border: "1px solid var(--rule)", padding: 14, background: "var(--bg)" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Detour <b style={{color:"var(--good)"}}>+{dDist} nm</b> &nbsp;avoids&nbsp; <b style={{color:"var(--good)"}}>{bearsAvoided.length} bear{bearsAvoided.length===1?"":"s"}</b>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 12 }}>
            Reduces collision risk by <b style={{color:"var(--good)"}}>{Math.abs(dRisk)} pts</b> at a cost of {dCO2} t CO₂ and {dTransit}h transit.
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 1, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ flex: o.risk*100, background: "var(--risk-high)" }}></div>
            <div style={{ flex: 100-(o.risk*100), background: "var(--rule)" }}></div>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-3)", marginBottom: 10 }}>
            Original risk · {(o.risk*100).toFixed(0)}/100
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 1, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ flex: p.risk*100, background: "var(--good)" }}></div>
            <div style={{ flex: 100-(p.risk*100), background: "var(--rule)" }}></div>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
            Proposed risk · {(p.risk*100).toFixed(0)}/100
          </div>
        </div>
      )}

      {presentation === "before-after" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--rule)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--risk-high)" }}>BEFORE</div>
            <div style={{ height: 4, background: "var(--rule)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${o.risk*100}%`, background: "var(--risk-high)" }}></div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--risk-high)" }}>{(o.risk*100).toFixed(0)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--bg)", borderLeft: "1px solid var(--rule)", borderRight: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--good)" }}>AFTER&nbsp;</div>
            <div style={{ height: 4, background: "var(--rule)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${p.risk*100}%`, background: "var(--good)" }}></div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--good)" }}>{(p.risk*100).toFixed(0)}</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
            <b style={{color:"var(--ink)"}}>+{dDist} nm</b> · <b style={{color:"var(--ink)"}}>+{dTransit} h</b> · <b style={{color:"var(--ink)"}}>+{dCO2} t CO₂</b>
            {bearsAvoided.length > 0 ? <><br/>Avoids <b style={{color:"var(--good)"}}>{avoidedJoined}</b>.</> : <><br/>No bears within {window.PBP_DATA.REROUTE.buffer_km || 25} km buffer.</>}
          </div>
        </div>
      )}

      <div className="actions">
        <button className={"btn " + (showProposed ? "primary" : "")} onClick={() => setShowProposed(!showProposed)}>
          {showProposed ? "✓ Showing on map" : "Preview on map"}
        </button>
        <button className="btn ghost" onClick={() => window.print()}>Export PDF report</button>
      </div>
    </div>
  );
};

window.LeftPanel = LeftPanel;
window.RightPanel = RightPanel;
