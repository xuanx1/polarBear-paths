/* App.jsx — root */
/* global React, ReactDOM, PBP_DATA, PBPMap, LeftPanel, RightPanel, SeaIcePanel, GlacierPanel, AlbedoPanel, useTweaks, TweaksPanel, TweakSection, TweakRadio */

const { useState, useEffect: useEffectA, useRef: useRefA } = React;

// Inline settings flyout — sits inside the viz instead of as a side panel.
function SettingsFlyout({ tweaks, setTweak }) {
  const [open, setOpen] = useState(false);
  const ref = useRefA(null);
  useEffectA(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const Group = ({ label, value, onChange, options }) => (
    <div className="sf-group">
      <div className="sf-label">{label}</div>
      <div className="sf-segs">
        {options.map(o => (
          <button key={o.value}
            className={"sf-seg " + (value === o.value ? "is-on" : "")}
            onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sf-root" ref={ref}>
      <button className={"sf-trigger " + (open ? "is-open" : "")} onClick={() => setOpen(o => !o)} aria-label="Settings">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 1v1.6M7 11.4V13M1 7h1.6M11.4 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <span>Visualisation Settings</span>
      </button>
      {open && (
        <div className="sf-panel">
          <div className="sf-head">Visualization settings</div>
          <Group label="Palette" value={tweaks.palette} onChange={v => setTweak("palette", v)}
            options={[{label:"Ice",value:"ice"},{label:"Warm",value:"warm"},{label:"Dark",value:"dark"}]} />
          <Group label="Time of day" value={tweaks.tod} onChange={v => setTweak("tod", v)}
            options={[{label:"Day",value:"day"},{label:"Dusk",value:"dusk"},{label:"Night",value:"night"}]} />
          <Group label="Risk viz" value={tweaks.riskViz} onChange={v => setTweak("riskViz", v)}
            options={[{label:"Heatmap",value:"heatmap"},{label:"Contours",value:"contours"},{label:"Pulses",value:"pulses"}]} />
          <Group label="Reroute" value={tweaks.reroutePresentation} onChange={v => setTweak("reroutePresentation", v)}
            options={[{label:"Split",value:"split"},{label:"Overlay",value:"overlay"},{label:"Before/after",value:"before-after"}]} />
          <Group label="Density" value={tweaks.density} onChange={v => setTweak("density", v)}
            options={[{label:"Sparse",value:"sparse"},{label:"Standard",value:"standard"},{label:"Dense",value:"dense"}]} />
        </div>
      )}
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tod": "day",
  "density": "standard",
  "riskViz": "heatmap",
  "palette": "ice",
  "reroutePresentation": "split",
  "showProposed": false
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [layers, setLayers] = useState({
    ice: true, glaciers: true, lanes: true, vessels: true, bears: true, risk: true,
  });
  const [bufferKm, setBufferKm] = useState(25);
  const [selection, setSelection] = useState(() => ({
    kind: "vessel",
    id: (window.PBP_DATA && window.PBP_DATA.REROUTE && window.PBP_DATA.REROUTE.vessel_id) || "CRU-MORTM",
  }));
  const [hoveredEnc, setHoveredEnc] = useState(null);
  const [timeIdx, setTimeIdx] = useState(8);
  const [iceFrameIdx, setIceFrameIdx] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [showProposed, setShowProposed] = useState(false);
  // Bumped each time A* finishes recomputing, so map + panels re-render
  // against the freshly-mutated PBP_DATA.VESSELS / REROUTE.
  const [rerouteVersion, setRerouteVersion] = useState(0);
  const [rerouting, setRerouting] = useState(false);

  // Recompute reroutes when the wildlife buffer or the time scrubber changes.
  // The reroute starts from the vessel's CURRENT position (timeIdx/23 along
  // its lane), so as time advances the proposed detour begins where the ship
  // actually is. Debounced — A* across all candidates takes ~1–2 s.
  useEffectA(() => {
    if (!window.PBP_GEO || !window.PBP_GEO.recomputeReroutes) return;
    const t = setTimeout(() => {
      setRerouting(true);
      requestAnimationFrame(() => {
        try {
          window.PBP_GEO.recomputeReroutes(bufferKm, 10, timeIdx / 23);
        } finally {
          setRerouting(false);
          setRerouteVersion(v => v + 1);
        }
      });
    }, 350);
    return () => clearTimeout(t);
  }, [bufferKm, timeIdx]);

  useEffectA(() => {
    document.body.dataset.palette = tweaks.palette;
    document.body.dataset.tod = tweaks.tod;
    document.body.dataset.density = tweaks.density;
  }, [tweaks.palette, tweaks.tod, tweaks.density]);

  useEffectA(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTimeIdx(t => (t + 1) % 24);
    }, 600);
    return () => clearInterval(id);
  }, [playing]);

  const D = window.PBP_DATA;

  const formatT = (h) => {
    const now = new Date("2025-03-15T08:00:00Z");
    const t = new Date(now.getTime() + h * 3600 * 1000);
    return t.toISOString().slice(11, 16) + " UTC";
  };

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand">
          <div className="mark"></div>
          <div>
            <div className="name">PolarBearPaths</div>
            <div className="sub">Polar Bear Risk</div>
          </div>
        </div>
        <div className="crumbs">
          <span>Region · <b>Svalbard / Barents</b></span>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span>Mode · <b>Forecast (24h)</b></span>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span>Operator · <b>National Wildlife Lab</b></span>
        </div>
        <div className="meta">
          <div>
            <div className="lbl">Time</div>
            <div className="val">{formatT(timeIdx)}</div>
          </div>
          <div>
            <div className="lbl">Active alerts</div>
            <div className="val alert">{D.ENCOUNTERS.length}</div>
          </div>
          <div>
            <div className="lbl">Bears collared</div>
            <div className="val">{D.BEARS.length}</div>
          </div>
          <div>
            <div className="lbl">Vessels in AOI</div>
            <div className="val">{D.VESSELS.length}</div>
          </div>
        </div>
      </div>

      <LeftPanel
        layers={layers}
        setLayers={setLayers}
        bufferKm={bufferKm}
        setBufferKm={setBufferKm}
        bears={D.BEARS}
        encounters={D.ENCOUNTERS}
        selection={selection}
        setSelection={setSelection}
        setHoveredEnc={setHoveredEnc}
      />

      <PBPMap
        tweaks={tweaks}
        setTweak={setTweak}
        layers={layers}
        bufferKm={bufferKm}
        selection={selection}
        setSelection={setSelection}
        hoveredEnc={hoveredEnc}
        timeIdx={timeIdx}
        setTimeIdx={setTimeIdx}
        playing={playing}
        setPlaying={setPlaying}
        iceFrameIdx={iceFrameIdx}
        showProposed={showProposed}
      />

      <RightPanel
        selection={selection}
        setSelection={setSelection}
        showProposed={showProposed}
        setShowProposed={setShowProposed}
        reroutePresentation={tweaks.reroutePresentation}
      />

      {/* BOTTOM panels */}
      <div className="bottom">
        <SeaIcePanel iceFrameIdx={iceFrameIdx} setIceFrameIdx={setIceFrameIdx} />
        <GlacierPanel />
        <AlbedoPanel />
      </div>

      {/* SettingsFlyout is now rendered inside PBPMap (bottom-left, on top of the scale) */}

      {/* Tweaks (also exposed via toolbar toggle) */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Palette">
          <TweakRadio
            value={tweaks.palette}
            onChange={(v) => setTweak("palette", v)}
            options={[
              { label: "Ice", value: "ice" },
              { label: "Warm", value: "warm" },
              { label: "Dark ops", value: "dark" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Time of day">
          <TweakRadio
            value={tweaks.tod}
            onChange={(v) => setTweak("tod", v)}
            options={[
              { label: "Day", value: "day" },
              { label: "Dusk", value: "dusk" },
              { label: "Night", value: "night" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Risk visualization">
          <TweakRadio
            value={tweaks.riskViz}
            onChange={(v) => setTweak("riskViz", v)}
            options={[
              { label: "Heatmap", value: "heatmap" },
              { label: "Contours", value: "contours" },
              { label: "Pulses", value: "pulses" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Reroute presentation">
          <TweakRadio
            value={tweaks.reroutePresentation}
            onChange={(v) => setTweak("reroutePresentation", v)}
            options={[
              { label: "Split", value: "split" },
              { label: "Overlay", value: "overlay" },
              { label: "Before/after", value: "before-after" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
            options={[
              { label: "Sparse", value: "sparse" },
              { label: "Standard", value: "standard" },
              { label: "Dense", value: "dense" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
