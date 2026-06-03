'use client';

import { useMemo } from 'react';
import { ForecastDay, ForecastLocation, ForecastSnapshot } from '@/src/lib/api';
import styles from './forecastChange.module.css';

interface Props {
  location: ForecastLocation;
  onEdit: () => void;
  onDelete: () => void;
}

/** Safely parse the JSON snapshot. */
function parseSnap(json: string | null | undefined): ForecastSnapshot | null {
  if (!json) return null;
  try { return JSON.parse(json) as ForecastSnapshot; }
  catch { return null; }
}

/** "2026-05-31T12:34:56" → "May 31, 12:34 PM". Falls back to raw string. */
function fmtTs(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/**
 * Map a temperature delta (°F) to a background color.
 * Red = warmer, blue = cooler, intensity scaled at ±10°.
 */
function tempBg(delta: number | null): string {
  if (delta == null || !isFinite(delta)) return 'transparent';
  const cap = 10;
  const mag = Math.min(Math.abs(delta), cap) / cap; // 0..1
  if (delta > 0) return `rgba(220, 60, 60, ${(0.10 + 0.32 * mag).toFixed(2)})`;
  if (delta < 0) return `rgba(40, 100, 220, ${(0.10 + 0.32 * mag).toFixed(2)})`;
  return 'transparent';
}

/**
 * Map a precip-chance delta (% points) to a background color.
 * Blue = wetter, tan = drier, intensity scaled at ±40 points.
 */
function precipBg(delta: number | null): string {
  if (delta == null || !isFinite(delta)) return 'transparent';
  const cap = 40;
  const mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return `rgba(30, 110, 210, ${(0.10 + 0.40 * mag).toFixed(2)})`;
  if (delta < 0) return `rgba(190, 150, 70, ${(0.10 + 0.40 * mag).toFixed(2)})`;
  return 'transparent';
}

/** Pretty delta with sign. */
function deltaStr(delta: number | null, unit: string = ''): string {
  if (delta == null || !isFinite(delta) || delta === 0) return '';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${Math.abs(delta)}${unit}`;
}

/** Build a per-day map so we can look up the prior snapshot's row by day name. */
function indexByDay(snap: ForecastSnapshot | null): Map<string, ForecastDay> {
  const map = new Map<string, ForecastDay>();
  if (!snap?.days) return map;
  for (const d of snap.days) map.set(d.day, d);
  return map;
}

export default function ForecastDiffCard({ location, onEdit, onDelete }: Props) {
  const current = useMemo(() => parseSnap(location.currentSnapshotJson), [location.currentSnapshotJson]);
  const previous = useMemo(() => parseSnap(location.previousSnapshotJson), [location.previousSnapshotJson]);
  const prevByDay = useMemo(() => indexByDay(previous), [previous]);

  return (
    <div className={styles.locCard}>
      <div className={styles.locHead}>
        <div>
          <h3 className={styles.locName}>📍 {location.name}</h3>
          <p className={styles.locMeta}>
            Current: <strong>{fmtTs(location.currentFetchedAt)}</strong>
            {previous && (
              <> · Previous: <strong>{fmtTs(location.previousFetchedAt)}</strong></>
            )}
            {!previous && current && (
              <span style={{ color: '#a16207', fontStyle: 'italic' }}>
                {' '}· no previous snapshot yet (refresh again later to see the change)
              </span>
            )}
          </p>
        </div>
        <div className={styles.locActions}>
          <button type="button" onClick={onEdit}   className={styles.iconBtn} title="Edit">✏️</button>
          <button type="button" onClick={onDelete} className={styles.iconBtn} title="Delete">🗑️</button>
        </div>
      </div>

      {!current && (
        <p className={styles.empty}>
          No forecast snapshot yet — use <strong>🔄 Refresh All</strong> at the top of the page to take the first one.
        </p>
      )}

      {current && (
        <div className={styles.dayGrid}>
          <div className={styles.headerRow}>
            <span>Day</span>
            <span>High</span>
            <span>Low</span>
            <span>Precip</span>
            <span>Forecast</span>
          </div>

          {current.days.map(d => {
            const prev = prevByDay.get(d.day);
            const hiDelta = d.high != null && prev?.high != null ? d.high - prev.high : null;
            const loDelta = d.low  != null && prev?.low  != null ? d.low  - prev.low  : null;
            const pcDelta = d.precipChance != null && prev?.precipChance != null
                            ? d.precipChance - prev.precipChance : null;
            return (
              <div key={d.day} className={styles.dayRow}>
                <span className={styles.dayName}>{d.day}</span>

                <span className={styles.cell} style={{ background: tempBg(hiDelta) }}>
                  <strong>{d.high != null ? `${d.high}°` : '—'}</strong>
                  {hiDelta != null && hiDelta !== 0 && (
                    <span className={styles.deltaPill} style={{ color: hiDelta > 0 ? '#b91c1c' : '#1d4ed8' }}>
                      {deltaStr(hiDelta, '°')}
                    </span>
                  )}
                </span>

                <span className={styles.cell} style={{ background: tempBg(loDelta) }}>
                  <strong>{d.low != null ? `${d.low}°` : '—'}</strong>
                  {loDelta != null && loDelta !== 0 && (
                    <span className={styles.deltaPill} style={{ color: loDelta > 0 ? '#b91c1c' : '#1d4ed8' }}>
                      {deltaStr(loDelta, '°')}
                    </span>
                  )}
                </span>

                <span className={styles.cell} style={{ background: precipBg(pcDelta) }}>
                  <strong>{d.precipChance != null ? `${d.precipChance}%` : '—'}</strong>
                  {pcDelta != null && pcDelta !== 0 && (
                    <span className={styles.deltaPill} style={{ color: pcDelta > 0 ? '#1d4ed8' : '#a16207' }}>
                      {deltaStr(pcDelta, '%')}
                    </span>
                  )}
                </span>

                <span className={styles.dayShort}>
                  {d.shortForecast ?? d.nightForecast ?? '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
