# Local dev setup

Steps to get both apps running on a fresh checkout.

## One-time setup

### Java + Maven (backend)

1. Install JDK 17. The project is currently developed against
   `C:\Program Files\Java\jdk-17.0.4.1` but anything 17.0.x works.
2. Either:
   - Set `JAVA_HOME` permanently in Windows ("Environment Variables"),
   - Or use the `dev-env.ps1` flow described below — it sets `JAVA_HOME`
     for the session.
3. The Maven wrapper (`mvnw.cmd`) handles Maven itself; no separate
   install needed.

### Node + Next.js (frontend)

```powershell
cd C:\Users\chris\front-service
npm install
```

## Per-checkout setup (secrets)

### Backend env vars

```powershell
cd C:\Users\chris\git\AgriServer
Copy-Item dev-env.example.ps1 dev-env.ps1
```

Then open `dev-env.ps1` and fill in real values:

- `DB_PASSWORD` — your local MySQL root password
- `USDA_API_KEY` — get one at https://quickstats.nass.usda.gov/api

`dev-env.ps1` is gitignored — your secrets stay local.

### Frontend env

```powershell
cd C:\Users\chris\front-service
Copy-Item .env.local.example .env.local
```

The default `NEXT_PUBLIC_API_URL=http://localhost:8081` already matches
the backend's default port, so most people don't need to change anything.

## Running

### Backend

```powershell
cd C:\Users\chris\git\AgriServer
. .\dev-env.ps1           # ← leading dot+space dot-sources into your shell
.\mvnw.cmd spring-boot:run
```

You only need to dot-source `dev-env.ps1` once per PowerShell window.
If you forget, the app fails to start with a `${DB_PASSWORD}` or
`${USDA_API_KEY}` placeholder error — that's the intended behavior.

### Frontend

```powershell
cd C:\Users\chris\front-service
npm run dev
```

Listens on `http://localhost:3000`. `.env.local` is picked up
automatically by Next.js.

## What's gitignored vs committed

| Pattern | Status |
|---|---|
| `AgriServer/dev-env.example.ps1` | committed (template) |
| `AgriServer/dev-env.ps1` | gitignored (real secrets) |
| `front-service/.env.local.example` | committed (template) |
| `front-service/.env.local` | gitignored (real secrets) |

## Rotating the leaked NASS key

The original NASS API key (`F8384D57-…`) was committed in early
versions and still exists in git history. Before going public:

1. Log in at https://quickstats.nass.usda.gov/api
2. Request a new key (it's instant and free).
3. Put the new key in `dev-env.ps1` and your host's env vars.
4. The old key remains valid for a while after rotation — fine, it
   just means the leaked one keeps working until NASS expires it.

## Production deployment

Same env vars, set on whichever host you use:

| Var | Where to set |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | host's secret-manager / env config |
| `USDA_API_KEY` | host's secret-manager / env config |
| `NEXT_PUBLIC_API_URL` | host's build env (Vercel / Railway / etc) |

Never set these in `application.properties` or in a `.env` file
committed to git. The whole point of #5 on the prerequisites list is
that secrets live in the host's environment, not the codebase.
