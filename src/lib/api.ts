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

export interface CornGuess {
  id: number;
  grain: string;
  date: string;
  yiel: string;
  name: string;
  state: string;
  interest: string;
  userId: number;
}

export interface GrainYield {
  id: number;
  state: string;
  yield: number;
  acres: number;
  avg: number;
}

export interface BeanGuess {
  id: number;
  nationalGuess: number;
  myState: number;
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

export interface NASSYieldData {
  id?: number;
  commodity_desc: string;
  state_name: string;
  Value: string;
  acresValue: string;
  load_time: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    get<User>(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),

  getPosts: () => get<Post[]>('/posts'),
  addPost: (body: Omit<Post, 'idposts' | 'date'>) =>
    fetch(`${BASE}/addpost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getCornYields: () => get<GrainYield[]>('/cornyields'),
  getCornEstimates: () => get<CornGuess[]>('/cornestimates'),
  addCornGuess: (body: Omit<CornGuess, 'id' | 'date'>) =>
    fetch(`${BASE}/cornGuess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getBeans: () => get<GrainYield[]>('/beans'),
  addBeanGuess: (body: Omit<BeanGuess, 'id'>) =>
    fetch(`${BASE}/beanGuess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getWeather: (gridID: string, gridX: string, gridY: string) =>
    get<WeatherPeriod[]>(`/fetch-weather?gridID=${gridID}&gridX=${gridX}&gridY=${gridY}`),

  getHogs: (month: string, year: string) =>
    get<AnimalData[]>(`/api/hogs?month=${month}&year=${year}`),

  getCattle: (month: string, year: string) =>
    get<AnimalData[]>(`/api/cattle?month=${month}&year=${year}`),

  getNassYield: (grain: string, month: string, year: string) =>
    get<NASSYieldData[]>(`/api/nass-yield-data?grain=${grain}&month=${month}&year=${year}`),
};
