'use client';

import { useState } from 'react';
import styles from '@/src/styles/farm.module.css';

/**
 * NOAA STAR Vegetation Health maps for the lower 48 — the weekly satellite
 * read on crop condition. Three indexes share one URL pattern:
 *
 *   VHI — Vegetation Health Index (the headline blend of the other two)
 *   VCI — Vegetation Condition Index (greenness / NDVI vs. history)
 *   TCI — Thermal Condition Index (heat stress vs. history)
 *
 * Images come from STAR's regional_image.php, which crops the world composite
 * to a lat/lon box. Weeks lag ~1 behind realtime and an unpublished week
 * returns a blank placeholder (HTTP 200, so onError can't catch it) — so we
 * request TWO weeks back, which is always published. The date is printed on
 * the map itself, so nothing can mislabel.
 */

const VH_BASE = 'https://www.star.nesdis.noaa.gov/smcd/emb/vci/VH/regional_image.php';
const USA_BOX = 'name=USA&latmin=25.0&latmax=51.0&lonmin=-126.0&lonmax=-63.0&sample=1&showGrid=1';
const LEGEND_BASE = 'https://www.star.nesdis.noaa.gov/smcd/emb/vci/images/VH_colorbars/';
const BROWSE_URL = 'https://www.star.nesdis.noaa.gov/smcd/emb/vci/VH/vh_browse.php';

/** {year, week} two weeks back (UTC, weeks 1–52) — always published. */
function publishedWeek(): { year: number; week: number } {
  const now = new Date();
  const jan1 = Date.UTC(now.getUTCFullYear(), 0, 1);
  const doy = Math.floor((Date.now() - jan1) / 86400000) + 1;
  let week = Math.min(52, Math.floor((doy - 1) / 7) + 1) - 2;
  let year = now.getUTCFullYear();
  if (week < 1) { week += 52; year -= 1; }
  return { year, week };
}

const INDEXES = [
  {
    key: 'VHI', label: 'Vegetation Health (VHI)',
    desc: 'Overall vegetation health — greenness and heat stress combined. Below 40 signals stress; above 60 is favorable.',
  },
  {
    key: 'VCI', label: 'Greenness (VCI)',
    desc: 'How green vegetation looks vs. the same week in past years (from satellite NDVI).',
  },
  {
    key: 'TCI', label: 'Heat Stress (TCI)',
    desc: 'How hot the canopy runs vs. history — low values mean heat is working against the crop.',
  },
];

export default function VegetationHealthPanel() {
  const [index, setIndex] = useState('VHI');
  const { year, week } = publishedWeek();
  const wk = String(week).padStart(2, '0');
  const mapSrc = `${VH_BASE}?${USA_BOX}&fileType=WorldBig_${index}_${year}${wk}`;
  const legendSrc = `${LEGEND_BASE}bar_${index}.png`;
  const meta = INDEXES.find(i => i.key === index)!;
  const [failed, setFailed] = useState(false);

  return (
    <div className={styles.section} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHead}>
        <h2>Vegetation Health — NOAA Satellite</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
          {INDEXES.map(i => (
            <button
              key={i.key}
              type="button"
              onClick={() => { setIndex(i.key); setFailed(false); }}
              style={{
                fontFamily: 'Lato, sans-serif', fontSize: '.72rem', fontWeight: 700,
                padding: '.25rem .7rem', borderRadius: 14, cursor: 'pointer',
                border: '1px solid ' + (index === i.key ? '#3d6b2a' : '#cdd6bd'),
                background: index === i.key ? '#3d6b2a' : '#fff',
                color: index === i.key ? '#f0f7e6' : '#3d6b2a',
              }}
            >
              {i.key}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.sectionBody}>
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#6a7a55',
          lineHeight: 1.5, margin: '0 0 1rem',
        }}>
          <strong style={{ color: '#3d6b2a' }}>{meta.label}:</strong> {meta.desc}{' '}
          Weekly satellite composite for the lower 48 — the date is printed on the map.
        </p>

        {failed ? (
          <p className={styles.empty} style={{ padding: '2rem 1rem' }}>
            Map unavailable right now —{' '}
            <a href={BROWSE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#3d6b2a', fontWeight: 700 }}>
              view it at NOAA STAR
            </a>.
          </p>
        ) : (
          <div style={{ maxWidth: 680 }}>
            <a href={mapSrc} target="_blank" rel="noopener noreferrer" title="Open full size">
              <img
                src={mapSrc}
                alt={`NOAA ${meta.label} map for the continental United States`}
                loading="lazy"
                onError={() => setFailed(true)}
                style={{
                  width: '100%', height: 'auto', display: 'block',
                  border: '1px solid #e1dccc', borderRadius: 6, background: '#fff',
                }}
              />
            </a>
            <img
              src={legendSrc}
              alt={`${index} color scale — red is stressed, green is healthy`}
              loading="lazy"
              style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', marginTop: '.5rem' }}
            />
          </div>
        )}

        <p style={{ margin: '.7rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
          Source:{' '}
          <a href={BROWSE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#8aa06a' }}>
            NOAA STAR Vegetation Health
          </a>{' '}
          · updated weekly · STAR notes these are provided for experimental use.
        </p>
      </div>
    </div>
  );
}
