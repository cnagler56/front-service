'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ConabProduction, SupplyDemandSheet } from '@/src/lib/api';
import styles from '@/src/components/commodity/commodityDashboard.module.css';

interface Props {
  commodity: string;          // "CORN" / "SOYBEANS"
  commodityLabel: string;
}

const BU_PER_MT: Record<string, number> = { CORN: 39.3680, SOYBEANS: 36.7437 };
const BR_GEO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';
const COUNTRY_GEO = (iso: string) =>
  `https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${iso}.geo.json`;

// Map extent: all of Brazil + Argentina (to Tierra del Fuego) + Paraguay.
const B = { latMin: -55, latMax: 6, lonMin: -74, lonMax: -34 };
const W = 520, H = Math.round((W * (B.latMax - B.latMin)) / (B.lonMax - B.lonMin)); // aspect-correct
const px = (lon: number) => ((lon - B.lonMin) / (B.lonMax - B.lonMin)) * W;
const py = (lat: number) => ((B.latMax - lat) / (B.latMax - B.latMin)) * H;

type GeoFeature = { properties: { name?: string; sigla?: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
let brCache: GeoFeature[] | null = null;
const countryCache: Record<string, GeoFeature> = {};

/** WASDE-only neighbours, drawn as whole-country shapes (no openly available sub-national data). */
const COUNTRIES = [
  { iso: 'ARG', region: 'ARGENTINA', name: 'Argentina', lat: -36, lon: -64 },
  { iso: 'PRY', region: 'PARAGUAY', name: 'Paraguay', lat: -23.5, lon: -58 },
];

/** Approx. label anchors (lat/lon) for the agriculturally relevant Brazilian states. */
const BR_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  MT: { lat: -13.0, lon: -55.8 }, PR: { lat: -24.6, lon: -51.6 }, RS: { lat: -29.8, lon: -53.5 },
  GO: { lat: -16.0, lon: -49.6 }, MS: { lat: -20.5, lon: -54.6 }, MG: { lat: -18.5, lon: -44.8 },
  SP: { lat: -22.2, lon: -48.6 }, BA: { lat: -12.5, lon: -41.7 }, TO: { lat: -10.2, lon: -48.3 },
  MA: { lat: -5.2, lon: -45.3 }, PI: { lat: -7.5, lon: -42.8 }, PA: { lat: -4.5, lon: -52.5 },
  SC: { lat: -27.2, lon: -50.6 }, RO: { lat: -11.0, lon: -62.8 },
};
const BR_NAMES: Record<string, string> = {
  MT: 'Mato Grosso', PR: 'Paraná', RS: 'Rio Grande do Sul', GO: 'Goiás', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', SP: 'São Paulo', BA: 'Bahia', TO: 'Tocantins', MA: 'Maranhão',
  PI: 'Piauí', PA: 'Pará', SC: 'Santa Catarina', RO: 'Rondônia',
};

/** Build an SVG path for a Polygon/MultiPolygon. */
function featurePath(geometry: GeoFeature['geometry']): string {
  const polys = geometry.type === 'Polygon'
    ? [geometry.coordinates as number[][][]]
    : (geometry.coordinates as number[][][][]);
  return polys.map(poly => poly.map(ring =>
    ring.map((pt, i) => `${i ? 'L' : 'M'}${px(pt[0]).toFixed(1)},${py(pt[1]).toFixed(1)}`).join(' ') + ' Z',
  ).join(' ')).join(' ');
}

/** Light→dark green by share of the max (sqrt for better spread). */
function greenShade(v: number | undefined, max: number): string {
  if (v == null || v <= 0) return '#efece3';
  const t = Math.sqrt(v / max);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(232, 26)}, ${lerp(243, 77)}, ${lerp(216, 18)})`;
}

/** Light→dark amber by share of the max — used for the whole-country (WASDE) neighbours. */
function amberShade(v: number | undefined, max: number): string {
  if (v == null || v <= 0) return '#efece3';
  const t = Math.sqrt(v / max);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(245, 138)}, ${lerp(228, 90)}, ${lerp(196, 6)})`;
}

function loadBushels(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem('supplyDemand:bushels') === '1'; } catch { return false; }
}

/**
 * Production map of South America for one crop: Brazil shaded by state (CONAB),
 * with Argentina & Paraguay drawn as whole-country shapes shaded by their WASDE
 * national totals (their sub-national data isn't openly available). All values
 * normalized to tonnes internally.
 */
export default function SouthAmericaMap({ commodity, commodityLabel }: Props) {
  const [brGeo, setBrGeo] = useState<GeoFeature[] | null>(brCache);
  const [countries, setCountries] = useState<Record<string, GeoFeature>>({ ...countryCache });
  const [conab, setConab] = useState<ConabProduction | null>(null);
  const [sd, setSd] = useState<SupplyDemandSheet | null>(null);
  const [bushels, setBushels] = useState(loadBushels);

  // Brazil state outlines.
  useEffect(() => {
    if (brCache) { setBrGeo(brCache); return; }
    let c = false;
    fetch(BR_GEO_URL).then(r => r.json()).then(g => { brCache = g.features; if (!c) setBrGeo(g.features); }).catch(() => {});
    return () => { c = true; };
  }, []);

  // Argentina / Paraguay country outlines.
  useEffect(() => {
    let c = false;
    COUNTRIES.forEach(co => {
      if (countryCache[co.iso]) return;
      fetch(COUNTRY_GEO(co.iso)).then(r => r.json()).then(g => {
        const ft: GeoFeature = g.features ? g.features[0] : g;
        countryCache[co.iso] = ft;
        if (!c) setCountries(prev => ({ ...prev, [co.iso]: ft }));
      }).catch(() => {});
    });
    return () => { c = true; };
  }, []);

  useEffect(() => {
    let c = false;
    api.getConab(commodity).then(d => { if (!c) setConab(d); }).catch(() => {});
    api.getSupplyDemand(commodity).then(d => { if (!c) setSd(d); }).catch(() => {});
    return () => { c = true; };
  }, [commodity]);

  useEffect(() => {
    const h = (e: Event) => setBushels(!!(e as CustomEvent).detail);
    window.addEventListener('sd-bushels', h);
    return () => window.removeEventListener('sd-bushels', h);
  }, []);

  const buPerMt = BU_PER_MT[commodity.toUpperCase()];
  const fmt = (t: number | null | undefined): string => {
    if (t == null) return '—';
    if (bushels && buPerMt) return (t * buPerMt / 1e9).toFixed(2) + ' bil bu';
    return (t / 1e6).toFixed(1) + ' Mt';
  };

  // Brazil production by UF code (tonnes).
  const bySigla = useMemo(() => {
    const m: Record<string, number> = {};
    (conab?.allStates ?? []).forEach(s => { m[s.state] = s.production * 1000; }); // thousand t → t
    return m;
  }, [conab]);

  // Argentina / Paraguay national production (tonnes) from WASDE.
  const regionProd = (region: string): number | null => {
    const rows = sd?.regions?.[region];
    if (!rows) return null;
    const r = rows.find(x => /production/i.test(x.attribute));
    const v = r?.values?.[0];
    return v == null ? null : v * 1e6; // MMT → t
  };

  const stateMax = Math.max(1, ...Object.values(bySigla));
  const countryProd = useMemo(
    () => Object.fromEntries(COUNTRIES.map(co => [co.iso, regionProd(co.region)])),
    [sd], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const countryMax = Math.max(1, ...Object.values(countryProd).map(v => v ?? 0));

  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>Production Map</h2>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#8aa06a', fontFamily: 'Lato, sans-serif' }}>
          Brazil by state (CONAB) · {commodityLabel}
        </span>
      </div>
      <div style={{ padding: '.6rem 1rem 1rem', fontFamily: 'Lato, sans-serif' }}>
        {!brGeo ? (
          <p className={styles.empty}>Loading map…</p>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: 460, margin: '0 auto' }}>
              {/* Argentina & Paraguay — whole-country shapes (WASDE national totals). */}
              {COUNTRIES.map(co => {
                const ft = countries[co.iso];
                if (!ft) return null;
                return (
                  <path
                    key={co.iso}
                    d={featurePath(ft.geometry)}
                    fill={amberShade(countryProd[co.iso] ?? undefined, countryMax)}
                    stroke="#7a4d06"
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{co.name} (national): {fmt(countryProd[co.iso])}</title>
                  </path>
                );
              })}

              {/* Brazil — state choropleth (CONAB). */}
              {brGeo.map(f => (
                <path
                  key={f.properties.sigla}
                  d={featurePath(f.geometry)}
                  fill={greenShade(bySigla[f.properties.sigla ?? ''], stateMax)}
                  stroke="#fff"
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{f.properties.name}: {fmt(bySigla[f.properties.sigla ?? ''])}</title>
                </path>
              ))}

              {/* Name the top producing Brazilian states (white halo for legibility). */}
              {(conab?.allStates ?? []).slice(0, 8).map(s => {
                const c = BR_CENTROIDS[s.state];
                if (!c) return null;
                return (
                  <text
                    key={s.state}
                    x={px(c.lon)} y={py(c.lat)} textAnchor="middle"
                    fontSize={10.5} fontWeight={700} fill="#1a2e0f"
                    stroke="#fff" strokeWidth={2.5} paintOrder="stroke"
                    style={{ pointerEvents: 'none' }}
                  >
                    {BR_NAMES[s.state] ?? s.state}
                  </text>
                );
              })}

              {/* Country labels. */}
              {COUNTRIES.map(co => countries[co.iso] && (
                <text
                  key={co.iso + '-label'}
                  x={px(co.lon)} y={py(co.lat)} textAnchor="middle"
                  fontSize={11} fontWeight={700} fill="#3a2606"
                  stroke="#fff" strokeWidth={2.5} paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {co.name}
                </text>
              ))}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.6rem', fontSize: '.7rem', color: '#6a7a55', flexWrap: 'wrap' }}>
              <span>Less</span>
              <div style={{ flex: '0 0 120px', height: 12, borderRadius: 3, background: 'linear-gradient(to right, #e8f3d8, #1a4d12)' }} />
              <span>More</span>
              <span style={{ marginLeft: '.3rem' }}>Brazil state (CONAB)</span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ flex: '0 0 120px', height: 12, borderRadius: 3, background: 'linear-gradient(to right, #f5e4c4, #8a5a06)' }} />
                Argentina / Paraguay (national, WASDE)
              </span>
            </div>
            <p style={{ margin: '.5rem 0 0', fontSize: '.7rem', color: '#999' }}>
              Brazil shaded by state from CONAB (green); Argentina &amp; Paraguay shaded by their national
              WASDE total (amber) — their province-level data isn&rsquo;t openly available. Hover any area for the figure.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
