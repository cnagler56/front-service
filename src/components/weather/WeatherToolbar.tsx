'use client';

import styles from '@/src/styles/farm.module.css';
import { ForecastSource } from './useNwsForecast';

interface Props {
  locLabel: string;
  coords: { lat: number; lon: number } | null;
  loading: boolean;
  source: ForecastSource | null;
  hasProfile: boolean;
  onRefresh: () => void;
  onUseGps: () => void;
  onUseProfile: () => void;
}

/**
 * Green location bar at the top of /weather — shows the detected location +
 * coordinates and where they came from (saved area vs. exact GPS), with a
 * button to switch sources and a Refresh button.
 */
export default function WeatherToolbar({
  locLabel, coords, loading, source, hasProfile, onRefresh, onUseGps, onUseProfile,
}: Props) {
  return (
    <div className={styles.weatherToolbar}>
      <div className={styles.weatherLoc}>
        {locLabel ? (
          <>
            <span className={styles.weatherLocIcon}>📍</span>
            <span>
              <strong>{locLabel}</strong>
              {source === 'profile' && (
                <span className={styles.weatherCoords}> · saved area</span>
              )}
              {source === 'gps' && (
                <span className={styles.weatherCoords}> · your exact location</span>
              )}
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

      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {/* Switch between the saved profile area and exact GPS. */}
        {source !== 'gps' && (
          <button type="button" className={styles.btnSecondary} onClick={onUseGps} disabled={loading}>
            🎯 Use my exact location
          </button>
        )}
        {source === 'gps' && hasProfile && (
          <button type="button" className={styles.btnSecondary} onClick={onUseProfile} disabled={loading}>
            🏠 Use my saved area
          </button>
        )}
        <button type="button" className={styles.btnSecondary} onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : '🔄 Refresh'}
        </button>
      </div>
    </div>
  );
}
