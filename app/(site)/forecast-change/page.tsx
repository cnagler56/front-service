'use client';

import { useEffect, useState } from 'react';
import { api, ForecastLocation } from '@/src/lib/api';
import ForecastDiffCard from '@/src/components/forecast/ForecastDiffCard';
import ForecastLocationModal from '@/src/components/forecast/ForecastLocationModal';
import styles from '@/src/styles/farm.module.css';

export default function ForecastChangePage() {
  const [locations, setLocations] = useState<ForecastLocation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing: ForecastLocation | null }>(
    { open: false, editing: null }
  );
  const [bulkRefreshing, setBulkRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listForecastLocations()
      .then(rows => { if (!cancelled) setLocations(rows); })
      .catch(() => { if (!cancelled) setError('Could not load locations. Is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function refreshOne(id: number) {
    const updated = await api.refreshForecastLocation(id);
    setLocations(prev => prev.map(l => l.id === id ? updated : l));
  }

  async function refreshAll() {
    setBulkRefreshing(true);
    try {
      // Sequential to stay polite to NWS (one call per location for the points
      // lookup if needed + one for the forecast). Could parallelize if desired.
      for (const l of locations) {
        if (l.id) {
          try { await refreshOne(l.id); } catch { /* keep going */ }
        }
      }
    } finally {
      setBulkRefreshing(false);
    }
  }

  async function handleSave(loc: ForecastLocation) {
    if (loc.id) {
      const updated = await api.updateForecastLocation(loc.id, loc);
      setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));
    } else {
      const created = await api.createForecastLocation(loc);
      setLocations(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setModal({ open: false, editing: null });
  }

  async function handleDelete(loc: ForecastLocation) {
    if (!loc.id) return;
    if (!confirm(`Stop tracking "${loc.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteForecastLocation(loc.id);
      setLocations(prev => prev.filter(l => l.id !== loc.id));
    } catch {
      alert('Could not delete that location.');
    }
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
            <button
              className={styles.btnSecondary}
              onClick={refreshAll}
              disabled={bulkRefreshing || locations.length === 0}
            >
              {bulkRefreshing ? 'Refreshing…' : '🔄 Refresh All'}
            </button>
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
            Track how each location's 7-day NWS forecast changes between refreshes. Cells are shaded by
            the delta vs the <em>previous</em> snapshot — <span style={{ color: '#b91c1c', fontWeight: 700 }}>red</span> = warmer,
            {' '}<span style={{ color: '#1d4ed8', fontWeight: 700 }}>blue</span> = cooler/wetter,
            {' '}<span style={{ color: '#a16207', fontWeight: 700 }}>tan</span> = drier.
            Take a fresh snapshot anytime with Refresh.
          </p>

          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loading}>Loading locations…</p>}
          {!loading && locations.length === 0 && !error && (
            <p className={styles.empty}>
              No locations tracked yet — click <strong>+ Add Location</strong> to start.
            </p>
          )}

          {locations.map(loc => (
            <ForecastDiffCard
              key={loc.id}
              location={loc}
              onRefresh={() => refreshOne(loc.id!)}
              onEdit={() => setModal({ open: true, editing: loc })}
              onDelete={() => handleDelete(loc)}
            />
          ))}
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
