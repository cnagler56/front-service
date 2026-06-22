/**
 * Look up US coordinates for a free-text place name via OpenStreetMap Nominatim.
 * Returns null if nothing was found or the request failed — callers should fall
 * back to manual coordinate entry or device geolocation.
 */
export async function geocodeUS(query: string): Promise<{ lat: number; lon: number } | null> {
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
