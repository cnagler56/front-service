'use client';

import { useEffect, useState } from 'react';
import { api, SoyOilBiofuelData } from '@/src/lib/api';
import styles from '@/src/components/commodity/commodityDashboard.module.css';
import { StatCard, MiniLineChart } from './EnergyCharts';

const BD_COLOR = '#a16207';   // biodiesel — amber
const RD_COLOR = '#2563eb';   // renewable diesel — blue
const TOTAL_COLOR = '#3d6b2a';

const fmtMM = (n: number) => Math.round(n).toLocaleString();
function pct(n: number | null | undefined): string {
  return n == null ? '—' : `${n > 0 ? '+' : ''}${n}%`;
}

/**
 * Soybean oil consumed as biofuel feedstock (EIA) — biodiesel + renewable diesel.
 * Renewable diesel has been the fastest-growing source of soybean-oil demand, so
 * this is a direct read on where the oil is going.
 */
export default function SoyOilBiofuelPanel() {
  const [data, setData] = useState<SoyOilBiofuelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getSoyOilBiofuel()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { /* leave null → panel shows nothing */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const total = data?.total ?? [];
  const renewable = data?.renewableDiesel ?? [];
  const hasData = total.length > 0;

  if (loading) return null;
  if (!hasData) return null;

  return (
    <div className={styles.section} style={{ marginTop: '1.25rem' }}>
      <div className={styles.sectionHead}>
        <h2>Soybean Oil Used for Biofuels</h2>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#8aa06a', fontFamily: 'Lato, sans-serif' }}>
          EIA · monthly
        </span>
      </div>
      <div style={{ padding: '.6rem 1rem 1rem', fontFamily: 'Lato, sans-serif' }}>
        <p style={{ fontSize: '.82rem', color: '#666', margin: '0 0 1rem' }}>
          Pounds of soybean oil consumed by U.S. biodiesel and renewable diesel plants — the demand side
          that&rsquo;s reshaped the soybean-oil market.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
          <StatCard
            label="Total for Biofuels"
            value={data?.totalLatest != null ? fmtMM(data.totalLatest) : '—'}
            unit="mil lbs"
            accent={TOTAL_COLOR}
            sub={
              <>
                {data?.totalMoMPct != null && <>MoM {pct(data.totalMoMPct)}</>}
                {data?.totalYoYPct != null && <> · YoY {pct(data.totalYoYPct)}</>}
              </>
            }
          />
          <StatCard
            label="Renewable Diesel"
            value={data?.renewableDieselLatest != null ? fmtMM(data.renewableDieselLatest) : '—'}
            unit="mil lbs"
            accent={RD_COLOR}
          />
          <StatCard
            label="Biodiesel"
            value={data?.biodieselLatest != null ? fmtMM(data.biodieselLatest) : '—'}
            unit="mil lbs"
            accent={BD_COLOR}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <MiniLineChart title="Total Soybean Oil for Biofuels" unit="million pounds / month" points={total} color={TOTAL_COLOR} fmtVal={fmtMM} />
          {renewable.length > 1 && (
            <MiniLineChart title="Renewable Diesel" unit="million pounds / month" points={renewable} color={RD_COLOR} fmtVal={fmtMM} />
          )}
        </div>

        <p style={{ margin: '.9rem 0 0', fontSize: '.7rem', color: '#999' }}>
          {data?.source ?? 'U.S. EIA'} · soybean oil inputs to biodiesel &amp; renewable diesel plants.
        </p>
      </div>
    </div>
  );
}
