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

/* ── VHI color scale — the red→yellow→green convention farmers know ── */
const STOPS: { v: number; c: [number, number, number] }[] = [
  { v: 0,   c: [165, 0, 38] },
  { v: 20,  c: [222, 90, 44] },
  { v: 35,  c: [253, 174, 97] },
  { v: 50,  c: [254, 240, 176] },
  { v: 65,  c: [166, 217, 106] },
  { v: 100, c: [26, 152, 80] },
];
function vhiColor(v: number): string {
  const clamp = Math.max(0, Math.min(100, v));
  for (let i = 1; i < STOPS.length; i++) {
    if (clamp <= STOPS[i].v) {
      const a = STOPS[i - 1], b = STOPS[i];
      const t = (clamp - a.v) / (b.v - a.v);
      const mix = a.c.map((x, k) => Math.round(x + (b.c[k] - x) * t));
      return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
    }
  }
  return 'rgb(26,152,80)';
}
function vhiWord(v: number): string {
  if (v < 16) return 'severe stress';
  if (v < 36) return 'stressed';
  if (v < 51) return 'fair';
  if (v < 66) return 'favorable';
  return 'very favorable';
}

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
            weekly 4km satellite composite — our own county-level rollup of the same data behind
            NOAA&rsquo;s national maps. <span style={{ color: '#b42318', fontWeight: 700 }}>Red</span> = crop
            stress, <span style={{ color: '#1a7f37', fontWeight: 700 }}>green</span> = healthy vegetation.
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

          {/* Legend */}
          {hasData && (
            <div style={{ maxWidth: 460, marginTop: '.9rem', fontFamily: 'Lato, sans-serif' }}>
              <div style={{
                height: 12, borderRadius: 6, border: '1px solid #d8d3c4',
                background: `linear-gradient(90deg, ${[0, 20, 35, 50, 65, 100].map(v => vhiColor(v)).join(', ')})`,
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: '#7a8a65', marginTop: '.25rem' }}>
                <span>0 · severe stress</span><span>50 · fair</span><span>100 · very healthy</span>
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
