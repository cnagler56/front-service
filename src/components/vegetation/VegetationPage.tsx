'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, VegetationCounties } from '@/src/lib/api';
import VegetationHealthPanel from '@/src/components/weather/VegetationHealthPanel';
import styles from '@/src/styles/farm.module.css';

/**
 * Weather → Vegetation Health: our own county-level VHI map for the Midwest.
 * The backend averages NOAA STAR's weekly 4km satellite composite inside each
 * county; this page paints those values onto the same county boundaries used
 * by the forecast map, with hover detail and a continuous legend.
 */

/* Same equirectangular box as the forecast MidwestMap, so maps feel consistent. */
const BOUNDS = { latMin: 35.0, latMax: 50.0, lonMin: -104.5, lonMax: -80.0 };
const WIDTH = 800;
const HEIGHT = 500;

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * WIDTH,
    y: ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * HEIGHT,
  };
}

interface CountyFeature {
  type: 'Feature';
  id: string;                        // 5-digit FIPS
  properties: { name?: string };
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] };
}
interface StateFeature {
  type: 'Feature';
  properties: { name: string };
  geometry: CountyFeature['geometry'];
}

function ringToPath(ring: number[][]): string {
  return ring.map(([lon, lat], i) => {
    const { x, y } = project(lat, lon);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}
function geometryToPath(g: CountyFeature['geometry']): string {
  if (g.type === 'Polygon') return g.coordinates.map(ringToPath).join(' ');
  return g.coordinates.flat().map(ringToPath).join(' ');
}

const MIDWEST_STATES = new Set([
  'Minnesota', 'Wisconsin', 'Michigan', 'Iowa', 'Illinois', 'Indiana', 'Ohio',
  'Missouri', 'Kansas', 'Nebraska', 'South Dakota', 'North Dakota', 'Kentucky', 'Tennessee',
]);

/* ── VHI color scale — NOAA's exact classes, extracted from their own
   colorbar image (bar_VHI.png), so our county map reads identically to the
   official national maps shown below it. Boundaries 0/6/12/24/36/48/60/72/84. ── */
const CLASSES: { max: number; color: string; word: string }[] = [
  { max: 6,   color: '#FF00A0', word: 'extreme stress' },
  { max: 12,  color: '#F00050', word: 'severe stress' },
  { max: 24,  color: '#FF7878', word: 'stressed' },
  { max: 36,  color: '#FFAA00', word: 'mild stress' },
  { max: 48,  color: '#FFFF55', word: 'fair' },
  { max: 60,  color: '#55FF55', word: 'favorable' },
  { max: 72,  color: '#00AA00', word: 'good' },
  { max: 84,  color: '#5555FF', word: 'very good' },
  { max: 100, color: '#0000AA', word: 'exceptional' },
];
function vhiClass(v: number) {
  const clamp = Math.max(0, Math.min(100, v));
  return CLASSES.find(c => clamp <= c.max) ?? CLASSES[CLASSES.length - 1];
}
function vhiColor(v: number): string { return vhiClass(v).color; }
function vhiWord(v: number): string { return vhiClass(v).word; }

export default function VegetationPage() {
  const [counties, setCounties] = useState<CountyFeature[]>([]);
  const [states, setStates] = useState<StateFeature[]>([]);
  const [data, setData] = useState<VegetationCounties | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hover, setHover] = useState<{ fips: string; name: string; vhi: number | null; x: number; y: number } | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch('/midwest-counties.geojson').then(r => r.json()),
      fetch('https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json')
        .then(r => r.json()).catch(() => null),
      api.getVegetationCounties().catch(() => null),
    ]).then(([countyGeo, stateGeo, veg]) => {
      if (!live) return;
      setCounties((countyGeo?.features ?? []) as CountyFeature[]);
      if (stateGeo?.features) {
        setStates((stateGeo.features as StateFeature[]).filter(f => MIDWEST_STATES.has(f.properties.name)));
      }
      if (veg) setData(veg);
      else setError('Could not load vegetation data.');
    }).catch(() => { if (live) setError('Could not load the map.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const countyPaths = useMemo(
    () => counties.map(f => ({ fips: f.id, name: f.properties?.name ?? '', d: geometryToPath(f.geometry) })),
    [counties],
  );
  const statePaths = useMemo(() => states.map(f => geometryToPath(f.geometry)), [states]);

  const byFips = data?.byFips ?? {};
  const hasData = Object.keys(byFips).length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Vegetation Health — Midwest Counties</h2>
          {data?.weekEnding && (
            <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
              satellite week ending {data.weekEnding}
            </span>
          )}
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.84rem', color: '#6a7a55', lineHeight: 1.55, margin: '0 0 1rem' }}>
            Each county is shaded by its average <strong>Vegetation Health Index</strong> from NOAA&rsquo;s
            weekly 4km satellite composite — our own county-level rollup, using{' '}
            <strong>the same color scale as NOAA&rsquo;s official maps</strong> below:{' '}
            <span style={{ color: '#d0006f', fontWeight: 700 }}>magenta/red</span> = stress,{' '}
            <span style={{ color: '#b08a00', fontWeight: 700 }}>yellow</span> = fair,{' '}
            <span style={{ color: '#00871f', fontWeight: 700 }}>green</span> = favorable,{' '}
            <span style={{ color: '#2222cc', fontWeight: 700 }}>blue</span> = exceptionally lush.
            Hover any county for its value.
          </p>

          {loading && <p className={styles.loading}>Loading vegetation map…</p>}
          {error && !loading && <p className={styles.error}>{error}</p>}
          {!loading && !error && !hasData && (
            <p className={styles.empty}>{data?.message ?? 'No vegetation data loaded yet.'}</p>
          )}

          {!loading && countyPaths.length > 0 && (
            <div style={{ position: 'relative' }}>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                style={{ width: '100%', height: 'auto', display: 'block', background: '#eef2f5', borderRadius: 6, border: '1px solid #e1dccc' }}
                onMouseLeave={() => setHover(null)}
              >
                {countyPaths.map(c => {
                  const v = byFips[c.fips];
                  return (
                    <path
                      key={c.fips}
                      d={c.d}
                      fill={v != null ? vhiColor(v) : '#ddd8cc'}
                      stroke="#ffffff"
                      strokeWidth={0.4}
                      onMouseMove={(e) => {
                        const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                        setHover({
                          fips: c.fips, name: c.name, vhi: v ?? null,
                          x: e.clientX - rect.left, y: e.clientY - rect.top,
                        });
                      }}
                    />
                  );
                })}
                {statePaths.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#5a6a4a" strokeWidth={1.1} opacity={0.8} />
                ))}
              </svg>

              {hover && (
                <div style={{
                  position: 'absolute',
                  left: hover.x + 12,
                  top: hover.y + 12,
                  pointerEvents: 'none',
                  background: '#1a2e0f', color: '#f0f7e6', borderRadius: 6,
                  padding: '.45rem .7rem', fontFamily: 'Lato, sans-serif', fontSize: '.8rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,.25)', whiteSpace: 'nowrap', zIndex: 5,
                }}>
                  <strong>{hover.name}</strong>
                  {hover.vhi != null
                    ? <> — VHI {hover.vhi.toFixed(1)} <span style={{ color: '#a8cc78' }}>({vhiWord(hover.vhi)})</span></>
                    : <> — no data</>}
                </div>
              )}
            </div>
          )}

          {/* Legend — NOAA's discrete classes, proportional widths */}
          {hasData && (
            <div style={{ maxWidth: 560, marginTop: '.9rem', fontFamily: 'Lato, sans-serif' }}>
              <div style={{ display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', border: '1px solid #b9b3a4' }}>
                {CLASSES.map((c, i) => {
                  const lo = i === 0 ? 0 : CLASSES[i - 1].max;
                  return (
                    <div key={c.max} title={`${lo}–${c.max}: ${c.word}`}
                      style={{ width: `${c.max - lo}%`, background: c.color }} />
                  );
                })}
              </div>
              <div style={{ position: 'relative', height: 14, fontSize: '.66rem', color: '#7a8a65' }}>
                {[0, 6, 12, 24, 36, 48, 60, 72, 84, 100].map(v => (
                  <span key={v} style={{
                    position: 'absolute', left: `${v}%`, transform: 'translateX(-50%)',
                  }}>
                    {v}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: '#7a8a65' }}>
                <span>← stressed</span>
                <span>fair</span>
                <span>lush →</span>
              </div>
            </div>
          )}

          <p style={{ margin: '.8rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
            Data: NOAA STAR Vegetation Health (4km blended VHP), averaged per county by Just4Ag ·
            updates weekly{data?.updatedAt ? ` · last ingested ${data.updatedAt.slice(0, 10)}` : ''}.
          </p>
        </div>
      </div>

      {/* NOAA's official national renderings, for reference */}
      <VegetationHealthPanel />
    </div>
  );
}
