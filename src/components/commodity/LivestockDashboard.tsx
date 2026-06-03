'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, AnimalData, CommodityGroup, User } from '@/src/lib/api';
import styles from './commodityDashboard.module.css';

interface Props {
  commodity: 'CATTLE' | 'HOGS';
  commodityLabel: string;       // "Cattle" / "Hogs"
  commodityIcon: string;        // "🐄" / "🐖"
  pricesGroupName: string;      // "Live Cattle" / "Lean Hogs"
  /** Default month to pull NASS inventory for. Jan=1 for cattle, Dec=12 for hogs Q4. */
  defaultMonth: string;
  /** Friendly description shown under the inventory headline. */
  inventoryDescription: string;
}

function fmtNum(n: number | null | undefined, digits = 0): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

/**
 * Price formatter — no thousands separator. Futures are quoted without commas
 * in market data feeds and most farmers expect to see "1188.75" not "1,188.75".
 */
function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(2);
}

function parseInventory(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Headline stats for the dashboard, extracted from a NASS inventory response.
 *
 *   - Total US head (US row, "<commodity> - INVENTORY")
 *   - Top 5 reporting states
 *   - YoY change uses the same-month, prior-year US total
 */
function summarize(rows: AnimalData[]): {
  usTotal: number | null;
  topStates: { state: string; head: number }[];
} {
  if (!rows.length) return { usTotal: null, topStates: [] };

  // Find the "headline" rows — the simple "<COMMODITY> - INVENTORY" or "HOGS - INVENTORY",
  // not the breeding/market/calf/etc. subcategories. These are the per-state totals.
  const headline = rows.filter(r => {
    const s = (r.short_desc ?? '').toUpperCase();
    // accept "CATTLE, INCL CALVES - INVENTORY" and "HOGS - INVENTORY"
    return /^(CATTLE,\s*INCL\s+CALVES|CATTLE|HOGS)\s*-\s*INVENTORY/.test(s);
  });

  const us = headline.find(r => (r.location_desc ?? '').toUpperCase() === 'US TOTAL');
  const usTotal = us ? parseInventory(us.Value) : null;

  const top = headline
    .filter(r => (r.location_desc ?? '').toUpperCase() !== 'US TOTAL')
    .map(r => ({ state: r.location_desc ?? '', head: parseInventory(r.Value) ?? 0 }))
    .filter(r => r.head > 0)
    .sort((a, b) => b.head - a.head)
    .slice(0, 5);

  return { usTotal, topStates: top };
}

export default function LivestockDashboard({
  commodity, commodityLabel, commodityIcon, pricesGroupName,
  defaultMonth, inventoryDescription,
}: Props) {
  const [user, setUser]               = useState<User | null>(null);
  const [prices, setPrices]           = useState<CommodityGroup | null>(null);
  const [currentRows, setCurrentRows] = useState<AnimalData[]>([]);
  const [priorRows, setPriorRows]     = useState<AnimalData[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [reportYear, setReportYear]   = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }

    // NASS Hogs+Cattle annual reports for "current year" usually come out the next year.
    // Fall back through recent years if the report hasn't dropped yet.
    const tryYear = async (y: number): Promise<AnimalData[]> => {
      try {
        return commodity === 'CATTLE'
          ? await api.getCattle(defaultMonth, String(y))
          : await api.getHogs(defaultMonth, String(y));
      } catch {
        return [];
      }
    };

    (async () => {
      const pricesPromise = api.getPrices().catch(() => [] as CommodityGroup[]);
      const startYear = new Date().getFullYear() - 1;
      let usedYear = startYear;
      let current: AnimalData[] = await tryYear(startYear);
      if (current.length === 0) {
        usedYear = startYear - 1;
        current = await tryYear(usedYear);
      }
      const prior = await tryYear(usedYear - 1);

      const pricesAll = await pricesPromise;
      if (cancelled) return;

      setPrices(pricesAll.find(g => g.name === pricesGroupName) ?? null);
      setCurrentRows(current);
      setPriorRows(prior);
      setReportYear(current.length > 0 ? usedYear : null);
    })()
      .catch(() => { if (!cancelled) setError(`Could not load ${commodityLabel} dashboard data.`); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [commodity, commodityLabel, defaultMonth, pricesGroupName]);

  const summary  = useMemo(() => summarize(currentRows), [currentRows]);
  const prior    = useMemo(() => summarize(priorRows), [priorRows]);
  const yoyPct   = useMemo(() => {
    if (summary.usTotal == null || prior.usTotal == null || prior.usTotal === 0) return null;
    return ((summary.usTotal - prior.usTotal) / prior.usTotal) * 100;
  }, [summary, prior]);

  const userInTop5 = useMemo(() => {
    const st = (user?.state ?? '').trim().toUpperCase();
    if (!st) return false;
    return summary.topStates.some(r => r.state.toUpperCase() === st);
  }, [summary, user]);

  const frontPrice = prices?.contracts?.[0];

  if (loading) {
    return <p className={styles.loading}>Loading {commodityLabel} dashboard…</p>;
  }
  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.dashboard}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className={styles.heroHeader}>
        <h1>
          <span className={styles.heroIcon}>{commodityIcon}</span>
          {commodityLabel} Dashboard
        </h1>
        <p>{inventoryDescription}</p>
      </div>

      {/* ── Futures ──────────────────────────────────────────── */}
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
                  {fmtPrice(frontPrice.last)} <span className={styles.unitLabel}>{prices?.unit}</span>
                </div>
                <ChangePill change={frontPrice.change ?? null} pct={frontPrice.changePercent ?? null} />
              </div>
              <div className={styles.deferredTable}>
                {(prices?.contracts ?? []).slice(1).map(c => (
                  <div key={c.symbol} className={styles.deferredRow}>
                    <span className={styles.deferredExp}>{c.expiration}</span>
                    <span className={styles.deferredLast}>{fmtPrice(c.last)}</span>
                    <ChangePill compact change={c.change ?? null} pct={null} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── USDA Inventory headline ──────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🏛️</span>
          <h2>USDA Inventory</h2>
          <Link href="/usda-reports" className={styles.headLink}>Full report →</Link>
        </div>
        {summary.usTotal == null ? (
          <p className={styles.empty}>
            No recent inventory data — the NASS report for this commodity may not have been published yet.
          </p>
        ) : (
          <div className={styles.statGrid}>
            <Stat
              label={`US Total${reportYear ? ` — ${reportYear}` : ''}`}
              value={fmtNum(summary.usTotal, 0)}
              unit="head"
              big
            />
            <Stat
              label="YoY Change"
              value={yoyPct != null
                ? `${yoyPct > 0 ? '+' : ''}${yoyPct.toFixed(1)}%`
                : '—'}
              tone={yoyPct != null
                ? yoyPct > 0 ? 'up' : yoyPct < 0 ? 'down' : undefined
                : undefined}
            />
            <Stat
              label="Top State"
              value={summary.topStates[0]?.state ?? '—'}
              footnote={summary.topStates[0]
                ? `${fmtNum(summary.topStates[0].head, 0)} head`
                : undefined}
            />
            <Stat
              label="Your State in Top 5?"
              value={userInTop5 ? '⭐ Yes' : (user?.state ?? '—')}
              footnote={userInTop5
                ? 'see the table below'
                : (user?.state ? 'outside top 5' : 'sign in & set state')}
            />
          </div>
        )}
      </div>

      {/* ── Top producing states ─────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📊</span>
          <h2>Top 5 States by Inventory</h2>
          <Link href="/usda-reports" className={styles.headLink}>Drill down →</Link>
        </div>
        {summary.topStates.length === 0 ? (
          <p className={styles.empty}>No state inventory data available.</p>
        ) : (
          <div className={styles.topStatesList}>
            {summary.topStates.map((s, i) => {
              const isUser = (user?.state ?? '').trim().toUpperCase() === s.state.toUpperCase();
              const maxHead = summary.topStates[0].head;
              const pct = (s.head / maxHead) * 100;
              return (
                <div key={s.state} className={styles.topStateRow}>
                  <span className={styles.topStateRank}>#{i + 1}</span>
                  <span className={styles.topStateName}>
                    {s.state}{isUser ? ' ⭐' : ''}
                  </span>
                  <div className={styles.topStateBarTrack}>
                    <div
                      className={styles.topStateBar}
                      style={{ width: `${pct}%`, background: isUser ? '#a16207' : '#3d6b2a' }}
                    />
                  </div>
                  <span className={styles.topStateValue}>{fmtNum(s.head, 0)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick links ──────────────────────────────────────── */}
      <div className={styles.linkGrid}>
        <QuickLink href="/usda-reports" icon="🏛️" title="USDA Reports"
          desc={`Full ${commodityLabel.toLowerCase()} inventory pivot tables by category.`} />
        <QuickLink href="/usda" icon="📑" title="USDA Yield Lookup"
          desc="Historical NASS data across all commodities." />
        <QuickLink href="/forecast-change" icon="📈" title="Forecast Change"
          desc="Track how weather forecasts shift between refreshes." />
        <QuickLink href="/buysell" icon="🛒" title="Buy / Sell"
          desc={`Livestock listings and ${commodityLabel.toLowerCase()}-related equipment.`} />
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
      {arrow} {Math.abs(change).toFixed(2)}
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
