'use client';

import { useEffect, useState } from 'react';
import { FieldRecord, FIELD_CROPS, FieldCrop } from '@/src/lib/api';
import sharedStyles from '@/src/styles/farm.module.css';
import styles from './fields.module.css';

interface Props {
  initial?: FieldRecord | null;       // null/undefined → "Add"
  userId: number;
  onSave: (f: FieldRecord) => Promise<void> | void;
  onClose: () => void;
}

export default function FieldFormModal({ initial, userId, onSave, onClose }: Props) {
  const [name,       setName]       = useState(initial?.name ?? '');
  const [crop,       setCrop]       = useState<FieldCrop>(initial?.crop ?? 'CORN');
  const [variety,    setVariety]    = useState(initial?.variety ?? '');
  const [acres,      setAcres]      = useState<string>(initial?.acres != null ? String(initial.acres) : '');
  const [plantedOn,  setPlantedOn]  = useState<string>(initial?.plantedOn ?? '');
  const [lat,        setLat]        = useState<string>(initial?.lat != null ? String(initial.lat) : '');
  const [lon,        setLon]        = useState<string>(initial?.lon != null ? String(initial.lon) : '');
  const [notes,      setNotes]      = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // Close on Escape, prevent background scroll
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

  function fillFromGeolocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Your browser does not support geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
      },
      () => setError('Could not get your location.'),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const acresN = acres.trim() === '' ? null : parseFloat(acres);
      const latN   = lat.trim()   === '' ? null : parseFloat(lat);
      const lonN   = lon.trim()   === '' ? null : parseFloat(lon);
      await onSave({
        ...initial,
        userId,
        name: name.trim(),
        crop,
        variety: variety.trim() || null,
        acres: acresN,
        plantedOn: plantedOn.trim() || null,
        lat: latN,
        lon: lonN,
        notes: notes.trim() || null,
      });
    } catch {
      setError('Could not save the field. Please try again.');
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
          <h2>{initial ? 'Edit Field' : 'Add a Field'}</h2>
          <button className={sharedStyles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={sharedStyles.modalBody}>
          {error && <p className={sharedStyles.error}>{error}</p>}

          <form className={sharedStyles.modalForm} onSubmit={handleSubmit}>
            <div className={sharedStyles.formRow}>
              <label>Field Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Home 40, Back 80"
                required
              />
            </div>

            <div className={sharedStyles.formRowGroup}>
              <div className={sharedStyles.formRow}>
                <label>Crop</label>
                <select value={crop} onChange={e => setCrop(e.target.value as FieldCrop)} required>
                  {FIELD_CROPS.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className={sharedStyles.formRow}>
                <label>Variety / Hybrid</label>
                <input
                  value={variety}
                  onChange={e => setVariety(e.target.value)}
                  placeholder="e.g. P0589AM, Asgrow 25X8"
                />
              </div>
            </div>

            <div className={sharedStyles.formRowGroup}>
              <div className={sharedStyles.formRow}>
                <label>Acres</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={acres}
                  onChange={e => setAcres(e.target.value)}
                  placeholder="40"
                />
              </div>
              <div className={sharedStyles.formRow}>
                <label>Planting Date</label>
                <input
                  type="date"
                  value={plantedOn}
                  onChange={e => setPlantedOn(e.target.value)}
                />
              </div>
            </div>

            <div className={sharedStyles.formRowGroup}>
              <div className={sharedStyles.formRow}>
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="41.5868"
                />
              </div>
              <div className={sharedStyles.formRow}>
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  placeholder="-93.6250"
                />
              </div>
            </div>
            <p style={{ margin: '-.4rem 0 .5rem', fontSize: '.75rem', color: '#888' }}>
              Coordinates enable GDD tracking and per-field soil-moisture.{' '}
              <button type="button" className={styles.linkBtn} onClick={fillFromGeolocation}>
                📍 Use my current location
              </button>
            </p>

            <div className={sharedStyles.formRow}>
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Soil type, drainage, planted population, sprays applied…"
              />
            </div>

            <div className={sharedStyles.modalActions}>
              <button type="button" className={sharedStyles.btnSecondary} onClick={onClose}>Cancel</button>
              <button type="submit" className={sharedStyles.btn} disabled={submitting}>
                {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Field'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
