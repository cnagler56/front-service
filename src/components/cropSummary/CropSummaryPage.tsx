'use client';

import { useEffect, useState } from 'react';
import { api, CropCommentary, CropSummary, CropSummaryMetric, CropSummaryMover } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Commodity { key: string; label: string; }
const COMMODITIES: Commodity[] = [
  { key: 'CORN',     label: 'Corn' },
  { key: 'SOYBEANS', label: 'Soybeans' },
  { key: 'WHEAT',    label: 'Wheat' },
];

const CURRENT_YEAR = new Date().getFullYear();
// "Latest" lets the server pick the newest report (falling back to last year);
// the explicit past years are for reviewing / testing against real numbers.
const YEARS: { label: string; value: number | undefined }[] = [
  { label: 'Latest', value: undefined },
  { label: String(CURRENT_YEAR - 1), value: CURRENT_YEAR - 1 },
  { label: String(CURRENT_YEAR - 2), value: CURRENT_YEAR - 2 },
];

/* ── value formatters ─────────────────────────────────────────────── */
const fmtYield = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1));
const fmtProd  = (v: number | null | undefined) => (v == null ? '—' : (v / 1e9).toFixed(2) + 'B');
const fmtAcres = (v: number | null | undefined) => (v == null ? '—' : (v / 1e6).toFixed(1) + 'M');

/**
 * /report-summary — a one-glance recap of the latest USDA Crop Production
 * report: national yield, production and harvested acres (each with change vs
 * the previous report and vs last year), plus the biggest state yield movers.
 */
export default function CropSummaryPage() {
  const [commodity, setCommodity] = useState<Commodity>(COMMODITIES[0]);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [data, setData] = useState<CropSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api.getCropSummary(commodity.key, year)
      .then(d => { if (live) setData(d); })
      .catch(() => { if (live) setError('Could not load the report summary.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [commodity.key, year]);

  const nat = data?.national;

  return (
    <div className={styles.page}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #2c4a1e 0%, #3d6b2a 55%, #2c4a1e 100%)',
        border: '1px solid #1a2e0f', borderRadius: 8, padding: '1.5rem 1.75rem',
        marginBottom: '1.25rem', color: '#f0f7e6',
      }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.7rem', margin: '0 0 .4rem' }}>
          Crop Production Report Summary
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.92rem', lineHeight: 1.6, color: '#d8ecc0', margin: 0, maxWidth: 720 }}>
          The headline numbers from USDA&rsquo;s latest Crop Production report — national yield,
          total production and harvested acres — with how each moved since last month&rsquo;s report
          and since last year, plus the states that changed the most.
        </p>
      </div>

      {/* ── Commodity + year selectors ───────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.6rem' }}>
        {COMMODITIES.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCommodity(c)}
            className={`${styles.filterPill} ${commodity.key === c.key ? styles.filterPillActive : ''}`}
            style={{ fontWeight: 700, fontSize: '.95rem', padding: '.5rem 1rem' }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.1rem', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#6a7a55', marginRight: '.2rem' }}>
          Report year:
        </span>
        {YEARS.map(y => (
          <button
            key={y.label}
            type="button"
            onClick={() => setYear(y.value)}
            className={`${styles.filterPill} ${year === y.value ? styles.filterPillActive : ''}`}
            style={{ fontSize: '.82rem', padding: '.3rem .7rem' }}
          >
            {y.label}
          </button>
        ))}
      </div>

      {loading && <p className={styles.loading}>Loading report summary…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && data && (
        data.message || !nat ? (
          <p className={styles.empty}>{data.message ?? 'No report data available yet.'}</p>
        ) : (
          <>
            {/* Report header */}
            <div style={{ fontFamily: 'Lato, sans-serif', margin: '0 0 1rem', color: '#2c4a1e' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {commodity.label} — {periodLabel(data.latestPeriod)} {data.year}
              </span>
              <span style={{ color: '#7a8a65', fontSize: '.85rem', marginLeft: '.6rem' }}>
                {data.stateCount} states · acre-weighted national figures
              </span>
            </div>

            {/* AI recap */}
            <Commentary commodity={commodity.key} year={year} />

            {/* National headline cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <MetricCard label="National Yield" unit="bu/acre" metric={nat.yield}
                fmt={fmtYield} prevLabel={data.previousPeriod ? periodLabel(data.previousPeriod) : null} priorYear={data.priorYear} />
              <MetricCard label="Production" unit="bushels" metric={nat.production}
                fmt={fmtProd} prevLabel={data.previousPeriod ? periodLabel(data.previousPeriod) : null} priorYear={data.priorYear} />
              <MetricCard label="Harvested Acres" unit="acres" metric={nat.acres}
                fmt={fmtAcres} prevLabel={data.previousPeriod ? periodLabel(data.previousPeriod) : null} priorYear={data.priorYear} />
            </div>

            {/* State movers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <MoverBoard title="Biggest Yield Gainers" basis={data.moverBasis} rows={data.topGainers ?? []} positive />
              <MoverBoard title="Biggest Yield Decliners" basis={data.moverBasis} rows={data.topDecliners ?? []} positive={false} />
            </div>

            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.74rem', color: '#8aa06a', marginTop: '1.25rem' }}>
              Source: USDA NASS Quick Stats. National yield is production-weighted by state harvested acres.
            </p>
          </>
        )
      )}
    </div>
  );
}

/* ── AI-generated recap ───────────────────────────────────────────── */
function Commentary({ commodity, year }: { commodity: string; year?: number }) {
  const [data, setData] = useState<CropCommentary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setData(null);
    api.getCropCommentary(commodity, year)
      .then(d => { if (live) setData(d); })
      .catch(() => { if (live) setData(null); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [commodity, year]);

  // Hide entirely if the model isn't configured / the call failed.
  if (!loading && (!data || !data.available)) return null;

  return (
    <div style={{
      background: '#f6f8f1', border: '1px solid #d8e3c8', borderLeft: '4px solid #8fbc45',
      borderRadius: 8, padding: '1rem 1.15rem', margin: '0 0 1.5rem', fontFamily: 'Lato, sans-serif',
    }}>
      <div style={{
        fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em',
        color: '#7a8a65', fontWeight: 700, marginBottom: '.4rem',
      }}>
        ✨ AI Recap
      </div>
      {loading ? (
        <p style={{ margin: 0, color: '#8aa06a', fontSize: '.9rem', fontStyle: 'italic' }}>
          Generating analysis…
        </p>
      ) : (
        <p style={{ margin: 0, color: '#2c4a1e', fontSize: '.95rem', lineHeight: 1.6 }}>
          {data!.commentary}
        </p>
      )}
    </div>
  );
}

/* ── One headline metric with MoM + YoY deltas ────────────────────── */
function MetricCard({
  label, unit, metric, fmt, prevLabel, priorYear,
}: {
  label: string; unit: string; metric: CropSummaryMetric;
  fmt: (v: number | null | undefined) => string;
  prevLabel: string | null; priorYear?: number;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #d8e3c8', borderRadius: 8, padding: '1.1rem 1.25rem' }}>
      <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.06em', color: '#7a8a65' }}>
        {label}
      </div>
      <div style={{ margin: '.35rem 0 .6rem', color: '#2c4a1e' }}>
        <strong style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums' }}>{fmt(metric.latest)}</strong>
        <span style={{ fontSize: '.78rem', color: '#888', marginLeft: '.4rem' }}>{unit}</span>
      </div>
      <Delta value={metric.momChange} fmt={fmt} label={prevLabel ? `vs ${prevLabel}` : 'vs prev report'} />
      <Delta value={metric.yoyChange} fmt={fmt} label={priorYear ? `vs ${priorYear}` : 'vs last year'} />
    </div>
  );
}

/** One signed change line, coloured green (up) / red (down). */
function Delta({ value, fmt, label }: { value: number | null; fmt: (v: number | null | undefined) => string; label: string }) {
  const up = value != null && value > 0;
  const down = value != null && value < 0;
  const color = up ? '#2c7a1e' : down ? '#c0392b' : '#999';
  const arrow = up ? '▲' : down ? '▼' : '–';
  const sign = up ? '+' : down ? '−' : '';
  const text = value == null ? '—' : `${sign}${fmt(Math.abs(value))}`;
  return (
    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color, display: 'flex', gap: '.4rem' }}>
      <span style={{ width: '5.5rem', fontVariantNumeric: 'tabular-nums' }}>{arrow} {text}</span>
      <span style={{ color: '#9aa88a' }}>{label}</span>
    </div>
  );
}

/* ── Top movers list ──────────────────────────────────────────────── */
function MoverBoard({ title, basis, rows, positive }: {
  title: string; basis?: string; rows: CropSummaryMover[]; positive: boolean;
}) {
  const color = positive ? '#2c7a1e' : '#c0392b';
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{title}</h2>
        {basis && (
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.72rem', fontFamily: 'Lato, sans-serif' }}>
            {basis}
          </span>
        )}
      </div>
      <div className={styles.sectionBody}>
        {rows.length === 0 ? (
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#888', padding: '.5rem 0' }}>
            No comparable states in the previous report.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>State</th><th>Change</th><th>Now (bu/acre)</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.state}>
                  <td style={{ fontWeight: 700, color: '#2c4a1e' }}>{r.state}</td>
                  <td style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                    {r.change > 0 ? '+' : r.change < 0 ? '−' : ''}{Math.abs(r.change).toFixed(1)}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.latest.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** NASS reference-period code → friendly label. */
function periodLabel(p?: string | null): string {
  if (!p) return '';
  const map: Record<string, string> = {
    YEAR: 'Final', DEC: 'December', NOV: 'November', OCT: 'October',
    SEP: 'September', AUG: 'August', JUL: 'July', JUN: 'June', MAY: 'May',
  };
  return map[p] ?? p;
}
