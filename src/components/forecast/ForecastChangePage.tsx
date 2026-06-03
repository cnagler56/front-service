'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ForecastLocation } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import ForecastLocationModal from './ForecastLocationModal';
import LocationsGrid from './LocationsGrid';
import { useForecastLocations } from './useForecastLocations';

/**
 * /forecast-change top — owns whether the add/edit modal is open. The
 * locations themselves (load + save + delete) live in useForecastLocations.
 */
export default function ForecastChangePage() {
  const { locations, loading, error, save, remove } = useForecastLocations();
  const [modal, setModal] = useState<{ open: boolean; editing: ForecastLocation | null }>(
    { open: false, editing: null }
  );

  async function handleSave(loc: ForecastLocation) {
    await save(loc);
    setModal({ open: false, editing: null });
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <span>📈</span>
            <h2>Change in Forecast</h2>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <Link href="/forecast-map" className={styles.btnSecondary}>
              🗺️ Map view
            </Link>
            <button
              className={styles.headerBtn}
              onClick={() => setModal({ open: true, editing: null })}
            >
              + Add Location
            </button>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1.25rem' }}>
            Snapshots are taken automatically at <strong>3:01 AM</strong> and <strong>3:01 PM Central</strong>,
            one minute after NWS's two daily forecast revisions. Cells are shaded by the delta vs the
            previous snapshot — <span style={{ color: '#b91c1c', fontWeight: 700 }}>red</span> = warmer,
            {' '}<span style={{ color: '#1d4ed8', fontWeight: 700 }}>blue</span> = cooler/wetter,
            {' '}<span style={{ color: '#a16207', fontWeight: 700 }}>tan</span> = drier. New locations
            get their first snapshot immediately on add.
          </p>

          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loading}>Loading locations…</p>}
          {!loading && locations.length === 0 && !error && (
            <p className={styles.empty}>
              No locations tracked yet — click <strong>+ Add Location</strong> to start.
            </p>
          )}

          <LocationsGrid
            locations={locations}
            onEdit={loc => setModal({ open: true, editing: loc })}
            onDelete={remove}
          />
        </div>
      </div>

      {modal.open && (
        <ForecastLocationModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
