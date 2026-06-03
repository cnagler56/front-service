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
const NEUTRAL: [number, number, number] = [204, 204, 204];
const WARM:    [number, number, number] = [185, 28, 28];   // #b91c1c
const COOL:    [number, number, number] = [29, 78, 216];   // #1d4ed8
const WET:     [number, number, number] = [30, 110, 210];
const DRY:     [number, number, number] = [161, 98, 7];    // #a16207

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
  if (delta > 0) return lerpColor(NEUTRAL, WARM, mag);
  if (delta < 0) return lerpColor(NEUTRAL, COOL, mag);
  return lerpColor(NEUTRAL, NEUTRAL, 0);
}

/** Precip marker color — caps at ±20 percentage points. */
function markerPrecipColor(delta: number | null): string {
  if (delta == null) return NO_DATA_COLOR;
  const cap = 20;
  const mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return lerpColor(NEUTRAL, WET, mag);
  if (delta < 0) return lerpColor(NEUTRAL, DRY, mag);
  return lerpColor(NEUTRAL, NEUTRAL, 0);
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

  const colorFor = metric === 'TEMP' ? markerTempColor : markerPrecipColor;

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
        </div>
        <Legend metric={metric} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.mapSvg}
        onMouseLeave={() => { setHoverId(null); setHoverXY(null); }}
      >
        {/* States */}
        <g>
          {stateFeatures.map(f => (
            <path
              key={f.properties.name}
              d={geometryToPath(f.geometry)}
              className={styles.statePath}
            />
          ))}
        </g>

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
            const fill = colorFor(delta);
            return (
              <g key={loc.id}>
                <circle
                  cx={x} cy={y}
                  r={isHover ? 11 : 8}
                  style={{ fill }}
                  className={`${styles.marker} ${isHover ? styles.markerHover : ''}`}
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
                      {d.high != null ? `${Math.round(d.high)}°` : '—'}
                    </td>
                    <td style={{ background: tempColor(d.lowDelta) }}>
                      {d.low != null ? `${Math.round(d.low)}°` : '—'}
                    </td>
                    <td style={{ background: precipColor(d.precipDelta) }}>
                      {d.precip != null ? `${d.precip}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
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
