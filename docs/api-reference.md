# API reference

Quick lookup of the AgriServer endpoints. All run on
`http://localhost:8081` in dev, mapped through `src/lib/api.ts` on the
frontend.

CORS is open to `http://localhost:3000` (set in each controller's
`@CrossOrigin`). All security is disabled in `WebSecurityConfig`
**except for password hashing** — `UserService` hashes new passwords
with BCrypt and verifies them with `PasswordEncoder.matches`. This is
still a learning project, not a production deployment.

## Auth flow

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/login?email=&password=` | `User` + `Set-Cookie: agri_session=...` | 401 on bad credentials. Password verified against BCrypt hash in `users.password`. |
| POST | `/register` | `User` + `Set-Cookie: agri_session=...` | 409 on duplicate email. Hashes the incoming password before save. |
| GET | `/me` | `User` | Reads the `agri_session` cookie and returns the matching user. 401 if no session or expired. **Frontend must send `credentials: 'include'`.** |
| POST | `/logout` | 204 + `Set-Cookie` clearing the session | Idempotent — safe to call without a session. |

### The session cookie

- Name: **`agri_session`**
- Lifetime: 30 days (cookie + DB row)
- `HttpOnly`, `Secure=false` (dev), `SameSite=Lax`, `Path=/`
- Value: 32 random bytes, URL-base64-encoded → 43 chars
- Server-side row in `user_sessions` (`token` unique, `expires_at` set on creation)
- Expired rows are swept by a daily 3 AM cron in `SessionService`

For production, flip `Secure=true` and `SameSite=None` when serving over HTTPS from a different origin.

### Client-side inactivity logout

Independent of the 30-day cookie lifetime, the `UserProvider` auto-logs
the user out after **4 hours of no input events** (mousedown, keydown,
scroll, touchstart). Activity in any tab keeps every other tab alive
via `BroadcastChannel('agri-activity')`. On expiry the provider calls
`signOut()` and pushes to `/signin?reason=inactivity`, which shows a
"You were signed out after 4 hours of inactivity" banner.

The server-side cookie isn't refreshed on each request, so the 30-day
limit is hard. If you ever want sliding-window server expiry, update
`UserSession.expiresAt` inside `SessionService.findUserByToken`.

### Frontend pattern

The whole auth lifecycle is wrapped by `UserContext` (mounted in `app/(site)/layout.tsx`).
Use `useAuth()` for mutations, `useUser()` for read-only:

```tsx
const { user, loading } = useUser();
// OR
const { user, signIn, signUp, signOut, refresh } = useAuth();
```

Every `fetch` in `src/lib/api.ts` includes `credentials: 'include'` so the
cookie flows on cross-origin requests.

## Users & posts

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/user` | `User[]` | All users — debug only. |
| GET | `/posts` | `Post[]` | Forum-style posts. |
| GET | `/post/{id}` | `Post` | |
| POST | `/addpost` | void | Body: `Post`. |

## Marketplace listings (`/buysell`)

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/api/listings?type=&category=` | `Listing[]` | Both filters accept `ALL`. |
| POST | `/api/listings` | `Listing` | Body: `Listing` without `id` / `date`. |

## Fields (`/fields`)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/fields/{userId}` | `Field[]` |
| POST | `/api/fields` | `Field` |
| PUT | `/api/fields/{id}` | `Field` |
| DELETE | `/api/fields/{id}` | 204 |

## USDA Reports (`/usda-reports`)

The unified yield + planting + livestock endpoints. See
[data-caching.md](./data-caching.md) for the refresh strategy.

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/api/usda-reports/yield/{commodity}` | `UsdaYieldReport` | `commodity` ∈ {CORN, SOYBEANS, WHEAT, ...}. Auto-refreshes from NASS if cache > 7 days. |
| GET | `/api/usda-reports/planting/{commodity}` | `UsdaPlantingReport` | Same caching. |
| GET | `/api/hogs?month=&year=` | `HogsData[]` | NASS quarterly Hogs & Pigs. `month` ∈ {3,6,9,12}. |
| GET | `/api/cattle?month=&year=` | `CattleData[]` | NASS Cattle Inventory. `month` ∈ {1,7}. |

## Community yield guesses

| Method | Path | Returns |
|---|---|---|
| GET | `/api/yield-guess/{commodity}` | `YieldGuess[]` (newest first) |
| POST | `/api/yield-guess` | `YieldGuess` |

## NASS NASS-direct passthroughs (legacy `/usda` page)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/nass-yield-data?grain=&month=&year=` | `NASSYieldData[]` |
| GET | `/api/yield-history?grain=&years=5` | `NASSYieldData[]` |
| GET | `/api/crop-progress?grain=&year=` | `CropProgressData[]` |

## Weather

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/fetch-weather?gridID=&gridX=&gridY=` | `WeatherPeriod[]` | Proxies NWS gridpoint forecast. |
| GET | `/api/soil-moisture?lat=&lon=&days=14` | rows of {date, GWETTOP, GWETROOT, GWETPROF} | NASA POWER. |
| GET | `/api/gdd?lat=&lon=&plantedOn=&base=50&cap=86` | `{ totalGdd, days, rows }` | Growing-degree days from planting. |

## Forecast tracking (`/forecast-change`, `/forecast-map`)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/forecast-locations` | `ForecastLocation[]` |
| POST | `/api/forecast-locations` | `ForecastLocation` (with first snapshot) |
| PUT | `/api/forecast-locations/{id}` | `ForecastLocation` |
| DELETE | `/api/forecast-locations/{id}` | 204 |
| POST | `/api/forecast-locations/{id}/refresh` | `ForecastLocation` | Manual override of the cron. |

## Futures prices

| Method | Path | Returns |
|---|---|---|
| GET | `/prices` | `CommodityGroup[]` | Each group has 5 contracts. 5-min in-memory cache. |

## Frontend usage

Always go through `src/lib/api.ts`. It centralizes the base URL, JSON
parsing, and error handling. Don't `fetch` to localhost:8081 directly
from a component.

When adding an endpoint:

1. Add the type definitions to `src/lib/api.ts` near the related ones.
2. Add a method to the `api` object. Use the existing helpers:
   - `get<T>(path)` for GETs
   - inline `fetch` with `Content-Type: application/json` for POSTs/PUTs/DELETEs
   - mirror the existing error-handling pattern (throw on `!res.ok`)
