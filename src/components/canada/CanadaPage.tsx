'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CanadaPanel from './CanadaPanel';
import styles from '@/src/styles/farm.module.css';

interface Props {
  commodity: string;            // "CANOLA" / "WHEAT" / "CORN" / "SOYBEANS"
  commodityLabel: string;
}

/** Quick-switch list of Canada crops. */
const CROPS = [
  { code: 'CANOLA', label: 'Canola', href: '/canada/canola' },
  { code: 'WHEAT', label: 'Wheat', href: '/canada/wheat' },
  { code: 'CORN', label: 'Corn', href: '/canada/corn' },
  { code: 'SOYBEANS', label: 'Soybeans', href: '/canada/soybeans' },
];

const BUSHELS_KEY = 'supplyDemand:bushels';
function loadBushels(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(BUSHELS_KEY) === '1'; } catch { return false; }
}

/**
 * Canada crop page — Statistics Canada production by province. Owns the
 * bushels toggle here (there's no WASDE Supply & Demand box on this page to
 * carry it), persisting + broadcasting the shared preference.
 */
export default function CanadaPage({ commodity, commodityLabel }: Props) {
  const [bushels, setBushels] = useState(loadBushels);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(BUSHELS_KEY, bushels ? '1' : '0'); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('sd-bushels', { detail: bushels }));
  }, [bushels]);

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ marginBottom: '1rem' }}>
        <div className={styles.sectionHead}>
          <h2>Canada {commodityLabel}</h2>
        </div>
        <div className={styles.sectionBody}>
          {/* Quick switch between Canada crops without going back to the menu. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.85rem' }}>
            {CROPS.map(c => {
              const active = c.code === commodity.toUpperCase();
              return (
                <Link
                  key={c.code}
                  href={c.href}
                  style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '.78rem', fontWeight: 700, textDecoration: 'none',
                    padding: '.3rem .85rem', borderRadius: 14,
                    border: '1px solid ' + (active ? '#3d6b2a' : '#cdd6bd'),
                    background: active ? '#3d6b2a' : '#fff',
                    color: active ? '#f0f7e6' : '#3d6b2a',
                    cursor: active ? 'default' : 'pointer',
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: '0 0 .85rem' }}>
            Production, yield, and harvested area for Canada&rsquo;s {commodityLabel.toLowerCase()} crop —
            national and by province, from Statistics Canada.
          </p>
          <button
            type="button"
            onClick={() => setBushels(b => !b)}
            style={{
              display: 'block', width: '100%', padding: '.6rem .9rem', borderRadius: 6, cursor: 'pointer',
              border: '1px solid ' + (bushels ? '#cdd6bd' : '#3d6b2a'),
              background: bushels ? '#fff' : '#3d6b2a',
              color: bushels ? '#3d6b2a' : '#f0f7e6',
              fontFamily: 'Lato, sans-serif', fontSize: '.85rem', fontWeight: 700,
            }}
          >
            {bushels ? '↩ Show metric (tonnes / ha)' : '🌾 Convert values to bushels'}
          </button>
        </div>
      </div>

      <CanadaPanel commodity={commodity} commodityLabel={commodityLabel} />
    </div>
  );
}
