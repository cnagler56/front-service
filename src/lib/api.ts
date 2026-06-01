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

export type FieldCrop = 'CORN' | 'SOYBEANS' | 'WHEAT' | 'HAY' | 'PASTURE' | 'OTHER';

export const FIELD_CROPS: { value: FieldCrop; label: string; icon: string }[] = [
  { value: 'CORN',     label: 'Corn',     icon: '🌽' },
  { value: 'SOYBEANS', label: 'Soybeans', icon: '🫘' },
  { value: 'WHEAT',    label: 'Wheat',    icon: '🌾' },
  { value: 'HAY',      label: 'Hay',      icon: '🌿' },
  { value: 'PASTURE',  label: 'Pasture',  icon: '🐄' },
  { value: 'OTHER',    label: 'Other',    icon: '📦' },
];

export interface FieldRecord {
  id?: number;
  userId: number;
  name: string;
  acres?: number | null;
  crop?: FieldCrop | null;
  variety?: string | null;
  plantedOn?: string | null;  // YYYY-MM-DD
  lat?: number | null;
  lon?: number | null;
  notes?: string | null;
  createdAt?: string;
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
  estimate: number;
  name: string;
  state: string;
  interest: string;
  userId: number;
  date?: string;
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

export interface GddRow {
  date: string;
  T2M_MAX: number | null;
  T2M_MIN: number | null;
  gdd: number | null;
}

export interface GddResponse {
  totalGdd: number;
  days: number;
  plantedOn: string;
  base: number;
  cap: number;
  rows: GddRow[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
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
      method: 'POST',
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

  getPosts: () => get<Post[]>('/posts'),
  addPost: (body: Omit<Post, 'idposts' | 'date'>) =>
    fetch(`${BASE}/addpost`, {
      method: 'POST',
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
      method: 'POST',
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

  getYieldGuesses: (commodity: string) =>
    get<YieldGuess[]>(`/api/yield-guess/${commodity}`),
  submitYieldGuess: async (body: YieldGuess): Promise<YieldGuess> => {
    const res = await fetch(`${BASE}/api/yield-guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  getWeather: (gridID: string, gridX: string, gridY: string) =>
    get<WeatherPeriod[]>(`/fetch-weather?gridID=${gridID}&gridX=${gridX}&gridY=${gridY}`),

  getHogs: (month: string, year: string) =>
    get<AnimalData[]>(`/api/hogs?month=${month}&year=${year}`),

  getCattle: (month: string, year: string) =>
    get<AnimalData[]>(`/api/cattle?month=${month}&year=${year}`),

  getNassYield: (grain: string, month: string, year: string) =>
    get<NASSYieldData[]>(`/api/nass-yield-data?grain=${grain}&month=${month}&year=${year}`),

  getYieldHistory: (grain: string, years = 5) =>
    get<NASSYieldData[]>(`/api/yield-history?grain=${grain}&years=${years}`),

  getCropProgress: (grain: string, year?: number) =>
    get<CropProgressData[]>(
      `/api/crop-progress?grain=${grain}${year != null ? `&year=${year}` : ''}`,
    ),

  getSoilMoisture: (lat: number, lon: number, days = 14) =>
    get<SoilMoistureRow[]>(
      `/api/soil-moisture?lat=${lat}&lon=${lon}&days=${days}`,
    ),

  getGdd: (lat: number, lon: number, plantedOn: string, base = 50, cap = 86) =>
    get<GddResponse>(
      `/api/gdd?lat=${lat}&lon=${lon}&plantedOn=${plantedOn}&base=${base}&cap=${cap}`,
    ),

  // ── Fields ──────────────────────────────────────────────────────
  listFields: (userId: number) =>
    get<FieldRecord[]>(`/api/fields/${userId}`),

  createField: async (body: FieldRecord): Promise<FieldRecord> => {
    const res = await fetch(`${BASE}/api/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  updateField: async (id: number, body: FieldRecord): Promise<FieldRecord> => {
    const res = await fetch(`${BASE}/api/fields/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  deleteField: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/api/fields/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`${res.status} ${res.statusText}`);
  },

  // ── Forecast change tracking ────────────────────────────────────
  listForecastLocations: () =>
    get<ForecastLocation[]>(`/api/forecast-locations`),

  createForecastLocation: async (body: ForecastLocation): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  updateForecastLocation: async (id: number, body: ForecastLocation): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  deleteForecastLocation: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`${res.status} ${res.statusText}`);
  },

  refreshForecastLocation: async (id: number): Promise<ForecastLocation> => {
    const res = await fetch(`${BASE}/api/forecast-locations/${id}/refresh`, { method: 'POST' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  getPrices: () => get<CommodityGroup[]>('/prices'),
};
