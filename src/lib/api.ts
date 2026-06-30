const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';

export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  name: string;
  email: string;
  city: string;
  state: string;
  interest: string;
  active: boolean;
  roles?: 'USER' | 'ADMIN';
}

export interface Post {
  idposts: number;
  title: string;
  content: string;
  name: string;
  city: string;
  state: string;
  date: string;
  userId: number;
}

export type ListingType = 'BUY' | 'SELL';
export type ListingCategory =
  | 'TRACTORS' | 'COMBINES' | 'EQUIPMENT'
  | 'HAY' | 'LIVESTOCK' | 'SERVICES'
  | 'OTHER';
export type ContactMethod = 'PHONE' | 'TEXT' | 'EMAIL';

export const LISTING_CATEGORIES: { value: ListingCategory; label: string; icon: string }[] = [
  { value: 'TRACTORS',  label: 'Tractors',         icon: '🚜' },
  { value: 'COMBINES',  label: 'Combines',         icon: '🌾' },
  { value: 'EQUIPMENT', label: 'Equipment',        icon: '🔧' },
  { value: 'HAY',       label: 'Hay / Forage',     icon: '🌿' },
  { value: 'LIVESTOCK', label: 'Livestock',        icon: '🐄' },
  { value: 'SERVICES',  label: 'Custom Services',  icon: '🛠️' },
  { value: 'OTHER',     label: 'Other',            icon: '📦' },
];

export const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'PHONE', label: 'Phone' },
  { value: 'TEXT',  label: 'Text'  },
  { value: 'EMAIL', label: 'Email' },
];

export interface Listing {
  id: number;
  title: string;
  description: string;
  type: ListingType;
  category: ListingCategory;
  name: string;
  city: string;
  state: string;
  price?: string;          // free-text e.g. "$25,000", "$8/bale", "$45/hr"
  quantity?: string;       // free-text e.g. "500 tons", "120 head"
  imageBase64?: string | null;
  contactMethod: ContactMethod;
  contactValue: string;
  date: string;
  userId: number;
}

export interface WeatherPeriod {
  name: string;
  dayForecast: number;
  temperature: number;
  precipChance: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  fullForecast: string;
}

// JSON property names from @JsonProperty annotations on the Java domain class
export interface AnimalData {
  id?: number;
  short_desc: string;
  load_time: string;
  location_desc: string;
  Value: string;
}

/** National headline for Cattle on Feed (monthly) or Hogs & Pigs (quarterly). */
export interface LivestockReport {
  report: string;          // "Cattle on Feed" / "Hogs & Pigs"
  unit?: string;           // "head"
  period?: string;         // NASS reference period, e.g. "FIRST OF APR"
  year?: number;
  value?: number;          // Cattle on Feed total
  all?: number;            // Hogs total
  breeding?: number;
  market?: number;
  yoyPct?: number;
  message?: string;
}

export interface CommodityPrice {
  symbol: string;          // e.g. "ZCN26.CBT"
  name: string;            // e.g. "Corn"
  unit: string;            // e.g. "¢/bu"
  expiration: string;      // e.g. "Jul 2026"
  expirationKey: number;   // sortable YYYYMM
  last: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  asOf: number | null;
  error: string | null;
}

export interface CommodityGroup {
  name: string;            // "Corn"
  unit: string;            // "¢/bu"
  exchange: string;        // "CBT" / "CME"
  contracts: CommodityPrice[];  // front month first
}

export interface NASSYieldData {
  id?: number;
  commodity_desc: string;
  short_desc?: string;
  state_name: string;
  year?: number;
  Value: string;
  acresValue: string;
  load_time: string;
}

export interface CropProgressData {
  commodity: string;
  state: string;
  year: number;
  unit: string;          // e.g. "PCT PLANTED"
  weekEnding: string;    // ISO date "2024-05-12"
  value: string;
  shortDesc?: string;
}


export interface YieldSnapshot {
  id?: number;
  commodity: string;
  state: string;
  year: number;
  referencePeriod: string;
  yieldBu: number;
  acres?: number | null;
  nassLoadTime?: string | null;
  fetchedAt?: string | null;
}

export interface UsdaYieldReport {
  commodity: string;
  currentYear: number;
  priorYear: number;
  currentAsOf: string;
  fellBack: boolean;
  currentEstimates: YieldSnapshot[];
  priorYearFinal: YieldSnapshot[];
}

export interface YieldGuess {
  id?: number;
  commodity: string;
  year?: number;
  estimate: number;
  name: string;
  state: string;
  interest: string;
  userId?: number;    // optional on submit — the server stamps it from the session
  date?: string;
  note?: string;      // explanation attached to a revision
}

/** One person's current standing in the challenge, with how it changed since last time. */
export interface GuessRosterEntry {
  latestId: number;
  userId: number | null;
  name: string;
  state: string;
  interest: string;
  estimate: number;
  date?: string;
  revisions: number;
  updated: boolean;                              // made more than one guess
  direction: 'up' | 'down' | 'same' | null;     // null = first guess
  delta: number | null;                          // latest − previous
  previousEstimate: number | null;
  note: string | null;                           // explanation on the latest revision
}

export interface SupplyDemandRow {
  attribute: string;
  unit: string;                // WASDE units, e.g. "Million Bushels"
  seq: number;                 // file/display order
  values: (number | null)[];   // aligned to `years`
  prev?: number | null;        // prior-month value for the new-crop year (values[0])
}
export interface SupplyDemandSheet {
  commodity: string;
  years: number[];             // newest first, e.g. [2026, 2025, 2024]
  reportDate?: string;         // WASDE report date
  prevReportDate?: string;     // prior month's report, for the change comparison
  updatedAt?: string;
  /** Balance sheet per region key ("US", "WORLD", "BRAZIL", "ARGENTINA", "PARAGUAY"). */
  regions: Record<string, SupplyDemandRow[]>;
  message?: string;
}

export interface Feedback {
  id?: number;
  userId?: number | null;
  name?: string;
  email?: string;
  message: string;
  date?: string;
}

export interface ResultsRankRow {
  label: string;        // group name or state
  count: number;
  avgEstimate: number;
  avgError: number;
}

export interface ResultsIndividual {
  name: string;
  state: string;
  group: string;
  estimate: number;
  error: number;
}

export interface ResultsPeriod {
  period: string;          // "AUG", "SEP", "YEAR", …
  usdaYield: number;
}

export interface UsdaResults {
  commodity: string;
  year: number;
  usdaYield: number | null;
  period: string;          // which report is being scored
  cutoff: string | null;   // NASS publication timestamp (the cheat-proof gate)
  availablePeriods: ResultsPeriod[];
  participants: number;
  byGroup: ResultsRankRow[];
  byState: ResultsRankRow[];
  topIndividuals: ResultsIndividual[];
  message?: string;
}

export interface PlantingSnapshot {
  id?: number;
  commodity: string;
  state: string;
  year: number;
  referencePeriod: string;
  acres: number;
  nassLoadTime?: string | null;
  fetchedAt?: string | null;
}

export interface UsdaPlantingReport {
  commodity: string;
  currentYear: number;
  priorYear: number;
  fellBack: boolean;
  currentPlantings: PlantingSnapshot[];
  priorYearPlantings: PlantingSnapshot[];
}

/** One state's planted acres for the planting search. */
export interface PlantingAcresRow {
  state: string;
  acres: number;
}

export interface PlantingSearchResult {
  commodity: string;
  year: number;
  priorYear: number;
  plantings: PlantingAcresRow[];
  priorYearPlantings: PlantingAcresRow[];
}

export interface ForecastDay {
  day: string;
  high?: number;
  low?: number;
  precipChance?: number;
  shortForecast?: string;
  nightForecast?: string;
  windSpeed?: string;
  windDirection?: string;
}

export interface ForecastSnapshot {
  days: ForecastDay[];
}

export interface ForecastLocation {
  id?: number;
  name: string;
  lat: number;
  lon: number;
  gridId?: string | null;
  gridX?: number | null;
  gridY?: number | null;
  currentFetchedAt?: string | null;     // ISO datetime
  currentSnapshotJson?: string | null;  // serialized ForecastSnapshot
  previousFetchedAt?: string | null;
  previousSnapshotJson?: string | null;
}

export interface SoilMoistureRow {
  date: string;          // "20240518"
  GWETTOP:  number | null;
  GWETROOT: number | null;
  GWETPROF: number | null;
}

/** One 3-month ONI season, e.g. { season: "MAM", year: 2026, oni: 0.48 }. */
export interface EnsoSeason {
  season: string;        // 3-month code, e.g. "MAM"
  year: number;
  oni: number;           // Oceanic Niño Index (°C anomaly)
}
export interface EnsoCurrent extends EnsoSeason {
  phase: 'EL_NINO' | 'LA_NINA' | 'NEUTRAL';
  label: string;         // "El Niño" / "La Niña" / "Neutral"
  strength: string;      // "Weak" | "Moderate" | "Strong" | "Very Strong" | ""
}
/** One season of the admin-entered probabilistic outlook. */
export interface EnsoForecastRow {
  id?: number;
  season: string;        // "JJA 2026"
  elNino: number;        // probability %
  neutral: number;
  laNina: number;
  issued?: string | null;
}
export interface EnsoData {
  source: string;
  updatedAt?: string;
  current: EnsoCurrent | null;
  history: EnsoSeason[];  // chronological, ~6 years
  forecast?: EnsoForecastRow[];
  forecastIssued?: string | null;
  message?: string;
}

/** Brazil production from CONAB (thousand tonnes / thousand hectares). */
export interface ConabProduction {
  commodity: string;
  source: string;
  updatedAt?: string;
  unit?: string;
  cropYear?: string;
  priorCropYear?: string;
  production?: number;          // thousand tonnes
  area?: number;               // thousand hectares
  yieldTha?: number | null;    // tonnes/hectare
  productionYoYPct?: number;
  productionMoM?: number;       // thousand tonnes vs our last monthly snapshot
  productionMoMPct?: number;
  momMonthKey?: number;        // YYYYMM of the snapshot compared against
  seasons?: { name: string; production: number }[];
  topStates?: { state: string; production: number; yieldTha?: number | null }[];
  allStates?: { state: string; production: number; yieldTha?: number | null }[];
  message?: string;
}

/** County-level production (bushels) keyed by 5-digit FIPS, for the forecast-map overlay. */
export interface CropProductionData {
  commodity: string;
  year?: number;               // most recent year present
  minYear?: number;            // oldest county year (map may mix years per county)
  unit?: string;               // "bushels"
  source?: string;
  updatedAt?: string;
  counties?: number;
  byFips: Record<string, number>;
  message?: string;
}

/** Latest CFTC managed-money positioning for one commodity (empty if untracked). */
export interface CotPosition {
  reportDate?: string | null;
  longs?: number;
  shorts?: number;
  net?: number;        // longs − shorts
  netChange?: number;  // week-over-week change in net
}

/** One auto-generated home-page news item (last 3 days). */
export interface NewsItem {
  category: string;       // "ETHANOL" / "WASDE" / "ENSO" / "PRICE"
  icon: string;
  headline: string;
  detail?: string | null;
  link?: string | null;
  eventDate?: string | null;
  createdAt?: string;
}

/** One weekly EIA observation. */
export interface EthanolPoint {
  period: string;        // ISO week-ending date "2026-06-12"
  value: number;
}
export interface EthanolData {
  source: string;
  updatedAt?: string;
  productionUnit?: string;        // "MBBL/D"
  stocksUnit?: string;            // "MBBL"
  gasolineUnit?: string;          // "MBBL/D"
  production?: EthanolPoint[];     // chronological, ~52 weeks
  stocks?: EthanolPoint[];
  gasoline?: EthanolPoint[];       // gasoline demand (product supplied)
  productionLatest?: number | null;
  productionWoW?: number | null;
  productionAsOf?: string | null;
  stocksLatest?: number | null;
  stocksAsOf?: string | null;
  gasolineLatest?: number | null;
  gasolineWoW?: number | null;
  gasolineYoYPct?: number | null;
  gasolineAsOf?: string | null;
  impliedBlendPct?: number | null; // ethanol production ÷ gasoline supplied
  ethanolSpotPrice?: number | null; // CME ethanol front, $/gal
  ethanolSpotUnit?: string;
  ethanolSpotAsOf?: string | null;
  impliedCornBuPerWeek?: number;  // derived corn grind
  impliedCornBuPerYear?: number;
  message?: string;
}

/** A weekly EIA energy metric (crude, diesel, propane) with a chart series. */
export interface EnergyMetric {
  key: string;
  label: string;
  unit: string;
  latest: number | null;
  wow: number | null;
  asOf: string | null;
  series: EthanolPoint[];
}
export interface EnergyData {
  source: string;
  updatedAt?: string;
  metrics: EnergyMetric[];
}

/** Soybean oil consumed by biodiesel + renewable diesel (million lbs, monthly). */
export interface SoyOilBiofuelData {
  source: string;
  updatedAt?: string;
  unit?: string;
  biodiesel?: EthanolPoint[];
  renewableDiesel?: EthanolPoint[];
  total?: EthanolPoint[];
  biodieselLatest?: number | null;
  renewableDieselLatest?: number | null;
  totalLatest?: number | null;
  asOf?: string | null;
  totalMoMPct?: number | null;
  totalYoYPct?: number | null;
  message?: string;
}

/** USDA FAS weekly export sales for one commodity. */
export interface ExportDestination { country: string; netSales: number; }
export interface ExportSalesData {
  commodity: string;
  source?: string;
  updatedAt?: string;
  unit?: string;                  // "MT" / "running bales"
  weekEnding?: string;
  netSales?: number;
  shipments?: number;
  totalCommitment?: number;
  nextMYNetSales?: number;
  topDestinations?: ExportDestination[];
  message?: string;
}

/** Admin WASDE upload status: months loaded + prior uploads. */
export interface WasdeUpload { filename: string; monthKey: number | null; uploadedAt: string | null; }
export interface WasdeAdminStatus {
  ok?: boolean;
  filename?: string;
  monthsLoaded?: number[];
  uploads?: WasdeUpload[];
  message?: string;
}

/** NASS quarterly grain stocks for one commodity. */
export interface GrainStocksData {
  commodity: string;
  unit?: string;                  // "bushels"
  period?: string;                // "Jun 1, 2026"
  year?: number;
  total?: number | null;
  onFarm?: number | null;
  offFarm?: number | null;
  yoyPct?: number | null;
  message?: string;
}

/** Admin-editable home-page announcement. Rendered on the home page only when `active`. */
export interface Announcement {
  id?: number;
  title?: string;
  body?: string;
  active: boolean;
  updatedAt?: string;
}

/** One admin-entered USDA report release date. */
export interface ReportReleaseDate {
  id?: number;
  reportKey: string;    // "CROP_PRODUCTION" | "WASDE" | "GRAIN_STOCKS"
  releaseDate: string;  // ISO date "2026-07-10"
}

/**
 * Default fetch options for every API call — `credentials: 'include'` is
 * what makes the browser send the session cookie cross-origin (Next.js on
 * :3000 → AgriServer on :8081). Without this, the server sees no cookie
 * and /me always 401s.
 */
const FETCH_OPTS: RequestInit = { credentials: 'include' };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, FETCH_OPTS);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  /** Returns the user attached to the current session cookie, or throws 401. */
  getMe: () => get<User>('/me'),

  /** Clears the server-side session and tells the browser to drop the cookie. */
  logout: async (): Promise<void> => {
    const res = await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' });
    if (!res.ok && res.status !== 204) throw new Error(`${res.status} ${res.statusText}`);
  },

  login: (email: string, password: string) =>
    get<User>(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),

  register: async (body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    city?: string;
    state?: string;
    interest?: string;
  }): Promise<User> => {
    const res = await fetch(`${BASE}/register`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Surface a server-supplied reason if there is one (e.g. duplicate email)
      let detail = `${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data?.message) detail = data.message;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    return res.json() as Promise<User>;
  },

  /** Begin a password reset. Always resolves (server never reveals if the email exists). */
  requestPasswordReset: async (email: string): Promise<string> => {
    const res = await fetch(`${BASE}/forgot-password`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? `${res.status} ${res.statusText}`);
    return data?.message ?? 'If an account exists for that email, a reset link is on its way.';
  },

  /** Complete a password reset with the emailed token. Throws on invalid/expired token. */
  resetPassword: async (token: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE}/reset-password`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? 'This reset link is invalid or has expired.');
    return data?.message ?? 'Your password has been reset.';
  },

  getPosts: () => get<Post[]>('/posts'),
  addPost: (body: Omit<Post, 'idposts' | 'date'>) =>
    fetch(`${BASE}/addpost`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getListings: (type?: ListingType | 'ALL', category?: ListingCategory | 'ALL') => {
    const params = new URLSearchParams();
    if (type     && type     !== 'ALL') params.set('type', type);
    if (category && category !== 'ALL') params.set('category', category);
    const qs = params.toString();
    return get<Listing[]>(`/listings${qs ? `?${qs}` : ''}`);
  },
  addListing: (body: Omit<Listing, 'id' | 'date'>) =>
    fetch(`${BASE}/addlisting`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json() as Promise<Listing>;
    }),

  // USDA Reports (corn / soybeans / wheat / ...)
  getUsdaYield: (commodity: string) =>
    get<UsdaYieldReport>(`/api/usda-reports/yield/${commodity}`),
  getUsdaPlanting: (commodity: string) =>
    get<UsdaPlantingReport>(`/api/usda-reports/planting/${commodity}`),

  getPlantingSearch: (commodity: string, year: number) =>
    get<PlantingSearchResult>(`/api/usda-reports/planting/${commodity}/${year}`),

  getYieldGuesses: (commodity: string) =>
    get<GuessRosterEntry[]>(`/api/yield-guess/${commodity}`),

  getGuessHistory: (commodity: string, userId: number) =>
    get<YieldGuess[]>(`/api/yield-guess/${commodity}/history/${userId}`),

  getUsdaResults: (commodity: string, period?: string) =>
    get<UsdaResults>(
      `/api/usda-results/${commodity}${period ? `?period=${encodeURIComponent(period)}` : ''}`,
    ),
  submitYieldGuess: async (body: YieldGuess): Promise<YieldGuess> => {
    const res = await fetch(`${BASE}/api/yield-guess`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  submitFeedback: async (body: { name?: string; email?: string; message: string }): Promise<Feedback> => {
    const res = await fetch(`${BASE}/api/feedback`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  // Admin-only feedback inbox
  getFeedback: () => get<Feedback[]>(`/api/feedback`),

  getWeather: (gridID: string, gridX: string, gridY: string) =>
    get<WeatherPeriod[]>(`/fetch-weather?gridID=${gridID}&gridX=${gridX}&gridY=${gridY}`),

  getHogs: (month: string, year: string) =>
    get<AnimalData[]>(`/api/hogs?month=${month}&year=${year}`),

  getCattle: (month: string, year: string) =>
    get<AnimalData[]>(`/api/cattle?month=${month}&year=${year}`),

  getCattleOnFeed: () => get<LivestockReport>('/api/cattle-on-feed'),
  getHogsAndPigs: () => get<LivestockReport>('/api/hogs-pigs'),

  getNassYield: (grain: string, month: string, year: string) =>
    get<NASSYieldData[]>(`/api/nass-yield-data?grain=${grain}&month=${month}&year=${year}`),

  getYieldHistory: (grain: string, years = 5) =>
    get<NASSYieldData[]>(`/api/yield-history?grain=${grain}&years=${years}`),

  getCropProgress: (grain: string, year?: number) =>
    get<CropProgressData[]>(
      `/api/crop-progress?grain=${grain}${year != null ? `&year=${year}` : ''}`,
    ),

  getEnso: () => get<EnsoData>('/api/enso'),

  getEthanol: () => get<EthanolData>('/api/ethanol'),

  getEnergy: () => get<EnergyData>('/api/energy'),
  getSoyOilBiofuel: () => get<SoyOilBiofuelData>('/api/energy/soyoil-biofuel'),

  getExportSales: (commodity: string) => get<ExportSalesData>(`/api/export-sales/${commodity}`),
  getGrainStocks: (commodity: string) => get<GrainStocksData>(`/api/grain-stocks/${commodity}`),

  // Admin-only WASDE CSV management.
  getWasdeAdmin: () => get<WasdeAdminStatus>('/api/admin/wasde'),
  uploadWasde: async (file: File): Promise<WasdeAdminStatus> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${BASE}/api/admin/wasde`, { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  },

  getNews: () => get<NewsItem[]>('/api/news'),

  // Admin-managed USDA report release dates (drive the release-day refresh burst).
  getReportDates: () => get<ReportReleaseDate[]>('/api/admin/report-dates'),
  saveReportDates: async (reportKey: string, dates: string[]): Promise<ReportReleaseDate[]> => {
    const res = await fetch(`${BASE}/api/admin/report-dates`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportKey, dates }),
    });
    if (!res.ok) {
      let msg = `Save failed (${res.status})`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json() as Promise<ReportReleaseDate[]>;
  },

  // Home-page announcement: public GET, plus admin GET (pre-fill) and POST (upsert).
  getAnnouncement: () => get<Announcement>('/api/announcement'),
  getAdminAnnouncement: () => get<Announcement>('/api/admin/announcement'),
  saveAnnouncement: async (body: { title: string; body: string; active: boolean }): Promise<Announcement> => {
    const res = await fetch(`${BASE}/api/admin/announcement`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = `Save failed (${res.status})`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json() as Promise<Announcement>;
  },

  getCot: (commodity: string) => get<CotPosition>(`/api/cot/${commodity}`),

  getConab: (commodity: string) => get<ConabProduction>(`/api/conab/${commodity}`),

  // Canada (Statistics Canada) — same production shape as CONAB.
  getStatCan: (commodity: string) => get<ConabProduction>(`/api/statcan/${commodity}`),

  // County-level production (bushels) by 5-digit FIPS, for the forecast-map overlay.
  getCropProduction: (commodity: string) => get<CropProductionData>(`/api/crop-production/${commodity}`),

  saveEnsoForecast: async (
    body: { issued: string; rows: Omit<EnsoForecastRow, 'id' | 'issued'>[] },
  ): Promise<EnsoForecastRow[]> => {
    const res = await fetch(`${BASE}/api/enso/forecast`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  getSoilMoisture: (lat: number, lon: number, days = 14) =>
    get<SoilMoistureRow[]>(
      `/api/soil-moisture?lat=${lat}&lon=${lon}&days=${days}`,
    ),

  // ── Forecast change tracking ────────────────────────────────────
  listForecastLocations: () =>
    get<ForecastLocation[]>(`/api/forecast-locations`),

  createForecastLocation: async (body: ForecastLocation): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  updateForecastLocation: async (id: number, body: ForecastLocation): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  deleteForecastLocation: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok && res.status !== 204) throw new Error(`${res.status} ${res.statusText}`);
  },

  refreshForecastLocation: async (id: number): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  refreshAllForecastLocations: async (): Promise<ForecastLocation[]> => {
    const res = await fetch(`${BASE}/api/forecast-locations/refresh-all`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  getPrices: () => get<CommodityGroup[]>('/prices'),

  getSupplyDemand: (commodity: string) =>
    get<SupplyDemandSheet>(`/api/supply-demand/${commodity}`),
};
