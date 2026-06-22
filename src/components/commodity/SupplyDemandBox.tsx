'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { api, SupplyDemandSheet, SupplyDemandRow } from '@/src/lib/api';
import styles from './commodityDashboard.module.css';

interface Props {
  commodity: string;        // "CORN" / "SOYBEANS" / "WHEAT"
  commodityLabel: string;
}

type Region = 'US' | 'WORLD';

/** 2025 → "2025/26". */
function yearLabel(y: number): string {
  return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
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

export default function SupplyDemandBox({ commodity, commodityLabel }: Props) {
  const [sheet, setSheet] = useState<SupplyDemandSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [region, setRegion] = useState<Region>('US');
  const [showChanges, setShowChanges] = useState(true);

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

  const rawRows = sheet ? (region === 'US' ? sheet.us : sheet.world) : [];
  const years = sheet?.years ?? [];

  // Reorder into a real balance sheet: Supply → Demand → Ending Stocks → appendix.
  const ordered = useMemo(
    () => rawRows
      .map(r => ({ r, ...classify(r.attribute) }))
      .sort((a, b) => a.sec - b.sec || a.idx - b.idx || a.r.seq - b.r.seq),
    [rawRows],
  );

  // Headline metrics for the newest (new-crop) marketing year.
  const metrics = useMemo(() => {
    const latest = (pred: (r: SupplyDemandRow) => boolean) => {
      const r = rawRows.find(pred);
      return r ? { v: r.values[0] ?? null, unit: r.unit } : null;
    };
    const prod = latest(isProduction);
    const ending = latest(isEnding);
    const useRow =
      rawRows.find(r => { const n = norm(r.attribute); return n.includes('usetotal') || n.includes('totaluse'); })
      ?? rawRows.find(r => norm(r.attribute).includes('domestictotal'));
    const useVal = useRow ? useRow.values[0] ?? null : null;
    const stocksToUse = ending?.v != null && useVal ? (ending.v / useVal) * 100 : null;
    return { prod, ending, stocksToUse };
  }, [rawRows]);

  // Stocks-to-use for every year, so the trend reads across the columns.
  const stuByYear = useMemo(() => {
    const endingRow = rawRows.find(isEnding);
    const useRow =
      rawRows.find(r => { const n = norm(r.attribute); return n.includes('usetotal') || n.includes('totaluse'); })
      ?? rawRows.find(r => norm(r.attribute).includes('domestictotal'));
    if (!endingRow || !useRow) return null;
    return years.map((_, j) => {
      const e = endingRow.values[j];
      const u = useRow.values[j];
      return e != null && u ? (e / u) * 100 : null;
    });
  }, [rawRows, years]);

  const latestYear = years[0];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span>⚖️</span>
        <h2>Supply &amp; Demand</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem' }}>
          {(['US', 'WORLD'] as Region[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              style={{
                fontFamily: 'Lato, sans-serif', fontSize: '.74rem', fontWeight: 700,
                padding: '.25rem .8rem', borderRadius: 14, cursor: 'pointer',
                border: '1px solid ' + (region === r ? '#3d6b2a' : '#cdd6bd'),
                background: region === r ? '#3d6b2a' : '#fff',
                color: region === r ? '#f0f7e6' : '#3d6b2a',
              }}
            >
              {r === 'US' ? 'U.S.' : 'World'}
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
                      {region === 'US' ? `U.S. ${commodityLabel}` : `World ${commodityLabel}`} Balance Sheet
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
