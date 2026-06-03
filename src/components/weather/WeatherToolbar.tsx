'use client';

import styles from '@/src/styles/farm.module.css';

interface Props {
  locLabel: string;
  coords: { lat: number; lon: number } | null;
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Green location bar at the top of /weather — shows the detected location
 * + coordinates, with a Refresh button to re-trigger geolocation.
 */
export default function WeatherToolbar({ locLabel, coords, loading, onRefresh }: Props) {
  return (
    <div className={styles.weatherToolbar}>
      <div className={styles.weatherLoc}>
        {locLabel ? (
          <>
            <span className={styles.weatherLocIcon}>📍</span>
            <span>
              <strong>{locLabel}</strong>
              {coords && (
                <span className={styles.weatherCoords}>
                  {' '}({coords.lat.toFixed(3)}, {coords.lon.toFixed(3)})
                </span>
              )}
            </span>
          </>
        ) : (
          <span className={styles.weatherLocMuted}>
            {loading ? 'Detecting your location…' : 'Location not set'}
          </span>
        )}
      </div>
      <button
        type="button"
        className={styles.btnSecondary}
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? 'Refreshing…' : '🔄 Refresh'}
      </button>
    </div>
  );
}
