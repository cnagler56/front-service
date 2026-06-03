'use client';

import Link from 'next/link';
import styles from '@/src/styles/farm.module.css';
import MidwestMap from './MidwestMap';
import { useForecastLocations } from './useForecastLocations';

/**
 * /forecast-map top — read-only view. Loads the same tracked locations as
 * /forecast-change and plots them on the Midwest map. No CRUD here; that's
 * what /forecast-change is for.
 */
export default function ForecastMapPage() {
  const { locations, loading, error } = useForecastLocations();

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <span>🗺️</span>
            <h2>Forecast Map</h2>
          </div>
          <Link href="/forecast-change" className={styles.headerBtn}>
            ⇄ Switch to detail view
          </Link>
        </div>

        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1rem' }}>
            Every tracked location plotted on the Midwest map. Hover any red dot to see its current
            5-day forecast with deltas vs the previous snapshot. Click <strong>Switch to detail view</strong>{' '}
            for the full 10-day comparison.
          </p>

          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loading}>Loading map…</p>}

          {!loading && locations.length === 0 && !error && (
            <p className={styles.empty}>
              No locations tracked yet — add some on the <Link href="/forecast-change">detail view</Link>.
            </p>
          )}

          {!loading && locations.length > 0 && <MidwestMap locations={locations} />}
        </div>
      </div>
    </div>
  );
}
