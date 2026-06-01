'use client';

import { useEffect, useState } from 'react';
import { api, SoilMoistureRow } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Props {
  lat: number | null;
  lon: number | null;
  locationLabel: string; // e.g. "Springfield, IL"
}

/** "20240518" → "May 18" */
function fmtPower(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  const y = yyyymmdd.substring(0, 4);
  const m = parseInt(yyyymmdd.substring(4, 6), 10);
  const d = parseInt(yyyymmdd.substring(6, 8), 10);
  const monthName = new Date(`${y}-${String(m).padStart(2,'0')}-15`)
    .toLocaleString(undefined, { month: 'short' });
  return `${monthName} ${d}`;
}

/**
 * Color for a soil-moisture fraction (0..1).
 * Red = dry, amber = mid, green = wet.
 */
function moistureColor(v: number | null): string {
  if (v == null) return '#ddd';
  if (v < 0.3) return '#b91c1c';
  if (v < 0.5) return '#a16207';
  if (v < 0.75) return '#65a30d';
  return '#1d4ed8';
}

export default function DroughtAndSoil({ lat, lon, locationLabel }: Props) {
  const [rows, setRows] = useState<SoilMoistureRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getSoilMoisture(lat, lon, 14)
      .then(r => { if (!cancelled) setRows(r); })
      .catch(() => { if (!cancelled) setError('Could not load soil moisture.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lon]);

  // Latest reading (POWER lags ~2 days behind real time)
  const latest = rows && rows.length ? rows[rows.length - 1] : null;

  return (
    <div className={styles.section} style={{ overflow: 'visible' }}>
      <div className={styles.sectionHead}>
        <span>🛰️</span>
        <h2>Drought & Soil Moisture</h2>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.droughtSoilGrid}>

          {/* ── US Drought Monitor ─────────────────────────── */}
          <div>
            <h3 className={styles.subhead}>U.S. Drought Monitor</h3>
            <p style={{ margin: '0 0 .5rem', fontSize: '.78rem', color: '#888' }}>
              Updated weekly by NDMC, USDA, and NOAA. Click for full map.
            </p>
            <a
              href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?USA"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://droughtmonitor.unl.edu/data/png/current/current_usdm.png"
                alt="Current US Drought Monitor map"
                className={styles.droughtImg}
              />
            </a>
          </div>

          {/* ── NASA POWER soil moisture ───────────────────── */}
          <div>
            <h3 className={styles.subhead}>Soil Moisture (last 14 days)</h3>
            <p style={{ margin: '0 0 .5rem', fontSize: '.78rem', color: '#888' }}>
              {locationLabel ? `For ${locationLabel}` : 'For your location'}.
              Source: NASA POWER. 0 = dry, 1 = saturated.
            </p>

            {lat == null && (
              <p className={styles.empty} style={{ margin: 0 }}>
                Allow location at the top of the page to see soil moisture for your area.
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {loading && <p className={styles.loading}>Loading soil data…</p>}

            {latest && (
              <div className={styles.moistureLatest}>
                <MoistureGauge label="Surface (0–10 cm)" value={latest.GWETTOP} />
                <MoistureGauge label="Root zone (0–1 m)" value={latest.GWETROOT} />
                <MoistureGauge label="Full profile"      value={latest.GWETPROF} />
              </div>
            )}

            {rows && rows.length > 0 && (
              <>
                <h4 style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '.7rem',
                  color: '#6a7a55',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  margin: '1rem 0 .35rem',
                }}>Root-zone trend</h4>
                <div className={styles.moistureBars}>
                  {rows.map(r => (
                    <div key={r.date} title={`${fmtPower(r.date)}: root ${r.GWETROOT?.toFixed(2) ?? '—'}`}>
                      <div
                        className={styles.moistureBar}
                        style={{
                          height: r.GWETROOT == null ? 2 : Math.max(2, r.GWETROOT * 80),
                          background: moistureColor(r.GWETROOT),
                        }}
                      />
                      <span className={styles.moistureBarLabel}>{fmtPower(r.date).split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoistureGauge({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.round(value * 100);
  const color = moistureColor(value);
  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeLabel}>{label}</div>
      <div className={styles.gaugeTrack}>
        <div className={styles.gaugeFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={styles.gaugeValue} style={{ color }}>
        {value == null ? '—' : `${pct}%`}
      </div>
    </div>
  );
}
