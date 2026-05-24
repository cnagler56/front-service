'use client';

import { useState } from 'react';
import { api, NASSYieldData } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

const GRAINS = ['CORN', 'SOYBEANS', 'WHEAT', 'COTTON', 'SORGHUM'];
const MONTHS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const YEARS = ['2021','2022','2023','2024','2025'];

export default function UsdaPage() {
  const [grain, setGrain] = useState('CORN');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2024');
  const [data, setData] = useState<NASSYieldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getNassYield(grain, month, year);
      setData(result);
      setFetched(true);
    } catch {
      setError('Failed to load NASS data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🏛️</span>
          <h2>USDA NASS Yield Data</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.filters}>
            <div className={styles.formRow}>
              <label>Commodity</label>
              <select value={grain} onChange={e => setGrain(e.target.value)}>
                {GRAINS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <label>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <label>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button className={styles.btn} onClick={fetchData} disabled={loading}>
              {loading ? 'Loading…' : 'Fetch Data'}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {!fetched && !loading && <p className={styles.empty}>Select filters and click Fetch Data.</p>}
          {fetched && data.length === 0 && !loading && <p className={styles.empty}>No data found for those filters.</p>}
          {data.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>State</th>
                  <th>Yield (Value)</th>
                  <th>Acres</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.commodity_desc}</td>
                    <td>{row.state_name}</td>
                    <td>{row.Value}</td>
                    <td>{row.acresValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
