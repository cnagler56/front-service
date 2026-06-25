'use client';

import { useEffect, useState } from 'react';
import { api, GrainStocksData } from '@/src/lib/api';
import { StatCard } from '@/src/components/energy/EnergyCharts';
import styles from './commodityDashboard.module.css';

/** Bushels → "9.02 bil bu". */
function fmtBu(v: number | null | undefined): string {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)} bil`;
  return `${Math.round(v / 1e6).toLocaleString()} mil`;
}

interface Props { commodity: string; }

/** NASS quarterly grain stocks — self-hides for non-grain commodities. */
export default function GrainStocksPanel({ commodity }: Props) {
  const [data, setData] = useState<GrainStocksData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getGrainStocks(commodity)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { /* self-hide */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity]);

  if (loading || !data || data.total == null) return null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Grain Stocks</h2>
        <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
          {data.period}
        </span>
      </div>
      <div style={{ padding: '.7rem 1rem 1rem', fontFamily: 'Lato, sans-serif' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.7rem' }}>
          <StatCard label="Total Stocks" value={fmtBu(data.total)} unit="bu" accent="#3d6b2a" />
          <StatCard label="On-Farm" value={fmtBu(data.onFarm)} unit="bu" accent="#a16207" />
          <StatCard label="Off-Farm" value={fmtBu(data.offFarm)} unit="bu" accent="#1a2e0f" />
          {data.yoyPct != null && (
            <StatCard
              label="YoY Change"
              value={`${data.yoyPct > 0 ? '+' : ''}${data.yoyPct}%`}
              accent={data.yoyPct >= 0 ? '#1a7f37' : '#b42318'}
            />
          )}
        </div>
        <p style={{ margin: '.8rem 0 0', fontSize: '.7rem', color: '#999' }}>
          USDA NASS quarterly Grain Stocks · on-farm + off-farm positions.
        </p>
      </div>
    </div>
  );
}
