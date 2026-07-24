'use client';

import { useEffect, useState } from 'react';
import { api, OutlookTrends, OutlookTrend } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

/**
 * "Last 3 outlooks" trend strip for the Extended Outlook page: is the CPC
 * lean trending warmer/cooler and wetter/drier? Shows the Midwest headline
 * for a range plus a per-state arrow grid. Data from /api/outlook/trends,
 * which samples the CPC shapefiles daily and diffs the last few issuances.
 */

const STATE_ORDER = [
  'ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH', 'KY', 'TN',
];

const DIR_META: Record<string, { arrow: string; color: string; label: string }> = {
  warmer: { arrow: '▲', color: '#c0392b', label: 'trending warmer' },
  cooler: { arrow: '▼', color: '#1d4ed8', label: 'trending cooler' },
  wetter: { arrow: '▲', color: '#15803d', label: 'trending wetter' },
  drier:  { arrow: '▼', color: '#92400e', label: 'trending drier' },
  steady: { arrow: '→', color: '#6a7a55', label: 'holding steady' },
  new:    { arrow: '·', color: '#9aa88a', label: 'building trend' },
};

function Cell({ t }: { t?: OutlookTrend }) {
  const meta = DIR_META[t?.direction ?? 'new'] ?? DIR_META.new;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.2rem',
      color: meta.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    }} title={t ? `${meta.label} · ${t.series.map(s => s.category === 'EC' ? 'EC' : `${s.category === 'BELOW' ? '−' : ''}${s.prob ?? 0}`).join(' → ')}` : 'no data'}>
      {meta.arrow}
    </span>
  );
}

function RangeBlock({ range, label, temp, precip }: {
  range: string; label: string;
  temp?: Record<string, OutlookTrend>; precip?: Record<string, OutlookTrend>;
}) {
  const midT = temp?.MIDWEST;
  const midP = precip?.MIDWEST;
  const validStart = midT?.validStart ?? midP?.validStart;
  const validEnd = midT?.validEnd ?? midP?.validEnd;

  return (
    <div style={{ flex: '1 1 340px', minWidth: 300, border: '1px solid #e1dccc', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: '#f5f8ee', padding: '.6rem .9rem', borderBottom: '1px solid #e1dccc' }}>
        <strong style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2c4a1e', fontSize: '1rem' }}>
          {label}
        </strong>
        {validStart && validEnd && (
          <span style={{ color: '#7a8a65', fontSize: '.72rem', fontFamily: 'Lato, sans-serif', marginLeft: '.5rem' }}>
            valid {validStart} → {validEnd}
          </span>
        )}
      </div>

      {/* Per-state arrow grid */}
      <div style={{ padding: '.75rem .9rem .9rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lato, sans-serif', fontSize: '.76rem' }}>
          <thead>
            <tr style={{ color: '#7a8a65', textAlign: 'left' }}>
              <th style={{ padding: '.2rem .3rem', fontWeight: 700 }}>State</th>
              <th style={{ padding: '.2rem .3rem', fontWeight: 700, textAlign: 'center' }}>Temp</th>
              <th style={{ padding: '.2rem .3rem', fontWeight: 700, textAlign: 'center' }}>Precip</th>
            </tr>
          </thead>
          <tbody>
            {STATE_ORDER.map(st => (
              <tr key={st} style={{ borderTop: '1px solid #f4efe1' }}>
                <td style={{ padding: '.22rem .3rem', color: '#33402a', fontWeight: 600 }}>{st}</td>
                <td style={{ padding: '.22rem .3rem', textAlign: 'center' }}><Cell t={temp?.[st]} /></td>
                <td style={{ padding: '.22rem .3rem', textAlign: 'center' }}><Cell t={precip?.[st]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OutlookTrendStrip() {
  const [data, setData] = useState<OutlookTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api.getOutlookTrends()
      .then(d => { if (live) setData(d); })
      .catch(() => { if (live) setData(null); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const r610 = data?.ranges?.['610'];
  const r814 = data?.ranges?.['814'];
  const hasData = !!(r610 || r814);

  if (loading) return null;
  if (!hasData) {
    return (
      <div className={styles.section} style={{ marginTop: '1rem' }}>
        <div className={styles.sectionHead}><h2>Outlook Trend</h2></div>
        <div className={styles.sectionBody}>
          <p className={styles.empty} style={{ padding: '1.5rem 1rem' }}>
            {data?.message ?? 'Trend is building — check back after a few daily outlooks accrue.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>Outlook Trend — Last 3 Issuances</h2>
      </div>
      <div className={styles.sectionBody}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#6a7a55', lineHeight: 1.5, margin: '0 0 1rem' }}>
          Which way the CPC lean is drifting as new outlooks come out —{' '}
          <span style={{ color: '#c0392b', fontWeight: 700 }}>▲ warmer</span> /{' '}
          <span style={{ color: '#1d4ed8', fontWeight: 700 }}>▼ cooler</span> and{' '}
          <span style={{ color: '#15803d', fontWeight: 700 }}>▲ wetter</span> /{' '}
          <span style={{ color: '#92400e', fontWeight: 700 }}>▼ drier</span>. Each new outlook covers a
          slightly later window, so this reads as the evolving lean for the period ahead, not three
          looks at the same days. Hover an arrow for the reading history.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {r610 && <RangeBlock range="610" label="6–10 Day" temp={r610.TEMP} precip={r610.PRECIP} />}
          {r814 && <RangeBlock range="814" label="8–14 Day" temp={r814.TEMP} precip={r814.PRECIP} />}
        </div>
      </div>
    </div>
  );
}
