import type { Metadata, MetadataRoute } from 'next';

/**
 * Search-engine metadata for every public page, in one place so page titles,
 * descriptions, the server-rendered "About this page" copy and the sitemap all
 * stay in sync. Add a public page → add an entry here, then use
 * `pageMetadata(path)` and `<PageAbout path=... />` in its page.tsx.
 */

export const SITE_URL = 'https://www.just4ag.com';
export const SITE_NAME = 'Just4Ag';
export const SITE_DESCRIPTION =
  'Free grain and livestock market dashboards, USDA report summaries, crop progress, ' +
  'and Midwest farm weather in one place.';

export interface PageSeo {
  /** <title> (the layout appends " | Just4Ag"). Keep under ~50 chars. */
  title: string;
  /** Meta description / search snippet. ~150 chars. */
  description: string;
  /** Server-rendered intro paragraphs, so crawlers see real text before data loads. */
  about: string[];
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}

export const PAGES: Record<string, PageSeo> = {
  '/': {
    title: 'Grain & Livestock Markets, USDA Reports and Farm Weather',
    description: SITE_DESCRIPTION + ' Corn, soybeans, wheat, cattle and hogs, built for farmers.',
    about: [
      'Just4Ag brings the numbers farmers check every day onto one free site: corn, soybean, wheat, cotton, cattle and hog futures, USDA supply and demand, export sales, crop progress, and Midwest weather.',
      'Futures quotes are delayed and refresh hourly during the trading day. USDA and weather data update on each agency\'s release schedule.',
    ],
    changeFrequency: 'daily',
    priority: 1,
  },

  /* ── grains ─────────────────────────────────────────────────────────── */
  '/corn': {
    title: 'Corn Futures, Supply & Demand and Export Sales',
    description: 'Corn futures prices and chart, WASDE supply and demand, weekly export sales, CFTC managed money, grain stocks and crop progress.',
    about: [
      'The corn dashboard collects the reports that move corn prices: CBOT corn futures across the next five contract months, USDA WASDE supply and demand balance sheets, weekly export sales, quarterly Grain Stocks, CFTC managed-money positioning, and weekly crop progress and condition.',
    ],
    changeFrequency: 'daily',
    priority: 0.9,
  },
  '/soybeans': {
    title: 'Soybean Futures, Crush Margin and Supply & Demand',
    description: 'Soybean futures prices and chart, board crush margin, WASDE supply and demand, export sales, CFTC positioning and crop progress.',
    about: [
      'The soybean dashboard shows CBOT soybean futures alongside the board crush margin from soybean meal and oil, USDA WASDE supply and demand, weekly export sales, Grain Stocks, CFTC managed-money positioning, and weekly crop progress.',
    ],
    changeFrequency: 'daily',
    priority: 0.9,
  },
  '/soybean-meal': {
    title: 'Soybean Meal Futures and Supply & Demand',
    description: 'Soybean meal futures prices, crush margin, USDA supply and demand and export sales for soybean meal.',
    about: [
      'Soybean meal futures from CBOT with the soybean crush margin, USDA WASDE supply and demand for meal, export sales, and CFTC positioning.',
    ],
    changeFrequency: 'daily',
    priority: 0.7,
  },
  '/soybean-oil': {
    title: 'Soybean Oil Futures and Biofuel Demand',
    description: 'Soybean oil futures prices, crush margin, USDA supply and demand, and soybean oil used for biofuels and renewable diesel.',
    about: [
      'Soybean oil futures from CBOT with the crush margin, USDA WASDE supply and demand for oil, and the EIA data on soybean oil used to make biodiesel and renewable diesel.',
    ],
    changeFrequency: 'daily',
    priority: 0.7,
  },
  '/wheat': {
    title: 'Wheat Futures (Chicago & KC), Supply & Demand',
    description: 'Chicago and Kansas City wheat futures prices, WASDE supply and demand, export sales, CFTC positioning and crop progress.',
    about: [
      'The wheat dashboard shows Chicago SRW and Kansas City HRW wheat futures, USDA WASDE supply and demand, weekly export sales, Grain Stocks, CFTC managed-money positioning, and weekly crop progress across the wheat classes.',
    ],
    changeFrequency: 'daily',
    priority: 0.9,
  },
  '/cotton': {
    title: 'Cotton Futures, Supply & Demand and Export Sales',
    description: 'ICE cotton futures prices and chart, USDA supply and demand, weekly export sales, CFTC positioning and crop progress.',
    about: [
      'Cotton futures from ICE with USDA WASDE supply and demand, weekly export sales, CFTC managed-money positioning, and weekly crop progress and condition.',
    ],
    changeFrequency: 'daily',
    priority: 0.7,
  },
  '/ethanol': {
    title: 'Ethanol Production, Stocks and Gasoline Demand',
    description: 'Weekly US ethanol production, ethanol stocks and gasoline demand from the EIA, alongside corn futures.',
    about: [
      'Ethanol is one of the largest uses of US corn. This tracker charts the EIA\'s weekly ethanol production, ethanol stocks, and gasoline demand, with corn prices for context.',
    ],
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  '/energy': {
    title: 'Diesel, Propane, Crude & Natural Gas Prices',
    description: 'Weekly EIA data on retail diesel prices, diesel demand, propane stocks, WTI crude and Henry Hub natural gas, plus soybean oil used for biofuels.',
    about: [
      'Energy prices drive fuel, drying and fertilizer costs on the farm. This page charts weekly EIA data on retail diesel prices and demand, propane stocks, WTI crude oil and Henry Hub natural gas, and how much soybean oil goes into biodiesel and renewable diesel.',
    ],
    changeFrequency: 'weekly',
    priority: 0.6,
  },

  /* ── international ──────────────────────────────────────────────────── */
  '/south-america/corn': {
    title: 'South America Corn Production: Brazil & Argentina',
    description: 'Brazil and Argentina corn production estimates, Brazil\'s three corn crops (safra and safrinha), and CONAB state-level data.',
    about: [
      'South America is the main export competitor for US corn. This page shows USDA and CONAB production estimates for Brazil and Argentina, and explains Brazil\'s three corn crops, including the large second-crop safrinha.',
    ],
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  '/south-america/soybeans': {
    title: 'South America Soybean Production: Brazil & Argentina',
    description: 'Brazil, Argentina and Paraguay soybean production estimates from USDA and CONAB, with a state-level production map.',
    about: [
      'Brazil is the world\'s largest soybean producer. This page tracks USDA and CONAB production estimates for Brazil, Argentina and Paraguay, with a map of production by state.',
    ],
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  '/canada/canola': {
    title: 'Canada Canola Production and Statistics',
    description: 'Canadian canola production, harvested area and yield by province from Statistics Canada.',
    about: [
      'Canola production, harvested area and yield for Canada and each province, from Statistics Canada field crop estimates.',
    ],
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  '/canada/wheat': {
    title: 'Canada Wheat Production and Statistics',
    description: 'Canadian wheat production, area and yield by province from Statistics Canada.',
    about: [
      'Wheat production, harvested area and yield for Canada and each province, from Statistics Canada field crop estimates.',
    ],
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  '/canada/corn': {
    title: 'Canada Corn Production and Statistics',
    description: 'Canadian corn for grain production, area and yield by province from Statistics Canada.',
    about: [
      'Corn for grain production, harvested area and yield for Canada and each province, from Statistics Canada field crop estimates.',
    ],
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  '/canada/soybeans': {
    title: 'Canada Soybean Production and Statistics',
    description: 'Canadian soybean production, area and yield by province from Statistics Canada.',
    about: [
      'Soybean production, harvested area and yield for Canada and each province, from Statistics Canada field crop estimates.',
    ],
    changeFrequency: 'monthly',
    priority: 0.5,
  },

  /* ── livestock ──────────────────────────────────────────────────────── */
  '/cattle': {
    title: 'Live & Feeder Cattle Futures, Cattle on Feed',
    description: 'Live cattle and feeder cattle futures prices, CFTC positioning, monthly Cattle on Feed and the USDA cattle inventory.',
    about: [
      'Live cattle and feeder cattle futures from CME with CFTC managed-money positioning, the monthly USDA Cattle on Feed report, and the NASS cattle inventory by state.',
    ],
    changeFrequency: 'daily',
    priority: 0.8,
  },
  '/hogs': {
    title: 'Lean Hog Futures and Hogs & Pigs Report',
    description: 'Lean hog futures prices, CFTC positioning, the quarterly USDA Hogs and Pigs report and the hog inventory by state.',
    about: [
      'Lean hog futures from CME with CFTC managed-money positioning, the quarterly USDA Hogs and Pigs report (breeding versus market hogs), and the NASS hog inventory by state.',
    ],
    changeFrequency: 'daily',
    priority: 0.8,
  },

  /* ── USDA reports ───────────────────────────────────────────────────── */
  '/usda-reports': {
    title: 'USDA Crop Production Reports: Acres & Yield',
    description: 'USDA crop production reports by state: planted acres, yield and production for corn, soybeans and wheat.',
    about: [
      'Look up USDA NASS crop production figures by state and year, including planted and harvested acres, yield, and production for corn, soybeans and wheat.',
    ],
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/report-summary': {
    title: 'USDA Crop Report Summary: Yield Changes by State',
    description: 'Summary of the latest USDA crop production report: national yield and production changes, and the biggest state gainers and decliners.',
    about: [
      'A plain-English summary of the latest USDA Crop Production report, with national yield and production changes and the states with the biggest yield gains and declines.',
    ],
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/cropprogress': {
    title: 'USDA Crop Progress and Condition by State',
    description: 'Weekly USDA crop progress and condition ratings for corn, soybeans, wheat and cotton by state, compared with past seasons.',
    about: [
      'USDA publishes crop progress and condition ratings every week during the growing season. Pick a commodity and year to see planting, emergence, harvest progress and good-to-excellent ratings by state, compared with past seasons.',
    ],
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/usda-challenge': {
    title: 'USDA Yield Challenge: Guess the Crop Report',
    description: 'Free game: guess the USDA corn and soybean yield before the Crop Production report and see how you stack up against other farmers.',
    about: [
      'Think you can call the USDA number? Lock in your corn and soybean yield guesses, state by state, before each Crop Production report, then see how close you came against other players.',
    ],
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/usda-results': {
    title: 'USDA Yield Challenge Results and Leaderboard',
    description: 'Results and leaderboard for the USDA Yield Challenge: top guessers by state and group, compared with the USDA actual.',
    about: [
      'How the community\'s yield guesses compared with the USDA actual, with the top individual guessers and results by state and by group.',
    ],
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  '/cornyield': {
    title: 'Corn Planting Map by County (USDA NASS)',
    description: 'County-level map of corn planting from USDA NASS data.',
    about: [
      'A county-level map of corn planting built from USDA NASS data.',
    ],
    changeFrequency: 'monthly',
    priority: 0.5,
  },

  /* ── weather ────────────────────────────────────────────────────────── */
  '/weather': {
    title: 'Farm Weather Forecast, Outlook and Crop Health',
    description: 'National Weather Service forecast for your farm, the Climate Prediction Center outlook trend, and NOAA satellite vegetation health.',
    about: [
      'Farm weather in one place: the National Weather Service forecast for your location, the trend in Climate Prediction Center 6–10 and 8–14 day outlooks, and NOAA satellite vegetation health for the Midwest.',
    ],
    changeFrequency: 'daily',
    priority: 0.8,
  },
  '/forecast-change': {
    title: 'Change in Forecast: Corn Belt Weather Shifts',
    description: 'See how the National Weather Service forecast changed since the last issuance for towns across the Corn Belt.',
    about: [
      'Markets react to changes in the forecast, not just the forecast itself. This page compares the latest National Weather Service forecast with the previous one for towns across the Corn Belt and highlights what got wetter, drier, warmer or cooler.',
    ],
    changeFrequency: 'daily',
    priority: 0.7,
  },
  '/forecast-map': {
    title: 'Midwest Forecast Map with Drought Monitor',
    description: 'Map of the National Weather Service forecast across the Midwest, with the US Drought Monitor and county crop production layers.',
    about: [
      'A map of the National Weather Service forecast for towns across the Midwest, with optional layers for the current US Drought Monitor and county crop production from USDA NASS.',
    ],
    changeFrequency: 'daily',
    priority: 0.7,
  },
  '/outlook': {
    title: '6–10 and 8–14 Day Weather Outlook Trend',
    description: 'Trend in the Climate Prediction Center 6–10 and 8–14 day temperature and precipitation outlooks for the Corn Belt.',
    about: [
      'The Climate Prediction Center issues 6–10 and 8–14 day temperature and precipitation outlooks every day. This page shows how those outlooks have trended over recent issuances.',
    ],
    changeFrequency: 'daily',
    priority: 0.6,
  },
  '/enso': {
    title: 'El Niño / La Niña Tracker (ENSO Forecast)',
    description: 'Current El Niño and La Niña probabilities from the Climate Prediction Center ENSO forecast, and what they mean for crops.',
    about: [
      'El Niño and La Niña shift growing-season weather in the US and South America. This tracker shows the Climate Prediction Center\'s ENSO forecast probabilities and how they have changed.',
    ],
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  '/vegetation': {
    title: 'Crop Vegetation Health Map, Midwest Counties',
    description: 'NOAA satellite vegetation health index for Midwest counties, a weekly read on crop stress and drought.',
    about: [
      'NOAA\'s satellite vegetation health index measures crop stress from space. This map shows the latest weekly reading for Midwest counties.',
    ],
    changeFrequency: 'weekly',
    priority: 0.6,
  },

  /* ── tools & community ──────────────────────────────────────────────── */
  '/calculators': {
    title: 'Calculators: Loan, Seed, Sprayer, Grain Shrink',
    description: 'Free calculators: loan payments with an amortization schedule, seed population, sprayer GPA, and grain shrink.',
    about: [
      'Quick, free calculators. Each one runs in your browser and updates as you type.',
    ],
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  '/calculators/seed-population': {
    title: 'Seed Population Calculator (Seeds per Acre)',
    description: 'Free seed population calculator: seeding rate, seeds per foot of row and seeds per 1/1000 acre from your target stand, germination and row spacing.',
    about: [
      'Work out how many seeds to plant per acre to hit a target final stand, and convert it to seeds per foot of row for checking the planter.',
    ],
    changeFrequency: 'yearly',
    priority: 0.7,
  },
  '/calculators/sprayer-gpa': {
    title: 'Sprayer GPA Calculator (Gallons per Acre)',
    description: 'Free sprayer calculator: gallons per acre from nozzle flow (GPM), ground speed and nozzle spacing, plus total boom flow.',
    about: [
      'Calculate your sprayer application rate in gallons per acre from nozzle flow, ground speed and nozzle spacing, plus the total flow across the boom.',
    ],
    changeFrequency: 'yearly',
    priority: 0.7,
  },
  '/calculators/grain-shrink': {
    title: 'Grain Shrink Calculator (Moisture & Handling)',
    description: 'Free grain shrink calculator: dry bushels from wet bushels after moisture shrink and elevator handling shrink.',
    about: [
      'Find out how many dry bushels you will have after drying wet grain down to a target moisture, including the handling shrink many elevators charge.',
    ],
    changeFrequency: 'yearly',
    priority: 0.7,
  },
  '/calculators/loan': {
    title: 'Loan Calculator with Amortization Schedule',
    description: 'Free loan calculator: monthly payment, total interest and a full month-by-month amortization schedule for a mortgage, car, personal or business loan.',
    about: [
      'Estimate the monthly payment and total interest on any fixed-rate loan, whether it\'s a mortgage, car loan, personal loan or business loan, and view the full month-by-month amortization schedule.',
    ],
    changeFrequency: 'yearly',
    priority: 0.7,
  },
  '/buysell': {
    title: 'Farm Classifieds: Tractors, Combines, Hay, Livestock',
    description: 'Free farm classifieds: buy and sell tractors, combines, equipment, hay, livestock and services with other farmers.',
    about: [
      'Post and browse free farm listings for tractors, combines, equipment, hay, livestock and farm services. Contact sellers directly.',
    ],
    changeFrequency: 'daily',
    priority: 0.6,
  },
  '/contact': {
    title: 'Contact Us',
    description: 'Questions, feedback or data requests for Just4Ag.',
    about: [],
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How Just4Ag collects, uses and protects your information.',
    about: [],
    changeFrequency: 'yearly',
    priority: 0.1,
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Terms of service for using Just4Ag.',
    about: [],
    changeFrequency: 'yearly',
    priority: 0.1,
  },
};

/**
 * Open Graph fields every page shares. Next.js replaces (doesn't merge) a
 * parent's openGraph object when a page sets its own, so pages spread this in.
 */
export const OPEN_GRAPH_BASE = {
  type: 'website',
  siteName: SITE_NAME,
  locale: 'en_US',
  images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: SITE_NAME }],
} satisfies Metadata['openGraph'];

/** Metadata for a public page: title, description, canonical URL and social previews. */
export function pageMetadata(path: string): Metadata {
  const page = PAGES[path];
  if (!page) throw new Error(`No SEO entry for ${path} in src/lib/seo.ts`);
  const title = path === '/' ? { absolute: `${SITE_NAME} — ${page.title}` } : page.title;
  const socialTitle = path === '/' ? `${SITE_NAME} — ${page.title}` : `${page.title} | ${SITE_NAME}`;
  return {
    title,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH_BASE, title: socialTitle, description: page.description, url: path },
    twitter: { card: 'summary', title: socialTitle, description: page.description },
  };
}

/** For admin, account and subscriber-only pages: keep them out of search results. */
export const NOINDEX: Metadata = { robots: { index: false, follow: false } };
