'use client';

import { useEffect, useState } from 'react';
import { api, EthanolData, EthanolPoint, CommodityGroup } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

const GAL_PER_BUSHEL = 2.8;   // ethanol yield per bushel of corn

const PROD_COLOR  = '#3d6b2a';   // green
const STOCK_COLOR = '#a16207';   // amber
const GAS_COLOR   = '#2563eb';   // blue (gasoline demand)

function fmtInt(n: number | null | undefined): string {
  return n == null ? '—' : Math.round(n).toLocaleString();
}
/** Bushels → "6.0 bil" / "115.7 mil". */
function fmtBu(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e9) return (n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function fmtDate(p: string | null | undefined): string {
  if (!p) return '';
  const d = new Date(p);
  return isNaN(d.getTime()) ? p : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EthanolPage() {
  const [data, setData] = useState<EthanolData | null>(null);
  const [prices, setPrices] = useState<CommodityGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getEthanol()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Could not load ethanol data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    api.getPrices().then(p => { if (!cancelled) setPrices(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const production = data?.production ?? [];
  const stocks = data?.stocks ?? [];
  const gasoline = data?.gasoline ?? [];
  const hasData = production.length > 0 || stocks.length > 0;
  const wow = data?.productionWoW ?? null;
  const gasWow = data?.gasolineWoW ?? null;

  // Corn–ethanol gross margin (before DDGS / corn-oil co-product credits).
  const ethSpot = data?.ethanolSpotPrice ?? null;
  const cornFront = prices?.find(g => g.name === 'Corn')?.contracts?.find(c => c.last != null) ?? null;
  const cornCost = cornFront?.last != null ? cornFront.last / 100 : null;
  const ethRevenue = ethSpot != null ? ethSpot * GAL_PER_BUSHEL : null;
  const grossSpread = ethRevenue != null && cornCost != null ? ethRevenue - cornCost : null;

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          
          <h2>Ethanol Tracker</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: '0 0 1rem' }}>
            About <strong>40% of the U.S. corn crop</strong> is ground for ethanol, so the EIA&rsquo;s weekly
            production figure is a near real-time read on corn demand. <strong>Gasoline demand</strong> is the
            other side of that coin — most ethanol is blended into gasoline (~10%), so softer driving demand
            eventually pressures the corn grind. Released every Wednesday.
          </p>

          {loading && <p className={styles.loading}>Loading ethanol data…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && !hasData && (
            <p className={styles.empty}>{data?.message ?? 'No ethanol data loaded yet.'}</p>
          )}

          {hasData && (
            <>
              {/* Headline cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
                <Card
                  label="Weekly Production"
                  value={fmtInt(data?.productionLatest)}
                  unit={data?.productionUnit ?? 'MBBL/D'}
                  accent={PROD_COLOR}
                  sub={
                    <>
                      {wow != null && (
                        <span style={{ color: wow > 0 ? '#1a7f37' : wow < 0 ? '#b42318' : '#888', fontWeight: 700 }}>
                          {wow > 0 ? '▲ +' : wow < 0 ? '▼ ' : ''}{wow !== 0 ? wow : '±0'} vs last wk
                        </span>
                      )}
                      {data?.productionAsOf && <> · {fmtDate(data.productionAsOf)}</>}
                    </>
                  }
                />
                <Card
                  label="Implied Corn Use (annualized)"
                  value={fmtBu(data?.impliedCornBuPerYear)}
                  unit="bil bu"
                  accent="#2c4a1e"
                  sub={<>≈ {fmtBu(data?.impliedCornBuPerWeek)} mil bu/week · 2.8 gal/bu</>}
                />
                <Card
                  label="Ethanol Stocks"
                  value={fmtInt(data?.stocksLatest)}
                  unit={data?.stocksUnit ?? 'MBBL'}
                  accent={STOCK_COLOR}
                  sub={data?.stocksAsOf ? <>{fmtDate(data.stocksAsOf)}</> : undefined}
                />
                {data?.gasolineLatest != null && (
                  <Card
                    label="Gasoline Demand"
                    value={fmtInt(data?.gasolineLatest)}
                    unit={data?.gasolineUnit ?? 'MBBL/D'}
                    accent={GAS_COLOR}
                    sub={
                      <>
                        {gasWow != null && (
                          <span style={{ color: gasWow > 0 ? '#1a7f37' : gasWow < 0 ? '#b42318' : '#888', fontWeight: 700 }}>
                            {gasWow > 0 ? '▲ +' : gasWow < 0 ? '▼ ' : ''}{gasWow !== 0 ? gasWow : '±0'} vs last wk
                          </span>
                        )}
                        {data?.impliedBlendPct != null && <> · blend ~{data.impliedBlendPct}%</>}
                      </>
                    }
                  />
                )}
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem',
              }}>
                {production.length > 1 && (
                  <LineChart title="Weekly Production" unit="thousand barrels/day (MBBL/D)" points={production} color={PROD_COLOR} />
                )}
                {stocks.length > 1 && (
                  <LineChart title="Ethanol Stocks" unit="thousand barrels (MBBL)" points={stocks} color={STOCK_COLOR} />
                )}
                {gasoline.length > 1 && (
                  <LineChart title="Gasoline Demand" unit="thousand barrels/day (MBBL/D)" points={gasoline} color={GAS_COLOR} />
                )}
              </div>

              {/* Corn connection */}
              <div style={{
                marginTop: '1.25rem', background: '#f7faf2', border: '1px solid #e1dccc',
                borderRadius: 8, padding: '.85rem 1.1rem', fontFamily: 'Lato, sans-serif',
                fontSize: '.82rem', color: '#33402a', lineHeight: 1.5,
              }}>
                🌽 <strong>Corn connection:</strong> at this production rate, ethanol plants are grinding roughly{' '}
                <strong>{fmtBu(data?.impliedCornBuPerWeek)} million bushels of corn per week</strong>{' '}
                (~{fmtBu(data?.impliedCornBuPerYear)} billion bu/yr). Rising production tightens corn demand;
                rising stocks can signal the opposite.
              </div>

              {/* Corn–ethanol margin */}
              {grossSpread != null && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1a2e0f', margin: '0 0 .5rem' }}>
                    Corn–Ethanol Margin
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                    <Card label="Ethanol Price" value={ethSpot != null ? `$${ethSpot.toFixed(2)}` : '—'} unit="/gal" accent="#2563eb" sub={<>CME front</>} />
                    <Card label="Ethanol Revenue" value={ethRevenue != null ? `$${ethRevenue.toFixed(2)}` : '—'} unit="/bu" accent="#3d6b2a" sub={<>2.8 gal × price</>} />
                    <Card label="Corn Cost" value={cornCost != null ? `$${cornCost.toFixed(2)}` : '—'} unit="/bu" accent="#a16207" sub={cornFront ? <>{cornFront.expiration}</> : undefined} />
                    <Card label="Gross Spread" value={`$${grossSpread.toFixed(2)}`} unit="/bu" accent={grossSpread >= 0 ? '#1a7f37' : '#b42318'} sub={<>before co-product credits</>} />
                  </div>
                  <p style={{ margin: '.6rem 0 0', fontSize: '.72rem', color: '#8a8a7a', fontFamily: 'Lato, sans-serif' }}>
                    Simplified: ethanol revenue minus corn cost. Actual plant margins add <strong>DDGS</strong> and
                    corn-oil credits (typically ~$0.50–0.80/bu), which aren&rsquo;t in this figure.
                  </p>
                </div>
              )}

              <p style={{ margin: '.9rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
                {data?.source ?? 'U.S. EIA'}{data?.updatedAt ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}` : ''}.
                Implied corn grind assumes ~2.8 gal ethanol/bushel and 42 gal/barrel.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  label, value, unit, sub, accent,
}: { label: string; value: string; unit?: string; sub?: React.ReactNode; accent: string }) {
  return (
    <div style={{
      flex: '1 1 200px', minWidth: 180,
      background: '#fff', border: '1px solid #e1dccc', borderLeft: `4px solid ${accent}`,
      borderRadius: 6, padding: '.7rem .9rem', fontFamily: 'Lato, sans-serif',
    }}>
      <div style={{ fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.04em', color: '#6a7a55', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2e0f', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: '.7rem', fontWeight: 400, color: '#888', marginLeft: '.35rem' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '.72rem', color: '#6a7a55', marginTop: '.2rem' }}>{sub}</div>}
    </div>
  );
}

/** "2026-06-12" → "Jun '26". */
function monthYear(p: string): string {
  const d = new Date(p);
  if (isNaN(d.getTime())) return p;
  return `${d.toLocaleDateString(undefined, { month: 'short' })} '${String(d.getFullYear() % 100).padStart(2, '0')}`;
}

/**
 * Responsive SVG line chart with gridlines + labeled axes, auto-scaled to the
 * series' range (with a little headroom). Everything is drawn inside the SVG so
 * the tick labels line up with the gridlines.
 */
function LineChart({ title, unit, points, color }: { title: string; unit: string; points: EthanolPoint[]; color: string }) {
  const W = 480, H = 250, padL = 50, padR = 14, padT = 16, padB = 28;
  const n = points.length;
  const vals = points.map(p => p.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  // ~8% headroom so the line isn't glued to the top/bottom edges.
  const pad = Math.max((hi - lo) * 0.08, 0.5);
  const dMin = lo - pad, dMax = hi + pad;
  const dSpan = Math.max(dMax - dMin, 1e-9);

  const x = (i: number) => padL + (i / Math.max(n - 1, 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - dMin) / dSpan) * (H - padT - padB);
  const baseY = y(dMin);

  const TICKS = 4; // → 5 horizontal gridlines
  const yTicks = Array.from({ length: TICKS + 1 }, (_, k) => dMin + (k / TICKS) * dSpan);
  const xIdx = Array.from({ length: 4 }, (_, k) => Math.round((k / 3) * (n - 1)));

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${baseY.toFixed(1)} L${x(0).toFixed(1)},${baseY.toFixed(1)} Z`;
  const last = points[n - 1];

  return (
    <div style={{ border: '1px solid #e1dccc', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '.5rem',
        padding: '.7rem .9rem', borderBottom: '1px solid #eef0ea',
        borderLeft: `4px solid ${color}`,
      }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1a2e0f', lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.68rem', color: '#8aa06a', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '.1rem' }}>
            {unit}
          </div>
        </div>
      </div>
      <div style={{ padding: '.7rem .9rem' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', background: 'transparent' }}
        fontFamily="Lato, sans-serif"
      >
        {/* Horizontal gridlines + y labels */}
        {yTicks.map((v, k) => (
          <g key={k}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#eef0ea" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="#9aa886">
              {Math.round(v).toLocaleString()}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill={color} fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.25} vectorEffect="non-scaling-stroke" />

        {/* X labels */}
        {xIdx.map((i, k) => (
          <text
            key={k}
            x={x(i)}
            y={H - 8}
            textAnchor={k === 0 ? 'start' : k === xIdx.length - 1 ? 'end' : 'middle'}
            fontSize={12}
            fill="#9aa886"
          >
            {monthYear(points[i].period)}
          </text>
        ))}

        {/* Latest point + value */}
        <circle cx={x(n - 1)} cy={y(last.value)} r={3.5} fill={color} />
        <text x={x(n - 1) - 6} y={y(last.value) - 7} textAnchor="end" fontSize={13} fontWeight={700} fill={color}>
          {Math.round(last.value).toLocaleString()}
        </text>
      </svg>
      </div>
    </div>
  );
}
