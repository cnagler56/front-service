'use client';

import { useEffect, useState } from 'react';
import { ForecastLocation } from '@/src/lib/api';
import sharedStyles from '@/src/styles/farm.module.css';

interface Props {
  initial?: ForecastLocation | null;
  onSave: (l: ForecastLocation) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Look up US coordinates for a free-text place name via OpenStreetMap Nominatim.
 * Returns null if nothing was found or the request failed — callers should fall
 * back to manual coordinate entry.
 */
async function geocodeUS(query: string): Promise<{ lat: number; lon: number } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}`
      + `&format=json&countrycodes=us&limit=1`,
    );
    if (!res.ok) return null;
    const hits: Array<{ lat: string; lon: string }> = await res.json();
    if (!hits.length) return null;
    const lat = parseFloat(hits[0].lat);
    const lon = parseFloat(hits[0].lon);
    return isFinite(lat) && isFinite(lon) ? { lat, lon } : null;
  } catch {
    return null;
  }
}

export default function ForecastLocationModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [lat,  setLat]  = useState<string>(initial?.lat != null ? String(initial.lat) : '');
  const [lon,  setLon]  = useState<string>(initial?.lon != null ? String(initial.lon) : '');
  const [submitting, setSubmitting] = useState(false);
  const [geocoding,  setGeocoding]  = useState(false);
  const [resolvedHint, setResolvedHint] = useState<string | null>(null);
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

  /**
   * Run a geocode and populate lat/lon. Returns the resolved coords on success.
   * Pass `quiet` to skip the "couldn't find" message — used by the auto-lookup
   * on blur, where popping an error would be intrusive while the user types.
   */
  async function lookup(query: string, opts: { quiet?: boolean } = {}): Promise<{ lat: number; lon: number } | null> {
    if (!query.trim()) return null;
    setGeocoding(true);
    setError('');
    const result = await geocodeUS(query);
    setGeocoding(false);
    if (result) {
      setLat(result.lat.toFixed(4));
      setLon(result.lon.toFixed(4));
      setResolvedHint(`Resolved "${query.trim()}" to ${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}`);
      return result;
    }
    setResolvedHint(null);
    if (!opts.quiet) {
      setError(`Couldn't find "${query}". Try a more specific name (e.g. "Spencer, IA") or enter coordinates manually below.`);
    }
    return null;
  }

  /** Auto-lookup on name blur — but only if the user hasn't already typed coords. */
  function handleNameBlur() {
    if (lat.trim() || lon.trim()) return;
    lookup(name, { quiet: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If lat/lon are still empty, try one more geocode now
    let latN = parseFloat(lat);
    let lonN = parseFloat(lon);
    if (!isFinite(latN) || !isFinite(lonN)) {
      const found = await lookup(name);
      if (!found) return;
      latN = found.lat;
      lonN = found.lon;
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
          {resolvedHint && !error && (
            <p style={{
              margin: '0 0 .75rem',
              padding: '.55rem .75rem',
              borderRadius: 4,
              fontSize: '.82rem',
              color: '#2c4a1e',
              background: '#f0fdf4',
              border: '1px solid #c3e6cb',
              fontFamily: 'Lato, sans-serif',
            }}>
              ✓ {resolvedHint}
            </p>
          )}

          <form className={sharedStyles.modalForm} onSubmit={handleSubmit}>
            <div className={sharedStyles.formRow}>
              <label>Location Name</label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setResolvedHint(null); }}
                onBlur={handleNameBlur}
                placeholder="e.g. Spencer, IA"
                autoFocus
                required
              />
            </div>
            <p style={{
              margin: '-.35rem 0 .65rem',
              fontSize: '.75rem',
              color: '#888',
              fontFamily: 'Lato, sans-serif',
            }}>
              Type a city and state — coordinates auto-fill when you tab away.{' '}
              <button
                type="button"
                onClick={() => lookup(name)}
                disabled={geocoding || !name.trim()}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#3d6b2a',
                  fontWeight: 700,
                  cursor: geocoding || !name.trim() ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                {geocoding ? 'Looking up…' : '🔍 Look up now'}
              </button>
            </p>

            <div className={sharedStyles.formRowGroup}>
              <div className={sharedStyles.formRow}>
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={e => { setLat(e.target.value); setResolvedHint(null); }}
                  placeholder="auto-filled"
                />
              </div>
              <div className={sharedStyles.formRow}>
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={e => { setLon(e.target.value); setResolvedHint(null); }}
                  placeholder="auto-filled"
                />
              </div>
            </div>
            <p style={{ margin: '-.4rem 0 .5rem', fontSize: '.72rem', color: '#888', fontFamily: 'Lato, sans-serif' }}>
              Override these only if the lookup picked the wrong point.
            </p>

            <div className={sharedStyles.modalActions}>
              <button type="button" className={sharedStyles.btnSecondary} onClick={onClose}>Cancel</button>
              <button type="submit" className={sharedStyles.btn} disabled={submitting || geocoding}>
                {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
