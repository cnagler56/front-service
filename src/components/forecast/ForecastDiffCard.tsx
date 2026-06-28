'use client';

import { useMemo } from 'react';
import { ForecastDay, ForecastLocation, ForecastSnapshot } from '@/src/lib/api';
import styles from './forecastChange.module.css';

interface Props {
  location: ForecastLocation;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Safely parse the JSON snapshot. */
function parseSnap(json: string | null | undefined): ForecastSnapshot | null {
  if (!json) return null;
  try { return JSON.parse(json) as ForecastSnapshot; }
  catch { return null; }
}

/**
 * "2026-05-31T12:34:56" → "May 31, 7:34 AM CDT" in the viewer's local time.
 * The API serializes naive UTC timestamps (the server runs in UTC), so when the
 * string carries no timezone we treat it as UTC before converting — otherwise the
 * browser parses it as local time and the clock is off by the UTC offset.
 */
function fmtTs(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const d = new Date(hasZone ? iso : `${iso}Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Map a temperature delta (°F) to a background color.
 * Pure red = warmer, pure blue = cooler, intensity scaled at ±10°.
 */
function tempBg(delta: number | null): string {
  if (delta == null || !isFinite(delta)) return 'transparent';
  const cap = 10;
  const mag = Math.min(Math.abs(delta), cap) / cap; // 0..1
  if (delta > 0) return `rgba(220, 38, 38, ${(0.10 + 0.32 * mag).toFixed(2)})`;  // warmer
  if (delta < 0) return `rgba(29, 78, 216, ${(0.10 + 0.32 * mag).toFixed(2)})`;  // cooler
  return 'transparent';
}

/**
 * Map a precip-chance delta (% points) to a background color.
 * Pure blue = wetter, pure red = drier, intensity scaled at ±40 points.
 */
function precipBg(delta: number | null): string {
  if (delta == null || !isFinite(delta)) return 'transparent';
  const cap = 40;
  const mag = Math.min(Math.abs(delta), cap) / cap;
  if (delta > 0) return `rgba(29, 78, 216, ${(0.10 + 0.40 * mag).toFixed(2)})`;  // wetter
  if (delta < 0) return `rgba(220, 38, 38, ${(0.10 + 0.40 * mag).toFixed(2)})`;  // drier
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
          <h3 className={styles.locName}>{location.name}</h3>
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
        {(onEdit || onDelete) && (
          <div className={styles.locActions}>
            {onEdit   && <button type="button" onClick={onEdit}   className={styles.iconBtn} title="Edit">✏️</button>}
            {onDelete && <button type="button" onClick={onDelete} className={styles.iconBtn} title="Delete">🗑️</button>}
          </div>
        )}
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
                    <span className={styles.deltaPill} style={{ color: hiDelta > 0 ? '#dc2626' : '#1d4ed8' }}>
                      {deltaStr(hiDelta, '°')}
                    </span>
                  )}
                </span>

                <span className={styles.cell} style={{ background: tempBg(loDelta) }}>
                  <strong>{d.low != null ? `${d.low}°` : '—'}</strong>
                  {loDelta != null && loDelta !== 0 && (
                    <span className={styles.deltaPill} style={{ color: loDelta > 0 ? '#dc2626' : '#1d4ed8' }}>
                      {deltaStr(loDelta, '°')}
                    </span>
                  )}
                </span>

                <span className={styles.cell} style={{ background: precipBg(pcDelta) }}>
                  <strong>{d.precipChance != null ? `${d.precipChance}%` : '—'}</strong>
                  {pcDelta != null && pcDelta !== 0 && (
                    <span className={styles.deltaPill} style={{ color: pcDelta > 0 ? '#1d4ed8' : '#dc2626' }}>
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
