# Data caching pattern

Several upstream APIs are slow, rate-limited, or both:
USDA NASS Quick Stats, Yahoo Finance, NASA POWER, OpenStreetMap
Nominatim. We don't hit them on every page load — we cache, and we
auto-refresh on a schedule that's tuned to when the upstream actually
changes.

Two flavors of cache live in this codebase:

1. **In-memory + TTL** for small, ephemeral things (prices, soil moisture)
2. **Database snapshot + staleness check** for the big USDA reports

## In-memory + TTL (PriceService, PowerService)

Used when the data is small, the upstream is fast enough, and we don't
need cross-restart durability.

```java
private final ConcurrentHashMap<String, Cached> cache = new ConcurrentHashMap<>();
private static final long CACHE_TTL_SECONDS = 300; // 5 min for prices, 6h for POWER

private Foo getOrFetch(String key) {
    Cached hit = cache.get(key);
    long now = Instant.now().getEpochSecond();
    if (hit != null && (now - hit.fetchedAt) < CACHE_TTL_SECONDS) return hit.value;
    Foo fresh = fetchUpstream(key);
    cache.put(key, new Cached(fresh, now));
    return fresh;
}
```

Files: `PriceService.java`, `PowerService.java`.

## DB snapshot + staleness check (USDA reports)

Used when the data is large, the upstream is rate-limited and slow, and
we want fresh data within a *week* of NASS publishing the next monthly
Crop Production report — not 5 minutes.

### The shape

Three pieces:

1. **A JPA entity** keyed by `(commodity, ...other dims..., referencePeriod)`
   with a `fetchedAt` column. Examples: `YieldSnapshot`, `PlantingSnapshot`,
   `CornYieldSnapshot` (legacy, was renamed to YieldSnapshot for genericness).

2. **A service** with two top-level methods:
   - `getXxxData(...)` — public entry point. Calls `refreshIfStale`,
     then reads the DB and returns the freshest row per state.
   - `refreshIfStale(...)` — checks `findFirstByCommodityOrderByFetchedAtDesc`;
     if the newest `fetchedAt` is older than `REFRESH_DAYS` (default 7),
     re-fetches from NASS and upserts.

3. **Per-NASS-call wrapping in `safe(...)`** so a 400 on one year
   (e.g. `year=2026` before August) doesn't short-circuit the other
   year's refresh:

   ```java
   safe(() -> fetchYieldForYear(commodity, currentYear), "yield " + currentYear);
   safe(() -> fetchYieldForYear(commodity, priorYear),   "yield " + priorYear);
   safe(() -> fetchAcresHarvestedForYear(commodity, priorYear), ...);

   private static void safe(Runnable r, String label) {
       try { r.run(); }
       catch (Exception e) { System.err.println("[USDA] " + label + " failed: " + ...); }
   }
   ```

Files: `UsdaReportsService.java`, `NASSYieldService.java`.

## Two NASS gotchas worth remembering

### 1. `RestTemplate.exchange(String, ...)` re-encodes the URL

NASS values like `"AREA HARVESTED"` need a space → `%20`. We encode the
URL during build. But Spring's `exchange(String, ...)` then treats the
string as a *URI template* and re-encodes, turning `%20` into `%2520`.
NASS sees `FIRST%20OF%20JAN` (with the literal percent), returns 400
"invalid query," and we eat hours debugging.

**Fix everywhere**: build to `URI`, not `String`:

```java
URI url = UriComponentsBuilder.fromHttpUrl(NASS_URL)
    .queryParam(...)
    .build()
    .encode()
    .toUri();                                   // ← URI, not toUriString()
restTemplate.getForObject(url, ApiResponse.class);
```

### 2. NASS reference periods are wordy

The published values are:

- `"YEAR"` — final annual
- `"YEAR - AUG FORECAST"`, `"YEAR - SEP FORECAST"`, ... — in-season

Always normalize:

```java
private static String normalizeRefPeriod(String raw) {
    String r = raw.trim().toUpperCase();
    if (r.equals("YEAR")) return "YEAR";
    if (r.equals("MARKETING YEAR")) return null;
    if (r.startsWith("YEAR - ") && r.endsWith(" FORECAST")) {
        String month = r.substring("YEAR - ".length(), r.length() - " FORECAST".length()).trim();
        if (REF_PERIOD_RANK.containsKey(month)) return month;
    }
    return REF_PERIOD_RANK.containsKey(r) ? r : null;
}
```

The `REF_PERIOD_RANK` map gives `YEAR=100, NOV=80, OCT=70, SEP=60, AUG=50` so
"latest published" is a `Math.max` over the rank.

## Refresh cadences

| Cache | TTL | Why |
|---|---|---|
| Yahoo prices (`PriceService`) | 5 min in-memory | Intra-day volatility doesn't matter for the dashboard. |
| NASA POWER (`PowerService`) | 6 hr in-memory | Daily-resolution data, no point refreshing more often. |
| USDA Reports (`UsdaReportsService`) | 7 days DB | NASS Crop Production publishes ~10th of each month — week-old cache picks the new month up within a week of issuance. |
| Forecast snapshots (`ForecastChangeService`) | 12 hours, cron-driven | NWS issues forecast text twice a day. See [forecast-tracking.md](./forecast-tracking.md). |
