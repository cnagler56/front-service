'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, WeatherPeriod } from '@/src/lib/api';
import DailyForecast from '@/src/components/DailyForecast';
import DroughtAndSoil from '@/src/components/DroughtAndSoil';
import styles from '@/src/styles/farm.module.css';

interface NwsPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    relativeLocation?: {
      properties?: { city?: string; state?: string };
    };
  };
}

export default function WeatherPage() {
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locLabel, setLocLabel] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  /** Hit NWS /points to convert lat/lon → grid, then fetch the forecast via our backend. */
  const loadForecast = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    try {
      const ptRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { Accept: 'application/geo+json' } },
      );
      if (!ptRes.ok) {
        throw new Error(
          ptRes.status === 404
            ? 'Location is outside the National Weather Service coverage area (US only).'
            : `NWS points lookup failed (${ptRes.status})`,
        );
      }
      const pt = (await ptRes.json()) as NwsPointResponse;
      const { gridId, gridX, gridY, relativeLocation } = pt.properties;
      const city = relativeLocation?.properties?.city ?? '';
      const state = relativeLocation?.properties?.state ?? '';
      setLocLabel([city, state].filter(Boolean).join(', '));

      const result = await api.getWeather(gridId, String(gridX), String(gridY));
      setForecast(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Ask the browser for the user's location; auto-loads the forecast on success. */
  const requestLocation = useCallback(() => {
    setError('');
    setLoading(true);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Your browser does not support geolocation.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        loadForecast(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Allow location in your browser settings to see your local forecast.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Could not determine your location. Try again or check your device settings.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timed out waiting for your location. Please try again.');
        } else {
          setError('Could not get your location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [loadForecast]);

  // Auto-fetch on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌦️</span>
          <h2>Weather Forecast — NWS</h2>
        </div>
        <div className={styles.sectionBody}>
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
              className={styles.btnSecondary}
              onClick={requestLocation}
              disabled={loading}
              type="button"
            >
              {loading ? 'Refreshing…' : '🔄 Refresh'}
            </button>
          </div>

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

      {/* Drought map + NASA POWER soil moisture, gated on having coordinates */}
      <DroughtAndSoil
        lat={coords?.lat ?? null}
        lon={coords?.lon ?? null}
        locationLabel={locLabel}
      />
    </div>
  );
}
