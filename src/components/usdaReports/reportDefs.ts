import { CategoryDef, MonthOption } from './LivestockInventoryPanel';
import {
  CATTLE_CATEGORIES, CATTLE_MONTHS,
  HOGS_CATEGORIES,   HOGS_MONTHS,
} from './livestockConfigs';

/**
 * Each kind of USDA report we expose under the unified tab selector.
 *
 * The interactive YIELD estimators (corn / soy / wheat) moved to the
 * standalone /usda-challenge page, so they're no longer listed here.
 */
export type ReportKind = 'PLANTING' | 'LIVESTOCK' | 'YIELD_LOOKUP';

export type ReportKey =
  | 'PLANTED_ACRES'
  | 'CATTLE_INV'    | 'HOGS_INV'
  | 'NASS_YIELD';

export interface ReportDef {
  value: ReportKey;
  label: string;
  description: string;
  kind: ReportKind;
  commodity: string;
  commodityLabel: string;
  unit?: string;
  // Livestock-only
  livestockIcon?: string;
  livestockMonths?: MonthOption[];
  livestockCategories?: CategoryDef[];
}

/** Source of truth for the /usda-reports tab list. */
export const REPORTS: ReportDef[] = [
  { value: 'PLANTED_ACRES',  label: 'Planted Acres',
    description: 'NASS Prospective Plantings (Mar 31) + Acreage (Jun 30) — planted acres by state for corn, soybeans, and wheat.',
    kind: 'PLANTING', commodity: 'ALL', commodityLabel: 'Planted Acres' },
  { value: 'CATTLE_INV',     label: 'Cattle — Inventory',
    description: 'NASS Cattle Inventory report (Jan 1 annual, Jul 1 mid-year) and Cattle on Feed.',
    kind: 'LIVESTOCK', commodity: 'CATTLE', commodityLabel: 'Cattle',
    livestockIcon: '🐄', livestockMonths: CATTLE_MONTHS, livestockCategories: CATTLE_CATEGORIES },
  { value: 'HOGS_INV',       label: 'Hogs — Inventory',
    description: 'NASS Quarterly Hogs & Pigs report (Mar / Jun / Sep / Dec).',
    kind: 'LIVESTOCK', commodity: 'HOGS', commodityLabel: 'Hogs',
    livestockIcon: '🐖', livestockMonths: HOGS_MONTHS, livestockCategories: HOGS_CATEGORIES },
  { value: 'NASS_YIELD',     label: 'NASS Yield Lookup',
    description: 'State-level annual yield and area harvested by commodity and year, straight from USDA NASS.',
    kind: 'YIELD_LOOKUP', commodity: 'CORN', commodityLabel: 'Corn' },
];
