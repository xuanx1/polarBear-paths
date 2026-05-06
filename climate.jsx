/* Climate.jsx — bottom panels: sea ice, glaciers, albedo */
/* global React, PBP_DATA */

const SeaIcePanel = ({ iceFrameIdx, setIceFrameIdx }) => {
  const D = window.PBP_DATA;
  const w = 280, h = 96;
  const data = D.SEA_ICE_TIMELINE;
  const min = Math.min(...data) - 0.1;
  const max = 0.1;
  const sx = (i) => (i / (data.length - 1)) * w;
  const sy = (v) => h - ((v - min) / (max - min)) * h;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="panel">
      <h4>Sea ice extent — anomaly</h4>
      <div className="lede">vs. 1991–2020 mean · {D.SEA_ICE_TIMELINE_LABEL} · NSIDC</div>
      <div className="chart" style={{ marginTop: 6, position: "relative" }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block", height:"100%"}}>
          <line x1="0" y1={sy(0)} x2={w} y2={sy(0)} stroke="var(--ink-3)" strokeWidth="0.4" strokeDasharray="2 2" />
          <path d={area} fill="var(--accent)" opacity="0.18" />
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.4" />
          {data.map((v, i) => (
            <circle key={i} cx={sx(i)} cy={sy(v)} r="1.4" fill="var(--accent)" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <div className="chart-tl">+0</div>
        <div className="chart-bl">{min.toFixed(2)} M km²</div>
        <div className="chart-br">Apr 2026</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {D.ICE_FRAMES.map((f, i) => (
          <button key={i}
            onClick={() => setIceFrameIdx(i)}
            style={{
              flex: 1,
              background: i === iceFrameIdx ? "var(--ink)" : "var(--paper)",
              color: i === iceFrameIdx ? "var(--paper)" : "var(--ink-2)",
              border: "1px solid var(--rule)",
              fontFamily: "var(--mono)",
              fontSize: 10,
              padding: "5px 0",
              cursor: "pointer",
              letterSpacing: "0.04em"
            }}>{f.label}</button>
        ))}
      </div>
    </div>
  );
};

const GlacierPanel = () => {
  const D = window.PBP_DATA;
  const data = D.GLACIER_RETREAT;
  const w = 280, h = 96;
  const max = Math.max(...data) * 1.1;
  const bw = w / data.length - 2;

  return (
    <div className="panel">
      <h4>Glacier front retreat</h4>
      <div className="lede">Mean km/yr · 5 Svalbard tidewater glaciers · NPI</div>
      <div className="chart" style={{ marginTop: 6, position: "relative" }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block", height:"100%"}}>
          {data.map((v, i) => {
            const bh = (v / max) * (h - 12);
            return (
              <rect key={i} x={i * (bw + 2)} y={h - bh - 2} width={bw} height={bh}
                fill="var(--ink)" opacity={0.4 + (i / data.length) * 0.6} />
            );
          })}
        </svg>
        <div className="chart-tr"><b>{data[data.length - 1].toFixed(2)}</b> km/yr</div>
        <div className="chart-bl">2011</div>
        <div className="chart-br">2025</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--mono)" }}>Σ 2011–25 — 9.65 km</span>
        <span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>↑ 7.3× rate</span>
      </div>
    </div>
  );
};

const AlbedoPanel = () => {
  const D = window.PBP_DATA;
  const data = D.ALBEDO_TREND;
  const w = 280, h = 96;
  const min = Math.min(...data) - 0.05;
  const max = Math.max(...data) + 0.02;
  const sx = (i) => (i / (data.length - 1)) * w;
  const sy = (v) => h - ((v - min) / (max - min)) * h;

  return (
    <div className="panel">
      <h4>Snow albedo · June</h4>
      <div className="lede">Reflectance · Svalbard mean · {D.ALBEDO_LABEL} · MOSJ</div>
      <div className="chart" style={{ marginTop: 6, position: "relative" }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block", height:"100%"}}>
          {/* gradient fill from white (high albedo) to dark (low albedo) */}
          <defs>
            <linearGradient id="albg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <path d={`${data.map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ")} L ${w} ${h} L 0 ${h} Z`}
            fill="url(#albg)" />
          <path d={data.map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ")}
            fill="none" stroke="var(--ink)" strokeWidth="1.4" />
          {data.map((v, i) => (
            <circle key={i} cx={sx(i)} cy={sy(v)} r="1.4"
              fill={v > 0.7 ? "var(--ink)" : v > 0.6 ? "var(--ink-2)" : "var(--accent)"} />
          ))}
        </svg>
        <div className="chart-tl">{max.toFixed(2)}</div>
        <div className="chart-bl">{min.toFixed(2)}</div>
        <div className="chart-br">2025</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--mono)" }}>0.78 → 0.52</span>
        <span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>−33% reflectance</span>
      </div>
    </div>
  );
};

window.SeaIcePanel = SeaIcePanel;
window.GlacierPanel = GlacierPanel;
window.AlbedoPanel = AlbedoPanel;
