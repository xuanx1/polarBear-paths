# PolarBearPaths

A wildlife–vessel collision-risk console for the Svalbard / Barents Sea region.
Visualises collared polar bears, AIS-style vessel tracks, sea-ice extent,
glacier outlines, real per-ship-type shipping lanes, and an **A*-based vessel
reroute** that detours around bear envelopes (current position + past track +
24 h forecast) while respecting land.

<img width="1918" height="1062" alt="Screenshot 2026-05-06 174749" src="https://github.com/user-attachments/assets/79361940-3137-4826-a5b1-bdd8f33102de" />

## Files

| File | Role |
|---|---|
| `PolarBearPaths.html` | Entry point. Loads scripts and mounts the React app. |
| `geo.js` | **Real geographic data** — coastline rings, glacier outlines, bear positions / tracks / forecasts, vessels, lanes, A* reroute. Uses lat/lon and a polar-stereographic projection. |
| `data.js` | Climate time series, encounter list, population stats, sources. Pulls geographic features from `geo.js`. |
| `seaice-data.js` | NSIDC monthly extent polygons (Mar / Jun / Sep / Dec) — `window.PBP_ICE_RAW`. |
| `glaciers-data.js` | CryoClim Svalbard glacier outlines — `window.PBP_GLACIERS_REAL` (271 polygons). |
| `vessels-data.js` | EMODnet 2024 vessel-density polygon envelopes — `window.PBP_VESSEL_DENSITY` (major + corridor). |
| `lanes-data.js` | EMODnet 2024 per-ship-type centerline polylines — `window.PBP_LANES_REAL` (all + fishing + passenger). |
| `svalbard-rings.js` | OSM coastline rings — `window.PBP_SVALBARD_RINGS` (102 islands, ~4,235 vertices). |
| `styles.css` | Design tokens, palettes, layout (3-column grid: 320 / 1fr / 380, rows 56 / 1fr / 260). |
| `map.jsx` | Polar map (SVG layers, pan/zoom, time-aware vessel/bear marker rotation, in-map overlays). |
| `panels.jsx` | Left rail (layers, encounters, bear list) + right rail (bear/vessel detail + per-vessel reroute hero). |
| `climate.jsx` | Bottom strip: sea-ice anomaly, glacier retreat, June albedo. |
| `tweaks-panel.jsx` | Tweaks UI primitives. |
| `app.jsx` | Root component, layout, time scrubber state, debounced reroute recompute. |

### Data pipeline

The five `*-data.js` files (`svalbard-rings.js`, `seaice-data.js`,
`glaciers-data.js`, `vessels-data.js`, `lanes-data.js`) are pre-generated
from raw sources by Python build scripts and shipped checked-in. The viz
itself never reads from those raw sources — `PolarBearPaths.html` only
loads the generated JS files.

The Python scripts (`build_coastline.py`, `build_glaciers.py`,
`build_vessels.py`, `build_lanes.py`, `refresh_coastline_cache.py`) and
the source `uploads/` (raw EMODnet GeoTIFFs, CryoClim shapefile, NSIDC
GeoJSONs, OSM Overpass cache) are **not part of this deployment** — they
live in a separate build directory. To regenerate any layer, re-add them
and run the matching build script. URLs and raw-file expectations:

- **OSM coastline** — Overpass query `way[natural=coastline]` in bbox
  (lat 73–81.5, lon 9–35.5). Cached to `uploads/svalbard_coastline_osm.json`.
- **NSIDC sea-ice (v4 monthly extents)** — `https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/shapefiles/shp_extent/`
- **CryoClim Svalbard glacier outlines (2001–2010)** — Norwegian Polar
  Institute, *Glacier Area Outlines, Svalbard*.
- **EMODnet vessel density 2024** — Human Activities portal,
  rasters `vesseldensity_all_2024.tif` (code 00 = all),
  `vesseldensity_01_2024.tif` (01 = fishing),
  `vesseldensity_08_2024.tif` (08 = passenger).

---

## Projection

Every map feature is stored as `[lon, lat]` (WGS-84 decimal degrees) and
projected at runtime using a **polar stereographic projection** centred on
**78°N, 18°E**. Output is scaled to fit a 1000×1000 SVG canvas with
`PADDING = 50` (islands fill ~90% of the viewBox), then shifted down by
`Y_OFFSET = 100` (10% of canvas) so the visible region centres better in
typical widescreen containers. The SVG is rendered with
`preserveAspectRatio="xMidYMid slice"`; pan + wheel-zoom (1×–8×) are
constrained to the canvas bounds.

Reference points used to verify the projection (NPI / Norwegian Mapping Authority):

| Place | Lat | Lon |
|---|---|---|
| Longyearbyen | 78.2232 N | 15.6469 E |
| Ny-Ålesund | 78.9242 N | 11.9266 E |
| Hopen | 76.5083 N | 25.0167 E |
| Kong Karls Land | 78.9167 N | 28.9333 E |
| Bjørnøya | 74.4333 N | 19.1000 E |
| Kongsbreen front | 78.9933 N | 12.9500 E |
| Negribreen front | 78.5500 N | 20.4500 E |
| Austfonna Basin-3 | 79.6200 N | 24.3000 E |
| Nathorstbreen front | 77.5500 N | 16.2000 E |

---

## Data sources

### Coastline (OpenStreetMap — wired)

Svalbard coastline comes from an **OpenStreetMap Overpass dump** of
`way[natural=coastline]` in the bbox (lat 73–81.5, lon 9–35.5). The build
script glues OSM ways end-to-end into closed rings and emits **102 island
polygons / ~4,235 vertices** at ~500 m DP-simplification tolerance — every
major island down to small skerries.

| Island | Vertex count |
|---|---|
| Spitsbergen (incl. all major fjords) | 2,012 |
| Nordaustlandet | 804 |
| Edgeøya | 162 |
| Prins Karls Forland | 162 |
| Barentsøya | 95 |
| Kong Karls Land | 54 |
| Bjørnøya | 51 |
| Hopen / Moffen / Kvitøya / 95 smaller skerries | 895 combined |

Replaces a previous 5-ring / 210-vertex outline.

### Sea ice extent — climate series (NSIDC)

`SEA_ICE_TIMELINE` — pan-Arctic monthly extent **anomaly** (M km²) vs.
**1991–2020 mean**, May 2024 → Apr 2026. Values reflect the documented
2024–2025 record-low season:

- **Mar 22 2025 maximum: 14.33 M km²** — record low in the 47-yr satellite record.
- **Sep 11 2024 minimum: 4.28 M km²** — 7th lowest in the 46-yr record.
- **Sep 10 2025 minimum: 4.60 M km²** — tied 10th lowest with 2008 and 2010.
- **Dec 2024: 11.43 M km²** — lowest December in the satellite record.
- **Apr 2025: 13.91 M km²** — tied 9th lowest.

Source: NSIDC *Sea Ice Today* monthly archive,
https://nsidc.org/sea-ice-today/analyses

### Sea-ice extent polygons (NSIDC v4.0 — wired)

The four sea-ice frames on the map (Mar / Jun / Sep / Dec) use the **real
NSIDC G02135 v4.0 monthly extent polygons**, reprojected from EPSG:3411
(NSIDC Polar Stereographic North) to WGS-84 and clipped to the Svalbard
bbox (lon −5…45, lat 73…84). Output in `seaice-data.js`.

### Glacier outlines (CryoClim / NPI 2001–2010 — wired)

The map overlays **real CryoClim Svalbard glacier outlines** (NPI /
Norwegian Ice Service, *Glacier Area Outlines, Svalbard, 2001–2010*).
Source: 1,668 polygons in EPSG:32633 UTM 33N, reprojected to WGS-84 and
filtered to **271 polygons** (every tidewater glacier + every glacier
≥ 30 km²). The five retreat-panel glaciers are matched by stable `IDENT`:

| Panel id | CryoClim NAME | IDENT | Area |
|---|---|---|---|
| `g_kongs` | Kongsbreen | 15511.1 | 378 km² |
| `g_krone` | Kronebreen | 15511.2 | 295 km² |
| `g_neg`   | Negribreen | 11105.1 | 963 km² |
| `g_aust`  | Austfonna · Bråsvellbreen (= Basin-3) | 21110.0 | 1,096 km² |
| `g_nathorst` | Nathorstbreen | 13214.1 | 180 km² |

### Glacier front retreat — climate series (NPI / Norwegian Ice Service)

`GLACIER_RETREAT` — mean km/yr across 5 Svalbard tidewater glaciers,
2011 → 2025. Per-glacier notes:

- **Kongsbreen** — −5.0 km over 30 yrs; −600 to −800 m in 6 weeks summer 2022.
- **Kronebreen** — among Svalbard's fastest (Schellenberger et al., Radarsat-2 SAR).
- **Negribreen** — active surge since 2016; peak >25 m day⁻¹ (Schellenberger 2017).
- **Austfonna Basin-3** — surging since 2012; calving discharge tripled (Dunse et al.).
- **Nathorstbreen** — pulsating; advanced 20 km in 2009–2011 (Nuth et al.).

### Snow albedo (MOSJ)

`ALBEDO_TREND` — Svalbard mean June broadband reflectance, 2002 → 2025.
Trend from MOSJ / CryoClim albedo decline literature (~0.78 → 0.52,
≈ −33% reflectance over 24 yrs).

### Vessel-density envelopes (EMODnet 2024 — wired)

`vessels-data.js` (`window.PBP_VESSEL_DENSITY`) holds polygon envelopes
extracted from the **EMODnet Human Activities — Vessel Density 2024 annual
raster** (EPSG:3035, 1 km, vessel-hours per km² per year, ship-type code 00):

- **major** (≥ p98) — 16 polygons over the thickest lanes (Longyearbyen
  approach, Forlandsundet, Murmansk approaches).
- **corridor** (≥ p90) — 25 polygons covering the broader regularly-trafficked
  envelope (Bjørnøya fishing, NSR transit).

### Per-ship-type lanes (EMODnet 2024 — wired)

`lanes-data.js` (`window.PBP_LANES_REAL`) holds **centerline polylines**
extracted from three EMODnet 2024 rasters by ship-type code:

- **all** (code 00) — 12 lanes, 3,007 km of combined corridor centerline.
- **fishing** (code 01) — 12 lanes, 1,266 km.
- **passenger** (code 08) — 12 lanes, 1,218 km.

Pipeline: smooth → percentile-threshold → connected-components →
skeletonize → 4–6 step spur-prune → walk → DP simplify → reproject. Each
lane carries a region label (NW Spitsbergen · Forlandsundet, Hornsund · S
Spitsbergen, Storfjorden · E Spitsbergen, Bjørnøya · S Barents, E Barents ·
Murmansk approach, etc.) and a length in km, exposed in tooltips.

### Vessels (10 real ships, snapped to lanes)

The fleet on the map is **10 real ships documented to operate in Svalbard
waters**. Each is snapped to a type-matched EMODnet lane; the position
along the lane is given by `pos_t ∈ [0,1]`. Headings are derived live from
the local segment direction — markers face their travel direction.

| ID | Ship | Operator | Lane snap | Type |
|---|---|---|---|---|
| `CRU-SPITSB` | MS Spitsbergen | Hurtigruten Expeditions | Forlandsundet | Expedition cruise |
| `CRU-HANSE` | HANSEATIC nature | Hapag-Lloyd Cruises | Hornsund / S Spitsbergen | Expedition cruise |
| `CRU-CHARC` | Le Commandant Charcot | Ponant | N Spitsbergen / NSR | PC2 polar cruise |
| `CRU-PLANC` | Plancius | Oceanwide Expeditions | Barents Sea approach | Expedition cruise |
| `CRU-HOND` | Hondius | Oceanwide Expeditions | NW Spitsbergen / Forlandsundet | PC6 expedition cruise |
| `CRU-MORTM` | Greg Mortimer | Aurora Expeditions | Storfjorden / E Spitsbergen | Expedition cruise |
| `CRU-EARLE` | Sylvia Earle | Aurora Expeditions | Hornsund / Bellsund | Expedition cruise |
| `RES-HAAKON` | Kronprins Haakon | Norwegian Polar Institute | Storfjorden | Ice-class research |
| `KV-SVAL` | KV Svalbard | Norwegian Coast Guard | Hornsund / S Spitsbergen | Coast Guard cutter |
| `RES-GOSARS` | G.O. Sars | IMR Norway | S Barents fishing zone | Fisheries research |

Sources: each operator's public fleet page (hurtigruten.com, hl-cruises.com,
ponant.com, oceanwide-expeditions.com, aurora-expeditions.com, npolar.no,
forsvaret.no, hi.no). Length / draft / speed values are approximate —
**cross-check against Lloyd's List / IMO before any client-facing
deliverable**. Cargo strings, ETAs, and per-vessel encounter counts remain
illustrative.

### Polar bears (illustrative, parameters from NPI literature)

11 collared individuals with synthetic IDs (`F-217`, `M-104`, `F-308`,
`M-211`, `F-142`, `M-355`, `F-401`, `M-188`, `F-512`, `M-440`, `F-623`),
each with a current `ll`, a 5-step past `track_ll`, and a 5-step 24h
`forecast_ll`.

- Subpopulation sizes: ~265 bears in Svalbard area (Aars 2015), ~2,650 in
  the Barents subpopulation.
- Movement scales (~25 km/day step, home-range sizes) consistent with
  Andersen et al. and Aars et al. tracking studies.
- **Individual records are illustrative** — NPI does not release Svalbard
  collar tracks publicly (animal-welfare / poaching-risk policy). For
  real telemetry, see USGS Alaska Science Center (Beaufort Sea polar bear
  GPS data, public via DOI) or Movebank study searches.

---

## Reroute algorithm (A* on a navigation grid)

For every vessel with at least one bear within `BUFFER_KM = 25` of the
**interior** (middle 70%) of its remaining lane, the runtime computes an
A* detour with hard land blocking and soft bear-envelope cost.

**Pipeline** (`geo.js`, `runRerouteComputation` and `aStarReroute`):

1. **Build a per-vessel grid** covering the lane's start–goal bbox + 4° lon /
   1.5° lat padding (so far detours like Hinlopen Strait are reachable).
   Cell size 0.10° lon × 0.03° lat (~2.3 km × 3.3 km at 78°N).
2. **Land mask** — point-in-polygon against all 102 OSM coastline rings
   with bbox prefilter; cells whose centre or edge midpoint falls on land
   are hard-blocked (so segments don't cut through skerries that are
   smaller than a cell).
3. **Bear cost** — for each cell, compute the closest distance to any bear
   envelope point (current + past track + 24 h forecast). If the cell is
   inside `BUFFER_KM + MARGIN_KM = 35 km`, add `(35 − dist) × 25` to the
   cell's traversal cost. Bear envelope points within 8 km of either
   endpoint are excluded (those bears can't be avoided by routing alone).
4. **A*** with admissible haversine heuristic; expand 8-connected neighbours.
   Grid is searched freshly per recompute (no caching across buffer / time
   changes).
5. **Path reconstruction + DP simplification** (2 km tolerance).
6. **Score every candidate vessel**; pick the one with the **largest min-sep
   improvement** (interior closest-approach in the proposed path minus the
   original). The "useful" flag requires ≥ 1 km gain.

**Reactivity** — the algorithm **re-runs** when:
- the **wildlife buffer slider** in the left panel changes (`bufferKm`), or
- the **time scrubber** moves (`timeIdx`). The reroute starts from the
  vessel's *current* position (its lane fraction at `timeIdx/23`), not the
  lane origin — so as time advances, the proposed detour begins where the
  ship actually is.

Both effects are debounced (350 ms) and run inside `requestAnimationFrame`
so the slider stays smooth. A* across all ~5 candidate vessels takes
~1–2 s on a typical browser.

The right panel uses **per-vessel** reroute data (`vessel.reroute`), so
clicking any vessel shows its own proposed detour or an honest
"no useful reroute — geographic constraint" message (e.g. Greg Mortimer
in Storfjorden, walled in by Spitsbergen / Edgeøya / Barentsøya).

---

## Climate panels — exact values shown

| Panel | Series | Units | Source |
|---|---|---|---|
| Sea ice extent — anomaly | May 2024 → Apr 2026, monthly | M km² vs. 1991–2020 | NSIDC Sea Ice Index |
| Glacier front retreat | 2011 → 2025 | km/yr (mean of 5 tidewater glaciers) | NPI / Norwegian Ice Service |
| Snow albedo · June | 2002 → 2025 | broadband reflectance | MOSJ / CryoClim |

Axis labels are rendered as HTML overlays on top of each chart container,
not as SVG `<text>`, so the chart paths can stretch with `preserveAspectRatio="none"` without warping the numbers.

---

## Caveats

- **Bear records are illustrative.** Movement scales and parameters are
  drawn from NPI tracking literature, but per-bear positions and forecasts
  are synthetic. Three of the eleven (`F-512`, `M-440`, `F-623`) were
  added specifically to give the reroute algorithm geographically-detourable
  scenarios where it can demonstrate a useful detour.
- **Vessel cargo / ETA / encounter counts are illustrative.** The 10
  ship names, operators, lane assignments, and approximate dimensions are
  real; positions on a specific date would need live AIS (BarentsWatch,
  PAME ASTD, AISHub).
- **Vessel-density envelopes and shipping lanes are real** (EMODnet 2024).
- **Sea-ice and glacier polygons are real** (NSIDC v4.0 / CryoClim
  2001–2010), simplified to ~200 m / ~400 m tolerance.
- **Coastline is real** (OSM, ~500 m simplification).
- **Reroute can be infeasible.** When a vessel's lane is geographically
  walled-in (Greg Mortimer in Storfjorden), the algorithm honestly reports
  "no useful reroute" rather than fabricating a green line.
