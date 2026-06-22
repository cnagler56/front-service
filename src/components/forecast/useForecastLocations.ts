'use client';

import { useEffect, useState } from 'react';
import { api, ForecastLocation } from '@/src/lib/api';

/**
 * Loads + manages the tracked-forecast-location list.
 *
 * Exposes save + delete helpers that handle both creation and update of the
 * row and keep the in-memory list in sync. Used by /forecast-change (which
 * exercises save/delete) and /forecast-map (which just reads).
 */
export function useForecastLocations() {
  const [locations, setLocations] = useState<ForecastLocation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listForecastLocations()
      .then(rows => { if (!cancelled) setLocations(rows); })
      .catch(() => { if (!cancelled) setError('Could not load locations. Is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /** Upsert a location and slot it into the sorted-by-name list. */
  async function save(loc: ForecastLocation) {
    if (loc.id) {
      const updated = await api.updateForecastLocation(loc.id, loc);
      setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));
      return updated;
    }
    const created = await api.createForecastLocation(loc);
    setLocations(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  /** Force a fresh NWS pull for every location and swap in the updated list. */
  async function refreshAll(): Promise<ForecastLocation[]> {
    const rows = await api.refreshAllForecastLocations();
    setLocations(rows);
    return rows;
  }

  /** Delete with confirmation. Returns false if the user cancelled. */
  async function remove(loc: ForecastLocation): Promise<boolean> {
    if (!loc.id) return false;
    if (!confirm(`Stop tracking "${loc.name}"? This cannot be undone.`)) return false;
    try {
      await api.deleteForecastLocation(loc.id);
      setLocations(prev => prev.filter(l => l.id !== loc.id));
      return true;
    } catch {
      alert('Could not delete that location.');
      return false;
    }
  }

  return { locations, loading, error, save, remove, refreshAll };
}
