/* Map.jsx — Stylized polar-projection map for PolarBearPaths */
/* global React, PBP_DATA */

const { useState, useEffect, useRef, useMemo } = React;

const PBPMap = ({
  tweaks,
  setTweak,       // for the in-map settings flyout
  layers,
  bufferKm,
  selection,
  setSelection,
  hoveredEnc,
  timeIdx,        // 0..23 (hours from now)
  setTimeIdx,     // scrubber control
  playing,        // play/pause state
  setPlaying,     // toggle for play button
  iceFrameIdx,    // 0..3
  showProposed,   // bool — show reroute proposed path
}) => {
  const D = window.PBP_DATA;
  const VBW = 1000, VBH = 1000;
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

  const handleEnter = (e, html) => {
    const r = wrapRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left + 14, y: e.clientY - r.top + 14, html });
  };
  const handleMove = (e) => {
    if (!tip) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTip(t => ({ ...t, x: e.clientX - r.left + 14, y: e.clientY - r.top + 14 }));
  };
  const handleLeave = () => setTip(null);

  // Interpolate position along a polyline at fraction t∈[0,1] of arc length.
  // Returns { pos: [x,y], heading: degrees } where heading is the local segment
  // direction at that point — so map markers can rotate to face their travel.
  const posAndHeadingAlong = (path, t) => {
    if (!path || path.length === 0) return { pos: [0, 0], heading: 0 };
    if (path.length === 1) return { pos: path[0], heading: 0 };
    const total = path.length - 1;
    const f = Math.min(Math.max(t, 0), 1) * total;
    const i = Math.min(Math.floor(f), total - 1);
    const k = f - i;
    const a = path[i], b = path[i + 1];
    const pos = [a[0] * (1 - k) + b[0] * k, a[1] * (1 - k) + b[1] * k];
    // SVG y-axis points DOWN, so for compass-style rotation (0=up, 90=right):
    // heading = atan2(dx, -dy)
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const heading = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return { pos, heading };
  };
  const vesselPos = (v) => posAndHeadingAlong(v.path, timeIdx / 23).pos;
  const vesselHeading = (v) => posAndHeadingAlong(v.path, timeIdx / 23).heading;
  const bearPos = (b) => posAndHeadingAlong(b.forecast, timeIdx / 23).pos;
  const bearHeading = (b) => posAndHeadingAlong(b.forecast, timeIdx / 23).heading;

  // Risk overlay: gradient circles around bears
  const bufferPx = (bufferKm / 25) * 38; // ~25km nominal -> 38px

  // Pan + zoom — viewBox manipulation, constrained so the visible window
  // can never leave the [0,0]–[VBW,VBH] map content area.
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef(null);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const vbW = VBW / view.zoom, vbH = VBH / view.zoom;
  const onPanDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, rect: e.currentTarget.getBoundingClientRect() };
  };
  const onPanMove = (e) => {
    handleMove(e);
    if (!dragRef.current) return;
    const d = dragRef.current;
    const k = vbW / d.rect.width;  // px → viewBox units
    const nx = clamp(d.vx - (e.clientX - d.sx) * k, 0, VBW - vbW);
    const ny = clamp(d.vy - (e.clientY - d.sy) * k, 0, VBH - vbH);
    setView(v => ({ ...v, x: nx, y: ny }));
  };
  const onPanUp = () => { dragRef.current = null; };
  const onWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setView(v => {
      const newZoom = clamp(v.zoom * (e.deltaY < 0 ? 1.15 : 0.87), 1, 8);
      if (newZoom === v.zoom) return v;
      const oldVbW = VBW / v.zoom, oldVbH = VBH / v.zoom;
      const cx = v.x + fx * oldVbW, cy = v.y + fy * oldVbH;
      const nVbW = VBW / newZoom, nVbH = VBH / newZoom;
      return {
        zoom: newZoom,
        x: clamp(cx - fx * nVbW, 0, VBW - nVbW),
        y: clamp(cy - fy * nVbH, 0, VBH - nVbH),
      };
    });
  };
  const onPanLeave = () => { handleLeave(); dragRef.current = null; };

  return (
    <div className="map-wrap" ref={wrapRef} onMouseLeave={onPanLeave}>
      <svg
        className="map"
        viewBox={`${view.x} ${view.y} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid slice"
        onMouseDown={onPanDown}
        onMouseMove={onPanMove}
        onMouseUp={onPanUp}
        onWheel={onWheel}
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
      >
        <defs>
          {/* sea texture */}
          <pattern id="seaGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="var(--sea)" />
            <path d="M40 0 L0 0 0 40" fill="none" stroke="var(--sea-deep)" strokeWidth="0.4" opacity="0.4" />
          </pattern>
          <pattern id="iceHatch" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="6" height="6" fill="var(--ice)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ice-edge)" strokeWidth="0.5" opacity="0.7" />
          </pattern>
          <pattern id="glacierHatch" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
            <rect width="5" height="5" fill="var(--glacier)" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--glacier-edge)" strokeWidth="0.6" />
          </pattern>
          <pattern id="landDots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="var(--land)" />
            <circle cx="5" cy="5" r="0.6" fill="var(--land-edge)" opacity="0.5" />
          </pattern>

          <radialGradient id="riskHeat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--risk-high)" stopOpacity="0.5" />
            <stop offset="55%" stopColor="var(--risk-mid)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--risk-low)" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="seaVignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="var(--sea)" />
            <stop offset="100%" stopColor="var(--sea-deep)" />
          </radialGradient>

          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
          </filter>
        </defs>

        {/* SEA */}
        <rect x="0" y="0" width={VBW} height={VBH} fill="url(#seaVignette)" />
        <rect x="0" y="0" width={VBW} height={VBH} fill="url(#seaGrid)" opacity="0.5" />

        {/* GRATICULE — polar projection lines */}
        <g opacity="0.35" stroke="var(--ink-3)" strokeWidth="0.4" fill="none">
          {[1,2,3,4,5,6].map(i => (
            <circle key={i} cx={500} cy={500} r={i * 80} strokeDasharray="2 4" />
          ))}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
            const r = 480;
            const rad = (deg - 90) * Math.PI / 180;
            const x = 500 + Math.cos(rad) * r;
            const y = 500 + Math.sin(rad) * r;
            return <line key={deg} x1={500} y1={500} x2={x} y2={y} strokeDasharray="2 4" />;
          })}
        </g>

        {/* SEA ICE EXTENT */}
        {layers.ice && (
          <g>
            <path
              d={D.ICE_FRAMES[iceFrameIdx].path}
              fill="url(#iceHatch)"
              fillOpacity="0.55"
              stroke="var(--ice-edge)"
              strokeWidth="0.8"
              className="driftN"
            />
            {/* historic outline (faint) */}
            <path
              d={D.ICE_FRAMES[0].path}
              fill="none"
              stroke="var(--ice-edge)"
              strokeWidth="0.6"
              strokeDasharray="3 4"
              opacity="0.5"
            />
          </g>
        )}

        {/* LAND */}
        <g>
          {D.LAND.map((d, i) => (
            <path key={i} d={d}
              fill="url(#landDots)"
              stroke="var(--land-edge)"
              strokeWidth="0.8"
            />
          ))}
        </g>

        {/* GLACIERS */}
        {layers.glaciers && (
          <g>
            {/* Background CryoClim glaciers — every Svalbard tidewater + >30 km² polygon */}
            <g opacity="0.45">
              {(D.GLACIERS_BG || []).map(g => (
                <path key={g.ident} d={g.path}
                  fill="url(#glacierHatch)"
                  stroke="var(--glacier-edge)"
                  strokeWidth="0.4"
                  fillOpacity="0.7"
                />
              ))}
            </g>
            {/* Featured glaciers (retreat panel) — full opacity, hover tooltip */}
            {D.GLACIERS.map(g => (
              <g key={g.id}>
                <path d={g.path}
                  fill="url(#glacierHatch)"
                  stroke="var(--glacier-edge)"
                  strokeWidth="0.7"
                  onMouseEnter={(e) => handleEnter(e, (
                    <span><b>{g.name}</b><small>{g.retreat_note || (g.real ? "CryoClim outline" : "")}</small></span>
                  ))}
                  onMouseLeave={handleLeave}
                />
              </g>
            ))}
          </g>
        )}

        {/* SHIPPING LANES */}
        {layers.lanes && (
          <g>
            {/* EMODnet 2024 vessel-density envelopes — corridor (faint) under major (stronger) */}
            {D.LANE_DENSITY && (
              <g style={{ pointerEvents: "none" }}>
                {(D.LANE_DENSITY.corridor || []).map((p, i) => (
                  <path key={`c${i}`} d={p.path}
                    fill="var(--lane)" fillOpacity="0.08"
                    stroke="var(--lane)" strokeWidth="0.4" strokeOpacity="0.25"
                  />
                ))}
                {(D.LANE_DENSITY.major || []).map((p, i) => (
                  <path key={`m${i}`} d={p.path}
                    fill="var(--lane)" fillOpacity="0.18"
                    stroke="var(--lane)" strokeWidth="0.6" strokeOpacity="0.5"
                  />
                ))}
              </g>
            )}
            {D.LANES.map(l => {
              const t = l.type || "all";
              const dash = t === "fishing" ? "2 4" : t === "passenger" ? "1 3" : "6 4";
              const w    = t === "passenger" ? 1.0 : t === "fishing" ? 1.0 : 1.4;
              const op   = t === "all" ? 0.65 : 0.55;
              const desc = t === "fishing" ? "fishing corridor"
                         : t === "passenger" ? "cruise corridor"
                         : "commercial corridor";
              return (
                <path key={l.id} d={l.d}
                  fill="none"
                  stroke="var(--lane)"
                  strokeWidth={w}
                  strokeDasharray={dash}
                  opacity={op}
                  onMouseEnter={(e) => handleEnter(e, (
                    <span><b>{l.name}</b><small>{desc} · {l.length_km ? `${l.length_km} km` : "EMODnet 2024"}</small></span>
                  ))}
                  onMouseLeave={handleLeave}
                />
              );
            })}
          </g>
        )}

        {/* RISK VIZ — heatmap mode */}
        {layers.risk && tweaks.riskViz === "heatmap" && (
          <g>
            {D.BEARS.map(b => {
              const [x, y] = bearPos(b);
              const r = bufferPx * (1 + b.stress_idx * 1.4);
              return (
                <circle key={b.id} cx={x} cy={y} r={r}
                  fill="url(#riskHeat)"
                  style={{ mixBlendMode: "multiply" }}
                />
              );
            })}
          </g>
        )}

        {/* RISK VIZ — contours mode */}
        {layers.risk && tweaks.riskViz === "contours" && (
          <g>
            {D.BEARS.map(b => {
              const [x, y] = bearPos(b);
              const r = bufferPx * (1 + b.stress_idx * 1.4);
              return [0.4, 0.7, 1.0].map((k, i) => (
                <circle key={`${b.id}-${i}`} cx={x} cy={y} r={r * k}
                  fill="none"
                  stroke={i === 2 ? "var(--risk-high)" : i === 1 ? "var(--risk-mid)" : "var(--risk-low)"}
                  strokeWidth="0.7"
                  opacity={0.7 - i * 0.15}
                  strokeDasharray={i === 2 ? "4 3" : "2 2"}
                />
              ));
            })}
          </g>
        )}

        {/* RISK VIZ — pulses mode */}
        {layers.risk && tweaks.riskViz === "pulses" && (
          <g>
            {D.BEARS.filter(b => b.stress_idx > 0.5).map(b => {
              const [x, y] = bearPos(b);
              const r = bufferPx * (0.8 + b.stress_idx);
              return (
                <g key={b.id}>
                  <circle cx={x} cy={y} r={r}
                    fill="none" stroke="var(--risk-high)" strokeWidth="0.8"
                    className="pulse-circle"
                    style={{ animationDelay: `${(b.id.charCodeAt(2) % 5) * 0.4}s` }}
                  />
                  <circle cx={x} cy={y} r={r * 0.6}
                    fill="var(--risk-high)" opacity="0.08"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* SHIPPING — current vessels with paths */}
        {layers.vessels && (
          <g>
            {D.VESSELS.map(v => {
              const [vx, vy] = vesselPos(v);
              // Each vessel carries its own A* reroute when one is useful.
              // Paint the green proposed line only for the currently-selected
              // vessel that has a useful detour, so the map doesn't get
              // cluttered with multiple greens at once.
              const hasOwnReroute = v.reroute && v.reroute.useful;
              const isSelected = selection?.kind === "vessel" && selection.id === v.id;
              const isReroute = hasOwnReroute && isSelected;
              const showOriginal = !showProposed || !isReroute;
              const pathD = isReroute && showProposed
                ? v.reroute.proposed.path
                : v.path;
              const dStr = pathD.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

              return (
                <g key={v.id}>
                  {/* original (faded if reroute shown) */}
                  {isReroute && showProposed && (
                    <path d={v.path.map((p,i)=>`${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ")}
                      fill="none"
                      stroke="var(--risk-high)"
                      strokeWidth="1.4"
                      strokeDasharray="3 4"
                      opacity="0.55"
                    />
                  )}
                  {/* live path */}
                  <path d={dStr}
                    fill="none"
                    stroke={isReroute && showProposed ? "var(--good)" : "var(--vessel-track)"}
                    strokeWidth="1.6"
                    strokeDasharray="0"
                    opacity="0.9"
                  />
                  {/* path waypoints */}
                  {pathD.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={isReroute && showProposed ? "var(--good)" : "var(--vessel)"} opacity="0.8" />
                  ))}
                  {/* vessel marker — heading derived from local path segment */}
                  <g
                    transform={`translate(${vx},${vy}) rotate(${vesselHeading(v)})`}
                    className="vessel-marker"
                    onClick={() => setSelection({ kind: "vessel", id: v.id })}
                    onMouseEnter={(e) => handleEnter(e, (
                      <span><b>{v.name}</b><small>{v.type} · {v.speed_kn} kn · heading {Math.round(vesselHeading(v))}°</small></span>
                    ))}
                    onMouseLeave={handleLeave}
                  >
                    {/* vessel hull silhouette */}
                    <path d="M 0 -10 L 5 -2 L 5 8 L -5 8 L -5 -2 Z"
                      fill={isReroute && showProposed ? "var(--good)" : "var(--vessel)"}
                      stroke="var(--paper)" strokeWidth="0.8"
                    />
                    {/* wake */}
                    <path d="M -3 8 Q -1 16 -4 22 M 3 8 Q 1 16 4 22"
                      fill="none" stroke="var(--vessel)" strokeWidth="0.6" opacity="0.5"
                    />
                  </g>
                  {/* selection ring */}
                  {selection?.kind === "vessel" && selection.id === v.id && (
                    <circle cx={vx} cy={vy} r="18" className="selection-ring" />
                  )}
                  {/* label */}
                  <text x={vx + 14} y={vy + 4}
                    fontFamily="var(--mono)" fontSize="9.5" fill="var(--ink-2)"
                    style={{ pointerEvents: "none" }}
                  >{v.id}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* BEARS */}
        {layers.bears && (
          <g>
            {D.BEARS.map(b => {
              const [bx, by] = bearPos(b);
              const isSel = selection?.kind === "bear" && selection.id === b.id;
              const isHL = hoveredEnc && hoveredEnc.bear === b.id;
              return (
                <g key={b.id}>
                  {/* track (past) */}
                  <path d={b.track.map((p,i)=>`${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ")}
                    fill="none" stroke="var(--bear-track)" strokeWidth="0.9"
                    strokeDasharray="1.5 2" opacity="0.4"
                  />
                  {/* forecast (future) */}
                  <path d={b.forecast.map((p,i)=>`${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ")}
                    fill="none" stroke="var(--bear-track)" strokeWidth="0.7"
                    strokeDasharray="3 4" opacity="0.65"
                  />
                  {/* bear paw glyph — rotated to face the bear's travel direction */}
                  <g transform={`translate(${bx},${by}) rotate(${bearHeading(b)})`}
                    className="bear-marker"
                    onClick={() => setSelection({ kind: "bear", id: b.id })}
                    onMouseEnter={(e) => handleEnter(e, (
                      <span><b>{b.name}</b> · {b.id}<small>BCI {b.condition} · stress {(b.stress_idx*100).toFixed(0)}%</small></span>
                    ))}
                    onMouseLeave={handleLeave}
                  >
                    {/* invisible hit-target so hover area covers the paw */}
                    <circle cx="0" cy="0" r="8" fill="transparent" />
                    {/* paw print — wrapped in .bear-glyph so :hover scales it without inflating the hit area */}
                    <g className="bear-glyph">
                      <ellipse cx="0" cy="2" rx="3.6" ry="3.2" fill="var(--bear)" />
                      <ellipse cx="-3.4" cy="-2.4" rx="1.4" ry="1.6" fill="var(--bear)" />
                      <ellipse cx="-1.2" cy="-4.4" rx="1.3" ry="1.5" fill="var(--bear)" />
                      <ellipse cx="1.4"  cy="-4.4" rx="1.3" ry="1.5" fill="var(--bear)" />
                      <ellipse cx="3.6" cy="-2.4" rx="1.4" ry="1.6" fill="var(--bear)" />
                    </g>
                  </g>
                  {(isSel || isHL) && (
                    <circle cx={bx} cy={by} r="14" className="selection-ring" />
                  )}
                  {/* bear name label */}
                  <text x={bx + 8} y={by + 3}
                    fontFamily="var(--serif)" fontSize="10" fill="var(--ink)"
                    fontStyle="italic"
                    style={{ pointerEvents: "none" }}
                  >{b.name}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* Place labels */}
        <g style={{ pointerEvents: "none" }} fontFamily="var(--serif)" fill="var(--ink-2)">
          <text x="430" y="350" fontSize="13" fontStyle="italic" letterSpacing="0.2">Spitsbergen</text>
          <text x="600" y="248" fontSize="11" fontStyle="italic">Nordaustlandet</text>
          <text x="610" y="450" fontSize="10" fontStyle="italic">Edgeøya</text>
          <text x="412" y="800" fontSize="9" fontStyle="italic">Bjørnøya</text>
          <text x="160" y="80" fontSize="11" fontStyle="italic" opacity="0.6">Greenland Sea</text>
          <text x="780" y="80" fontSize="11" fontStyle="italic" opacity="0.6">Barents Sea</text>
          <text x="450" y="940" fontSize="11" fontStyle="italic" opacity="0.6">Norwegian Sea</text>
        </g>

        {/* film grain */}
        <rect x="0" y="0" width={VBW} height={VBH} filter="url(#grain)" pointerEvents="none" />
      </svg>

      {/* Map overlays */}
      <div className="map-overlay-tl">
        <div style={{ fontWeight: 600, color: "var(--ink)", letterSpacing: "0.16em", marginBottom: 4 }}>BARENTS · SVALBARD</div>
        <div>76°N–81°N · 10°E–35°E</div>
        <div>polar stereographic · {D.ICE_FRAMES[iceFrameIdx].label}</div>
      </div>
      <div className="map-overlay-tr compass">
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>T+{String(timeIdx).padStart(2,"0")}h</div>
          <div>forecast horizon · 24h</div>
        </div>
        <svg className="rose" viewBox="0 0 40 40" width="38" height="38" aria-label="compass rose">
          {/* outer ring */}
          <circle cx="20" cy="20" r="17.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.7"/>
          {/* 8-point rose face — light guide lines */}
          <g stroke="var(--ink-3)" strokeWidth="0.35" fill="none" opacity="0.9">
            <line x1="20" y1="3" x2="20" y2="37"/>
            <line x1="3" y1="20" x2="37" y2="20"/>
            <line x1="8" y1="8" x2="32" y2="32"/>
            <line x1="32" y1="8" x2="8" y2="32"/>
          </g>
          {/* tick marks at the 4 cardinals */}
          <g stroke="var(--ink)" strokeWidth="0.9" strokeLinecap="round">
            <line x1="20" y1="3.5" x2="20" y2="6.5"/>
            <line x1="20" y1="33.5" x2="20" y2="36.5"/>
            <line x1="3.5" y1="20" x2="6.5" y2="20"/>
            <line x1="33.5" y1="20" x2="36.5" y2="20"/>
          </g>
          {/* needle — N half (accent) and S half (ink) form a diamond */}
          <polygon points="20,5 17.5,20 20,19" fill="var(--accent)"/>
          <polygon points="20,5 22.5,20 20,19" fill="var(--accent)" opacity="0.55"/>
          <polygon points="20,35 17.5,20 20,21" fill="var(--ink-2)" opacity="0.85"/>
          <polygon points="20,35 22.5,20 20,21" fill="var(--ink-2)" opacity="0.55"/>
          {/* hub */}
          <circle cx="20" cy="20" r="1.4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.7"/>
          {/* N letter at the top, just inside the ring */}
          <text x="20" y="13" fontFamily="var(--serif)" fontSize="5.5" fontWeight="700"
                textAnchor="middle" fill="var(--ink)">N</text>
        </svg>
      </div>
      <div className="map-overlay-bl-stack">
        {/* Settings flyout sits on top of the scale — same width column */}
        {setTweak && <SettingsFlyout tweaks={tweaks} setTweak={setTweak} />}
        {/* Scale */}
        <div className="scale-row">
          <div style={{ marginBottom: 4 }}>SCALE</div>
          <svg width="100%" height="14" viewBox="0 0 200 14" preserveAspectRatio="none">
            <line x1="2" y1="9" x2="198" y2="9" stroke="var(--ink-2)" strokeWidth="1" />
            <line x1="2" y1="5" x2="2" y2="13" stroke="var(--ink-2)" strokeWidth="1" />
            <line x1="100" y1="5" x2="100" y2="13" stroke="var(--ink-2)" strokeWidth="1" />
            <line x1="198" y1="5" x2="198" y2="13" stroke="var(--ink-2)" strokeWidth="1" />
            <text x="2" y="4" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">0</text>
            <text x="92" y="4" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">100</text>
            <text x="180" y="4" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">200 km</text>
          </svg>
        </div>
      </div>
      <div className="map-overlay-br-stack">
        {/* Time scrubber — sits directly above the chip bar, same width */}
        <div className="scrubber-inline">
          <button className="play" onClick={() => setPlaying && setPlaying(p => !p)} aria-label="play">
            {playing ? (
              <svg width="9" height="11" viewBox="0 0 10 12"><rect x="1" y="1" width="3" height="10" fill="var(--ink)"/><rect x="6" y="1" width="3" height="10" fill="var(--ink)"/></svg>
            ) : (
              <svg width="9" height="11" viewBox="0 0 10 12"><polygon points="1,1 9,6 1,11" fill="var(--ink)"/></svg>
            )}
          </button>
          <div className="now">T+{String(timeIdx).padStart(2,"0")}h</div>
          <input type="range" min="0" max="23" value={timeIdx} onChange={(e) => setTimeIdx && setTimeIdx(+e.target.value)} />
          <div className="lbl">+24h</div>
        </div>
        {/* Counts chip bar */}
        <div className="chip-row">
          <span className="chip"><i style={{background:"var(--bear)", borderRadius:"50%"}}></i>Bears: {D.BEARS.length}</span>
          <span className="chip"><i style={{background:"var(--vessel)"}}></i>Vessels: {D.VESSELS.length}</span>
          <span className="chip"><i style={{background:"var(--risk-high)", opacity:0.4}}></i>Risk zones</span>
        </div>
      </div>

      {tip && (
        <div className="map-tip" style={{ left: tip.x, top: tip.y }}>{tip.html}</div>
      )}
    </div>
  );
};

window.PBPMap = PBPMap;
