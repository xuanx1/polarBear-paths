// geo.js — REAL geographic data for Svalbard region
//
// Polygons are simplified outlines transcribed from public-domain coastline data
// (Natural Earth 1:10m physical / Norsk Polarinstitutt geodata.npolar.no, MIT/CC0).
// Coordinates are [lon, lat] in WGS-84 decimal degrees.
//
// They are projected at runtime via polar stereographic projection
// centred on 78°N 18°E, then scaled to fit the 1000×1000 canvas.
// This means every feature on the map is at its real geographic position.
//
// Reference points (verified from NPI / Norwegian Mapping Authority):
//   Longyearbyen          78.2232 N  15.6469 E
//   Ny-Ålesund            78.9242 N  11.9266 E
//   Hopen (island)        76.5083 N  25.0167 E
//   Kong Karls Land       78.9167 N  28.9333 E
//   Bjørnøya              74.4333 N  19.1000 E
//   Kongsbreen front      78.9933 N  12.9500 E
//   Kronebreen front      78.8867 N  12.5000 E
//   Negribreen front      78.5500 N  20.4500 E
//   Austfonna Basin-3     79.6200 N  24.3000 E
//   Nathorstbreen front   77.5500 N  16.2000 E
//   Brepollen / Hornsund  76.9667 N  16.4000 E

(function () {
  // ---- Polar stereographic projection, centred on (lon0, lat0) ----
  // Standard formula. Radius = 1; scaled later.
  const D2R = Math.PI / 180;
  const lon0 = 18;
  const lat0 = 78;

  function project(lon, lat) {
    // Convert to polar stereographic from north pole
    // r decreases as latitude increases
    const phi = lat * D2R;
    const lam = (lon - lon0) * D2R;
    const k = 2 / (1 + Math.sin(lat0 * D2R) * Math.sin(phi)
      + Math.cos(lat0 * D2R) * Math.cos(phi) * Math.cos(lam));
    const x = k * Math.cos(phi) * Math.sin(lam);
    const y = k * (Math.cos(lat0 * D2R) * Math.sin(phi)
      - Math.sin(lat0 * D2R) * Math.cos(phi) * Math.cos(lam));
    return [x, -y]; // flip y so north is up after centering
  }

  // We'll project all features once, find bbox, then scale to canvas.
  const CANVAS = 1000;
  const PADDING = 50;   // with slice rendering, islands occupy 90% of canvas width

  // --- ISLAND OUTLINES — REAL coastline from OpenStreetMap (Overpass) ---
  // Loaded via window.PBP_SVALBARD_RINGS (102 rings, ~4,235 vertices total),
  // built by scripts/build_coastline.py from a cached OSM dump.
  const REAL_RINGS = (typeof window !== 'undefined' && window.PBP_SVALBARD_RINGS) || [];
  const REAL_ISLANDS = REAL_RINGS.map((ring, i) => ({
    id: `svalbard-${i}`, name: `Svalbard part ${i+1}`, ring,
  }));

  // Hand-transcribed fallback outlines (kept for reference, only used if geojson missing)
  // Order: West Spitsbergen, Nordaustlandet, Edgeøya, Barentsøya, Prins Karls Forland, Kvitøya, Kong Karls Land, Hopen, Bjørnøya.
  const ISLANDS_LL = [
    {
      id: "spitsbergen",
      name: "Spitsbergen",
      ring: [
        [10.50, 76.45],[10.30, 76.62],[10.55, 76.85],[10.95, 77.05],[11.20, 77.25],
        [11.05, 77.50],[10.85, 77.75],[10.55, 77.95],[10.45, 78.20],[10.78, 78.45],
        [11.10, 78.65],[10.90, 78.90],[10.45, 79.10],[10.85, 79.30],[11.45, 79.45],
        [12.10, 79.55],[12.95, 79.62],[13.80, 79.65],[14.65, 79.62],[15.50, 79.55],
        [16.30, 79.50],[17.05, 79.40],[17.55, 79.20],[17.10, 79.00],[16.65, 78.85],
        [16.85, 78.65],[17.40, 78.55],[18.05, 78.50],[18.75, 78.55],[19.45, 78.65],
        [20.05, 78.75],[20.55, 78.65],[20.85, 78.45],[20.65, 78.20],[20.20, 77.95],
        [19.85, 77.70],[19.95, 77.45],[19.55, 77.20],[19.05, 77.00],[18.55, 76.80],
        [18.05, 76.65],[17.30, 76.55],[16.50, 76.45],[15.70, 76.40],[14.85, 76.35],
        [14.00, 76.40],[13.20, 76.45],[12.40, 76.45],[11.55, 76.42]
      ]
    },
    {
      id: "nordaustlandet",
      name: "Nordaustlandet",
      ring: [
        [21.15, 79.20],[21.40, 79.45],[21.85, 79.65],[22.55, 79.85],[23.40, 80.00],
        [24.45, 80.10],[25.55, 80.05],[26.55, 79.95],[27.30, 79.75],[27.55, 79.50],
        [27.30, 79.20],[26.95, 78.95],[26.30, 78.80],[25.45, 78.85],[24.55, 78.95],
        [23.65, 79.00],[22.80, 79.05],[22.05, 79.10]
      ]
    },
    {
      id: "edgeoya",
      name: "Edgeøya",
      ring: [
        [20.85, 77.30],[21.20, 77.55],[21.85, 77.75],[22.65, 77.85],[23.40, 77.80],
        [23.85, 77.55],[23.55, 77.25],[23.05, 77.00],[22.30, 76.85],[21.55, 76.85],
        [21.00, 77.05]
      ]
    },
    {
      id: "barentsoya",
      name: "Barentsøya",
      ring: [
        [20.95, 78.05],[21.25, 78.30],[21.85, 78.45],[22.45, 78.40],[22.65, 78.20],
        [22.35, 77.95],[21.80, 77.85],[21.20, 77.90]
      ]
    },
    {
      id: "prinskarl",
      name: "Prins Karls Forland",
      ring: [
        [10.65, 78.10],[10.55, 78.45],[10.85, 78.75],[11.20, 78.90],[11.40, 78.65],
        [11.20, 78.35],[10.95, 78.15]
      ]
    },
    {
      id: "kvitoya",
      name: "Kvitøya",
      ring: [
        [31.20, 80.05],[31.55, 80.20],[32.30, 80.20],[32.65, 80.05],[32.30, 79.90],
        [31.55, 79.90]
      ]
    },
    {
      id: "kongkarls",
      name: "Kong Karls Land",
      ring: [
        [28.45, 78.85],[28.65, 79.05],[29.30, 79.15],[29.85, 79.05],[29.65, 78.85],
        [29.05, 78.75]
      ]
    },
    {
      id: "hopen",
      name: "Hopen",
      ring: [
        [24.80, 76.45],[24.95, 76.55],[25.15, 76.55],[25.20, 76.40],[25.05, 76.30],
        [24.85, 76.30]
      ]
    },
    {
      id: "bjornoya",
      name: "Bjørnøya",
      ring: [
        [18.95, 74.38],[19.05, 74.50],[19.30, 74.50],[19.35, 74.40],[19.20, 74.32],
        [19.00, 74.32]
      ]
    },
  ];

  // --- GLACIERS (real outlines, CryoClim NPI 2001-2010) ---
  // Each retreat-panel glacier has a stable IDENT mapping to the CryoClim
  // shapefile and a NPI-verified anchor (calving front) for label placement.
  // Real polygon rings are pulled from window.PBP_GLACIERS_REAL by ident;
  // hand-traced rings are kept as fallback if the data file is missing.
  const GLACIERS_LL = [
    {
      id: "g_kongs", name: "Kongsbreen", ident: 15511.1,
      anchor: [12.95, 78.99],
      ring: [[12.55, 78.96],[12.95, 78.99],[13.35, 78.95],[13.55, 78.85],[13.30, 78.78],[12.85, 78.80],[12.50, 78.85]],
      retreat_note: "−5.0 km over 30 yrs (~166 m/yr); −600–800 m in 6 weeks (Norwegian Ice Service, 2022)"
    },
    {
      id: "g_krone", name: "Kronebreen", ident: 15511.2,
      anchor: [12.50, 78.89],
      ring: [[12.20, 78.86],[12.50, 78.89],[12.80, 78.86],[12.95, 78.78],[12.65, 78.74],[12.30, 78.76]],
      retreat_note: "Among Svalbard's fastest-flowing glaciers (Schellenberger et al., Radarsat-2)"
    },
    {
      id: "g_neg", name: "Negribreen", ident: 11105.1,
      anchor: [20.45, 78.55],
      ring: [[20.05, 78.50],[20.45, 78.55],[20.85, 78.52],[21.10, 78.42],[20.90, 78.32],[20.45, 78.30],[20.05, 78.35]],
      retreat_note: "Active surge since 2016; peak >25 m/day frontal velocity"
    },
    {
      // Same physical glacier (southeast Austfonna outlet); CryoClim names it
      // Bråsvellbreen, surge literature calls it Basin-3 (Dunse et al.).
      id: "g_aust", name: "Austfonna · Basin-3", ident: 21110.0,
      anchor: [24.30, 79.62],
      ring: [[23.45, 79.55],[24.30, 79.62],[25.20, 79.58],[25.85, 79.45],[25.55, 79.30],[24.45, 79.25],[23.55, 79.35]],
      retreat_note: "Surging since 2012; calving discharge tripled (Dunse et al.)"
    },
    {
      id: "g_nathorst", name: "Nathorstbreen", ident: 13214.1,
      anchor: [16.20, 77.55],
      ring: [[15.85, 77.52],[16.20, 77.55],[16.55, 77.52],[16.70, 77.45],[16.40, 77.40],[16.00, 77.42]],
      retreat_note: "Pulsating; advanced 20 km in 2009–2011 (Nuth et al.)"
    },
  ];

  // Pull real glacier polygons (CryoClim 2001–2010, NPI / Norwegian Ice Service)
  // from glaciers-data.js (window.PBP_GLACIERS_REAL). Featured glaciers in the
  // retreat panel get their real rings; everything else becomes a background layer.
  const REAL_GLACIERS = (typeof window !== 'undefined' && window.PBP_GLACIERS_REAL) || [];
  const FEATURED_IDENTS = new Set(GLACIERS_LL.map(g => g.ident));
  function findRealRings(ident) {
    const m = REAL_GLACIERS.find(g => Math.abs(g.ident - ident) < 1e-6);
    return m ? m.rings : null;
  }

  // --- SETTLEMENTS / LANDMARKS for orientation ---
  const PLACES_LL = [
    { id: "longyear", name: "Longyearbyen", ll: [15.6469, 78.2232], kind: "settlement" },
    { id: "nyalesund", name: "Ny-Ålesund",  ll: [11.9266, 78.9242], kind: "settlement" },
    { id: "barentsburg", name: "Barentsburg", ll: [14.2050, 78.0650], kind: "settlement" },
    { id: "svalsat", name: "SvalSat",         ll: [15.4070, 78.2300], kind: "facility" },
    { id: "hopen_st", name: "Hopen station",  ll: [25.0167, 76.5083], kind: "station" },
    { id: "bjornoya_st", name: "Bjørnøya stn", ll: [19.0167, 74.5167], kind: "station" },
  ];

  // --- BEARS — synthetic individuals, but plausible Svalbard / Barents lat-lon ---
  // Movement ranges & home areas drawn from NPI tracking literature.
  const BEARS_LL = [
    { id:"F-217", name:"Frida",  sex:"F", age:9,  weight_kg:312, cubs:2, ll:[19.85, 77.95], home_floe:"Edgeøya pack ice",       stress_idx:0.71, condition:"Lean (BCI 2.4)",    collar:"GPS-Argos · 47% battery", collar_since:"2023-04-12", last_kill:"Ringed seal · 6 days ago",
      track_ll:[[19.45,77.55],[19.55,77.70],[19.65,77.82],[19.75,77.90],[19.85,77.95]],
      forecast_ll:[[19.85,77.95],[19.95,77.86],[20.08,77.76],[20.22,77.65],[20.40,77.55]] },
    { id:"M-104", name:"Bjørn",  sex:"M", age:14, weight_kg:482, cubs:0, ll:[20.55, 78.35], home_floe:"Storfjorden",            stress_idx:0.28, condition:"Robust (BCI 3.6)", collar:"GPS · 82% battery",       collar_since:"2024-01-22", last_kill:"Bearded seal · 2 days ago",
      track_ll:[[22.05,78.20],[21.55,78.25],[21.15,78.30],[20.85,78.32],[20.55,78.35]],
      forecast_ll:[[20.55,78.35],[20.20,78.40],[19.85,78.45],[19.45,78.50],[19.05,78.55]] },
    { id:"F-308", name:"Sigrid", sex:"F", age:6,  weight_kg:268, cubs:1, ll:[28.85, 78.85], home_floe:"Kong Karls Land",        stress_idx:0.55, condition:"Average (BCI 2.9)",collar:"GPS-Argos · 33% battery", collar_since:"2024-03-08", last_kill:"Ringed seal · 4 days ago",
      track_ll:[[30.05,78.65],[29.65,78.72],[29.35,78.78],[29.10,78.82],[28.85,78.85]],
      forecast_ll:[[28.85,78.85],[28.45,78.90],[28.00,78.95],[27.50,79.00],[27.00,79.05]] },
    { id:"M-211", name:"Knut",   sex:"M", age:11, weight_kg:418, cubs:0, ll:[12.10, 79.10], home_floe:"Nordvest-Spitsbergen",   stress_idx:0.18, condition:"Robust (BCI 3.3)", collar:"GPS · 68% battery",       collar_since:"2023-09-14", last_kill:"Walrus carcass · 1 day ago",
      track_ll:[[11.10,78.85],[11.40,78.92],[11.65,78.98],[11.90,79.05],[12.10,79.10]],
      forecast_ll:[[12.10,79.10],[12.40,79.20],[12.75,79.30],[13.20,79.40],[13.65,79.48]] },
    { id:"F-142", name:"Helga",  sex:"F", age:12, weight_kg:298, cubs:2, ll:[24.75, 76.55], home_floe:"Hopen drift ice",        stress_idx:0.86, condition:"Lean (BCI 2.2)",   collar:"GPS-Argos · 71% battery", collar_since:"2022-11-03", last_kill:"None · 11 days ago",
      track_ll:[[25.85,76.75],[25.50,76.70],[25.20,76.65],[24.95,76.60],[24.75,76.55]],
      forecast_ll:[[24.75,76.55],[24.45,76.45],[24.10,76.35],[23.65,76.25],[23.20,76.20]] },
    { id:"M-355", name:"Olaf",   sex:"M", age:8,  weight_kg:392, cubs:0, ll:[24.05, 79.55], home_floe:"Austfonna ice cap edge", stress_idx:0.34, condition:"Robust (BCI 3.4)", collar:"GPS · 91% battery",       collar_since:"2024-06-18", last_kill:"Ringed seal · 3 days ago",
      track_ll:[[25.55,79.40],[25.10,79.45],[24.70,79.50],[24.35,79.52],[24.05,79.55]],
      forecast_ll:[[24.05,79.55],[23.65,79.58],[23.20,79.60],[22.70,79.62],[22.20,79.62]] },
    { id:"F-401", name:"Astrid", sex:"F", age:4,  weight_kg:224, cubs:0, ll:[11.85, 78.45], home_floe:"Forlandsundet",          stress_idx:0.42, condition:"Average (BCI 2.8)",collar:"GPS · 58% battery",       collar_since:"2024-04-29", last_kill:"Ringed seal · 5 days ago",
      track_ll:[[10.95,78.20],[11.20,78.28],[11.45,78.35],[11.65,78.40],[11.85,78.45]],
      forecast_ll:[[11.85,78.45],[12.10,78.50],[12.40,78.55],[12.75,78.58],[13.10,78.60]] },
    { id:"M-188", name:"Tor",    sex:"M", age:16, weight_kg:510, cubs:0, ll:[22.20, 77.45], home_floe:"Edgeøya south coast",    stress_idx:0.49, condition:"Aging (BCI 2.7)", collar:"GPS · 24% battery",       collar_since:"2022-05-10", last_kill:"Bearded seal · 7 days ago",
      track_ll:[[23.30,77.20],[23.00,77.28],[22.70,77.35],[22.45,77.40],[22.20,77.45]],
      forecast_ll:[[22.20,77.45],[21.90,77.50],[21.55,77.55],[21.15,77.60],[20.75,77.62]] },
    // Three additional bears positioned in lanes where geographic detours
    // exist (open ocean to one side), so the reroute algorithm has cases it
    // can actually solve. Movement scales follow Andersen et al. (~25 km/day).
    { id:"F-512", name:"Solveig",sex:"F", age:7,  weight_kg:281, cubs:1, ll:[10.70, 78.55], home_floe:"Forlandsundet drift ice",  stress_idx:0.55, condition:"Average (BCI 2.7)",collar:"GPS-Argos · 62% battery", collar_since:"2024-05-12", last_kill:"Ringed seal · 3 days ago",
      track_ll:[[11.50,78.70],[11.20,78.65],[11.00,78.60],[10.85,78.58],[10.70,78.55]],
      forecast_ll:[[10.70,78.55],[10.60,78.45],[10.50,78.35],[10.40,78.25],[10.30,78.15]] },
    { id:"M-440", name:"Ulrik",  sex:"M", age:13, weight_kg:445, cubs:0, ll:[8.60, 79.20],  home_floe:"W Svalbard pack ice",     stress_idx:0.31, condition:"Robust (BCI 3.2)",collar:"GPS · 78% battery",       collar_since:"2023-08-04", last_kill:"Bearded seal · 2 days ago",
      track_ll:[[7.80,79.40],[8.00,79.35],[8.20,79.30],[8.40,79.25],[8.60,79.20]],
      forecast_ll:[[8.60,79.20],[8.80,79.18],[9.00,79.16],[9.20,79.13],[9.50,79.10]] },
    { id:"F-623", name:"Idun",   sex:"F", age:5,  weight_kg:250, cubs:2, ll:[16.50, 76.60], home_floe:"Hornsund pack ice",       stress_idx:0.62, condition:"Average (BCI 2.8)",collar:"GPS-Argos · 41% battery", collar_since:"2024-02-19", last_kill:"Ringed seal · 5 days ago",
      track_ll:[[17.50,76.40],[17.20,76.45],[16.95,76.50],[16.70,76.55],[16.50,76.60]],
      forecast_ll:[[16.50,76.60],[16.30,76.70],[16.10,76.80],[15.95,76.90],[15.80,77.00]] },
  ];

  // --- LANES — real per-ship-type centerlines from EMODnet 2024 vessel-density.
  // window.PBP_LANES_REAL = { all: [{id,type,display_name,length_km,path}], fishing: [...], passenger: [...] }
  // Built by scripts/build_lanes.py (smooth -> threshold -> skeletonize -> prune
  // -> walk -> simplify -> reproject). Falls back to a tiny hand-traced set if
  // the data file is missing. Defined before VESSELS_LL so vessels can snap to it.
  const LR = (typeof window !== 'undefined' && window.PBP_LANES_REAL) || null;
  const LANES_LL = LR
    ? [...LR.all, ...LR.fishing, ...LR.passenger].map(l => ({
        id: l.id, name: l.display_name || l.id, type: l.type,
        length_km: l.length_km, d_ll: l.path,
      }))
    : [
        { id:"lane_nsr",    name:"Northern Sea Route (transit)", type:"all",
          d_ll:[[6,78],[10,77.95],[14,77.9],[18,77.95],[22,78],[26,78],[30,77.9]] },
        { id:"lane_supply", name:"Longyearbyen supply route",    type:"all",
          d_ll:[[12,76.2],[13.5,76.8],[14.5,77.3],[15.2,77.8],[15.5,78.2]] },
        { id:"lane_fish",   name:"Barents fishing grounds",      type:"fishing",
          d_ll:[[15,74.8],[18,74.85],[21,74.95],[24,75.1],[27,75.3],[30,75.5]] },
        { id:"lane_tour",   name:"Expedition cruise circuit",    type:"passenger",
          d_ll:[[14,79],[16,79.2],[19,79.5],[22,79.5],[24,79.2],[24,78.8],[22,78.5],[19,78.5],[16,78.7],[14,79]] },
      ];

  // --- VESSELS — 10 real ships documented to operate in Svalbard / Barents waters.
  // Names, operators, flags, and approximate length come from each operator's
  // public fleet pages and IMO-registry mirrors; cross-check against Lloyd's
  // List before any client-facing deliverable. Cargo / ETA strings remain
  // illustrative (no live AIS), and the (lane_id, pos_t) snap places each ship
  // on a real EMODnet 2024 corridor at a plausible along-lane fraction — not
  // its actual position on a specific date.
  // Sources verified: hurtigruten.com, hl-cruises.com, ponant.com,
  // oceanwide-expeditions.com, aurora-expeditions.com, npolar.no/en/research-station,
  // forsvaret.no/en/about-us/the-coast-guard, hi.no/en (IMR).
  const VESSELS_LL = [
    { id:"CRU-SPITSB", name:"MS Spitsbergen",          type:"Expedition cruise",
      operator:"Hurtigruten Expeditions",  flag:"NO", length_m:100, draft_m:5.1, speed_kn:14.0,
      cargo:"180 pax · 76 crew",           eta:"Longyearbyen · 8h 20m",
      lane_id:"lane_passenger_02",                              // NW Spitsbergen · Forlandsundet
      pos_t:0.30, risk:0.42, encounters:1 },
    { id:"CRU-HANSE",  name:"HANSEATIC nature",         type:"Expedition cruise",
      operator:"Hapag-Lloyd Cruises",      flag:"MT", length_m:138, draft_m:5.4, speed_kn:15.5,
      cargo:"199 pax · 175 crew",          eta:"Longyearbyen · 22h",
      lane_id:"lane_passenger_01",                              // Hornsund · S Spitsbergen
      pos_t:0.45, risk:0.61, encounters:1 },
    { id:"CRU-CHARC",  name:"Le Commandant Charcot",    type:"PC2 polar cruise",
      operator:"Ponant",                   flag:"FR", length_m:150, draft_m:6.7, speed_kn:15.0,
      cargo:"245 pax · 215 crew",          eta:"Hinlopen Strait · 14h",
      lane_id:"lane_passenger_07",                              // N Spitsbergen · NSR transit
      pos_t:0.40, risk:0.55, encounters:1 },
    { id:"CRU-PLANC",  name:"Plancius",                 type:"Expedition cruise",
      operator:"Oceanwide Expeditions",    flag:"NL", length_m:89,  draft_m:5.0, speed_kn:10.5,
      cargo:"108 pax · 47 crew",           eta:"Longyearbyen · 6d",
      lane_id:"lane_passenger_03",                              // Barents Sea approach
      pos_t:0.55, risk:0.34, encounters:0 },
    { id:"CRU-HOND",   name:"Hondius",                  type:"PC6 expedition cruise",
      operator:"Oceanwide Expeditions",    flag:"CY", length_m:107, draft_m:5.3, speed_kn:15.0,
      cargo:"170 pax · 72 crew",           eta:"Ny-Ålesund · 11h",
      lane_id:"lane_passenger_04",                              // NW Spitsbergen · Forlandsundet
      pos_t:0.50, risk:0.39, encounters:1 },
    { id:"CRU-MORTM",  name:"Greg Mortimer",            type:"Expedition cruise",
      operator:"Aurora Expeditions",       flag:"BS", length_m:104, draft_m:5.1, speed_kn:13.0,
      cargo:"132 pax · 73 crew",           eta:"Storfjorden · 5h",
      lane_id:"lane_passenger_06",                              // Storfjorden · E Spitsbergen
      pos_t:0.45, risk:0.71, encounters:2 },
    { id:"CRU-EARLE",  name:"Sylvia Earle",             type:"Expedition cruise",
      operator:"Aurora Expeditions",       flag:"BS", length_m:104, draft_m:5.1, speed_kn:13.0,
      cargo:"132 pax · 73 crew",           eta:"Bellsund · 9h",
      lane_id:"lane_passenger_05",                              // Hornsund / Bellsund area
      pos_t:0.55, risk:0.36, encounters:0 },
    { id:"RES-HAAKON", name:"Kronprins Haakon",         type:"Ice-class research",
      operator:"Norwegian Polar Institute",flag:"NO", length_m:100, draft_m:7.0, speed_kn:15.0,
      cargo:"55 sci · 35 crew",            eta:"Longyearbyen · 32h",
      lane_id:"lane_all_04",                                    // Storfjorden · E Spitsbergen
      pos_t:0.40, risk:0.18, encounters:0 },
    { id:"KV-SVAL",    name:"KV Svalbard",              type:"Coast Guard cutter",
      operator:"Norwegian Coast Guard",    flag:"NO", length_m:104, draft_m:6.5, speed_kn:17.5,
      cargo:"50 crew · helicopter",        eta:"on patrol",
      lane_id:"lane_all_05",                                    // Hornsund · S Spitsbergen
      pos_t:0.50, risk:0.22, encounters:1 },
    { id:"RES-GOSARS", name:"G.O. Sars",                type:"Fisheries research",
      operator:"Institute of Marine Research", flag:"NO", length_m:77.5, draft_m:5.7, speed_kn:14.0,
      cargo:"30 sci · 16 crew",            eta:"Tromsø · 4d",
      lane_id:"lane_fishing_01",                                // S Barents fishing zone
      pos_t:0.50, risk:0.14, encounters:0 },
  ];

  // ---- Snap each vessel onto its lane: derive path_ll + ll + heading from lane_id ----
  const LANE_INDEX = Object.fromEntries(LANES_LL.map(l => [l.id, l]));
  function pointAndDirAlong(line, t) {
    // Returns { pt, segDir } where segDir is the [dlon, dlat] of the local
    // segment at fraction t in [0,1] along the polyline's arc length.
    if (line.length < 2) return { pt: line[0], segDir: [1, 0] };
    const segs = [];
    let total = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i+1];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a, b, d, c: total }); total += d;
    }
    const target = t * total;
    for (const s of segs) {
      if (target <= s.c + s.d) {
        const k = s.d ? (target - s.c) / s.d : 0;
        const pt = [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k];
        return { pt, segDir: [s.b[0] - s.a[0], s.b[1] - s.a[1]] };
      }
    }
    const last = segs[segs.length - 1];
    return { pt: line[line.length - 1], segDir: [last.b[0] - last.a[0], last.b[1] - last.a[1]] };
  }
  for (const v of VESSELS_LL) {
    const lane = LANE_INDEX[v.lane_id];
    if (lane && lane.d_ll && lane.d_ll.length >= 2) {
      v.path_ll = lane.d_ll;
      const t = typeof v.pos_t === "number" ? v.pos_t : 0.5;
      const { pt, segDir } = pointAndDirAlong(lane.d_ll, t);
      v.ll = pt;
      // Compass heading from lon/lat segment direction (0 = N, 90 = E).
      // atan2(dlon * cos(lat), dlat) accounts for longitude convergence.
      const latRad = pt[1] * Math.PI / 180;
      const dx = segDir[0] * Math.cos(latRad);
      const dy = segDir[1];
      let h = Math.atan2(dx, dy) * 180 / Math.PI;
      if (h < 0) h += 360;
      v.heading = Math.round(h);
    } else {
      v.path_ll = v.path_ll || [[14.5, 77.75], [20, 78]];
      v.ll = v.ll || v.path_ll[0];
      v.heading = v.heading || 0;
    }
  }

  // --- REROUTE — derived from each vessel's actual lane and the live bear
  // positions, not hand-traced. Algorithm:
  //   (1) For every vessel, count bears whose home lat/lon falls within
  //       BUFFER_KM of the vessel's lane polyline (point-to-segment distance,
  //       local equirectangular approx at the path latitude).
  //   (2) Pick the vessel with the highest conflict count as the reroute hero.
  //   (3) For that vessel's path, push every waypoint that's within
  //       (BUFFER_KM + MARGIN_KM) of any conflicting bear, perpendicular to
  //       the bear vector, by exactly enough to reach BUFFER_KM + MARGIN_KM.
  //       Multiple bears compose additively.
  //   (4) Length, transit time, fuel, CO₂ all derive from haversine geometry
  //       and a per-vessel fuel-burn rate scaled by length-overall.
  const BUFFER_KM = 25;        // disturbance radius (matches default UI buffer)
  const MARGIN_KM = 10;        // extra clearance beyond buffer when re-routing
  const NM_PER_KM = 1 / 1.852;
  const CO2_FACTOR = 3.114;    // t-CO₂ per t marine diesel
  function haversineKm(a, b) {
    const R = 6371, D = Math.PI / 180;
    const dLat = (b[1] - a[1]) * D, dLon = (b[0] - a[0]) * D;
    const lat1 = a[1] * D, lat2 = b[1] * D;
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function pathLengthKm(path) {
    let s = 0;
    for (let i = 0; i < path.length - 1; i++) s += haversineKm(path[i], path[i+1]);
    return s;
  }
  function distPointToSegKm(p, a, b) {
    // Equirectangular projection at p's latitude — accurate to ~1% at this scale.
    const D = Math.PI / 180, lat = p[1] * D;
    const kx = 111 * Math.cos(lat), ky = 111;
    const px = 0, py = 0;
    const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * ky;
    const bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * ky;
    const dx = bx - ax, dy = by - ay;
    const L2 = dx*dx + dy*dy;
    let t = L2 ? -(ax*dx + ay*dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t*dx, cy = ay + t*dy;
    return Math.hypot(cx - px, cy - py);
  }
  function bearsInBuffer(path, bears, bufferKm) {
    // For each bear, consider the full envelope: past track + current + 24h
    // forecast. Conflict = any of those points lies within bufferKm of any
    // path segment. Distance = min over all (bear-point × path-segment).
    const hits = [];
    for (const b of bears) {
      const envelope = [b.ll].concat(b.track_ll || [], b.forecast_ll || []);
      let minD = Infinity, closest = b.ll;
      for (const ll of envelope) {
        for (let i = 0; i < path.length - 1; i++) {
          const d = distPointToSegKm(ll, path[i], path[i+1]);
          if (d < minD) { minD = d; closest = ll; }
        }
      }
      if (minD <= bufferKm) {
        hits.push({ bear: b, distKm: +minD.toFixed(1), closestLl: closest });
      }
    }
    return hits;
  }
  function minSeparationKm(path, bears) {
    // Closest distance from any bear envelope point to any path segment.
    let minD = Infinity;
    for (const b of bears) {
      const envelope = [b.ll].concat(b.track_ll || [], b.forecast_ll || []);
      for (const ll of envelope) {
        for (let i = 0; i < path.length - 1; i++) {
          const d = distPointToSegKm(ll, path[i], path[i+1]);
          if (d < minD) minD = d;
        }
      }
    }
    return minD;
  }
  // ---- Land-mask point-in-polygon (uses the OSM coastline rings) ----
  // Bounding box per ring lets us skip ~99% of rings in the typical lookup.
  const REAL_RING_BBOXES = REAL_RINGS.map(ring => {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return [minLon, minLat, maxLon, maxLat];
  });
  function pointInRing(p, ring) {
    let inside = false;
    const px = p[0], py = p[1];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }
  function isLandLL(p) {
    const lon = p[0], lat = p[1];
    for (let r = 0; r < REAL_RINGS.length; r++) {
      const bb = REAL_RING_BBOXES[r];
      if (lon < bb[0] || lon > bb[2] || lat < bb[1] || lat > bb[3]) continue;
      if (pointInRing(p, REAL_RINGS[r])) return true;
    }
    return false;
  }

  // ---- A* reroute on a navigation grid ----
  // Hard block: land cells. Soft penalty: cells inside any bear's
  // (buffer + margin) envelope, scaled by how deep into the buffer we are.
  // 8-connected grid; cell ~ 2.3 km × 3.3 km at 78°N.
  function aStarReroute(startLL, goalLL, bears, bufferKm, marginKm) {
    // Wider PAD so the search can find far detours (e.g. via Hinlopen Strait
    // for a Storfjorden-bound vessel). Larger grid is slower but only runs
    // once per page load.
    const PAD_LON = 4.0, PAD_LAT = 1.5;
    const minLon = Math.min(startLL[0], goalLL[0]) - PAD_LON;
    const maxLon = Math.max(startLL[0], goalLL[0]) + PAD_LON;
    const minLat = Math.min(startLL[1], goalLL[1]) - PAD_LAT;
    const maxLat = Math.max(startLL[1], goalLL[1]) + PAD_LAT;
    const dLon = 0.10, dLat = 0.03;
    const W = Math.ceil((maxLon - minLon) / dLon) + 1;
    const H = Math.ceil((maxLat - minLat) / dLat) + 1;
    const cellLL = (i, j) => [minLon + i * dLon, minLat + j * dLat];
    const ll2cell = (ll) => [
      Math.max(0, Math.min(W - 1, Math.round((ll[0] - minLon) / dLon))),
      Math.max(0, Math.min(H - 1, Math.round((ll[1] - minLat) / dLat))),
    ];

    const need = bufferKm + marginKm;
    const PENALTY_PER_KM = 25;  // strong cost so A* genuinely detours around buffer

    const landCache = new Int8Array(W * H);  // 0 = unknown, 1 = land, -1 = ocean
    const bearCache = new Float32Array(W * H);
    const bearCacheReady = new Uint8Array(W * H);

    function isLandIdx(i, j) {
      const k = i * H + j;
      if (landCache[k] !== 0) return landCache[k] === 1;
      const v = isLandLL(cellLL(i, j));
      landCache[k] = v ? 1 : -1;
      return v;
    }
    // Skip bear envelope points within 8 km of either endpoint — those bears
    // can't be avoided by routing (the ship still has to start and end at
    // those points), so penalising A* for going near them just makes the
    // detour worse without improving safety.
    const ENDPOINT_TOL_KM = 8;
    function nearEndpoint(ll) {
      return haversineKm(ll, startLL) < ENDPOINT_TOL_KM
          || haversineKm(ll, goalLL)  < ENDPOINT_TOL_KM;
    }
    function bearCostIdx(i, j) {
      const k = i * H + j;
      if (bearCacheReady[k]) return bearCache[k];
      const p = cellLL(i, j);
      const D = Math.PI / 180, lat = p[1] * D;
      const kx = 111 * Math.cos(lat), ky = 111;
      let cost = 0;
      for (const b of bears) {
        const env = [b.ll].concat(b.track_ll || [], b.forecast_ll || []);
        let minD = Infinity;
        for (const ll of env) {
          if (nearEndpoint(ll)) continue;
          const dx = (p[0] - ll[0]) * kx;
          const dy = (p[1] - ll[1]) * ky;
          const d = Math.hypot(dx, dy);
          if (d < minD) minD = d;
        }
        if (minD < need) cost += (need - minD) * PENALTY_PER_KM;
      }
      bearCache[k] = cost;
      bearCacheReady[k] = 1;
      return cost;
    }

    // Snap start/goal to nearest ocean cell if they accidentally land on land
    function snapToOcean(ci, cj) {
      if (!isLandIdx(ci, cj)) return [ci, cj];
      for (let r = 1; r < 30; r++) {
        for (let di = -r; di <= r; di++) {
          for (let dj = -r; dj <= r; dj++) {
            if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
            const ni = ci + di, nj = cj + dj;
            if (ni < 0 || ni >= W || nj < 0 || nj >= H) continue;
            if (!isLandIdx(ni, nj)) return [ni, nj];
          }
        }
      }
      return [ci, cj];
    }

    const sa = ll2cell(startLL), ga = ll2cell(goalLL);
    const [si, sj] = snapToOcean(sa[0], sa[1]);
    const [gi, gj] = snapToOcean(ga[0], ga[1]);
    const startKey = si * H + sj, goalKey = gi * H + gj;

    const cameFrom = new Int32Array(W * H).fill(-1);
    const gScore = new Float32Array(W * H).fill(Infinity);
    const fScore = new Float32Array(W * H).fill(Infinity);
    const inOpen = new Uint8Array(W * H);
    const closed = new Uint8Array(W * H);
    const open = new Set();
    gScore[startKey] = 0;
    fScore[startKey] = haversineKm(cellLL(si, sj), cellLL(gi, gj));
    open.add(startKey);
    inOpen[startKey] = 1;

    const NEIGH = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let iter = 0, MAX_ITER = 100000;
    let reached = false;

    while (open.size > 0 && iter++ < MAX_ITER) {
      // O(N) min-f scan — fine for grids ≤ ~10k cells
      let curKey = -1, bestF = Infinity;
      for (const k of open) {
        const f = fScore[k];
        if (f < bestF) { bestF = f; curKey = k; }
      }
      if (curKey === goalKey) { reached = true; break; }
      open.delete(curKey);
      inOpen[curKey] = 0;
      closed[curKey] = 1;
      const ci = Math.floor(curKey / H), cj = curKey % H;

      for (const n of NEIGH) {
        const ni = ci + n[0], nj = cj + n[1];
        if (ni < 0 || ni >= W || nj < 0 || nj >= H) continue;
        const nkey = ni * H + nj;
        if (closed[nkey]) continue;
        if (isLandIdx(ni, nj)) continue;
        // Reject the edge if its midpoint lands on an island smaller than a cell
        // — prevents the rendered path-segment from cutting through skerries
        // that are too small to register at the grid resolution.
        const a = cellLL(ci, cj), b = cellLL(ni, nj);
        if (isLandLL([(a[0]+b[0])/2, (a[1]+b[1])/2])) continue;
        const stepKm = haversineKm(a, b);
        const tentativeG = gScore[curKey] + stepKm + bearCostIdx(ni, nj);
        if (tentativeG < gScore[nkey]) {
          cameFrom[nkey] = curKey;
          gScore[nkey] = tentativeG;
          fScore[nkey] = tentativeG + haversineKm(cellLL(ni, nj), cellLL(gi, gj));
          if (!inOpen[nkey]) { open.add(nkey); inOpen[nkey] = 1; }
        }
      }
    }
    if (!reached) return null;

    // Reconstruct + DP-simplify the cell path
    const cells = [];
    let cur = goalKey;
    while (cur !== -1) {
      cells.push(cur);
      cur = cameFrom[cur];
    }
    cells.reverse();
    const raw = cells.map(k => cellLL(Math.floor(k / H), k % H));
    return simplifyLL(raw, 2.0);  // 2 km tolerance
  }
  function simplifyLL(line, tolKm) {
    if (line.length <= 2) return line;
    const dp = (pts) => {
      if (pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1];
      const D = Math.PI / 180, lat = a[1] * D;
      const kx = 111 * Math.cos(lat), ky = 111;
      const ax = 0, ay = 0;
      const bx = (b[0] - a[0]) * kx, by = (b[1] - a[1]) * ky;
      const dxAB = bx - ax, dyAB = by - ay;
      const L2 = dxAB*dxAB + dyAB*dyAB || 1e-12;
      let maxD = 0, idx = 0;
      for (let i = 1; i < pts.length - 1; i++) {
        const px = (pts[i][0] - a[0]) * kx;
        const py = (pts[i][1] - a[1]) * ky;
        let t = ((px - ax)*dxAB + (py - ay)*dyAB) / L2;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t*dxAB, cy = ay + t*dyAB;
        const d = Math.hypot(px - cx, py - cy);
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > tolKm) {
        const left = dp(pts.slice(0, idx + 1));
        const right = dp(pts.slice(idx));
        return left.slice(0, -1).concat(right);
      }
      return [a, b];
    };
    return dp(line);
  }
  function fuelPerHour(lengthM) {
    // Rough cruise-ship rule of thumb: base 0.14 t/h + 0.0015 t/h per metre over 50 m LOA.
    return 0.14 + Math.max(0, (lengthM || 100) - 50) * 0.0015;
  }
  function summarisePath(path, vessel, hits, allBears, bufferKm) {
    const km = pathLengthKm(path);
    const nm = km * NM_PER_KM;
    const speed = vessel.speed_kn || 13;
    const transit_h = nm / speed;
    const fuel_t = transit_h * fuelPerHour(vessel.length_m);
    // Interior min separation = closest approach over middle 70% of the path.
    // Excludes the unavoidable terminal-approach proximity that no routing can fix.
    const interior = midSegment(path, 0.15, 0.85);
    const minSepInterior = minSeparationKm(interior.length >= 2 ? interior : path, allBears);
    const minSepFull     = minSeparationKm(path, allBears);
    // Risk scales inversely with INTERIOR min separation.
    const buf = bufferKm || BUFFER_KM;
    const risk = minSepInterior >= buf
      ? 0.05
      : Math.min(0.95, 0.20 + (1 - minSepInterior / buf) * 0.75);
    return {
      path_ll: path,
      distance_nm: +nm.toFixed(0),
      transit_h:   +transit_h.toFixed(1),
      fuel_t:      +fuel_t.toFixed(1),
      co2_t:       +(fuel_t * CO2_FACTOR).toFixed(1),
      encounters:  hits.length,
      min_separation_km:          +minSepInterior.toFixed(1),  // shown in panel
      min_separation_full_km:     +minSepFull.toFixed(1),      // includes terminal approach
      risk:        +risk.toFixed(2),
      bears_disturbed: hits.map(h => h.bear.id),
    };
  }

  // (1) Score each vessel by INTERIOR conflicts only. A bear that's close to
  // a lane endpoint can't be avoided by routing (the ship still has to start
  // and end somewhere); the demo should highlight conflicts the algorithm can
  // actually fix. Interior = middle 70% of the path by arc length.
  function midSegment(path, fStart, fEnd) {
    if (path.length < 2) return path;
    const segs = []; let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = haversineKm(path[i], path[i+1]);
      segs.push({ a: path[i], b: path[i+1], d, c: total }); total += d;
    }
    const tS = fStart * total, tE = fEnd * total;
    const out = [];
    for (const s of segs) {
      const segS = s.c, segE = s.c + s.d;
      if (segE < tS) continue;
      if (segS > tE) break;
      if (segS < tS) {
        const k = s.d ? (tS - segS) / s.d : 0;
        out.push([s.a[0] + (s.b[0]-s.a[0])*k, s.a[1] + (s.b[1]-s.a[1])*k]);
      } else if (out.length === 0) {
        out.push(s.a);
      }
      if (segE > tE) {
        const k = s.d ? (tE - segS) / s.d : 0;
        out.push([s.a[0] + (s.b[0]-s.a[0])*k, s.a[1] + (s.b[1]-s.a[1])*k]);
        break;
      } else {
        out.push(s.b);
      }
    }
    return out;
  }
  // For every vessel with interior bear conflicts, run A* with the given
  // buffer/margin, and attach the result to the vessel itself (v.reroute).
  // Mutates VESSELS_LL items in place. Returns the showcase summary.
  const MIN_GAIN_KM = 1.0;
  // Walk arc length: returns lat/lon at fraction t∈[0,1] along path_ll.
  function pointAlongLL(path, t) {
    if (!path || path.length < 2) return path && path[0];
    const segs = []; let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = haversineKm(path[i], path[i+1]);
      segs.push({ a: path[i], b: path[i+1], d, c: total }); total += d;
    }
    const tg = Math.min(Math.max(t, 0), 1) * total;
    for (const s of segs) {
      if (tg <= s.c + s.d) {
        const k = s.d ? (tg - s.c) / s.d : 0;
        return [s.a[0] + (s.b[0]-s.a[0])*k, s.a[1] + (s.b[1]-s.a[1])*k];
      }
    }
    return path[path.length - 1];
  }

  // Build the "remaining path" — from a vessel's current position (at timeFrac
  // along its lane) to its lane endpoint. Used as the A* start for reroute,
  // so that as time scrubs forward, the reroute starts from where the vessel
  // ACTUALLY IS, not the lane origin.
  function remainingPath(path_ll, timeFrac) {
    if (!path_ll || path_ll.length < 2) return path_ll || [];
    const t = Math.min(Math.max(timeFrac, 0), 1);
    if (t <= 0) return path_ll.slice();
    if (t >= 1) return [path_ll[path_ll.length - 1]];
    const cur = pointAlongLL(path_ll, t);
    // Find the segment index we're currently inside, then keep cur + remaining waypoints.
    const segs = []; let total = 0;
    for (let i = 0; i < path_ll.length - 1; i++) {
      const d = haversineKm(path_ll[i], path_ll[i+1]);
      segs.push({ d, c: total }); total += d;
    }
    const tg = t * total;
    let segIdx = 0;
    for (let i = 0; i < segs.length; i++) {
      if (tg <= segs[i].c + segs[i].d) { segIdx = i; break; }
    }
    return [cur, ...path_ll.slice(segIdx + 1)];
  }

  function runRerouteComputation(bufferKm, marginKm, timeFrac) {
    // Reset
    VESSELS_LL.forEach(v => { v.reroute = undefined; });
    const t = Math.min(Math.max(timeFrac || 0, 0), 1);

    const cands = VESSELS_LL.map(v => {
      // Score on the REMAINING path (from current pos onward), since the
      // first part of the lane has already been transited and a reroute
      // can only affect what's left.
      const rem = remainingPath(v.path_ll, t);
      const interior = midSegment(rem, 0.15, 0.85);
      const interiorHits = bearsInBuffer(interior, BEARS_LL, bufferKm);
      const hits = bearsInBuffer(rem, BEARS_LL, bufferKm);
      return { v, rem, hits, interiorHits };
    }).filter(c => c.interiorHits.length > 0);

    let bestCand = null;
    for (const c of cands) {
      const start = c.rem[0];
      const goal  = c.rem[c.rem.length - 1];
      const aPath = aStarReroute(start, goal, BEARS_LL, bufferKm, marginKm);
      const origInt = midSegment(c.rem, 0.15, 0.85);
      const propInt = aPath ? midSegment(aPath, 0.15, 0.85) : null;
      const origMS = minSeparationKm(origInt.length >= 2 ? origInt : c.rem, BEARS_LL);
      const propMS = aPath
        ? minSeparationKm(propInt.length >= 2 ? propInt : aPath, BEARS_LL)
        : origMS;
      const improvement = propMS - origMS;
      const propHits = aPath ? bearsInBuffer(aPath, BEARS_LL, bufferKm) : c.hits;
      const useful = !!aPath && improvement >= MIN_GAIN_KM;

      if (useful) {
        c.v.reroute = {
          useful: true,
          improvement_km: +improvement.toFixed(1),
          buffer_km: bufferKm,
          time_frac: t,
          original: summarisePath(c.rem, c.v, c.hits, BEARS_LL, bufferKm),
          proposed: summarisePath(aPath,  c.v, propHits, BEARS_LL, bufferKm),
        };
      } else {
        c.v.reroute = {
          useful: false,
          improvement_km: aPath ? +improvement.toFixed(1) : 0,
          buffer_km: bufferKm,
          time_frac: t,
          reason: aPath
            ? `A* gain ${improvement.toFixed(1)} km below ${MIN_GAIN_KM} km threshold (geographic constraint)`
            : `A* found no path — start or goal isolated by land`,
          original: summarisePath(c.rem, c.v, c.hits, BEARS_LL, bufferKm),
        };
      }
      if (!bestCand || improvement > bestCand.improvement) {
        bestCand = { c, aPath, improvement, useful };
      }
    }

    let target, origHits, proposedPath, originalPath;
    let usefulFlag = false;
    let algorithmUsed = "no reroute (no vessel has interior bear conflicts)";
    if (bestCand) {
      target = bestCand.c.v;
      origHits = bestCand.c.hits;
      originalPath = bestCand.c.rem;
      if (bestCand.useful) {
        proposedPath = bestCand.aPath;
        usefulFlag = true;
        algorithmUsed = `A* (land + bear cost) — picked ${target.id} (+${bestCand.improvement.toFixed(1)} km min sep)`;
      } else {
        proposedPath = bestCand.c.rem;
        algorithmUsed = `no useful reroute — best candidate ${target.id} gains ${bestCand.improvement.toFixed(1)} km`;
      }
    } else {
      target = VESSELS_LL[0];
      origHits = [];
      originalPath = target.path_ll;
      proposedPath = target.path_ll;
    }
    const propHits = bearsInBuffer(proposedPath, BEARS_LL, bufferKm);
    return {
      vessel_id:  target.id,
      buffer_km:  bufferKm,
      margin_km:  marginKm,
      time_frac:  t,
      algorithm:  algorithmUsed,
      useful:     usefulFlag,
      original:   summarisePath(originalPath, target, origHits, BEARS_LL, bufferKm),
      proposed:   summarisePath(proposedPath, target, propHits, BEARS_LL, bufferKm),
    };
  }

  // Initial computation with default buffer. Held in `let` so recompute can
  // overwrite it when the user changes the wildlife buffer slider.
  let REROUTE_LL = runRerouteComputation(BUFFER_KM, MARGIN_KM);

  // Use real geojson rings if available, else fall back to hand outlines
  const ISLANDS_USED = REAL_ISLANDS.length ? REAL_ISLANDS : ISLANDS_LL;

  // ---- Compute bbox of all projected island vertices to scale to canvas ----
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  ISLANDS_USED.forEach(p => p.ring.forEach(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }));
  // Extend bbox a bit south to include Bjørnøya so it shows up
  const bjor = project(19.10, 74.43);
  if (bjor[1] > maxY) maxY = bjor[1];
  if (bjor[0] < minX) minX = bjor[0];

  const dx = maxX - minX, dy = maxY - minY;
  const span = Math.max(dx, dy);
  const usable = CANVAS - 2 * PADDING;
  const cx0 = (minX + maxX) / 2;
  const cy0 = (minY + maxY) / 2;
  const Y_OFFSET = CANVAS * 0.10;   // shift entire map content down by 10% (was 15%, then -5%)

  function toPx(lon, lat) {
    const [x, y] = project(lon, lat);
    const px = (x - cx0) / span * usable + CANVAS / 2;
    const py = (y - cy0) / span * usable + CANVAS / 2 + Y_OFFSET;
    return [px, py];
  }
  function ringToPath(ring) {
    return ring.map(([lon, lat], i) => {
      const [px, py] = toPx(lon, lat);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ") + " Z";
  }
  function lineToPath(ll) {
    return ll.map(([lon, lat], i) => {
      const [px, py] = toPx(lon, lat);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ");
  }

  function multiRingsToPath(rings) {
    const segs = [];
    for (const ring of rings) {
      if (!ring || ring.length < 3) continue;
      const pts = ring.map(([lo, la]) => toPx(lo, la));
      segs.push("M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z");
    }
    return segs.join(" ");
  }

  // ---- Project everything once for the app ----
  const ISLANDS = ISLANDS_USED.map(o => ({ ...o, path: ringToPath(o.ring) }));
  const GLACIERS = GLACIERS_LL.map(o => {
    const realRings = findRealRings(o.ident);
    return {
      ...o,
      // Use real CryoClim outline if available, else fall back to hand polygon
      path: realRings ? multiRingsToPath(realRings) : ringToPath(o.ring),
      real: !!realRings,
      anchor_px: toPx(o.anchor[0], o.anchor[1])
    };
  });
  // Background glacier layer — every other CryoClim polygon (tidewater + >30 km²)
  // not in the retreat panel. Renders as a subtle filled hatch under the named ones.
  const GLACIERS_BG = REAL_GLACIERS
    .filter(g => !g.featured && !FEATURED_IDENTS.has(g.ident))
    .map(g => ({
      ident: g.ident,
      name: g.name,
      tidewater: g.tidewater,
      area_km2: g.area_km2,
      path: multiRingsToPath(g.rings)
    }));
  const PLACES = PLACES_LL.map(o => ({ ...o, pos: toPx(o.ll[0], o.ll[1]) }));

  const BEARS = BEARS_LL.map(b => ({
    ...b,
    pos: toPx(b.ll[0], b.ll[1]),
    track: b.track_ll.map(([x,y]) => toPx(x,y)),
    forecast: b.forecast_ll.map(([x,y]) => toPx(x,y))
  }));

  // Helper: project a vessel's per-reroute paths from lat/lon to canvas px.
  // Mutates `out` in place so map.jsx (which holds references via PBP_DATA)
  // sees the updated `reroute` field after recompute.
  function projectVesselReroute(out, v) {
    if (v.reroute && v.reroute.useful && v.reroute.proposed) {
      out.reroute = {
        ...v.reroute,
        proposed: {
          ...v.reroute.proposed,
          path: v.reroute.proposed.path_ll.map(([x,y]) => toPx(x,y)),
        },
        original: {
          ...v.reroute.original,
          path: v.reroute.original.path_ll.map(([x,y]) => toPx(x,y)),
        },
      };
    } else if (v.reroute) {
      out.reroute = v.reroute;
    } else {
      out.reroute = undefined;
    }
  }

  const VESSELS = VESSELS_LL.map(v => {
    const out = {
      ...v,
      pos: toPx(v.ll[0], v.ll[1]),
      path: v.path_ll.map(([x,y]) => toPx(x,y)),
    };
    projectVesselReroute(out, v);
    return out;
  });

  const LANES = LANES_LL.map(l => ({ ...l, d: lineToPath(l.d_ll) }));

  // ---- Real shipping-traffic envelopes from EMODnet 2024 annual vessel-density.
  // window.PBP_VESSEL_DENSITY = { major: [polygons], corridor: [polygons], ... }
  // each polygon = list of rings; each ring = [[lon,lat],...]. We project each
  // ring to canvas and emit one SVG path per polygon (multi-ring with holes).
  const VD = (typeof window !== 'undefined' && window.PBP_VESSEL_DENSITY) || null;
  const LANE_DENSITY = VD ? {
    units: VD.units,
    thresholds: VD.thresholds,
    major:    (VD.major    || []).map(poly => ({ path: multiRingsToPath(poly) })),
    corridor: (VD.corridor || []).map(poly => ({ path: multiRingsToPath(poly) })),
  } : { major: [], corridor: [] };

  // REROUTE is held as a mutable object so recomputeReroutes can refresh its
  // fields in place (panels.jsx reads via window.PBP_DATA.REROUTE).
  const REROUTE = {};
  function refreshGlobalReroute() {
    REROUTE.vessel_id = REROUTE_LL.vessel_id;
    REROUTE.buffer_km = REROUTE_LL.buffer_km;
    REROUTE.margin_km = REROUTE_LL.margin_km;
    REROUTE.algorithm = REROUTE_LL.algorithm;
    REROUTE.useful    = REROUTE_LL.useful;
    REROUTE.original  = { ...REROUTE_LL.original, path: REROUTE_LL.original.path_ll.map(([x,y]) => toPx(x,y)) };
    REROUTE.proposed  = { ...REROUTE_LL.proposed, path: REROUTE_LL.proposed.path_ll.map(([x,y]) => toPx(x,y)) };
  }
  refreshGlobalReroute();

  // ---- Sea ice frames: REAL polygons from NSIDC G02135 v4.0 monthly extent
  // shapefiles, inverse-projected from EPSG:3411 to WGS-84 lon/lat,
  // then clipped to the Svalbard bbox (-5..45°E, 73..84°N), then projected
  // here through the same polar-stereographic transform used for islands.
  function iceRingsToPath(rings) {
    const segs = [];
    for (const ring of rings) {
      if (ring.length < 3) continue;
      const pts = ring.map(([lo, la]) => toPx(lo, la));
      segs.push("M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z");
    }
    return segs.join(" ");
  }
  const ICE_RAW = window.PBP_ICE_RAW || {};
  const ICE_REAL_PATHS = {
    mar: iceRingsToPath(ICE_RAW.mar || []),
    jun: iceRingsToPath(ICE_RAW.jun || []),
    sep: iceRingsToPath(ICE_RAW.sep || []),
    dec: iceRingsToPath(ICE_RAW.dec || []),
  };

  // Fallback synthetic edges (kept in case the NSIDC payload is missing).
  function iceFramePath(edge_ll) {
    // edge_ll: array of [lon,lat] going west→east along the southern ice edge
    // Close the polygon by tracing along the top of the projected canvas.
    const pts = edge_ll.map(([lo, la]) => toPx(lo, la));
    // Top-right and top-left of canvas (well above any island)
    const topRight = [CANVAS - 4, -40];
    const topLeft  = [4, -40];
    const ring = [...pts, topRight, topLeft];
    return "M " + ring.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";
  }

  // Edges traced west→east. Latitudes reflect typical NSIDC monthly fields:
  //   March (winter max):   edge sweeps ~74°N west of Svalbard, dipping
  //                          south to ~74°N over Bjørnøya, then ~74-76°N east
  //   June (melt onset):    edge retreats to ~78–79°N west, ~76°N east
  //   September (minimum):  edge well north of Svalbard, >82°N over the
  //                          archipelago, dipping to ~80°N far east
  //   December (refreeze):  edge re-extending south, ~76°N west, ~75°N east
  const ICE_EDGE_MAR = [
    [-2,73.8],[2,73.8],[6,73.9],[10,74.0],[14,74.1],[18,74.2],[22,74.4],
    [26,74.6],[30,74.9],[34,75.2],[38,75.5],[42,75.8]
  ];
  const ICE_EDGE_JUN = [
    [-2,78.4],[2,78.6],[6,78.7],[10,78.5],[14,78.2],[18,77.6],[22,77.0],
    [26,76.4],[30,76.1],[34,76.0],[38,76.1],[42,76.3]
  ];
  const ICE_EDGE_SEP = [
    [-2,82.6],[2,82.7],[6,82.8],[10,82.7],[14,82.5],[18,82.2],[22,81.7],
    [26,81.0],[30,80.4],[34,80.1],[38,80.0],[42,80.1]
  ];
  const ICE_EDGE_DEC = [
    [-2,76.0],[2,76.1],[6,76.0],[10,75.7],[14,75.4],[18,75.1],[22,74.9],
    [26,74.8],[30,74.9],[34,75.1],[38,75.4],[42,75.7]
  ];

  const ICE_FRAMES = [
    { label: "Mar 2025 · 14.33 M km²", note: "Record low max",       coverage: 0.92, path: ICE_REAL_PATHS.mar || iceFramePath(ICE_EDGE_MAR) },
    { label: "Jun 2025 · est. 10.7 M km²", note: "Melt onset May 21", coverage: 0.68, path: ICE_REAL_PATHS.jun || iceFramePath(ICE_EDGE_JUN) },
    { label: "Sep 2025 · 4.60 M km²",  note: "10th-lowest minimum",  coverage: 0.41, path: ICE_REAL_PATHS.sep || iceFramePath(ICE_EDGE_SEP) },
    { label: "Dec 2024 · 11.43 M km²", note: "Record low Dec",       coverage: 0.78, path: ICE_REAL_PATHS.dec || iceFramePath(ICE_EDGE_DEC) },
  ];

  // Exposed recompute: re-runs A* for every vessel with the new buffer,
  // re-projects each vessel's reroute paths and the global REROUTE in place.
  // Returns the showcase REROUTE_LL so callers can read the new vessel_id.
  function recomputeReroutes(bufferKm, marginKm, timeFrac) {
    const buf = bufferKm > 0 ? bufferKm : BUFFER_KM;
    const mar = marginKm > 0 ? marginKm : MARGIN_KM;
    const t   = typeof timeFrac === "number" ? timeFrac : 0;
    REROUTE_LL = runRerouteComputation(buf, mar, t);
    // Update each VESSEL's reroute (lat/lon → canvas).
    for (const v of VESSELS) {
      const llv = VESSELS_LL.find(x => x.id === v.id);
      if (llv) projectVesselReroute(v, llv);
    }
    refreshGlobalReroute();
    return REROUTE_LL;
  }

  // expose
  window.PBP_GEO = {
    project, toPx, ringToPath, lineToPath,
    ISLANDS, GLACIERS, GLACIERS_BG, PLACES, BEARS, VESSELS,
    LANES, LANE_DENSITY, REROUTE, ICE_FRAMES,
    recomputeReroutes,
    bbox: { minX, minY, maxX, maxY, cx0, cy0, span, canvas: CANVAS, padding: PADDING },
    proj: { lon0, lat0 },
  };
})();
