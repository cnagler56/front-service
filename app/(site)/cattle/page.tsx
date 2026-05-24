'use client';

import { useState } from 'react';
import { api, AnimalData } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

const MONTHS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const YEARS = ['2022','2023','2024','2025'];

export default function CattlePage() {
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2024');
  const [data, setData] = useState<AnimalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getCattle(month, year);
      setData(result);
      setFetched(true);
    } catch {
      setError('Failed to load cattle data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🐄</span>
          <h2>Cattle on Feed</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.filters}>
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
          {!fetched && !loading && <p className={styles.empty}>Select a month and year, then click Fetch Data.</p>}
          {fetched && data.length === 0 && !loading && <p className={styles.empty}>No data found for that period.</p>}
          {data.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>State</th>
                  <th>Inventory</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.short_desc}</td>
                    <td>{row.location_desc}</td>
                    <td>{row.Value}</td>
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
