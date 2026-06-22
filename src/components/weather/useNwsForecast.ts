'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, WeatherPeriod } from '@/src/lib/api';
import { geocodeUS } from '@/src/lib/geocode';

interface NwsPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    relativeLocation?: { properties?: { city?: string; state?: string } };
  };
}

/** Where the active forecast's coordinates came from. */
export type ForecastSource = 'profile' | 'gps';

interface Options {
  /** Profile city, e.g. "Springfield". */
  city?: string | null;
  /** Profile state, e.g. "IL". */
  state?: string | null;
  /** Hold off the initial auto-load until auth has resolved (so we know if a profile exists). */
  ready?: boolean;
}

const COORD_CACHE_PREFIX = 'weatherCoords:';

function readCachedCoords(key: string): { lat: number; lon: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COORD_CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as { lat: number; lon: number }) : null;
  } catch {
    return null;
  }
}

function writeCachedCoords(key: string, c: { lat: number; lon: number }) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COORD_CACHE_PREFIX + key, JSON.stringify(c));
  } catch {
    /* ignore storage errors (quota / private mode) */
  }
}

/**
 * NWS forecast pipeline with two location sources:
 *   - "profile": geocode the signed-in user's city/state (cached in localStorage,
 *     so Nominatim is hit at most once per place) → NWS forecast. No permission
 *     prompt, works on every visit.
 *   - "gps": browser geolocation for the user's exact spot.
 *
 * On load it prefers the profile location and falls back to GPS when there's no
 * profile place. The caller can switch sources on demand.
 */
export function useNwsForecast({ city, state, ready = true }: Options = {}) {
  const [forecast, setForecast] = useState<WeatherPeriod[]>([]);
  const [coords, setCoords]     = useState<{ lat: number; lon: number } | null>(null);
  const [locLabel, setLocLabel] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [source, setSource]     = useState<ForecastSource | null>(null);

  const profileQuery = [city, state].filter(Boolean).join(', ');
  const hasProfile = profileQuery.length > 0;

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
      const ptCity  = relativeLocation?.properties?.city  ?? '';
      const ptState = relativeLocation?.properties?.state ?? '';
      setLocLabel([ptCity, ptState].filter(Boolean).join(', '));
      setForecast(await api.getWeather(gridId, String(gridX), String(gridY)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Exact device location via browser geolocation. */
  const useGps = useCallback(() => {
    setSource('gps');
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
          setError('Location access denied. Allow location in your browser settings, or use your saved area.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Could not determine your location. Try again or use your saved area.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timed out waiting for your location. Please try again.');
        } else {
          setError('Could not get your location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [loadForecast]);

  /** Forecast for the profile city/state (geocoded once, then cached). */
  const useProfileLocation = useCallback(async () => {
    if (!profileQuery) return false;
    setSource('profile');
    setError('');
    setLoading(true);
    let c = readCachedCoords(profileQuery);
    if (!c) {
      c = await geocodeUS(profileQuery);
      if (c) writeCachedCoords(profileQuery, c);
    }
    if (!c) {
      setError(`Couldn't locate "${profileQuery}". Try using your exact location instead.`);
      setLoading(false);
      return false;
    }
    setCoords(c);
    await loadForecast(c.lat, c.lon);
    return true;
  }, [profileQuery, loadForecast]);

  /** Re-run whichever source is currently active. */
  const refresh = useCallback(() => {
    if (source === 'gps' || !hasProfile) useGps();
    else useProfileLocation();
  }, [source, hasProfile, useGps, useProfileLocation]);

  // Initial auto-load: prefer the profile location, fall back to GPS. Runs once,
  // after auth has resolved so we know whether a profile place is available.
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (hasProfile) useProfileLocation();
    else useGps();
  }, [ready, hasProfile, useProfileLocation, useGps]);

  return {
    forecast, coords, locLabel, loading, error, source, hasProfile,
    refresh, useGps, useProfileLocation,
  };
}
