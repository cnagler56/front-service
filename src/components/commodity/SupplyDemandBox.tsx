'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { api, SupplyDemandSheet, SupplyDemandRow } from '@/src/lib/api';
import styles from './commodityDashboard.module.css';

interface RegionOption {
  key: string;              // matches a key in SupplyDemandSheet.regions, e.g. "US"
  label: string;            // toggle button text, e.g. "U.S."
}

interface Props {
  commodity: string;        // "CORN" / "SOYBEANS" / "WHEAT"
  commodityLabel: string;
  /** Which region balance sheets to offer; defaults to U.S. / World. */
  regions?: RegionOption[];
}

const DEFAULT_REGIONS: RegionOption[] = [
  { key: 'US', label: 'U.S.' },
  { key: 'WORLD', label: 'World' },
];

/** 2025 → "2025/26". */
function yearLabel(y: number): string {
  return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
}

/** Bushels per metric ton by crop (corn 56 lb/bu, soybeans & wheat 60 lb/bu). */
const BU_PER_MT: Record<string, number> = { CORN: 39.3680, SOYBEANS: 36.7437, WHEAT: 36.7437 };
const ACRES_PER_HA = 2.47105;

/** localStorage key remembering the metric→bushels preference across visits. */
const BUSHELS_KEY = 'supplyDemand:bushels';
function loadBushelsPref(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(BUSHELS_KEY) === '1'; } catch { return false; }
}

/** Can this row's metric unit be converted to a US (bushel/acre) unit? */
function isConvertible(unit: string): boolean {
  const u = unit.toLowerCase();
  return u.includes('metric ton') || u.includes('tonne') || /\bmt\b/.test(u) || u.includes('hectare');
}

/** Return a copy of the row with values converted to bushels/acres, or the row unchanged. */
function toBushels(row: SupplyDemandRow, buPerMt: number): SupplyDemandRow {
  const u = row.unit.toLowerCase();
  const scale = (factor: number, unit: string): SupplyDemandRow => ({
    ...row,
    unit,
    values: row.values.map(v => (v == null ? null : +(v * factor).toFixed(2))),
    prev: row.prev == null ? null : +(row.prev * factor).toFixed(2),
  });
  // Yield (tons per hectare) → bushels per acre
  if ((u.includes('ton') || /\bmt\b/.test(u)) && (u.includes('hectare') || u.includes('/ha') || u.includes(' per ')))
    return scale(buPerMt / ACRES_PER_HA, 'Bushels per Acre');
  // Area (hectares) → acres
  if (u.includes('hectare'))
    return scale(ACRES_PER_HA, u.includes('million') ? 'Million Acres' : 'Acres');
  // Quantity (metric tons) → bushels
  if (u.includes('metric ton') || u.includes('tonne') || /\bmt\b/.test(u))
    return scale(buPerMt, u.includes('million') ? 'Million Bushels' : u.includes('1000') ? '1000 Bushels' : 'Bushels');
  return row;
}

/** WASDE values are already in their published units; just format readably. */
function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Month-over-month change styling for the new-crop column. */
function changeMeta(cur: number | null | undefined, prev: number | null | undefined) {
  if (cur == null || prev == null) return null;
  const delta = cur - prev;
  if (Math.abs(delta) < 1e-9) return { delta: 0, bg: undefined as string | undefined, fg: '#8a9678' };
  const up = delta > 0;
  return {
    delta,
    bg: up ? 'rgba(46,160,67,0.16)' : 'rgba(208,48,48,0.14)',
    fg: up ? '#1a7f37' : '#b42318',
  };
}

/** Absolute change with a sign, e.g. "+129" / "−54". */
function fmtDelta(d: number): string {
  if (d === 0) return '±0';
  return (d > 0 ? '+' : '−') + Math.abs(d).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const isEnding     = (r: SupplyDemandRow) => norm(r.attribute).includes('endingstocks');
const isTotal      = (r: SupplyDemandRow) => norm(r.attribute).includes('total');
const isProduction = (r: SupplyDemandRow) => norm(r.attribute).includes('production');
const isYield      = (r: SupplyDemandRow) => norm(r.attribute).includes('yield');

/** Section 0=Supply, 1=Demand/Use, 2=Ending Stocks, 3=appendix (area/yield/price). */
const SEC_SUPPLY = 0, SEC_DEMAND = 1, SEC_ENDING = 2, SEC_OTHER = 3;
function classify(attribute: string): { sec: number; idx: number } {
  const n = norm(attribute);
  if (n.includes('endingstocks')) return { sec: SEC_ENDING, idx: 0 };
  // Supply
  if (n.includes('beginningstocks'))               return { sec: SEC_SUPPLY, idx: 0 };
  if (n.includes('production'))                     return { sec: SEC_SUPPLY, idx: 1 };
  if (n.includes('imports'))                        return { sec: SEC_SUPPLY, idx: 2 };
  if (n.includes('total') && n.includes('supply'))  return { sec: SEC_SUPPLY, idx: 3 };
  // Demand / use
  if (n.includes('crush'))                          return { sec: SEC_DEMAND, idx: 0 };
  if (n.includes('feed'))                           return { sec: SEC_DEMAND, idx: 1 };
  if (n.includes('seed'))                           return { sec: SEC_DEMAND, idx: 2 };
  if (n.includes('food') || n.includes('industrial') || n.includes('fsi')) return { sec: SEC_DEMAND, idx: 3 };
  if (n.includes('domestic'))                       return { sec: SEC_DEMAND, idx: 4 };
  if (n.includes('exports'))                        return { sec: SEC_DEMAND, idx: 5 };
  if (n.includes('total') && (n.includes('use') || n.includes('distribution') || n.includes('disappearance')))
    return { sec: SEC_DEMAND, idx: 6 };
  // Area planted/harvested, yield, farm price, anything else → appendix at bottom
  return { sec: SEC_OTHER, idx: 0 };
}

export default function SupplyDemandBox({ commodity, commodityLabel, regions = DEFAULT_REGIONS }: Props) {
  const [sheet, setSheet] = useState<SupplyDemandSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [region, setRegion] = useState<string>(regions[0].key);
  const [showChanges, setShowChanges] = useState(true);
  const [bushels, setBushels] = useState<boolean>(loadBushelsPref);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getSupplyDemand(commodity)
      .then(d => { if (!cancelled) setSheet(d); })
      .catch(() => { if (!cancelled) setError('Could not load supply/demand.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity]);

  // Remember the bushels preference across visits, and broadcast so other panels
  // on the page (e.g. the CONAB Brazil panel) stay in sync within the same tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(BUSHELS_KEY, bushels ? '1' : '0'); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('sd-bushels', { detail: bushels }));
  }, [bushels]);

  const rawRows = sheet?.regions?.[region] ?? [];
  const years = sheet?.years ?? [];

  // Bushel conversion — only for grains, and only when the current view has
  // metric rows to convert (i.e. World / South America, not the U.S. bushel view).
  const buPerMt = BU_PER_MT[commodity.toUpperCase()];
  const canConvert = !!buPerMt && rawRows.some(r => isConvertible(r.unit));
  const rows = useMemo(
    () => (bushels && buPerMt ? rawRows.map(r => toBushels(r, buPerMt)) : rawRows),
    [rawRows, bushels, buPerMt],
  );

  // Reorder into a real balance sheet: Supply → Demand → Ending Stocks → appendix.
  const ordered = useMemo(
    () => rows
      .map(r => ({ r, ...classify(r.attribute) }))
      .sort((a, b) => a.sec - b.sec || a.idx - b.idx || a.r.seq - b.r.seq),
    [rows],
  );

  // Headline metrics for the newest (new-crop) marketing year.
  const metrics = useMemo(() => {
    const latest = (pred: (r: SupplyDemandRow) => boolean) => {
      const r = rows.find(pred);
      return r ? { v: r.values[0] ?? null, unit: r.unit } : null;
    };
    const prod = latest(isProduction);
    const ending = latest(isEnding);
    const useRow =
      rows.find(r => { const n = norm(r.attribute); return n.includes('usetotal') || n.includes('totaluse'); })
      ?? rows.find(r => norm(r.attribute).includes('domestictotal'));
    const useVal = useRow ? useRow.values[0] ?? null : null;
    const stocksToUse = ending?.v != null && useVal ? (ending.v / useVal) * 100 : null;
    return { prod, ending, stocksToUse };
  }, [rows]);

  // Stocks-to-use for every year, so the trend reads across the columns.
  const stuByYear = useMemo(() => {
    const endingRow = rows.find(isEnding);
    const useRow =
      rows.find(r => { const n = norm(r.attribute); return n.includes('usetotal') || n.includes('totaluse'); })
      ?? rows.find(r => norm(r.attribute).includes('domestictotal'));
    if (!endingRow || !useRow) return null;
    return years.map((_, j) => {
      const e = endingRow.values[j];
      const u = useRow.values[j];
      return e != null && u ? (e / u) * 100 : null;
    });
  }, [rows, years]);

  const latestYear = years[0];
  const regionLabel = regions.find(r => r.key === region)?.label ?? region;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        
        <h2>Supply &amp; Demand</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem' }}>
          {regions.map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRegion(r.key)}
              style={{
                fontFamily: 'Lato, sans-serif', fontSize: '.74rem', fontWeight: 700,
                padding: '.25rem .8rem', borderRadius: 14, cursor: 'pointer',
                border: '1px solid ' + (region === r.key ? '#3d6b2a' : '#cdd6bd'),
                background: region === r.key ? '#3d6b2a' : '#fff',
                color: region === r.key ? '#f0f7e6' : '#3d6b2a',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem 1.25rem 1.1rem' }}>
        {loading && <p className={styles.loading}>Loading supply/demand…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && ordered.length === 0 && (
          <p className={styles.empty}>
            {sheet?.message ?? `No ${commodityLabel.toLowerCase()} WASDE data loaded yet.`}
          </p>
        )}

        {ordered.length > 0 && (
          <>
            {/* Prominent metric → bushels converter (grains, metric views only). */}
            {canConvert && (
              <button
                type="button"
                onClick={() => setBushels(b => !b)}
                style={{
                  display: 'block', width: '100%', margin: '0 0 1rem', padding: '.6rem .9rem',
                  borderRadius: 6, cursor: 'pointer',
                  border: '1px solid ' + (bushels ? '#cdd6bd' : '#3d6b2a'),
                  background: bushels ? '#fff' : '#3d6b2a',
                  color: bushels ? '#3d6b2a' : '#f0f7e6',
                  fontFamily: 'Lato, sans-serif', fontSize: '.85rem', fontWeight: 700,
                }}
              >
                {bushels ? '↩ Show metric tons (MMT)' : '🌽 Convert values to bushels'}
              </button>
            )}

            {/* Month-over-month toggle — its own line, with an explanation. */}
            <label
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '.5rem',
                margin: '0 0 1rem', padding: '.6rem .75rem', borderRadius: 6,
                background: '#f5f8ee', border: '1px solid #e1dccc',
                fontFamily: 'Lato, sans-serif', fontSize: '.78rem', lineHeight: 1.4,
                color: '#3d6b2a', cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showChanges}
                onChange={e => setShowChanges(e.target.checked)}
                style={{ accentColor: '#3d6b2a', cursor: 'pointer', marginTop: '.15rem' }}
              />
              <span>
                <strong>Highlight changes since last month</strong>
                {sheet?.prevReportDate ? (
                  <>
                    {' — '}shades the {latestYear != null ? yearLabel(latestYear) : 'new-crop'} column{' '}
                    <span style={{ color: '#1a7f37', fontWeight: 700 }}>green</span> when a value rose and{' '}
                    <span style={{ color: '#b42318', fontWeight: 700 }}>red</span> when it fell vs the{' '}
                    {sheet.prevReportDate} WASDE, with the amount of change.
                  </>
                ) : (
                  <>{' — '}no prior month is loaded yet, so there is nothing to compare.</>
                )}
              </span>
            </label>

            {/* Highlight chips for the new-crop year */}
            {latestYear != null && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '1rem' }}>
                <Chip
                  label={`Production ${yearLabel(latestYear)}`}
                  value={fmt(metrics.prod?.v)}
                  unit={metrics.prod?.unit}
                  accent="#3d6b2a"
                />
                <Chip
                  label={`Ending Stocks ${yearLabel(latestYear)}`}
                  value={fmt(metrics.ending?.v)}
                  unit={metrics.ending?.unit}
                  accent="#a16207"
                />
                {metrics.stocksToUse != null && (
                  <Chip
                    label="Stocks-to-Use"
                    value={metrics.stocksToUse.toFixed(1) + '%'}
                    accent="#1d4ed8"
                  />
                )}
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lato, sans-serif', fontSize: '.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ ...th(), textAlign: 'left' }}>
                      {regionLabel} {commodityLabel} Balance Sheet
                    </th>
                    {years.map((y, j) => (
                      <th key={y} style={{
                        ...th(), textAlign: 'right',
                        color: j === 0 ? '#2c4a1e' : '#6a7a55',
                        background: j === 0 ? '#eef5e1' : undefined,
                        borderBottom: j === 0 ? '2px solid #8fbc45' : '2px solid #e1dccc',
                      }}>
                        {yearLabel(y)}{j === 0 && <span style={{ display: 'block', fontSize: '.6rem', color: '#3d6b2a' }}>new crop</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((o, i) => {
                    const r = o.r;
                    const ending = o.sec === SEC_ENDING;
                    const total = isTotal(r) && !ending;
                    const headline = isProduction(r) || isYield(r);
                    const emphasize = ending || total || headline;
                    const appendix = o.sec === SEC_OTHER;
                    const rowBg = ending ? '#eaf4dc' : total ? '#f5f8ee' : (i % 2 ? '#fcfbf7' : '#ffffff');
                    const gap = i > 0 && o.sec !== ordered[i - 1].sec;
                    return (
                      <Fragment key={r.seq}>
                        {gap && (
                          <tr aria-hidden>
                            <td colSpan={1 + years.length} style={{ height: '.5rem', borderBottom: '2px solid #e7eed9' }} />
                          </tr>
                        )}
                        <tr style={{ background: rowBg }}>
                          <td style={{
                            ...td(),
                            fontWeight: emphasize ? 700 : 500,
                            color: appendix ? '#7a8a65' : ending ? '#2c4a1e' : '#33402a',
                            fontStyle: appendix ? 'italic' : undefined,
                          }}>
                            {r.attribute}
                            {r.unit && <span style={{ color: '#aaa', fontSize: '.7rem', marginLeft: '.4rem', fontWeight: 400, fontStyle: 'normal' }}>{r.unit}</span>}
                          </td>
                          {years.map((y, j) => {
                            // Month-over-month change only on the new-crop column.
                            const ch = j === 0 && showChanges ? changeMeta(r.values[0], r.prev) : null;
                            return (
                              <td key={y} style={{
                                ...td(), textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                fontWeight: emphasize || j === 0 ? 700 : 500,
                                color: appendix ? '#8a9678' : j === 0 ? '#1a2e0f' : '#55624a',
                                background: ch?.bg ?? (j === 0 && !appendix ? 'rgba(143,188,69,0.08)' : undefined),
                              }}>
                                {fmt(r.values[j])}
                                {ch && ch.delta !== 0 && (
                                  <span style={{ display: 'block', fontSize: '.62rem', fontWeight: 700, color: ch.fg, marginTop: '1px' }}>
                                    {fmtDelta(ch.delta)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Stocks-to-use trend, right under Ending Stocks */}
                        {ending && stuByYear && (
                          <tr style={{ background: '#eef2fb' }}>
                            <td style={{ ...td(), fontWeight: 700, color: '#1d4ed8' }}>
                              Stocks-to-Use
                              <span style={{ color: '#8aa', fontSize: '.7rem', marginLeft: '.4rem', fontWeight: 400 }}>%</span>
                            </td>
                            {years.map((y, j) => (
                              <td key={y} style={{
                                ...td(), textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                fontWeight: j === 0 ? 800 : 700, color: '#1d4ed8',
                                background: j === 0 ? 'rgba(29,78,216,0.07)' : undefined,
                              }}>
                                {stuByYear[j] != null ? stuByYear[j]!.toFixed(1) + '%' : '—'}
                              </td>
                            ))}
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ margin: '.7rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
              USDA WASDE{sheet?.reportDate ? ` · ${sheet.reportDate}` : ''} · official figures, in the units shown on each row.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent: string }) {
  return (
    <div style={{
      flex: '1 1 160px', minWidth: 150,
      background: '#fff', border: '1px solid #e1dccc', borderLeft: `4px solid ${accent}`,
      borderRadius: 6, padding: '.6rem .8rem', fontFamily: 'Lato, sans-serif',
    }}>
      <div style={{ fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.04em', color: '#6a7a55', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a2e0f', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: '.66rem', fontWeight: 400, color: '#888', marginLeft: '.35rem' }}>{unit}</span>}
      </div>
    </div>
  );
}

function th(): React.CSSProperties {
  return {
    padding: '.5rem .6rem', borderBottom: '2px solid #e1dccc',
    fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.04em', color: '#6a7a55', fontWeight: 700,
  };
}
function td(): React.CSSProperties {
  return { padding: '.4rem .6rem' };
}
