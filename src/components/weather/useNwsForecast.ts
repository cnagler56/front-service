'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, WeatherPeriod } from '@/src/lib/api';

interface NwsPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    relativeLocation?: { properties?: { city?: string; state?: string } };
  };
}

/**
 * Browser geolocation → NWS /points → NWS forecast pipeline as a single hook.
 *
 * On mount it asks the browser for the user's lat/lon. On success it resolves
 * the NWS grid and pulls the forecast through our backend. `refresh()` re-runs
 * the whole pipeline (useful for a Refresh button or after moving locations).
 */
export function useNwsForecast() {
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [coords, setCoords]     = useState<{ lat: number; lon: number } | null>(null);
  const [locLabel, setLocLabel] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const loadForecast = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    try {
      const ptRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { Accept: 'application/geo+json' } },
      );
      if (!ptRes.ok) {
        throw new Error(
          ptRes.status === 404
            ? 'Location is outside the National Weather Service coverage area (US only).'
            : `NWS points lookup failed (${ptRes.status})`,
        );
      }
      const pt = (await ptRes.json()) as NwsPointResponse;
      const { gridId, gridX, gridY, relativeLocation } = pt.properties;
      const city  = relativeLocation?.properties?.city  ?? '';
      const state = relativeLocation?.properties?.state ?? '';
      setLocLabel([city, state].filter(Boolean).join(', '));
      setForecast(await api.getWeather(gridId, String(gridX), String(gridY)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setError('');
    setLoading(true);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Your browser does not support geolocation.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        loadForecast(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Allow location in your browser settings to see your local forecast.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Could not determine your location. Try again or check your device settings.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timed out waiting for your location. Please try again.');
        } else {
          setError('Could not get your location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [loadForecast]);

  // Auto-run on mount
  useEffect(() => { refresh(); }, [refresh]);

  return { forecast, coords, locLabel, loading, error, refresh };
}
