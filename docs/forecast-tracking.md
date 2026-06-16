# Forecast tracking

`/forecast-change` and `/forecast-map` let users track multiple
locations and see how each location's NWS forecast changed since the
last snapshot. The whole system is designed around one observation:
**the comparison is only meaningful if the previous snapshot is
recent**. So we don't refresh on-demand from a button — we refresh on
a cron timed to NWS's actual publication cadence.

## The snapshot rotation

Each `ForecastLocation` row stores **two** JSON snapshots:

```
current_snapshot_json    + current_fetched_at
previous_snapshot_json   + previous_fetched_at
```

When `refresh(id)` runs:

1. Move `current` → `previous` (snapshot + timestamp)
2. Fetch fresh data from NWS
3. Save new fetch as `current`

The frontend renders `current.days[i]` vs `previous.days[i]` colored by
the delta. With the cron firing every 12 hours, the delta is always
"what changed in the last NWS issuance."

JSON shape:

```json
{
  "days": [
    {"day":"Today","high":78,"low":58,"precipChance":10,"shortForecast":"Partly Sunny"},
    {"day":"Tuesday","high":81,"low":60,"precipChance":0,"shortForecast":"Sunny"}
  ]
}
```

Pure JSON, no joins, no second table. We only ever care about the last
two snapshots so a child entity would just add ceremony.

## The cron

```java
@Scheduled(cron = "0 1 3,15 * * *", zone = "America/Chicago")
public void scheduledRefreshAll() {
    for (ForecastLocation l : repo.findAll()) {
        try { refresh(l.getId()); } catch (Exception e) { log... }
    }
}
```

3:01 AM and 3:01 PM Central — one minute after NWS's two daily forecast
revisions ("morning push" around 3 AM local, "afternoon push" around 3 PM
local) typically settle into the gridded feed. Captured 12 hours apart.

`@EnableScheduling` lives on `AgriServerApplication`.

## First snapshots

Two places trigger an immediate refresh so the user never sees an
empty card:

1. **On startup**, `@EventListener(ApplicationReadyEvent.class)`
   scans for locations with `currentFetchedAt == null` and refreshes them.
   Picks up newly-seeded defaults and any rows added while the server
   was down.

2. **On `create(...)`**, after `repo.save(...)` we call `refresh(id)`
   synchronously so the response to the frontend already includes the
   first snapshot.

## NWS rate-limit etiquette

- One HTTP call per location per refresh (we cache the `gridId/X/Y` on
  the row after the first lookup, so we skip the `/points` endpoint
  thereafter).
- Sequential, not parallel — NWS expects no more than ~1 req/sec
  sustained from a single client.
- Custom `User-Agent` header — NWS asks for one and 403s requests
  without it. See `UA` constant in `ForecastChangeService`.

## Frontend — `useForecastLocations` hook

Both `/forecast-change` (CRUD) and `/forecast-map` (read-only) share
the same hook:

```ts
const { locations, loading, error, save, remove } = useForecastLocations();
```

- `locations` is the in-memory list (sorted by name).
- `save(loc)` POSTs or PUTs depending on `loc.id` presence; updates the
  list locally without re-fetching.
- `remove(loc)` prompts to confirm, deletes, removes from the list.

The map page just doesn't call save/remove.

## Color shading

Both the diff cards and the map dots use the same approach:

- **Temperature delta**: red (warmer) ↔ blue (cooler), capped at ±5°
  for the map's per-location average, ±10° for per-day cells.
- **Precip delta**: blue (wetter) ↔ tan (drier), capped at ±20%
  (avg) or ±40% (per-day).
- Magnitude scales the alpha or interpolates RGB.

See `tempBg` / `precipBg` in `ForecastDiffCard.tsx` and `markerTempColor` /
`markerPrecipColor` in `MidwestMap.tsx`. The pattern is reusable for
any signed-delta visualization (could be applied to YoY yield change,
for example).
