'use client';

import { useEffect, useState } from 'react';
import { api, CotPosition } from '@/src/lib/api';
import styles from './commodityDashboard.module.css';

interface Props {
  commodity: string;        // "CORN" / "SOYBEANS" / "SOYBEAN_MEAL" …
  commodityLabel: string;
}

const LONG_COLOR = '#3d6b2a';   // bullish (net long)
const SHORT_COLOR = '#b42318';  // bearish (net short)

function fmtDate(p: string | null | undefined): string {
  if (!p) return '';
  const d = new Date(p);
  return isNaN(d.getTime()) ? p : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
/**
 * CFTC managed-money ("the funds") futures positioning for one commodity — net
 * long/short, the weekly change, and a long-vs-short split bar. Renders nothing
 * for commodities CFTC doesn't track (e.g. the data isn't loaded).
 */
export default function CotPanel({ commodity, commodityLabel }: Props) {
  const [data, setData] = useState<CotPosition | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getCot(commodity)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [commodity]);

  // Nothing to show until we have a real net reading.
  if (!loaded || !data || data.net == null) return null;

  const net = data.net;
  const longs = data.longs ?? 0;
  const shorts = data.shorts ?? 0;
  const total = Math.max(longs + shorts, 1);
  const longPct = (longs / total) * 100;
  const isLong = net >= 0;
  const netColor = isLong ? LONG_COLOR : SHORT_COLOR;
  const chg = data.netChange ?? null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        
        <div>
          <h2 style={{ margin: 0 }}>Managed Money</h2>
          <div style={{
            fontFamily: 'Lato, sans-serif', fontSize: '.64rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.05em', color: '#8aa06a', marginTop: '1px',
          }}>
            Commitments of Traders
          </div>
        </div>
        {data.reportDate && (
          <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#8aa06a', fontFamily: 'Lato, sans-serif' }}>
            CFTC · {fmtDate(data.reportDate)}
          </span>
        )}
      </div>
      <div style={{ padding: '0.9rem 1.25rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: netColor, lineHeight: 1 }}>
            {Math.abs(net).toLocaleString()}
          </span>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '.95rem', fontWeight: 700, color: netColor }}>
            {isLong ? 'net long' : 'net short'}
          </span>
        </div>

        {chg != null && (
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#55624a', marginTop: '.4rem' }}>
            {chg === 0 ? 'Unchanged from last week' : (
              <>
                <strong style={{ color: chg > 0 ? LONG_COLOR : SHORT_COLOR }}>
                  {chg > 0 ? '▲ +' : '▼ −'}{Math.abs(chg).toLocaleString()}
                </strong>{' '}contracts vs last week
              </>
            )}
          </div>
        )}

        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.72rem', color: '#8a8473', margin: '.55rem 0 .8rem' }}>
          {commodityLabel} futures · CFTC managed money
        </div>

        {/* Long vs short split */}
        <div style={{ display: 'flex', height: 18, borderRadius: 4, overflow: 'hidden', border: '1px solid #e1dccc' }}>
          <div style={{ width: `${longPct}%`, background: LONG_COLOR }} title={`Long ${longs.toLocaleString()}`} />
          <div style={{ width: `${100 - longPct}%`, background: SHORT_COLOR }} title={`Short ${shorts.toLocaleString()}`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', fontFamily: 'Lato, sans-serif', fontSize: '.74rem' }}>
          <span style={{ color: LONG_COLOR, fontWeight: 700 }}>Long {longs.toLocaleString()}</span>
          <span style={{ color: SHORT_COLOR, fontWeight: 700 }}>Short {shorts.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
