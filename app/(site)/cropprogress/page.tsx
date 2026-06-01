'use client';

import { useEffect, useState } from 'react';
import { api, CropProgressData, User } from '@/src/lib/api';
import CropProgressTable from '@/src/components/CropProgressTable';
import styles from '@/src/styles/farm.module.css';

const GRAINS = [
  { value: 'CORN',     label: 'Corn'     },
  { value: 'SOYBEANS', label: 'Soybeans' },
  { value: 'WHEAT',    label: 'Wheat'    },
  { value: 'COTTON',   label: 'Cotton'   },
  { value: 'SORGHUM',  label: 'Sorghum'  },
  { value: 'RICE',     label: 'Rice'     },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function CropProgressPage() {
  const [grain, setGrain] = useState('CORN');
  const [year, setYear]   = useState(new Date().getFullYear());
  const [rows, setRows]   = useState<CropProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  async function fetchProgress() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getCropProgress(grain, year);
      setRows(result);
      setFetched(true);
    } catch {
      setError('Failed to load Crop Progress. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  const grainLabel = GRAINS.find(g => g.value === grain)?.label ?? grain;

  return (
    <div className={styles.page}>
      {/* Filters live in a normal `.section` — no sticky concerns, no sticky-blocking overflow */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌱</span>
          <h2>USDA Crop Progress</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1.25rem' }}>
            Weekly state-level crop progress from USDA NASS — % planted, emerged, silking, harvested.
            Reports run April through November during the growing season.
          </p>

          <div className={styles.filters}>
            <div className={styles.formRow}>
              <label>Commodity</label>
              <select value={grain} onChange={e => setGrain(e.target.value)}>
                {GRAINS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <label>Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button className={styles.btn} onClick={fetchProgress} disabled={loading}>
              {loading ? 'Loading…' : 'Load Progress'}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {!fetched && !loading && (
            <p className={styles.empty}>Choose a commodity and year, then click Load Progress.</p>
          )}
          {fetched && rows.length === 0 && !loading && (
            <p className={styles.empty}>
              No Crop Progress data found for {grainLabel} in {year}. Reports run roughly
              April – November, so it may be too early or too late in the season.
            </p>
          )}
        </div>
      </div>

      {/*
        Pivot table lives OUTSIDE the .section card so its sticky headers can pin
        to the page viewport. The component renders its own `.sectionOpen` card
        with overflow:visible (sticky-friendly) but the same look as `.section`.
        Keyed on grain+year so a new fetch resets internal state cleanly.
      */}
      {rows.length > 0 && (
        <CropProgressTable
          key={`${grain}-${year}`}
          rows={rows}
          year={year}
          user={user}
        />
      )}
    </div>
  );
}
