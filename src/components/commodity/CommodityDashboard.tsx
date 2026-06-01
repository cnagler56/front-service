'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  api,
  CommodityGroup,
  CropProgressData,
  NASSYieldData,
  UsdaYieldReport,
  User,
} from '@/src/lib/api';
import YieldHistoryChart, { Series, colorFor } from '@/src/components/YieldHistoryChart';
import styles from './commodityDashboard.module.css';

interface Props {
  commodity: string;            // NASS code: "CORN" / "SOYBEANS" / "WHEAT"
  commodityLabel: string;       // "Corn" / "Soybeans" / "Wheat"
  commodityIcon: string;        // "🌽" / "🫘" / "🌾"
  pricesGroupName: string;      // matches CommodityGroup.name in /prices ("Corn" / "Soybeans" / "Wheat")
}

/** "AUG" → "Aug 2026", "YEAR" → "Final 2025" */
function refPeriodLabel(p: string | undefined, year: number): string {
  if (!p) return `${year}`;
  const map: Record<string, string> = {
    YEAR: 'Final', MAY: 'May', JUN: 'Jun', JUL: 'Jul',
    AUG: 'Aug', SEP: 'Sep', OCT: 'Oct', NOV: 'Nov', DEC: 'Dec',
  };
  return `${map[p] ?? p} ${year}`;
}

function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function fmtWeek(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return m && d ? `${parseInt(m, 10)}/${parseInt(d, 10)}` : iso;
}

function stageLabel(unit: string | undefined): string {
  if (!unit) return '';
  const u = unit.toUpperCase().replace(/^PCT\s+/, '');
  return u.charAt(0) + u.substring(1).toLowerCase();
}

/** Production-weighted national yield from a list of state snapshots. */
function nationalAvg(rows: { yieldBu?: number; acres?: number | null }[]): number | null {
  let wsum = 0, asum = 0;
  for (const r of rows) {
    if (r.yieldBu == null || !r.acres) continue;
    wsum += r.yieldBu * r.acres;
    asum += r.acres;
  }
  return asum > 0 ? wsum / asum : null;
}

export default function CommodityDashboard({
  commodity, commodityLabel, commodityIcon, pricesGroupName,
}: Props) {
  const [user, setUser]               = useState<User | null>(null);
  const [prices, setPrices]           = useState<CommodityGroup | null>(null);
  const [yieldReport, setYieldReport] = useState<UsdaYieldReport | null>(null);
  const [progress, setProgress]       = useState<CropProgressData[]>([]);
  const [history, setHistory]         = useState<NASSYieldData[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }

    const thisYear = new Date().getFullYear();

    Promise.all([
      api.getPrices().catch(() => [] as CommodityGroup[]),
      api.getUsdaYield(commodity).catch(() => null),
      api.getCropProgress(commodity, thisYear).catch(() => [] as CropProgressData[]),
      api.getYieldHistory(commodity, 5).catch(() => [] as NASSYieldData[]),
    ]).then(([pricesAll, yieldData, cropProgress, yieldHist]) => {
      if (cancelled) return;
      setPrices(pricesAll.find(g => g.name === pricesGroupName) ?? null);
      setYieldReport(yieldData);
      setProgress(cropProgress);
      setHistory(yieldHist);
    }).catch(() => {
      if (!cancelled) setError(`Could not load ${commodityLabel} dashboard data.`);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [commodity, commodityLabel, pricesGroupName]);

  // ── Derived: yield headline ───────────────────────────────────────────────
  const yieldHeadline = useMemo(() => {
    if (!yieldReport) return null;
    const currentNat = nationalAvg(yieldReport.currentEstimates);
    const priorNat   = nationalAvg(yieldReport.priorYearFinal);
    const yoy = currentNat != null && priorNat != null && priorNat !== 0
      ? ((currentNat - priorNat) / priorNat) * 100
      : null;
    // Top yielder for current snapshot
    let topState: { state: string; yield: number } | null = null;
    for (const r of yieldReport.currentEstimates) {
      if (r.yieldBu == null) continue;
      if (!topState || r.yieldBu > topState.yield) {
        topState = { state: r.state, yield: r.yieldBu };
      }
    }
    return { currentNat, priorNat, yoy, topState };
  }, [yieldReport]);

  // ── Derived: this week's crop progress ────────────────────────────────────
  const progressView = useMemo(() => {
    if (progress.length === 0) return null;
    // Get the latest week
    const weeks = Array.from(new Set(progress.map(r => r.weekEnding))).sort();
    const latestWeek = weeks[weeks.length - 1];
    const latestRows = progress.filter(r => r.weekEnding === latestWeek);

    // National average per stage (across all states reporting)
    const byStage = new Map<string, { sum: number; n: number; userVal?: number }>();
    const userStateName = (user?.state ?? '').toUpperCase().trim();
    for (const r of latestRows) {
      const v = parseFloat(r.value);
      if (!isFinite(v)) continue;
      const slot = byStage.get(r.unit) ?? { sum: 0, n: 0 };
      slot.sum += v;
      slot.n += 1;
      if (userStateName && r.state.toUpperCase() === userStateName) {
        slot.userVal = v;
      }
      byStage.set(r.unit, slot);
    }
    const stages = Array.from(byStage.entries()).map(([unit, s]) => ({
      unit,
      label: stageLabel(unit),
      nationalAvg: s.n > 0 ? s.sum / s.n : 0,
      userVal: s.userVal,
    }));
    return { latestWeek, stages, userState: userStateName };
  }, [progress, user]);

  // ── Derived: 5-year national yield series for the chart ───────────────────
  const chartSeries = useMemo<Series[]>(() => {
    if (history.length === 0) return [];
    // Group all rows by year (ignoring class — usually only one for soybeans, mostly GRAIN for corn)
    const byYear = new Map<number, { sum: number; n: number }>();
    for (const r of history) {
      const v = parseFloat(r.Value);
      if (!isFinite(v) || r.year == null) continue;
      const slot = byYear.get(r.year) ?? { sum: 0, n: 0 };
      slot.sum += v; slot.n += 1;
      byYear.set(r.year, slot);
    }
    const natlPoints = Array.from(byYear.entries())
      .filter(([, s]) => s.n > 0)
      .map(([year, s]) => ({ year, value: Math.round((s.sum / s.n) * 10) / 10 }))
      .sort((a, b) => a.year - b.year);
    const series: Series[] = [{ state: 'US AVG', color: colorFor(0), points: natlPoints }];

    // Add user's state if data exists
    const userState = (user?.state ?? '').toUpperCase().trim();
    if (userState) {
      const stateRows = history
        .filter(r => r.state_name?.toUpperCase() === userState)
        .map(r => ({ year: r.year ?? 0, value: parseFloat(r.Value) }))
        .filter(r => isFinite(r.value) && r.year > 0)
        .sort((a, b) => a.year - b.year);
      if (stateRows.length > 0) {
        series.push({ state: userState, color: colorFor(1), points: stateRows });
      }
    }
    return series;
  }, [history, user]);

  // ── Front contract for the price strip ────────────────────────────────────
  const frontPrice = prices?.contracts?.[0];

  if (loading) {
    return <p className={styles.loading}>Loading {commodityLabel} dashboard…</p>;
  }
  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.dashboard}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.heroHeader}>
        <h1>
          <span className={styles.heroIcon}>{commodityIcon}</span>
          {commodityLabel} Dashboard
        </h1>
        <p>Everything for {commodityLabel.toLowerCase()} at a glance — price, USDA estimates, this week's progress, and 5-year trend.</p>
      </div>

      {/* ── Price strip ────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📈</span>
          <h2>Futures</h2>
          <Link href="/home" className={styles.headLink}>All commodities →</Link>
        </div>
        <div className={styles.priceStrip}>
          {!frontPrice ? (
            <p className={styles.empty}>Price unavailable.</p>
          ) : (
            <>
              <div className={styles.frontPrice}>
                <div className={styles.frontLabel}>{frontPrice.expiration} (front)</div>
                <div className={styles.frontValue}>
                  {fmtNum(frontPrice.last, 2)} <span className={styles.unitLabel}>{prices?.unit}</span>
                </div>
                <ChangePill change={frontPrice.change ?? null} pct={frontPrice.changePercent ?? null} />
              </div>
              <div className={styles.deferredTable}>
                {(prices?.contracts ?? []).slice(1).map(c => (
                  <div key={c.symbol} className={styles.deferredRow}>
                    <span className={styles.deferredExp}>{c.expiration}</span>
                    <span className={styles.deferredLast}>{fmtNum(c.last, 2)}</span>
                    <ChangePill compact change={c.change ?? null} pct={null} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── USDA Yield ─────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🏛️</span>
          <h2>USDA Yield</h2>
          <Link href="/usda-reports" className={styles.headLink}>Adjust state-by-state →</Link>
        </div>
        {!yieldReport ? (
          <p className={styles.empty}>USDA yield data unavailable.</p>
        ) : (
          <div className={styles.statGrid}>
            <Stat
              label={`Latest USDA (${refPeriodLabel(yieldReport.currentAsOf, yieldReport.currentYear)})`}
              value={fmtNum(yieldHeadline?.currentNat, 1)}
              unit="bu/acre"
              big
            />
            <Stat
              label={`USDA Final ${yieldReport.priorYear}`}
              value={fmtNum(yieldHeadline?.priorNat, 1)}
              unit="bu/acre"
            />
            <Stat
              label="YoY Change"
              value={yieldHeadline?.yoy != null
                ? `${yieldHeadline.yoy > 0 ? '+' : ''}${yieldHeadline.yoy.toFixed(1)}%`
                : '—'}
              tone={yieldHeadline?.yoy != null
                ? yieldHeadline.yoy > 0 ? 'up' : yieldHeadline.yoy < 0 ? 'down' : undefined
                : undefined}
            />
            <Stat
              label="Top Yielding State"
              value={yieldHeadline?.topState
                ? `${yieldHeadline.topState.state}`
                : '—'}
              footnote={yieldHeadline?.topState
                ? `${fmtNum(yieldHeadline.topState.yield, 1)} bu/acre`
                : undefined}
            />
          </div>
        )}
      </div>

      {/* ── Crop Progress (this week) ──────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌱</span>
          <h2>Crop Progress</h2>
          <Link href="/cropprogress" className={styles.headLink}>Full report →</Link>
        </div>
        {!progressView ? (
          <p className={styles.empty}>
            No crop progress data yet for {new Date().getFullYear()}. Reports run April – November.
          </p>
        ) : (
          <>
            <p className={styles.progressMeta}>
              Week ending <strong>{fmtWeek(progressView.latestWeek)}</strong>
              {progressView.userState && (
                <> · showing <strong>{progressView.userState}</strong> next to national avg</>
              )}
            </p>
            <div className={styles.stageGrid}>
              {progressView.stages.map(s => (
                <StageBar
                  key={s.unit}
                  label={s.label}
                  nationalAvg={s.nationalAvg}
                  userVal={s.userVal}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── 5-year history chart ───────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📊</span>
          <h2>5-Year Yield History</h2>
          <Link href="/usda" className={styles.headLink}>State-level history →</Link>
        </div>
        {chartSeries.length === 0 ? (
          <p className={styles.empty}>No history available.</p>
        ) : (
          <>
            <div className={styles.legend}>
              {chartSeries.map(s => (
                <span key={s.state} className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ background: s.color }} />
                  <strong>{s.state}</strong>
                </span>
              ))}
            </div>
            <YieldHistoryChart series={chartSeries} yLabel="Yield (bu/acre)" />
          </>
        )}
      </div>

      {/* ── Quick links ────────────────────────────────────────── */}
      <div className={styles.linkGrid}>
        <QuickLink href="/usda-reports" icon="🏛️" title="USDA Reports"
          desc="Adjust state-by-state yields, submit a guess, see the crowd average." />
        <QuickLink href="/cropprogress" icon="🌱" title="Crop Progress"
          desc="Weekly state-level % planted, emerged, harvested." />
        <QuickLink href="/usda" icon="📑" title="USDA Yield Lookup"
          desc="Historical yield by commodity, year, and class." />
        <QuickLink href="/forecast-change" icon="📈" title="Forecast Change"
          desc="Track how weather forecasts shift between refreshes." />
      </div>
    </div>
  );
}

/* ── Small presentational helpers ─────────────────────────────────────────── */

function Stat({
  label, value, unit, footnote, big, tone,
}: {
  label: string;
  value: string;
  unit?: string;
  footnote?: string;
  big?: boolean;
  tone?: 'up' | 'down';
}) {
  const valueColor = tone === 'up' ? '#1d4ed8' : tone === 'down' ? '#b91c1c' : '#1a2e0f';
  return (
    <div className={`${styles.stat} ${big ? styles.statBig : ''}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color: valueColor }}>
        {value}
        {unit && <span className={styles.statUnit}>{unit}</span>}
      </div>
      {footnote && <div className={styles.statFootnote}>{footnote}</div>}
    </div>
  );
}

function StageBar({
  label, nationalAvg, userVal,
}: { label: string; nationalAvg: number; userVal?: number }) {
  const natlPct = Math.max(0, Math.min(100, Math.round(nationalAvg)));
  const userPct = userVal != null ? Math.max(0, Math.min(100, Math.round(userVal))) : null;
  return (
    <div className={styles.stageCard}>
      <div className={styles.stageLabel}>{label}</div>
      <div className={styles.stageBars}>
        <div className={styles.stageBarRow}>
          <span className={styles.stageRowLabel}>US Avg</span>
          <div className={styles.stageBarTrack}>
            <div className={styles.stageBarFill} style={{ width: `${natlPct}%`, background: '#3d6b2a' }} />
          </div>
          <span className={styles.stageRowValue}>{natlPct}%</span>
        </div>
        {userPct != null && (
          <div className={styles.stageBarRow}>
            <span className={styles.stageRowLabel}>Your State</span>
            <div className={styles.stageBarTrack}>
              <div className={styles.stageBarFill} style={{ width: `${userPct}%`, background: '#a16207' }} />
            </div>
            <span className={styles.stageRowValue}>{userPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePill({
  change, pct, compact,
}: { change: number | null; pct: number | null; compact?: boolean }) {
  if (change == null) return <span className={styles.changeFlat}>—</span>;
  const up = change > 0;
  const down = change < 0;
  const arrow = up ? '▲' : down ? '▼' : '—';
  const cls = up ? styles.changeUp : down ? styles.changeDown : styles.changeFlat;
  return (
    <span className={`${cls} ${compact ? styles.compact : ''}`}>
      {arrow} {Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      {pct != null && !compact && (
        <span style={{ marginLeft: '.4rem', opacity: .85 }}>
          ({pct > 0 ? '+' : ''}{pct.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}

function QuickLink({
  href, icon, title, desc,
}: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className={styles.quickLink}>
      <span className={styles.quickIcon}>{icon}</span>
      <div>
        <div className={styles.quickTitle}>{title}</div>
        <div className={styles.quickDesc}>{desc}</div>
      </div>
    </Link>
  );
}
