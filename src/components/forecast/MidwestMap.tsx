'use client';

import { useEffect, useMemo, useState } from 'react';
import { ForecastLocation, ForecastSnapshot } from '@/src/lib/api';
import styles from './midwestMap.module.css';
import farmStyles from '@/src/styles/farm.module.css';

/** Which delta is driving the marker colors. */
type Metric = 'TEMP' | 'PRECIP';

/* ── Projection setup ───────────────────────────────────────────── */

/** Midwest bounding box — drives the equirectangular projection. */
const BOUNDS = { latMin: 35.0, latMax: 50.0, lonMin: -104.5, lonMax: -80.0 };
const WIDTH  = 800;
const HEIGHT = 500;

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * WIDTH,
    y: ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * HEIGHT,
  };
}

/* ── US Drought Monitor layer ─────────────────────────────────────
   Current-week drought polygons from the USDM ArcGIS FeatureServer,
   clipped to our map envelope and generalized (maxAllowableOffset) to
   keep the payload light. Field `DM` is the category 0–4 = D0–D4. */
const DROUGHT_QUERY =
  'https://services5.arcgis.com/0OTVzJS4K09zlixn/arcgis/rest/services/USDM_current/FeatureServer/0/query' +
  '?where=1%3D1&outFields=DM%2CMapDate&returnGeometry=true&outSR=4326&inSR=4326' +
  '&geometryType=esriGeometryEnvelope' +
  `&geometry=${BOUNDS.lonMin}%2C${BOUNDS.latMin}%2C${BOUNDS.lonMax}%2C${BOUNDS.latMax}` +
  '&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0.02&f=geojson';

/** Official USDM category colors + labels, indexed by DM (0–4). */
const DM_COLORS = ['#ffff00', '#fcd37f', '#ffaa00', '#e60000', '#730000'];
const DM_LABELS = ['D0 Abnormally Dry', 'D1 Moderate', 'D2 Severe', 'D3 Extreme', 'D4 Exceptional'];
function dmColor(dm: number): string { return DM_COLORS[dm] ?? '#ffff00'; }

interface DroughtPoly { dm: number; geometry: GeoFeature['geometry']; }

/* ── Point-in-polygon (so a marker can report its drought category) ──
   Standard ray-casting on [lon, lat] rings. USDM polygons are cumulative
   (a D3 area also lies inside the D0–D2 polygons), so we take the worst
   category whose polygon contains the point. */
function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
function pointInPolygon(x: number, y: number, poly: number[][][]): boolean {
  if (poly.length === 0 || !pointInRing(x, y, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (pointInRing(x, y, poly[k])) return false; // hole
  return true;
}
function geomContains(x: number, y: number, g: GeoFeature['geometry']): boolean {
  return g.type === 'Polygon'
    ? pointInPolygon(x, y, g.coordinates)
    : g.coordinates.some(p => pointInPolygon(x, y, p));
}
function droughtCategoryAt(lon: number, lat: number, polys: DroughtPoly[]): number | null {
  let worst = -1;
  for (const p of polys) if (geomContains(lon, lat, p.geometry)) worst = Math.max(worst, p.dm);
  return worst >= 0 ? worst : null;
}

/** States rendered in our map view. */
const MIDWEST_STATES = new Set([
  'Minnesota', 'Wisconsin', 'Michigan',
  'Iowa', 'Illinois', 'Indiana', 'Ohio',
  'Missouri', 'Kansas', 'Nebraska',
  'South Dakota', 'North Dakota',
  'Kentucky', 'Tennessee',
]);

/** Approximate label anchor per state (lat, lon) — keeps name labels off the borders. */
const STATE_LABEL_ANCHORS: Record<string, { lat: number; lon: number }> = {
  'Minnesota':     { lat: 46.5, lon: -94.5 },
  'Wisconsin':     { lat: 44.8, lon: -90.0 },
  'Michigan':      { lat: 44.0, lon: -85.0 },
  'Iowa':          { lat: 42.0, lon: -93.5 },
  'Illinois':      { lat: 40.2, lon: -89.2 },
  'Indiana':       { lat: 40.0, lon: -86.3 },
  'Ohio':          { lat: 40.3, lon: -82.8 },
  'Missouri':      { lat: 38.5, lon: -92.7 },
  'Kansas':        { lat: 38.5, lon: -98.5 },
  'Nebraska':      { lat: 41.5, lon: -99.7 },
  'South Dakota':  { lat: 44.5, lon: -100.0 },
  'North Dakota':  { lat: 47.5, lon: -100.4 },
  'Kentucky':      { lat: 37.6, lon: -85.3 },
  'Tennessee':     { lat: 35.8, lon: -86.5 },
};

/* ── GeoJSON → SVG path ────────────────────────────────────────── */

interface GeoFeature {
  type: 'Feature';
  properties: { name: string };
  geometry:
    | { type: 'Polygon';      coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] };
}

function ringToPath(ring: number[][]): string {
  return ring.map(([lon, lat], i) => {
    const { x, y } = project(lat, lon);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

function geometryToPath(g: GeoFeature['geometry']): string {
  if (g.type === 'Polygon') {
    return g.coordinates.map(ringToPath).join(' ');
  }
  return g.coordinates.flat().map(ringToPath).join(' ');
}

/* ── Per-location average deltas ──────────────────────────────── */

/**
 * Mean (current − previous) across the next 5 forecast days. We average both
 * High and Low deltas together for the temperature view, and average precip%
 * deltas for the precipitation view. Returns null if there's not enough data.
 */
function avgTempDelta(curr: ForecastSnapshot | null, prev: ForecastSnapshot | null): number | null {
  if (!curr?.days || !prev?.days) return null;
  const prevMap = new Map<string, NonNullable<ForecastSnapshot['days']>[number]>();
  for (const d of prev.days) prevMap.set(d.day, d);
  let sum = 0, n = 0;
  for (const d of curr.days.slice(0, 5)) {
    const p = prevMap.get(d.day);
    if (!p) continue;
    if (d.high != null && p.high != null) { sum += d.high - p.high; n++; }
    if (d.low  != null && p.low  != null) { sum += d.low  - p.low;  n++; }
  }
  return n > 0 ? sum / n : null;
}

function avgPrecipDelta(curr: ForecastSnapshot | null, prev: ForecastSnapshot | null): number | null {
  if (!curr?.days || !prev?.days) return null;
  const prevMap = new Map<string, NonNullable<ForecastSnapshot['days']>[number]>();
  for (const d of prev.days) prevMap.set(d.day, d);
  let sum = 0, n = 0;
  for (const d of curr.days.slice(0, 5)) {
    const p = prevMap.get(d.day);
    if (!p) continue;
    if (d.precipChance != null && p.precipChance != null) {
      sum += d.precipChance - p.precipChance;
      n++;
    }
  }
  return n > 0 ? sum / n : null;
}

/* ── Marker color from a delta ────────────────────────────────── */

const NO_DATA_COLOR = '#9ca3af';     // grey for "no previous snapshot"
// Pure light→strong ramps (no grey midpoint, so even small deltas read as a
// clean light blue / light red instead of muddy bluish-grey or brown).
const BLUE_LIGHT:  [number, number, number] = [191, 219, 254]; // #bfdbfe
const BLUE_STRONG: [number, number, number] = [ 29,  78, 216]; // #1d4ed8
const RED_LIGHT:   [number, number, number] = [254, 202, 202]; // #fecaca
const RED_STRONG:  [number, number, number] = [220,  38,  38]; // #dc2626
const ZERO_COLOR = '#d1d5db'; // no-change dots render hollow, so this is rarely seen

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}
function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): string {
  return `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;
}

/** Temperature marker color — caps at ±5°F so even modest deltas pop. */
function markerTempColor(delta: number | null): string {
  if (delta == null) return NO_DATA_COLOR;
  const cap = 5;
  const mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return lerpColor(RED_LIGHT, RED_STRONG, mag);   // warmer
  if (delta < 0) return lerpColor(BLUE_LIGHT, BLUE_STRONG, mag); // cooler
  return ZERO_COLOR;
}

/** Precip marker color — caps at ±20 percentage points. */
function markerPrecipColor(delta: number | null): string {
  if (delta == null) return NO_DATA_COLOR;
  const cap = 20;
  const mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return lerpColor(BLUE_LIGHT, BLUE_STRONG, mag); // wetter
  if (delta < 0) return lerpColor(RED_LIGHT, RED_STRONG, mag);   // drier
  return ZERO_COLOR;
}

/* ── Marker appearance ────────────────────────────────────────────
   Only a real change gets a solid, colored, shadowed dot. Everything
   else is hollow so changes are the only thing that "pops":
     • no previous snapshot (delta null) → dashed faint ring
     • change below the threshold         → thin solid ring
   Thresholds are small so genuine shifts still register. */
const TEMP_EPS   = 0.5;   // °F (averaged hi+lo delta)
const PRECIP_EPS = 1.5;   // percentage points

interface MarkerVisual {
  fill: string; stroke: string; strokeWidth: number;
  dash?: string; shadow: boolean; r: number;
}

function markerVisual(delta: number | null, metric: Metric): MarkerVisual {
  if (delta == null) {
    // No baseline to compare against yet (new location / first snapshot only).
    return { fill: 'transparent', stroke: '#b8bdab', strokeWidth: 1.5, dash: '2 2', shadow: false, r: 6 };
  }
  const eps = metric === 'TEMP' ? TEMP_EPS : PRECIP_EPS;
  if (Math.abs(delta) < eps) {
    // Tracked, but essentially no change since the last snapshot.
    return { fill: 'transparent', stroke: '#a7ad97', strokeWidth: 1.5, shadow: false, r: 6 };
  }
  const fill = metric === 'TEMP' ? markerTempColor(delta) : markerPrecipColor(delta);
  return { fill, stroke: '#fff', strokeWidth: 2, shadow: true, r: 8 };
}

/* ── Tooltip helpers ──────────────────────────────────────────── */

interface DayDelta {
  day: string;
  high?: number;
  low?: number;
  precip?: number;
  highDelta: number | null;
  lowDelta: number | null;
  precipDelta: number | null;
}

function parseSnap(json: string | null | undefined): ForecastSnapshot | null {
  if (!json) return null;
  try { return JSON.parse(json) as ForecastSnapshot; }
  catch { return null; }
}

function buildDeltas(curr: ForecastSnapshot | null, prev: ForecastSnapshot | null): DayDelta[] {
  if (!curr?.days) return [];
  const prevMap = new Map<string, NonNullable<ForecastSnapshot['days']>[number]>();
  if (prev?.days) for (const d of prev.days) prevMap.set(d.day, d);
  return curr.days.slice(0, 5).map(d => {
    const p = prevMap.get(d.day);
    return {
      day: d.day,
      high: d.high,
      low: d.low,
      precip: d.precipChance,
      highDelta:   d.high   != null && p?.high   != null ? d.high   - p.high   : null,
      lowDelta:    d.low    != null && p?.low    != null ? d.low    - p.low    : null,
      precipDelta: d.precipChance != null && p?.precipChance != null ? d.precipChance - p.precipChance : null,
    };
  });
}

function tempColor(delta: number | null): string {
  if (delta == null) return 'transparent';
  const cap = 10, mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return `rgba(220, 60, 60, ${(0.10 + 0.32 * mag).toFixed(2)})`;
  if (delta < 0) return `rgba(40, 100, 220, ${(0.10 + 0.32 * mag).toFixed(2)})`;
  return 'transparent';
}
function precipColor(delta: number | null): string {
  if (delta == null) return 'transparent';
  const cap = 40, mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return `rgba(30, 110, 210, ${(0.10 + 0.40 * mag).toFixed(2)})`;
  if (delta < 0) return `rgba(190, 150, 70, ${(0.10 + 0.40 * mag).toFixed(2)})`;
  return 'transparent';
}

function fmtTs(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "▲10" / "▼5" / "±0" — how much this value moved since the previous snapshot. */
function fmtDelta(d: number | null): string {
  if (d == null) return '—';
  const r = Math.round(d);
  if (r === 0) return '±0';
  return `${r > 0 ? '▲' : '▼'}${Math.abs(r)}`;
}

/* ── Component ────────────────────────────────────────────────── */

interface Props {
  locations: ForecastLocation[];
}

export default function MidwestMap({ locations }: Props) {
  const [stateFeatures, setStateFeatures] = useState<GeoFeature[]>([]);
  const [error, setError]     = useState('');
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [hoverXY, setHoverXY] = useState<{ x: number; y: number } | null>(null);
  const [metric, setMetric]   = useState<Metric>('TEMP');

  // US Drought Monitor background layer
  const [drought, setDrought]       = useState<DroughtPoly[]>([]);
  const [droughtDate, setDroughtDate] = useState<Date | null>(null);
  const [showDrought, setShowDrought] = useState(true);

  /**
   * Per-location delta the markers are colored by. Computed once per
   * (locations × metric) — cheap, but worth memoizing so hover doesn't trigger
   * recompute.
   */
  const deltas = useMemo(() => {
    const out = new Map<number, number | null>();
    for (const loc of locations) {
      if (loc.id == null) continue;
      const curr = parseSnap(loc.currentSnapshotJson);
      const prev = parseSnap(loc.previousSnapshotJson);
      out.set(loc.id, metric === 'TEMP'
        ? avgTempDelta(curr, prev)
        : avgPrecipDelta(curr, prev),
      );
    }
    return out;
  }, [locations, metric]);

  // Load state outlines once
  useEffect(() => {
    let cancelled = false;
    fetch('https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json')
      .then(r => r.json())
      .then(geojson => {
        if (cancelled) return;
        const feats = (geojson.features as GeoFeature[])
          .filter(f => MIDWEST_STATES.has(f.properties.name));
        setStateFeatures(feats);
      })
      .catch(() => { if (!cancelled) setError('Could not load map outlines.'); });
    return () => { cancelled = true; };
  }, []);

  // Load current US Drought Monitor polygons once
  useEffect(() => {
    let cancelled = false;
    fetch(DROUGHT_QUERY)
      .then(r => r.json())
      .then((geo: { features?: { properties?: { DM?: number; MapDate?: number }; geometry?: GeoFeature['geometry'] }[] }) => {
        if (cancelled) return;
        const polys: DroughtPoly[] = (geo.features ?? [])
          .filter(f => f.geometry)
          .map(f => ({ dm: f.properties?.DM ?? 0, geometry: f.geometry as GeoFeature['geometry'] }))
          // draw worse categories last so they sit on top of milder ones
          .sort((a, b) => a.dm - b.dm);
        setDrought(polys);
        const md = geo.features?.find(f => f.properties?.MapDate)?.properties?.MapDate;
        if (md) setDroughtDate(new Date(md));
      })
      .catch(() => { /* drought layer is optional — fail quietly */ });
    return () => { cancelled = true; };
  }, []);

  const hoverLoc = useMemo(
    () => locations.find(l => l.id === hoverId) ?? null,
    [hoverId, locations],
  );

  const hoverDeltas = useMemo(() => {
    if (!hoverLoc) return [];
    return buildDeltas(
      parseSnap(hoverLoc.currentSnapshotJson),
      parseSnap(hoverLoc.previousSnapshotJson),
    );
  }, [hoverLoc]);

  // Drought category at the hovered location (null = not in drought)
  const hoverDm = useMemo(() => {
    if (!hoverLoc || hoverLoc.lat == null || hoverLoc.lon == null || drought.length === 0) return null;
    return droughtCategoryAt(hoverLoc.lon, hoverLoc.lat, drought);
  }, [hoverLoc, drought]);

  return (
    <div className={styles.mapWrap}>
      {/* Metric selector */}
      <div className={styles.metricBar}>
        <span className={styles.metricLabel}>Color dots by:</span>
        <div style={{ display: 'flex', gap: '.35rem' }}>
          <button
            type="button"
            onClick={() => setMetric('TEMP')}
            className={`${farmStyles.filterPill} ${metric === 'TEMP' ? farmStyles.filterPillActive : ''}`}
          >
            🌡️ Temperature
          </button>
          <button
            type="button"
            onClick={() => setMetric('PRECIP')}
            className={`${farmStyles.filterPill} ${metric === 'PRECIP' ? farmStyles.filterPillActive : ''}`}
          >
            💧 Precipitation
          </button>
          <button
            type="button"
            onClick={() => setShowDrought(s => !s)}
            className={`${farmStyles.filterPill} ${showDrought ? farmStyles.filterPillActive : ''}`}
            title="Toggle the current US Drought Monitor layer"
          >
            🏜️ Drought {showDrought ? 'on' : 'off'}
          </button>
        </div>
        <Legend metric={metric} />
      </div>

      {/* Drought legend + release date */}
      {showDrought && drought.length > 0 && <DroughtLegend asOf={droughtDate} />}

      {error && <p className={styles.error}>{error}</p>}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.mapSvg}
        onMouseLeave={() => { setHoverId(null); setHoverXY(null); }}
      >
        {/* States (base fill) */}
        <g>
          {stateFeatures.map(f => (
            <path
              key={f.properties.name}
              d={geometryToPath(f.geometry)}
              className={styles.statePath}
            />
          ))}
        </g>

        {/* US Drought Monitor layer — sits over the state fill, under markers */}
        {showDrought && (
          <g style={{ pointerEvents: 'none' }}>
            {drought.map((d, i) => (
              <path
                key={`dm-${i}`}
                d={geometryToPath(d.geometry)}
                fill={dmColor(d.dm)}
                fillOpacity={0.5}
                fillRule="evenodd"
              />
            ))}
          </g>
        )}

        {/* Re-draw crisp state borders on top of the drought fill */}
        {showDrought && drought.length > 0 && (
          <g style={{ pointerEvents: 'none' }}>
            {stateFeatures.map(f => (
              <path
                key={`border-${f.properties.name}`}
                d={geometryToPath(f.geometry)}
                className={styles.stateBorder}
              />
            ))}
          </g>
        )}

        {/* State labels */}
        <g>
          {stateFeatures.map(f => {
            const a = STATE_LABEL_ANCHORS[f.properties.name];
            if (!a) return null;
            const { x, y } = project(a.lat, a.lon);
            return (
              <text key={`label-${f.properties.name}`}
                x={x} y={y} className={styles.stateLabel}
                textAnchor="middle"
              >
                {f.properties.name}
              </text>
            );
          })}
        </g>

        {/* Location markers — colored by the selected metric's per-location delta */}
        <g>
          {locations.map(loc => {
            if (loc.lat == null || loc.lon == null) return null;
            const { x, y } = project(loc.lat, loc.lon);
            const isHover = hoverId === loc.id;
            const delta = loc.id != null ? deltas.get(loc.id) ?? null : null;
            const v = markerVisual(delta, metric);
            return (
              <g key={loc.id}>
                <circle
                  cx={x} cy={y}
                  r={isHover ? v.r + 3 : v.r}
                  style={{
                    fill: v.fill,
                    stroke: isHover ? '#1a2e0f' : v.stroke,
                    strokeWidth: isHover ? v.strokeWidth + 0.6 : v.strokeWidth,
                    strokeDasharray: v.dash,
                    filter: v.shadow ? undefined : 'none',
                  }}
                  className={styles.marker}
                  onMouseEnter={(e) => {
                    setHoverId(loc.id ?? null);
                    setHoverXY({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setHoverXY({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => { setHoverId(null); setHoverXY(null); }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <MarkerKey metric={metric} />

      {/* Hover tooltip — positioned in viewport coords */}
      {hoverLoc && hoverXY && (
        <div
          className={styles.tooltip}
          style={{
            position: 'fixed',
            left: Math.min(hoverXY.x + 15, window.innerWidth - 340),
            top: Math.min(hoverXY.y + 15, window.innerHeight - 280),
          }}
        >
          <h4>📍 {hoverLoc.name}</h4>
          <p className={styles.tooltipMeta}>
            Updated <strong>{fmtTs(hoverLoc.currentFetchedAt)}</strong>
          </p>

          {drought.length > 0 && (
            <p className={styles.tooltipDrought}>
              {hoverDm == null ? (
                <>🌧️ Not in drought</>
              ) : (
                <>
                  <span
                    style={{
                      width: 11, height: 11, borderRadius: 2, display: 'inline-block',
                      background: dmColor(hoverDm), border: '1px solid #cbb', marginRight: 5,
                      verticalAlign: 'middle',
                    }}
                  />
                  Drought: <strong>{DM_LABELS[hoverDm]}</strong>
                </>
              )}
            </p>
          )}

          {hoverDeltas.length === 0 ? (
            <p className={styles.tooltipEmpty}>No forecast snapshot yet.</p>
          ) : (
            <table className={styles.tooltipTable}>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Hi</th>
                  <th>Lo</th>
                  <th>Pcp</th>
                </tr>
              </thead>
              <tbody>
                {hoverDeltas.map(d => (
                  <tr key={d.day}>
                    <td className={styles.tooltipDay}>{d.day}</td>
                    <td style={{ background: tempColor(d.highDelta) }}>
                      <span className={styles.cellVal}>{d.high != null ? `${Math.round(d.high)}°` : '—'}</span>
                      <span className={styles.deltaTag}>{fmtDelta(d.highDelta)}</span>
                    </td>
                    <td style={{ background: tempColor(d.lowDelta) }}>
                      <span className={styles.cellVal}>{d.low != null ? `${Math.round(d.low)}°` : '—'}</span>
                      <span className={styles.deltaTag}>{fmtDelta(d.lowDelta)}</span>
                    </td>
                    <td style={{ background: precipColor(d.precipDelta) }}>
                      <span className={styles.cellVal}>{d.precip != null ? `${d.precip}%` : '—'}</span>
                      <span className={styles.deltaTag}>{fmtDelta(d.precipDelta)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {hoverDeltas.length > 0 && (
            <p className={styles.tooltipFoot}>▲ / ▼ = change since previous snapshot</p>
          )}
        </div>
      )}
    </div>
  );
}

/** US Drought Monitor legend (D0–D4) + the week the data is valid for. */
function DroughtLegend({ asOf }: { asOf: Date | null }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.6rem',
      padding: '.1rem .25rem .6rem', fontFamily: 'Lato, sans-serif',
      fontSize: '.7rem', color: '#6a7a55',
    }}>
      <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        Drought
      </span>
      {DM_COLORS.map((c, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
          <span style={{ width: 13, height: 13, background: c, border: '1px solid #cbb', borderRadius: 2, display: 'inline-block' }} />
          {DM_LABELS[i]}
        </span>
      ))}
      <a
        href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?USA"
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginLeft: 'auto', color: '#3d6b2a', fontWeight: 700 }}
      >
        {asOf
          ? `USDM · valid ${asOf.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} →`
          : 'US Drought Monitor →'}
      </a>
    </div>
  );
}

/** Tiny key explaining solid vs hollow vs dashed markers. */
function MarkerKey({ metric }: { metric: Metric }) {
  // A representative "change" color for the chosen metric.
  const changeColor = metric === 'TEMP' ? markerTempColor(4) : markerPrecipColor(15);
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '1.1rem', alignItems: 'center',
      padding: '.55rem .25rem 0', fontFamily: 'Lato, sans-serif',
      fontSize: '.72rem', color: '#6a7a55',
    }}>
      <Swatch fill={changeColor} stroke="#fff" strokeWidth={2} label="Change (shaded by amount)" />
      <Swatch fill="transparent" stroke="#a7ad97" strokeWidth={1.5} label="No change" />
      <Swatch fill="transparent" stroke="#b8bdab" strokeWidth={1.5} dash="2 2" label="Awaiting first comparison" />
    </div>
  );
}

function Swatch({
  fill, stroke, strokeWidth, dash, label,
}: {
  fill: string; stroke: string; strokeWidth: number; dash?: string; label: string;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
      </svg>
      {label}
    </span>
  );
}

/** Color-scale legend that matches the chosen metric. */
function Legend({ metric }: { metric: Metric }) {
  const colorFor = metric === 'TEMP' ? markerTempColor : markerPrecipColor;
  const cap      = metric === 'TEMP' ? 5 : 20;
  const unit     = metric === 'TEMP' ? '°' : '%';
  const lowLabel  = metric === 'TEMP' ? 'Cooler' : 'Drier';
  const highLabel = metric === 'TEMP' ? 'Warmer' : 'Wetter';

  // Sample 9 stops across the range for a smooth gradient strip
  const stops = Array.from({ length: 9 }, (_, i) => {
    const t = -1 + (i / 4); // -1 .. +1
    return { value: t * cap, color: colorFor(t * cap) };
  });

  return (
    <div className={styles.legend}>
      <span className={styles.legendLabel}>−{cap}{unit} {lowLabel}</span>
      <div className={styles.legendBar}>
        {stops.map((s, i) => (
          <span key={i} style={{ background: s.color }} />
        ))}
      </div>
      <span className={styles.legendLabel}>{highLabel} +{cap}{unit}</span>
    </div>
  );
}
