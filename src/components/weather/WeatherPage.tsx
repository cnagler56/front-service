'use client';

import DailyForecast from '@/src/components/DailyForecast';
import DroughtAndSoil from '@/src/components/DroughtAndSoil';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';
import WeatherToolbar from './WeatherToolbar';
import { useNwsForecast } from './useNwsForecast';

/**
 * Composes the three weather-page concerns: location/refresh toolbar,
 * NWS daily forecast table, and the Drought + Soil Moisture panel.
 * State lives in `useNwsForecast` so this stays a pure layout.
 */
export default function WeatherPage() {
  const { user, loading: userLoading } = useUser();
  const {
    forecast, coords, locLabel, loading, error, source, hasProfile,
    refresh, useGps, useProfileLocation,
  } = useNwsForecast({ city: user?.city, state: user?.state, ready: !userLoading });

  return (
    <div className={styles.page}>
      {/* Forecast and soil moisture sit side by side at the top, matched in height
          (stacks on mobile, where each takes its natural height). */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div className={styles.section} style={{ flex: '2 1 460px', margin: 0 }}>
          <div className={styles.sectionHead}>
            <h2>Weather Forecast — NWS</h2>
          </div>
          <div className={styles.sectionBody}>
            <WeatherToolbar
              locLabel={locLabel}
              coords={coords}
              loading={loading}
              source={source}
              hasProfile={hasProfile}
              onRefresh={refresh}
              onUseGps={useGps}
              onUseProfile={useProfileLocation}
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

        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex' }}>
          <DroughtAndSoil
            lat={coords?.lat ?? null}
            lon={coords?.lon ?? null}
            locationLabel={locLabel}
          />
        </div>
      </div>
    </div>
  );
}
