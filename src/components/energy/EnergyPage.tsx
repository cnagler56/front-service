'use client';

import { useEffect, useState } from 'react';
import { api, EnergyData, EnergyMetric } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import { StatCard, MiniLineChart } from './EnergyCharts';

const COLORS: Record<string, string> = {
  crude: '#1a2e0f', dieselDemand: '#a16207', dieselPrice: '#b45309',
  propaneStocks: '#2563eb', naturalGas: '#0e7490',
};

/** Per-metric value formatting: prices in decimals, volumes as integers. */
function formatterFor(key: string): (n: number) => string {
  if (key === 'dieselPrice') return n => n.toFixed(3);
  if (key === 'crude' || key === 'naturalGas') return n => n.toFixed(2);
  return n => Math.round(n).toLocaleString();
}

function fmtDate(p: string | null | undefined): string {
  if (!p) return '';
  const d = new Date(p);
  return isNaN(d.getTime()) ? p : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EnergyPage() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getEnergy()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Could not load energy data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const metrics = data?.metrics ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Energy &amp; Input Costs</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: '0 0 1rem' }}>
            Weekly EIA energy data that hits the farm — crude oil, diesel demand and the retail diesel
            price (planting, harvest, and freight fuel), propane stocks (grain drying + rural heating), and
            Henry Hub natural gas, the main cost driver for nitrogen fertilizer. Released every Wednesday.
          </p>

          {loading && <p className={styles.loading}>Loading energy data…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && metrics.length === 0 && (
            <p className={styles.empty}>No energy data loaded yet.</p>
          )}

          {metrics.length > 0 && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
                {metrics.map(m => (
                  <StatCard
                    key={m.key}
                    label={m.label}
                    value={m.latest != null ? formatterFor(m.key)(m.latest) : '—'}
                    unit={m.unit}
                    accent={COLORS[m.key] ?? '#3d6b2a'}
                    sub={<MetricSub m={m} />}
                  />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {metrics.filter(m => m.series.length > 1).map(m => (
                  <MiniLineChart
                    key={m.key}
                    title={m.label}
                    unit={m.unit}
                    points={m.series}
                    color={COLORS[m.key] ?? '#3d6b2a'}
                    fmtVal={formatterFor(m.key)}
                  />
                ))}
              </div>

              <p style={{ margin: '.9rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
                {data?.source ?? 'U.S. EIA'}{data?.updatedAt ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}` : ''}.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricSub({ m }: { m: EnergyMetric }) {
  return (
    <>
      {m.wow != null && (
        <span style={{ color: m.wow > 0 ? '#1a7f37' : m.wow < 0 ? '#b42318' : '#888', fontWeight: 700 }}>
          {m.wow > 0 ? '▲ +' : m.wow < 0 ? '▼ ' : ''}{m.wow !== 0 ? m.wow : '±0'} vs last wk
        </span>
      )}
      {m.asOf && <> · {fmtDate(m.asOf)}</>}
    </>
  );
}
