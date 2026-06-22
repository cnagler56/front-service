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
export type ReportKind = 'PLANTING' | 'LIVESTOCK';

export type ReportKey =
  | 'CORN_PLANTING' | 'SOY_PLANTING' | 'WHEAT_PLANTING'
  | 'CATTLE_INV'    | 'HOGS_INV';

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
  { value: 'CORN_PLANTING',  label: '🌽 Corn — Planted Acres',
    description: 'NASS Prospective Plantings (Mar 31) refined by the Acreage report (Jun 30).',
    kind: 'PLANTING', commodity: 'CORN',     commodityLabel: 'Corn' },
  { value: 'SOY_PLANTING',   label: '🫘 Soybeans — Planted Acres',
    description: 'NASS Prospective Plantings + Acreage for soybeans.',
    kind: 'PLANTING', commodity: 'SOYBEANS', commodityLabel: 'Soybeans' },
  { value: 'WHEAT_PLANTING', label: '🌾 Wheat — Planted Acres',
    description: 'NASS Prospective Plantings + Acreage for all wheat.',
    kind: 'PLANTING', commodity: 'WHEAT',    commodityLabel: 'Wheat' },
  { value: 'CATTLE_INV',     label: '🐄 Cattle — Inventory',
    description: 'NASS Cattle Inventory report (Jan 1 annual, Jul 1 mid-year) and Cattle on Feed.',
    kind: 'LIVESTOCK', commodity: 'CATTLE', commodityLabel: 'Cattle',
    livestockIcon: '🐄', livestockMonths: CATTLE_MONTHS, livestockCategories: CATTLE_CATEGORIES },
  { value: 'HOGS_INV',       label: '🐖 Hogs — Inventory',
    description: 'NASS Quarterly Hogs & Pigs report (Mar / Jun / Sep / Dec).',
    kind: 'LIVESTOCK', commodity: 'HOGS', commodityLabel: 'Hogs',
    livestockIcon: '🐖', livestockMonths: HOGS_MONTHS, livestockCategories: HOGS_CATEGORIES },
];
