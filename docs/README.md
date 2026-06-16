# Just4Ag developer docs

Short, opinionated notes on how this codebase is structured and how the
recurring patterns work. Read these first when picking up a new task —
they'll save you from re-deriving conventions from the code.

## What's where

| Doc | When to read it |
|---|---|
| **[page-pattern.md](./page-pattern.md)** | Adding or refactoring a page under `app/(site)/`. |
| **[data-caching.md](./data-caching.md)** | Anything that calls NASS Quick Stats or another slow / rate-limited upstream. |
| **[forecast-tracking.md](./forecast-tracking.md)** | Working on /forecast-change, /forecast-map, or the scheduled refresh task. |
| **[api-reference.md](./api-reference.md)** | Quick lookup for what backend endpoints exist and what they return. |
| **[shared-hooks.md](./shared-hooks.md)** | Before you write a new `useEffect` that reads `localStorage` or loads forecast locations — there's probably already a hook. |
| **[local-dev-setup.md](./local-dev-setup.md)** | First time setting up on a fresh checkout — env vars, dev-env.ps1, what to commit vs ignore. |

## High-level stack

- **Frontend** — Next.js 16 (App Router) + React 19, TypeScript. Plain CSS Modules for styling, no UI lib.
- **Backend** — Spring Boot 3.2 + Java 17, Spring Data JPA, MySQL. Talks to NASS Quick Stats, NWS, NASA POWER, Yahoo Finance, Nominatim.
- **Repos** — `front-service` (this repo) and `AgriServer` (Spring). They run independently on `localhost:3000` and `localhost:8081` respectively.

## Two non-obvious rules

1. **Pages are 5-line wrappers.** Every page under `app/(site)/` imports
   one component from `src/components/<route>/` and renders it. State,
   API calls, and composition live in the component folder. See
   [page-pattern.md](./page-pattern.md).

2. **No charting / mapping libraries.** Hand-rolled SVG is the project
   norm — `YieldHistoryChart`, `MidwestMap`, `DailyForecast` all do
   their own layout. Don't add `recharts` / `chart.js` / `react-simple-maps`
   without a strong reason.
