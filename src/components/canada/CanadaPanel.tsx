'use client';

import { useEffect, useState } from 'react';
import { api, ConabProduction } from '@/src/lib/api';
import styles from '@/src/components/commodity/commodityDashboard.module.css';

interface Props {
  commodity: string;        // "CANOLA" / "WHEAT" / "CORN" / "SOYBEANS"
  commodityLabel: string;
}

/** Bushels per metric tonne (corn 56, wheat/soy 60, canola 50 lb/bu). */
const BU_PER_MT: Record<string, number> = {
  CORN: 39.3680, SOYBEANS: 36.7437, WHEAT: 36.7437, CANOLA: 44.0925,
};
const ACRES_PER_HA = 2.47105;

function loadBushels(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem('supplyDemand:bushels') === '1'; } catch { return false; }
}

/**
 * Canada production from Statistics Canada — national total with YoY and top
 * provinces (production + yield). Honors the shared "convert to bushels" toggle.
 */
export default function CanadaPanel({ commodity, commodityLabel }: Props) {
  const [data, setData] = useState<ConabProduction | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bushels, setBushels] = useState(loadBushels);

  useEffect(() => {
    let cancelled = false;
    api.getStatCan(commodity)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [commodity]);

  useEffect(() => {
    const h = (e: Event) => setBushels(!!(e as CustomEvent).detail);
    window.addEventListener('sd-bushels', h);
    return () => window.removeEventListener('sd-bushels', h);
  }, []);

  if (!loaded || !data || data.production == null) return null;

  const buPerMt = BU_PER_MT[commodity.toUpperCase()];
  const useBu = bushels && !!buPerMt;
  const fmt = (milT: number | null | undefined): string => {
    if (milT == null) return '—';
    if (useBu) return (milT * buPerMt / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' bil bu';
    return (milT / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' Mt';
  };
  const yieldStr = (tha: number | null | undefined): string =>
    tha == null ? '—' : useBu ? (tha * buPerMt / ACRES_PER_HA).toFixed(1) + ' bu/ac' : tha.toFixed(1) + ' t/ha';

  const yoy = data.productionYoYPct;
  const topStates = data.topStates ?? [];
  const maxState = Math.max(1, ...topStates.map(s => s.production));

  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>Canada Production</h2>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#8aa06a', fontFamily: 'Lato, sans-serif' }}>
          StatCan · {data.cropYear}
        </span>
      </div>
      <div style={{ padding: '.9rem 1.25rem 1.1rem', fontFamily: 'Lato, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#1a2e0f', lineHeight: 1 }}>
            {fmt(data.production)}
          </span>
          {yoy != null && (
            <span style={{ fontSize: '.85rem', fontWeight: 700, color: yoy > 0 ? '#1a7f37' : yoy < 0 ? '#b42318' : '#888' }}>
              {yoy > 0 ? '▲ +' : yoy < 0 ? '▼ ' : ''}{yoy}% YoY
            </span>
          )}
          <span style={{ fontSize: '.74rem', color: '#8a8473' }}>{commodityLabel} · {data.cropYear}</span>
        </div>

        {data.yieldTha != null && (
          <div style={{ marginTop: '.3rem', fontSize: '.78rem', color: '#8a8473' }}>
            National yield: <strong style={{ color: '#33402a' }}>{yieldStr(data.yieldTha)}</strong>
          </div>
        )}

        {topStates.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6a7a55', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.45rem' }}>
              Top producing provinces <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· yield &amp; production</span>
            </div>
            {topStates.map((s, i) => (
              <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.3rem' }}>
                <span style={{ flex: '0 0 170px', fontSize: '.78rem', fontWeight: 700, color: '#2c4a1e' }}>#{i + 1} {s.state}</span>
                <div style={{ flex: 1, background: '#eef0ea', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.production / maxState) * 100}%`, height: '100%', background: '#3d6b2a' }} />
                </div>
                <span style={{ flex: '0 0 auto', fontSize: '.72rem', color: '#8a8473', fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
                  {yieldStr(s.yieldTha)}
                </span>
                <span style={{ flex: '0 0 auto', fontSize: '.78rem', fontWeight: 700, color: '#2c4a1e', fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right' }}>
                  {fmt(s.production)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '.9rem 0 0', fontSize: '.7rem', color: '#999' }}>
          {data.source}{data.updatedAt ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}` : ''}. Annual estimates.
        </p>
      </div>
    </div>
  );
}
