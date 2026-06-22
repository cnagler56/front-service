'use client';

import { useMemo, useState } from 'react';
import { WeatherPeriod } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Props {
  periods: WeatherPeriod[];
}

/** True if this period covers the night (low temp + nighttime forecast). */
function isNight(name: string): boolean {
  return /tonight/i.test(name) || /\s+night$/i.test(name);
}

/**
 * Normalize a period name into a "day key" we can group by.
 *   "Tonight"        → "Tonight"   (first row; pairs with no day)
 *   "Today"          → "Today"
 *   "This Afternoon" → "Today"
 *   "Tuesday"        → "Tuesday"
 *   "Tuesday Night"  → "Tuesday"
 */
function dayKey(name: string): string {
  if (/^tonight$/i.test(name)) return 'Tonight';
  if (/^today|this\s+afternoon|this\s+morning/i.test(name)) return 'Today';
  return name.replace(/\s+Night$/i, '');
}

/** Pick a single emoji for the row from the shortForecast text. */
function iconFor(shortForecast: string | undefined): string {
  const s = (shortForecast ?? '').toLowerCase();
  if (s.includes('thunder'))                                   return '⛈️';
  if (s.includes('rain') || s.includes('shower'))              return '🌧️';
  if (s.includes('snow') || s.includes('flurr') || s.includes('sleet')) return '❄️';
  if (s.includes('fog') || s.includes('haze') || s.includes('mist'))    return '🌫️';
  if (s.includes('mostly cloudy') || s.includes('overcast'))   return '☁️';
  if (s.includes('partly'))                                    return '⛅';
  if (s.includes('mostly sunny') || s.includes('mostly clear')) return '🌤️';
  if (s.includes('sunny') || s.includes('clear'))              return '☀️';
  if (s.includes('cloud'))                                     return '☁️';
  return '🌤️';
}

interface Daily {
  key: string;
  day?: WeatherPeriod;
  night?: WeatherPeriod;
}

export default function DailyForecast({ periods }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Group periods into one slot per day, preserving the order they came in
  const days: Daily[] = useMemo(() => {
    const map = new Map<string, Daily>();
    const order: string[] = [];
    for (const p of periods) {
      const key = dayKey(p.name);
      if (!map.has(key)) {
        map.set(key, { key });
        order.push(key);
      }
      const slot = map.get(key)!;
      if (isNight(p.name)) slot.night = p;
      else slot.day = p;
    }
    return order.map(k => map.get(k)!);
  }, [periods]);

  if (!days.length) return null;

  return (
    <div className={styles.dailyForecast}>
      {/* Header row — hidden on mobile via media query, replaced by mobile labels */}
      <div className={styles.dailyHeader}>
        <span>Day</span>
        <span></span>
        <span>High / Low</span>
        <span>Precip</span>
        <span>Forecast</span>
      </div>

      {days.map(d => {
        const headline = d.day ?? d.night;
        if (!headline) return null;

        const high = d.day?.temperature;
        const low  = d.night?.temperature;
        const precip = Math.max(d.day?.precipChance ?? 0, d.night?.precipChance ?? 0);
        const isOpen = expanded === d.key;

        return (
          <div key={d.key} className={styles.dailyRowWrap}>
            <button
              type="button"
              className={`${styles.dailyRow} ${isOpen ? styles.dailyRowOpen : ''}`}
              onClick={() => setExpanded(isOpen ? null : d.key)}
              aria-expanded={isOpen}
            >
              <span className={styles.dailyDay}>{d.key}</span>
              <span className={styles.dailyIcon}>{iconFor(headline.shortForecast)}</span>
              <span className={styles.dailyTemps}>
                {high != null && <span className={styles.dailyHigh}>{Math.round(high)}°</span>}
                {high != null && low != null && <span className={styles.dailySep}> / </span>}
                {low  != null && <span className={styles.dailyLow}>{Math.round(low)}°</span>}
              </span>
              <span className={styles.dailyPrecip}>
                {precip > 0 ? `${precip}%` : '—'}
              </span>
              <span className={styles.dailyShort}>
                {headline.shortForecast}
              </span>
              <span className={styles.dailyChevron} aria-hidden>
                {isOpen ? '▾' : '▸'}
              </span>
            </button>

            {isOpen && (
              <div className={styles.dailyDetail}>
                {d.day && (
                  <div>
                    <div className={styles.dailyDetailLabel}>
                      ☀️ {d.day.name} — high {Math.round(d.day.temperature)}°
                    </div>
                    <p>{d.day.fullForecast || d.day.shortForecast}</p>
                  </div>
                )}
                {d.night && (
                  <div>
                    <div className={styles.dailyDetailLabel}>
                      🌙 {d.night.name} — low {Math.round(d.night.temperature)}°
                    </div>
                    <p>{d.night.fullForecast || d.night.shortForecast}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
