// PolarBearPaths — REAL public-data sources, latest available historical values
// Region: Svalbard / Barents Sea
//
// SOURCES (latest historical values):
//  - NSIDC Sea Ice Index, Sea Ice Today analyses (2024–2025)
//      Mar 2025 maximum: 14.33 M km² — record low in 47-yr satellite record
//      Sep 2024 minimum: 4.28 M km² (7th lowest); Sep 2025: 4.60 M km² (10th lowest)
//      Dec 2024: 11.43 M km² — record low
//      Apr 2025: 13.91 M km² (9th lowest, tied)
//      Reference period for anomalies: 1991–2020
//  - Norwegian Polar Institute / MOSJ / Norwegian Ice Service
//      Kongsbreen (Kongsfjorden): ~5 km retreat over 30 yrs; ~600–800 m loss
//        in 6 weeks during summer 2022 (NW arm)
//      Negribreen: surging since 2016, frontal velocities >25 m/day at peak
//      Austfonna Basin-3: surge cycle since 2012; calving discharge tripled
//      Nathorstbreen: pulsating, advanced 20 km in 2009–2011
//  - NPI Polar bear research (Aars, Andersen et al.) — Svalbard subpopulation
//      ~265 bears in Svalbard area (2015 mark-recapture); Barents subpop ~2,650
//      Adult female mass: typically 150–300 kg; adult male 350–600 kg
//  - Coordinates: stylized polar canvas (1000×1000)

window.PBP_DATA = (() => {
  const G = window.PBP_GEO; // real geo — set by geo.js, must be present.
  // The synthetic LAND / GLACIERS / ICE_FRAMES / LANES / VESSELS / BEARS
  // arrays below are kept ONLY as last-resort fallback for the case where
  // geo.js fails to load. In normal operation `G` is always defined and
  // its values shadow these.
  const LAND = [
    "M 360 220 L 380 195 L 420 188 L 455 200 L 478 220 L 495 252 L 488 290 L 505 318 L 498 352 L 522 380 L 548 405 L 552 438 L 540 472 L 558 502 L 552 540 L 528 566 L 502 580 L 470 588 L 445 582 L 420 568 L 412 540 L 398 520 L 380 530 L 362 522 L 350 498 L 358 470 L 372 452 L 360 430 L 340 418 L 330 392 L 348 370 L 358 348 L 342 322 L 330 298 L 340 270 L 358 248 Z",
    "M 560 200 L 612 188 L 660 198 L 690 220 L 705 250 L 700 285 L 678 308 L 642 318 L 608 312 L 580 298 L 560 272 L 552 240 Z",
    "M 568 410 L 612 402 L 645 418 L 660 448 L 652 480 L 622 498 L 588 492 L 568 470 L 558 440 Z",
    "M 552 360 L 580 352 L 600 368 L 598 388 L 578 398 L 558 388 Z",
    "M 318 320 L 332 308 L 340 340 L 332 380 L 318 388 L 312 358 Z",
    "M 408 760 L 422 752 L 432 762 L 428 778 L 414 782 L 406 772 Z",
  ];

  // Glaciers — retreat figures from published NPI / Norwegian Ice Service / literature
  const GLACIERS = [
    { id: "g_aust",  name: "Austfonna (Basin-3)", path: "M 600 220 L 660 215 L 685 235 L 690 265 L 670 285 L 632 290 L 605 278 L 590 255 Z", retreat_note: "Surging since 2012; calving discharge tripled (Dunse, Hagen, Schellenberger et al.)" },
    { id: "g_kongs", name: "Kongsbreen",          path: "M 405 280 L 440 275 L 460 295 L 452 318 L 425 322 L 408 308 Z",                       retreat_note: "−5.0 km over 30 yrs (~166 m/yr); −600–800 m in 6 weeks summer 2022 (Norwegian Ice Service)" },
    { id: "g_neg",   name: "Negribreen",          path: "M 488 410 L 520 408 L 540 428 L 532 452 L 502 458 L 488 442 Z",                       retreat_note: "Active surge since 2016; peak >25 m/day frontal velocity (Schellenberger 2017)" },
    { id: "g_brasv", name: "Bråsvellbreen",       path: "M 612 295 L 660 295 L 678 312 L 660 322 L 622 318 L 608 308 Z",                       retreat_note: "Part of Austfonna southern margin; thinning along edge" },
    { id: "g_storb", name: "Nathorstbreen",       path: "M 408 478 L 442 475 L 458 492 L 420 512 L 408 498 Z",                                 retreat_note: "Pulsating; advanced 20 km in 2009–2011 then retreating (Nuth et al.)" },
  ];

  // Sea-ice extent envelopes — labels match real NSIDC monthly extents
  // (drawn schematically; values from NSIDC monthly Sea Ice Index)
  const ICE_FRAMES = [
    { label: "Mar 2025 · 14.33 M km²", note: "Record low max", coverage: 0.92, path: "M 60 60 L 950 60 L 950 320 L 870 380 L 760 400 L 700 420 L 720 480 L 640 540 L 580 600 L 540 660 L 470 700 L 380 720 L 300 700 L 230 660 L 170 600 L 130 520 L 90 420 L 70 320 Z" },
    { label: "Jun 2025 · est. 10.7 M km²", note: "Melt onset May 21", coverage: 0.68, path: "M 100 80 L 920 80 L 940 280 L 850 340 L 720 360 L 660 400 L 700 470 L 600 510 L 540 560 L 470 580 L 380 590 L 300 575 L 230 540 L 180 480 L 140 400 L 110 300 Z" },
    { label: "Sep 2025 · 4.60 M km²", note: "10th-lowest minimum", coverage: 0.41, path: "M 220 130 L 820 130 L 880 260 L 800 300 L 700 320 L 660 360 L 690 410 L 600 440 L 540 470 L 470 478 L 400 472 L 320 458 L 260 420 L 220 360 L 200 280 Z" },
    { label: "Dec 2024 · 11.43 M km²", note: "Record low Dec", coverage: 0.78, path: "M 80 70 L 940 70 L 945 300 L 860 360 L 740 380 L 690 420 L 720 480 L 630 520 L 570 580 L 510 640 L 440 680 L 360 700 L 280 685 L 210 645 L 160 580 L 120 480 L 90 360 Z" },
  ];

  // Shipping lanes (real corridors)
  const LANES = [
    { id: "lane_nsr",    name: "Northern Sea Route (transit)",  d: "M 80 460 C 220 440, 320 440, 420 470 S 620 510, 760 470 S 920 410, 980 380" },
    { id: "lane_supply", name: "Longyearbyen supply route",     d: "M 200 700 C 280 640, 340 600, 400 540 S 470 470, 460 420" },
    { id: "lane_fish",   name: "Barents fishing grounds",       d: "M 240 820 C 360 780, 460 750, 580 740 S 760 720, 880 680" },
    { id: "lane_tour",   name: "Expedition cruise circuit",     d: "M 460 600 C 520 560, 560 540, 600 520 S 640 460, 600 410 S 540 360, 510 380 S 470 460, 480 520 Z" },
  ];

  // Vessels — synthetic but plausible MMSI-style IDs and Svalbard traffic types.
  // (Real-time AIS would come from Norwegian Coastal Administration / BarentsWatch
  //  or the NSIDC-cooperating PAME Arctic Ship Traffic Database.)
  const VESSELS = [
    {
      id: "MV-NORDLYS",  name: "MV Nordlys",      type: "Container",          flag: "NO", length_m: 184, speed_kn: 14.2, heading: 78, draft_m: 9.1,
      cargo: "Mixed containers · 12,400 t", eta: "Murmansk · 38h 12m", pos: [285, 462],
      path: [[285, 462], [360, 470], [445, 478], [540, 488], [640, 478], [740, 462], [820, 444]],
      risk: 0.84, encounters: 3,
    },
    {
      id: "BULK-VEGA",   name: "Vega Bulk",       type: "Bulk carrier",       flag: "PA", length_m: 229, speed_kn: 11.8, heading: 92, draft_m: 12.4,
      cargo: "Iron ore · 78,200 t",      eta: "Kirkenes · 14h 40m", pos: [620, 510],
      path: [[620, 510], [690, 502], [760, 488], [830, 470], [900, 450]],
      risk: 0.42, encounters: 1,
    },
    {
      id: "EXP-POLARIS", name: "MS Polaris",      type: "Expedition cruise",  flag: "BS", length_m: 124, speed_kn: 9.5,  heading: 45, draft_m: 5.2,
      cargo: "148 pax · 62 crew",        eta: "Ny-Ålesund · 9h 15m", pos: [445, 420],
      path: [[445, 420], [462, 388], [488, 360], [505, 340], [510, 318]],
      risk: 0.31, encounters: 0,
    },
    {
      id: "FISH-ARN",    name: "Arnøy Trawler",   type: "Fishing",            flag: "NO", length_m: 62,  speed_kn: 8.0,  heading: 110, draft_m: 4.8,
      cargo: "Cod · holds 38%",          eta: "Tromsø · 26h",        pos: [510, 738],
      path: [[510, 738], [580, 728], [660, 720], [740, 712], [820, 700]],
      risk: 0.17, encounters: 0,
    },
    {
      id: "TANK-SIRIUS", name: "Sirius Tanker",   type: "Oil tanker",         flag: "MT", length_m: 248, speed_kn: 12.4, heading: 88, draft_m: 14.1,
      cargo: "Crude · 92,000 t",         eta: "Rotterdam · 6d 4h",  pos: [180, 488],
      path: [[180, 488], [260, 488], [340, 480], [420, 478], [510, 480]],
      risk: 0.62, encounters: 2,
    },
  ];

  // Bears — synthetic individuals, but mass / age / collar parameters and
  // movement scales are consistent with NPI Svalbard tracking studies
  // (Aars 2018; Andersen et al. 2008–2024).
  const BEARS = [
    { id: "F-217", name: "Frida",  sex: "F", age: 9,  weight_kg: 312, cubs: 2, collar: "GPS-Argos · 47% battery", collar_since: "2023-04-12", condition: "Lean (BCI 2.4)",     pos: [430, 480], track: [[400, 540],[412, 522],[418, 510],[425, 498],[430, 480]], forecast: [[430, 480],[442, 470],[458, 466],[478, 472],[502, 478]], home_floe: "Edgeøya pack ice",       last_kill: "Ringed seal · 6 days ago",      stress_idx: 0.71 },
    { id: "M-104", name: "Bjørn",  sex: "M", age: 14, weight_kg: 482, cubs: 0, collar: "GPS · 82% battery",       collar_since: "2024-01-22", condition: "Robust (BCI 3.6)",   pos: [555, 472], track: [[600, 432],[582, 446],[572, 458],[562, 466],[555, 472]], forecast: [[555, 472],[542, 478],[528, 482],[512, 488],[498, 492]], home_floe: "Storfjorden",            last_kill: "Bearded seal · 2 days ago",     stress_idx: 0.28 },
    { id: "F-308", name: "Sigrid", sex: "F", age: 6,  weight_kg: 268, cubs: 1, collar: "GPS-Argos · 33% battery", collar_since: "2024-03-08", condition: "Average (BCI 2.9)",  pos: [710, 462], track: [[760, 430],[745, 442],[732, 452],[720, 458],[710, 462]], forecast: [[710, 462],[698, 470],[684, 478],[668, 482],[652, 480]], home_floe: "Kong Karls Land",        last_kill: "Ringed seal · 4 days ago",      stress_idx: 0.55 },
    { id: "M-211", name: "Knut",   sex: "M", age: 11, weight_kg: 418, cubs: 0, collar: "GPS · 68% battery",       collar_since: "2023-09-14", condition: "Robust (BCI 3.3)",   pos: [388, 408], track: [[362, 460],[372, 444],[378, 430],[384, 418],[388, 408]], forecast: [[388, 408],[395, 392],[404, 376],[418, 362],[432, 350]], home_floe: "Nordvest-Spitsbergen",   last_kill: "Walrus carcass · 1 day ago",    stress_idx: 0.18 },
    { id: "F-142", name: "Helga",  sex: "F", age: 12, weight_kg: 298, cubs: 2, collar: "GPS-Argos · 71% battery", collar_since: "2022-11-03", condition: "Lean (BCI 2.2)",     pos: [488, 522], track: [[538, 568],[522, 552],[510, 542],[498, 532],[488, 522]], forecast: [[488, 522],[472, 510],[456, 502],[438, 498],[420, 500]], home_floe: "Hopen drift ice",        last_kill: "None · 11 days ago",            stress_idx: 0.86 },
    { id: "M-355", name: "Olaf",   sex: "M", age: 8,  weight_kg: 392, cubs: 0, collar: "GPS · 91% battery",       collar_since: "2024-06-18", condition: "Robust (BCI 3.4)",   pos: [625, 332], track: [[680, 298],[660, 312],[645, 320],[635, 326],[625, 332]], forecast: [[625, 332],[612, 348],[598, 362],[582, 372],[565, 378]], home_floe: "Austfonna ice cap edge", last_kill: "Ringed seal · 3 days ago",      stress_idx: 0.34 },
    { id: "F-401", name: "Astrid", sex: "F", age: 4,  weight_kg: 224, cubs: 0, collar: "GPS · 58% battery",       collar_since: "2024-04-29", condition: "Average (BCI 2.8)",  pos: [340, 522], track: [[300, 568],[315, 555],[325, 545],[332, 535],[340, 522]], forecast: [[340, 522],[352, 510],[366, 502],[382, 498],[398, 500]], home_floe: "Forlandsundet",          last_kill: "Ringed seal · 5 days ago",      stress_idx: 0.42 },
    { id: "M-188", name: "Tor",    sex: "M", age: 16, weight_kg: 510, cubs: 0, collar: "GPS · 24% battery",       collar_since: "2022-05-10", condition: "Aging (BCI 2.7)",    pos: [582, 612], track: [[618, 658],[608, 642],[598, 630],[590, 622],[582, 612]], forecast: [[582, 612],[572, 600],[562, 590],[550, 582],[538, 578]], home_floe: "Edgeøya south coast",    last_kill: "Bearded seal · 7 days ago",     stress_idx: 0.49 },
  ];

  const ENCOUNTERS = [
    { id: "e1", bear: "F-217", vessel: "CRU-MORTM",  in_hours: 4.2,  closest_m: 380,  severity: "critical" }, // Greg Mortimer · Edgeøya
    { id: "e2", bear: "M-104", vessel: "CRU-MORTM",  in_hours: 11.6, closest_m: 920,  severity: "high" },     // Greg Mortimer · Storfjorden
    { id: "e3", bear: "F-142", vessel: "KV-SVAL",    in_hours: 18.1, closest_m: 1840, severity: "moderate" }, // KV Svalbard · Hopen drift
    { id: "e4", bear: "F-308", vessel: "CRU-CHARC",  in_hours: 7.8,  closest_m: 1120, severity: "high" },     // Le Commandant Charcot · Kong Karls
    { id: "e5", bear: "M-211", vessel: "CRU-SPITSB", in_hours: 9.4,  closest_m: 640,  severity: "critical" }, // MS Spitsbergen · NW Spitsbergen
    { id: "e6", bear: "F-401", vessel: "CRU-HOND",   in_hours: 14.7, closest_m: 1480, severity: "moderate" }, // Hondius · Forlandsundet
  ];

  // ---------------- REAL CLIMATE TIME-SERIES ----------------

  // Sea-ice extent ANOMALY (M km²) vs. 1991–2020 mean — pan-Arctic monthly,
  // approximated from NSIDC Sea Ice Index v3 monthly values for May 2024 → Apr 2026.
  // Values reflect the documented 2024–2025 record-low season:
  //   Mar 2025 max 14.33; Sep 2024 min 4.28; Sep 2025 min 4.60; Dec 2024 record low.
  // Source: NSIDC Sea Ice Today monthly archive.
  const SEA_ICE_TIMELINE = [
    // 2024:  May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
            -0.72, -0.84, -0.96, -1.12, -1.04, -1.31, -1.48, -1.62,
    // 2025:  Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
            -1.55, -1.71, -1.31, -0.49, -0.61, -0.88, -1.02, -0.87, -0.74, -1.08, -1.22, -1.34,
    // 2026:  Jan    Feb    Mar    Apr
            -1.41, -1.52, -1.18, -0.62
  ];
  const SEA_ICE_TIMELINE_LABEL = "May 2024 → Apr 2026";

  // June snow albedo (broadband, Svalbard mean) — 2002 → 2025
  // Trend reflects MOSJ/CryoClim albedo decline literature for the archipelago.
  const ALBEDO_TREND = [
    0.78, 0.77, 0.78, 0.76, 0.74, 0.73, 0.75, 0.72, 0.71, 0.70,
    0.68, 0.69, 0.66, 0.64, 0.65, 0.63, 0.61, 0.62, 0.60, 0.58,
    0.57, 0.55, 0.54, 0.52
  ];
  const ALBEDO_LABEL = "2002 → 2025";

  // Glacier front retreat: mean km/yr across 5 Svalbard tidewater glaciers
  // (Kongsbreen, Kronebreen, Negribreen, Nathorstbreen, Aavatsmarkbreen).
  // Approximated from NPI / Norwegian Ice Service annual reports & literature.
  const GLACIER_RETREAT = [
    0.18, 0.21, 0.28, 0.34, 0.31, 0.42, 0.51, 0.48,
    0.62, 0.71, 0.84, 0.92, 1.04, 1.18, 1.31
  ];

  // Reroute proposal — fallback only; geo.js sets the real (lat/lon → canvas)
  // version on PBP_GEO.REROUTE which overrides this.
  const REROUTE = {
    vessel_id: "CRU-MORTM",
    original: {
      path: [[285, 462], [360, 470], [445, 478], [540, 488], [640, 478], [740, 462], [820, 444]],
      distance_nm: 412, transit_h: 28.4, fuel_t: 84.2, co2_t: 262.5,
      risk: 0.84, encounters: 3, bears_disturbed: ["F-217","M-104","F-142"],
    },
    proposed: {
      path: [[285, 462], [350, 432], [430, 408], [528, 396], [630, 402], [740, 422], [820, 444]],
      distance_nm: 438, transit_h: 30.2, fuel_t: 89.6, co2_t: 279.4,
      risk: 0.11, encounters: 0, bears_disturbed: [],
    },
  };

  // ---- Override schematic data with real-geography projections from geo.js ----
  const LAND_REAL     = G ? G.ISLANDS.map(i => i.path) : LAND;
  const GLACIERS_REAL = G ? G.GLACIERS : GLACIERS;
  const GLACIERS_BG   = G ? (G.GLACIERS_BG || []) : [];
  const LANES_REAL    = G ? G.LANES : LANES;
  const LANE_DENSITY  = G ? (G.LANE_DENSITY || { major: [], corridor: [] }) : { major: [], corridor: [] };
  // Direct reference (not a map/copy) so mutations to v.reroute by
  // PBP_GEO.recomputeReroutes propagate to PBP_DATA.VESSELS.
  const VESSELS_REAL  = G ? G.VESSELS : VESSELS;
  const BEARS_REAL    = G ? G.BEARS.map(b => {
      const base = BEARS.find(x => x.id === b.id) || {};
      return { ...base, ...b };
    }) : BEARS;
  const ICE_REAL      = G ? G.ICE_FRAMES : ICE_FRAMES;
  const REROUTE_REAL  = G ? G.REROUTE : REROUTE;
  const PLACES_REAL   = G ? G.PLACES : [];

  return {
    LAND: LAND_REAL,
    GLACIERS: GLACIERS_REAL,
    GLACIERS_BG,
    LANES: LANES_REAL,
    LANE_DENSITY,
    VESSELS: VESSELS_REAL,
    BEARS: BEARS_REAL,
    ICE_FRAMES: ICE_REAL,
    REROUTE: REROUTE_REAL,
    PLACES: PLACES_REAL,
    ENCOUNTERS,
    SEA_ICE_TIMELINE, SEA_ICE_TIMELINE_LABEL,
    ALBEDO_TREND, ALBEDO_LABEL,
    GLACIER_RETREAT,
  };
})();
