'use client';

import DailyForecast from '@/src/components/DailyForecast';
import DroughtAndSoil from '@/src/components/DroughtAndSoil';
import styles from '@/src/styles/farm.module.css';
import WeatherToolbar from './WeatherToolbar';
import { useNwsForecast } from './useNwsForecast';

/**
 * Composes the three weather-page concerns: location/refresh toolbar,
 * NWS daily forecast table, and the Drought + Soil Moisture panel.
 * State lives in `useNwsForecast` so this stays a pure layout.
 */
export default function WeatherPage() {
  const { forecast, coords, locLabel, loading, error, refresh } = useNwsForecast();

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌦️</span>
          <h2>Weather Forecast — NWS</h2>
        </div>
        <div className={styles.sectionBody}>
          <WeatherToolbar
            locLabel={locLabel}
            coords={coords}
            loading={loading}
            onRefresh={refresh}
          />

          {error && <p className={styles.error}>{error}</p>}
          {loading && forecast.length === 0 && (
            <p className={styles.loading}>Loading forecast…</p>
          )}
          {!loading && !error && forecast.length === 0 && (
            <p className={styles.empty}>No forecast available yet.</p>
          )}

          {forecast.length > 0 && <DailyForecast periods={forecast} />}
        </div>
      </div>

      <DroughtAndSoil
        lat={coords?.lat ?? null}
        lon={coords?.lon ?? null}
        locationLabel={locLabel}
      />
    </div>
  );
}
