# Page pattern

Every page in `app/(site)/<route>/page.tsx` is a thin wrapper. The
actual UI lives in `src/components/<route>/`, organized as one
**main component** + several **child components** + optional helpers.

## The shape

```
app/(site)/<route>/page.tsx                ← 5 lines, no logic

src/components/<route>/
  <RouteName>Page.tsx                      ← MAIN: composition + high-level state
  <FocusedChildA>.tsx                      ← one concern each
  <FocusedChildB>.tsx
  use<SomeHook>.ts                         ← shared state / side effects
  <pureHelpers>.ts                         ← formatters, classifiers, parsers
  <something>.module.css                   ← only if needed
```

## Concrete example — `/buysell`

```
app/(site)/buysell/page.tsx                 5 lines
src/components/buysell/
  BuySellPage.tsx                           ~85 lines — owns listings + filters + modal-open
  ListingFilters.tsx                        ~55 lines — type & category pills
  ListingCard.tsx                           ~50 lines — one listing row
  ContactLine.tsx                           ~25 lines — tel:/sms:/mailto: pill
  AddListingModal.tsx                       ~180 lines — the form
  listingHints.ts                           pure functions — placeholder text per category
  imageResize.ts                            pure async — File → resized data URL
```

The page is literally:

```tsx
import BuySellPage from '@/src/components/buysell/BuySellPage';
export default function Page() { return <BuySellPage />; }
```

## Rules for splitting

A component should be responsible for **one** of these:
- One section of the layout (card, modal, toolbar)
- One side effect (data fetch, geolocation, localStorage read)
- One pure transformation (classifier, formatter)

When a `useEffect` + a couple of `useState` calls would naturally come
with descriptive names like "loadFoo / save / delete" — that's a
**hook**, extract it. See `useForecastLocations.ts` or `useNwsForecast.ts`.

When a function takes args, returns a primitive, and has no JSX — that's
a **helper module**, put it in a `.ts` file with no React imports.

## Add a new page — 4-step recipe

1. **Create the route**: `app/(site)/<route>/page.tsx`
2. **Create the folder**: `src/components/<route>/<RouteName>Page.tsx`
3. **Page imports**:
   ```tsx
   import RouteNamePage from '@/src/components/<route>/RouteNamePage';
   export default function Page() { return <RouteNamePage />; }
   ```
4. **Write the main component**, then *extract children as soon as*:
   - A `useEffect` does a thing worth naming
   - JSX nests more than 3 levels deep
   - A switch / map renders >30 lines of JSX

## Pages that already followed the pattern

`/corn`, `/soybeans`, `/wheat` all just call `CommodityDashboard` with
different props. `/cattle` and `/hogs` similarly call `LivestockDashboard`.
That's another valid version of the pattern — one parameterized component
serving multiple pages.

## What NOT to do

- Don't put `'use client'` at the top of `app/(site)/<route>/page.tsx`.
  The wrapper has no client behavior — let the route be a Server
  Component and let the main component declare `'use client'`.
- Don't `import styles from '@/src/styles/farm.module.css'` from
  `page.tsx`. Style imports belong inside the component folder.
- Don't extract a child component for one piece of JSX you use once
  with no internal state. Co-located JSX is fine until it's not.
