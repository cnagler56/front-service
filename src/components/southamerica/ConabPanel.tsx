'use client';

import { useEffect, useState } from 'react';
import { api, ConabProduction } from '@/src/lib/api';
import styles from '@/src/components/commodity/commodityDashboard.module.css';

interface Props {
  commodity: string;        // "CORN" / "SOYBEANS"
  commodityLabel: string;
}

const BU_PER_MT: Record<string, number> = { CORN: 39.3680, SOYBEANS: 36.7437, WHEAT: 36.7437 };
const ACRES_PER_HA = 2.47105;

/** Brazilian state (UF) codes → full names. */
const BR_STATES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};
const stateName = (uf: string): string => BR_STATES[uf?.toUpperCase()] ?? uf;

/** Read the shared metric→bushels preference (set on the Supply & Demand panel). */
function loadBushels(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem('supplyDemand:bushels') === '1'; } catch { return false; }
}

/**
 * Brazil production from CONAB — national total with YoY, the crop-season split
 * (1st / safrinha / 3rd for corn), and top producing states. Honors the same
 * "convert to bushels" toggle as the WASDE panel above it.
 */
export default function ConabPanel({ commodity, commodityLabel }: Props) {
  const [data, setData] = useState<ConabProduction | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bushels, setBushels] = useState(loadBushels);

  useEffect(() => {
    let cancelled = false;
    api.getConab(commodity)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [commodity]);

  // Stay in sync with the Supply & Demand bushels toggle (same tab).
  useEffect(() => {
    const h = (e: Event) => setBushels(!!(e as CustomEvent).detail);
    window.addEventListener('sd-bushels', h);
    return () => window.removeEventListener('sd-bushels', h);
  }, []);

  if (!loaded || !data || data.production == null) return null;

  const buPerMt = BU_PER_MT[commodity.toUpperCase()];
  const canBu = !!buPerMt;
  const useBu = bushels && canBu;

  // Values arrive in thousand tonnes; show Mt, or billion bushels when converted.
  const fmt = (milT: number | null | undefined): string => {
    if (milT == null) return '—';
    if (useBu) return (milT * buPerMt / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' bil bu';
    return (milT / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' Mt';
  };
  const yoy = data.productionYoYPct;
  const seasons = data.seasons ?? [];
  const topStates = data.topStates ?? [];
  const maxSeason = Math.max(1, ...seasons.map(s => s.production));
  const maxState = Math.max(1, ...topStates.map(s => s.production));

  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>Brazil Production</h2>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#8aa06a', fontFamily: 'Lato, sans-serif' }}>
          CONAB · {data.cropYear}
        </span>
      </div>
      <div style={{ padding: '.9rem 1.25rem 1.1rem', fontFamily: 'Lato, sans-serif' }}>
        {/* Headline */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#1a2e0f', lineHeight: 1 }}>
            {fmt(data.production)}
          </span>
          {yoy != null && (
            <span style={{ fontSize: '.85rem', fontWeight: 700, color: yoy > 0 ? '#1a7f37' : yoy < 0 ? '#b42318' : '#888' }}>
              {yoy > 0 ? '▲ +' : yoy < 0 ? '▼ ' : ''}{yoy}% YoY
            </span>
          )}
          <span style={{ fontSize: '.74rem', color: '#8a8473' }}>
            {commodityLabel} · {data.cropYear} crop
          </span>
        </div>

        {/* Month-over-month change (from our own monthly snapshots). */}
        {data.productionMoMPct != null && (
          <div style={{ marginTop: '.35rem', fontSize: '.8rem', color: '#55624a' }}>
            <strong style={{ color: data.productionMoMPct > 0 ? '#1a7f37' : data.productionMoMPct < 0 ? '#b42318' : '#888' }}>
              {data.productionMoMPct > 0 ? '▲ +' : data.productionMoMPct < 0 ? '▼ ' : ''}{fmt(data.productionMoM)} ({data.productionMoMPct > 0 ? '+' : ''}{data.productionMoMPct}%)
            </strong>{' '}vs last month&rsquo;s estimate
          </div>
        )}

        {/* National yield */}
        {data.yieldTha != null && (
          <div style={{ marginTop: '.3rem', fontSize: '.78rem', color: '#8a8473' }}>
            National yield: <strong style={{ color: '#33402a' }}>{useBu ? (data.yieldTha * buPerMt / ACRES_PER_HA).toFixed(1) + ' bu/acre' : data.yieldTha.toFixed(1) + ' t/ha'}</strong>
          </div>
        )}

        {/* Season split */}
        {seasons.length > 1 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6a7a55', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.45rem' }}>
              By crop season
            </div>
            {seasons.map(s => {
              const safrinha = /safrinha/i.test(s.name);
              return (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.35rem' }}>
                  <span style={{ flex: '0 0 130px', fontSize: '.8rem', color: safrinha ? '#2c4a1e' : '#55624a', fontWeight: safrinha ? 700 : 500 }}>
                    {s.name}
                  </span>
                  <div style={{ flex: 1, background: '#eef0ea', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.production / maxSeason) * 100}%`, height: '100%', background: safrinha ? '#3d6b2a' : '#8fbc45' }} />
                  </div>
                  <span style={{ flex: '0 0 auto', fontSize: '.8rem', fontWeight: 700, color: '#2c4a1e', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.production)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Top states */}
        {topStates.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6a7a55', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.45rem' }}>
              Top producing states <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· production &amp; yield</span>
            </div>
            {topStates.map((s, i) => (
              <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.3rem' }}>
                <span style={{ flex: '0 0 150px', fontSize: '.78rem', fontWeight: 700, color: '#2c4a1e' }}>
                  #{i + 1} {stateName(s.state)}
                </span>
                <div style={{ flex: 1, background: '#eef0ea', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.production / maxState) * 100}%`, height: '100%', background: '#3d6b2a' }} />
                </div>
                <span style={{ flex: '0 0 auto', fontSize: '.72rem', color: '#8a8473', fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
                  {s.yieldTha == null ? '—'
                    : useBu ? (s.yieldTha * buPerMt / ACRES_PER_HA).toFixed(1) + ' bu/ac'
                    : s.yieldTha.toFixed(1) + ' t/ha'}
                </span>
                <span style={{ flex: '0 0 auto', fontSize: '.78rem', fontWeight: 700, color: '#2c4a1e', fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right' }}>
                  {fmt(s.production)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '.9rem 0 0', fontSize: '.7rem', color: '#999' }}>
          {data.source}{data.updatedAt ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}` : ''}.
          Brazil&rsquo;s official crop survey — more granular than the WASDE country total.
        </p>
      </div>
    </div>
  );
}
