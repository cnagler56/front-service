# Shared hooks and helpers

The recurring "who's signed in" / "fetch + cache locally" /
"normalize a NASS string" patterns are already extracted. **Check
here before you write a new `useEffect` or helper.**

## Auth — `UserContext` + `useUser` / `useAuth`

The single source of truth for "is this person signed in." Mounted in
`app/(site)/layout.tsx`. On mount, the provider calls `/me` to resolve
the session cookie.

### Read-only — `useUser()`

```tsx
const { user, loading } = useUser();
if (loading) return null;          // bootstrapping /me
if (!user)   return <SignInPrompt />;
```

Used everywhere a component just needs to know "who am I" — `Header`,
`NavigationBar`, the dashboards, the listing modal.

### Mutating — `useAuth()`

```tsx
const { user, signIn, signUp, signOut, refresh } = useAuth();
await signIn(email, password);     // sets user, server sets cookie
await signOut();                   // clears cookie + user
```

Only used by `SignInForm`, `SignUpForm`, and `LogoutPage`. Everything
else should use `useUser()`.

### `useStoredUser()` — legacy wrapper

Old name from when the user lived in localStorage. Still works — it
delegates to `useUser().user`. New code should call `useUser()` directly.

### `useNwsForecast()` — `src/components/weather/useNwsForecast.ts`

Geolocation → NWS `/points` → NWS forecast as a single hook.

```tsx
const { forecast, coords, locLabel, loading, error, refresh } = useNwsForecast();
```

Auto-runs on mount. `refresh()` re-asks for geolocation (use it for
"Refresh" buttons). All NWS-error-code branching (denied, unavailable,
timeout) is internalized.

### `useForecastLocations()` — `src/components/forecast/useForecastLocations.ts`

CRUD over `/api/forecast-locations` with the locations kept sorted in
memory.

```tsx
const { locations, loading, error, save, remove } = useForecastLocations();
```

- `save(loc)` does the upsert and slots the row into the sorted list.
- `remove(loc)` prompts for confirmation first; returns `false` if the
  user cancelled.

`/forecast-change` uses save + remove; `/forecast-map` only reads
`locations`.

## Helpers (no React)

### NASS short_desc parsers — `src/components/usdaLookup/nassClassify.ts`

NASS rows come with strings like `"CORN, GRAIN - YIELD, MEASURED IN BU / ACRE"`.

```ts
classify(shortDesc)        // "GRAIN" (or "ALL CLASSES")
unit(shortDesc)            // "BU / ACRE"
toNum("1,234")             // 1234   (handles commas)
```

Used by the USDA snapshot panel, history panel, dashboard. Pure
functions — no imports beyond their own argument types.

### `imageResize.ts` + `listingHints.ts` — `src/components/buysell/`

- `fileToResizedDataUrl(file)` — client-side image resize to a data
  URL. Used by the Add Listing modal so we don't ship multi-MB
  phone-camera JPEGs over the wire.
- `titleHint / priceHint / qtyHint / detailsHint(category)` —
  category-specific placeholder text for the modal's inputs.

## Pattern: when to extract a hook vs a helper

| Has state? | Reads / writes browser? | Use |
|---|---|---|
| Yes | — | **Hook** in same component folder, named `useXxx.ts` |
| No | Yes (localStorage, geolocation, etc) | Hook (so SSR can sidestep it) |
| No | No | **Pure helper** in same folder, named `xxx.ts` |

If two pages use the same hook/helper, move it to `src/lib/` or to a
shared component folder (e.g. `forecast/useForecastLocations.ts` lives
in `forecast/` because both forecast pages share it but no others do).

## When you find yourself copy-pasting

Three small signs there's a pattern worth extracting:

1. The same try/catch + `JSON.parse(localStorage.getItem(...))` block —
   that's `useStoredUser`.
2. The same `setLoading(true) → api.x() → catch → finally setLoading(false)` —
   could be its own hook if more than two callers need it.
3. The same color-by-magnitude logic across two visualizations — extract
   to a helper that takes `(delta, capMagnitude, lowColor, highColor)`.
