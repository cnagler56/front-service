'use client';

import { useState } from 'react';
import { api, CropProgressData } from '@/src/lib/api';
import { useStoredUser } from '@/src/lib/useStoredUser';
import styles from '@/src/styles/farm.module.css';
import CropProgressFilters, { grainLabel } from './CropProgressFilters';
import CropProgressTable from './CropProgressTable';

/**
 * /cropprogress top — owns the filter state and the fetched rows, delegates
 * the filter UI and the (sticky-headered) pivot table to child components.
 */
export default function CropProgressPage() {
  const user = useStoredUser();
  const [grain, setGrain] = useState('CORN');
  const [year, setYear]   = useState(new Date().getFullYear());
  const [rows, setRows]   = useState<CropProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchProgress() {
    setLoading(true);
    setError('');
    try {
      setRows(await api.getCropProgress(grain, year));
      setFetched(true);
    } catch {
      setError('Failed to load Crop Progress. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Filters in a normal .section — no sticky issues from overflow:hidden */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          
          <h2>USDA Crop Progress</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1.25rem' }}>
            Weekly state-level crop progress from USDA NASS — % planted, emerged, silking, harvested.
            Reports run April through November during the growing season.
          </p>

          <CropProgressFilters
            grain={grain} year={year} loading={loading}
            onGrainChange={setGrain}
            onYearChange={setYear}
            onLoad={fetchProgress}
          />

          {error && <p className={styles.error}>{error}</p>}
          {!fetched && !loading && (
            <p className={styles.empty}>Choose a commodity and year, then click Load Progress.</p>
          )}
          {fetched && rows.length === 0 && !loading && (
            <p className={styles.empty}>
              No Crop Progress data found for {grainLabel(grain)} in {year}. Reports run roughly
              April – November, so it may be too early or too late in the season.
            </p>
          )}
        </div>
      </div>

      {/*
        Pivot table lives OUTSIDE the .section card so its sticky headers can pin
        to the page viewport. Keyed on grain+year so a new fetch resets internal state.
      */}
      {rows.length > 0 && (
        <CropProgressTable
          key={`${grain}-${year}`}
          rows={rows}
          user={user}
        />
      )}
    </div>
  );
}
