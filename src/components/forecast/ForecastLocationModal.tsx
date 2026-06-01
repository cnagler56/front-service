'use client';

import { useEffect, useState } from 'react';
import { ForecastLocation } from '@/src/lib/api';
import sharedStyles from '@/src/styles/farm.module.css';

interface Props {
  initial?: ForecastLocation | null;
  onSave: (l: ForecastLocation) => Promise<void> | void;
  onClose: () => void;
}

export default function ForecastLocationModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [lat,  setLat]  = useState<string>(initial?.lat != null ? String(initial.lat) : '');
  const [lon,  setLon]  = useState<string>(initial?.lon != null ? String(initial.lon) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (!isFinite(latN) || !isFinite(lonN)) {
      setError('Lat and lon must be numbers.');
      return;
    }
    if (latN < 24 || latN > 50 || lonN < -125 || lonN > -66) {
      setError('Coordinates appear to be outside the continental US — NWS only covers the US.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        ...initial,
        name: name.trim(),
        lat: latN,
        lon: lonN,
      });
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={sharedStyles.modalOverlay}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={sharedStyles.modalCard}>
        <div className={sharedStyles.modalHead}>
          <h2>{initial ? 'Edit Location' : 'Add a Location'}</h2>
          <button className={sharedStyles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={sharedStyles.modalBody}>
          {error && <p className={sharedStyles.error}>{error}</p>}
          <form className={sharedStyles.modalForm} onSubmit={handleSubmit}>
            <div className={sharedStyles.formRow}>
              <label>Display Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Spencer, IA"
                required
              />
            </div>
            <div className={sharedStyles.formRowGroup}>
              <div className={sharedStyles.formRow}>
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="43.1410"
                  required
                />
              </div>
              <div className={sharedStyles.formRow}>
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  placeholder="-95.1422"
                  required
                />
              </div>
            </div>
            <p style={{ margin: '-.4rem 0 .5rem', fontSize: '.75rem', color: '#888' }}>
              Need coords? Right-click any spot in Google Maps to copy the lat/lon.
            </p>
            <div className={sharedStyles.modalActions}>
              <button type="button" className={sharedStyles.btnSecondary} onClick={onClose}>Cancel</button>
              <button type="submit" className={sharedStyles.btn} disabled={submitting}>
                {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
