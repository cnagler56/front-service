/**
 * Crop planting/harvest calendars. Month indices are 0=Jan … 11=Dec; windows
 * that wrap the year-end (e.g. Oct–Jan) simply list both ends. `commodities`
 * holds the WASDE keys a row relates to, so a crop page can emphasize its own
 * rows. Kept region-agnostic so US / Canada calendars can be added later.
 *
 * Source: USDA FAS/IPAD crop calendars, CONAB (Brazil), Bolsa de Cereales (Argentina).
 * These are typical national windows; exact dates shift by region and season.
 */
export interface CropCalendarRow {
  region: string;          // grouping label, e.g. "Brazil"
  crop: string;            // display name, e.g. "Corn — safrinha"
  commodities: string[];   // WASDE keys, e.g. ["CORN"]
  plant: number[];         // month indices being planted
  harvest: number[];       // month indices being harvested
}

export const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SOUTH_AMERICA_CALENDAR: CropCalendarRow[] = [
  { region: 'Brazil', crop: 'Soybeans', commodities: ['SOYBEANS'], plant: [8, 9, 10, 11], harvest: [0, 1, 2, 3, 4] },
  { region: 'Brazil', crop: 'Corn — 1st crop', commodities: ['CORN'], plant: [7, 8, 9, 10], harvest: [1, 2, 3, 4, 5] },
  { region: 'Brazil', crop: 'Corn — safrinha', commodities: ['CORN'], plant: [0, 1, 2], harvest: [5, 6, 7] },
  { region: 'Brazil', crop: 'Wheat', commodities: ['WHEAT'], plant: [3, 4, 5], harvest: [8, 9, 10, 11] },
  { region: 'Argentina', crop: 'Soybeans', commodities: ['SOYBEANS'], plant: [9, 10, 11, 0], harvest: [2, 3, 4, 5] },
  { region: 'Argentina', crop: 'Corn', commodities: ['CORN'], plant: [8, 9, 10, 11, 0], harvest: [2, 3, 4, 5, 6] },
  { region: 'Argentina', crop: 'Wheat', commodities: ['WHEAT'], plant: [4, 5, 6, 7], harvest: [10, 11, 0] },
];
