'use client';

import { useState } from 'react';
import { api, WeatherPeriod } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function WeatherPage() {
  const [gridID, setGridID] = useState('ILX');
  const [gridX, setGridX] = useState('72');
  const [gridY, setGridY] = useState('69');
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchForecast() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getWeather(gridID, gridX, gridY);
      setForecast(result);
      setFetched(true);
    } catch {
      setError('Failed to fetch forecast. Check your NWS grid values or verify the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌦️</span>
          <h2>Weather Forecast — NWS</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1.25rem' }}>
            Enter your NWS grid coordinates. Find yours at{' '}
            <a href="https://api.weather.gov/points/{lat},{lon}" target="_blank" rel="noopener noreferrer" style={{ color: '#3d6b2a' }}>
              api.weather.gov/points/lat,lon
            </a>
            {' '}— default is Springfield, IL (ILX / 72 / 69).
          </p>
          <div className={styles.filters}>
            <div className={styles.formRow}>
              <label>Grid ID</label>
              <input value={gridID} onChange={e => setGridID(e.target.value.toUpperCase())} style={{ width: 80 }} />
            </div>
            <div className={styles.formRow}>
              <label>Grid X</label>
              <input type="number" value={gridX} onChange={e => setGridX(e.target.value)} style={{ width: 80 }} />
            </div>
            <div className={styles.formRow}>
              <label>Grid Y</label>
              <input type="number" value={gridY} onChange={e => setGridY(e.target.value)} style={{ width: 80 }} />
            </div>
            <button className={styles.btn} onClick={fetchForecast} disabled={loading}>
              {loading ? 'Loading…' : 'Get Forecast'}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {!fetched && !loading && <p className={styles.empty}>Enter grid coordinates and click Get Forecast.</p>}

          {forecast.length > 0 && (
            <div className={styles.weatherGrid}>
              {forecast.map((period, i) => (
                <div key={i} className={styles.weatherCard}>
                  <h3>{period.name}</h3>
                  <div className={styles.temp}>{period.temperature}°F</div>
                  <div className={styles.meta}>💨 {period.windSpeed} {period.windDirection}</div>
                  <div className={styles.meta}>🌧 {period.precipChance}% precip</div>
                  <div className={styles.forecast}>{period.shortForecast}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
