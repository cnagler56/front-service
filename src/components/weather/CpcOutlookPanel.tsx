'use client';

import { useState } from 'react';
import styles from '@/src/styles/farm.module.css';

/**
 * NOAA Climate Prediction Center 6–10 day outlooks: the probability that
 * temperature and precipitation run above or below normal. These are the
 * official CPC maps embedded directly (public domain, updated daily around
 * 3pm ET) — the same images floor traders and agronomists watch.
 *
 * The date-keyed query string busts browser caches once per day so visitors
 * always see the current outlook without re-downloading on every view.
 */

const CPC_BASE = 'https://www.cpc.ncep.noaa.gov/products/predictions/610day/';

/** Daily cache-buster, UTC so server and client render the same URL. */
function dayKey(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

const MAPS = [
  {
    key: 'temp',
    title: '6–10 Day Temperature Probability',
    img: `${CPC_BASE}610temp.new.gif`,
    alt: 'NOAA CPC 6 to 10 day temperature probability outlook map',
  },
  {
    key: 'prcp',
    title: '6–10 Day Precipitation Probability',
    img: `${CPC_BASE}610prcp.new.gif`,
    alt: 'NOAA CPC 6 to 10 day precipitation probability outlook map',
  },
];

function OutlookMap({ title, img, alt }: { title: string; img: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = `${img}?v=${dayKey()}`;
  return (
    <div style={{ flex: '1 1 340px', minWidth: 280 }}>
      <h3 style={{
        fontFamily: 'Lato, sans-serif', fontSize: '.82rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.05em', color: '#3d6b2a',
        margin: '0 0 .5rem',
      }}>
        {title}
      </h3>
      {failed ? (
        <p className={styles.empty} style={{ padding: '2rem 1rem' }}>
          Map unavailable right now —{' '}
          <a href={CPC_BASE} target="_blank" rel="noopener noreferrer" style={{ color: '#3d6b2a', fontWeight: 700 }}>
            view it at NOAA CPC
          </a>.
        </p>
      ) : (
        <a href={src} target="_blank" rel="noopener noreferrer" title="Open full size">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            style={{
              width: '100%', height: 'auto', display: 'block',
              border: '1px solid #e1dccc', borderRadius: 6, background: '#fff',
            }}
          />
        </a>
      )}
    </div>
  );
}

export default function CpcOutlookPanel() {
  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>6–10 Day Outlook — NOAA</h2>
      </div>
      <div className={styles.sectionBody}>
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#6a7a55',
          lineHeight: 1.5, margin: '0 0 1rem',
        }}>
          The Climate Prediction Center&rsquo;s official probability outlooks for days 6–10.
          Temperature map: <strong style={{ color: '#b45309' }}>orange/red</strong> leans above
          normal, <strong style={{ color: '#1d4ed8' }}>blue</strong> below normal. Precipitation
          map: <strong style={{ color: '#15803d' }}>green</strong> leans wetter than normal,{' '}
          <strong style={{ color: '#92400e' }}>brown</strong> drier. Darker shades = higher
          probability. Updated daily around 3pm ET; click a map for full size.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {MAPS.map(m => <OutlookMap key={m.key} title={m.title} img={m.img} alt={m.alt} />)}
        </div>
        <p style={{ margin: '.7rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
          Source:{' '}
          <a href={CPC_BASE} target="_blank" rel="noopener noreferrer" style={{ color: '#8aa06a' }}>
            NOAA Climate Prediction Center
          </a>{' '}
          · public domain.
        </p>
      </div>
    </div>
  );
}
