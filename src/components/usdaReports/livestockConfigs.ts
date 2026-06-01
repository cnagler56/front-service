import { CategoryDef, MonthOption } from './LivestockInventoryPanel';

/* ── Cattle ────────────────────────────────────────────────────── */

/**
 * NASS publishes:
 *   - Jan 1 — Cattle Inventory (full annual)
 *   - Jul 1 — Cattle Inventory (mid-year)
 *   - Plus monthly Cattle on Feed (CME 1000+ head feedlots)
 * We keep both annual snapshots since they're the major ones; on-feed users
 * can hit it from the /usda page with a finer filter.
 */
export const CATTLE_MONTHS: MonthOption[] = [
  { value: '1', label: 'January 1 (Annual Inventory)' },
  { value: '7', label: 'July 1 (Mid-Year Inventory)'  },
];

export const CATTLE_CATEGORIES: CategoryDef[] = [
  { value: 'ALL',     label: 'All Categories',    matches: () => true },
  { value: 'TOTAL',   label: 'All Cattle',
    matches: s => /^CATTLE\b/.test(s) &&
      (s.includes('INCL CALVES') || /^CATTLE\s*-/.test(s)) },
  { value: 'BEEF',    label: 'Beef Cows',
    matches: s => s.includes('BEEF') },
  { value: 'DAIRY',   label: 'Dairy / Milk Cows',
    matches: s => s.includes('MILK') },
  { value: 'ON_FEED', label: 'Cattle on Feed',
    matches: s => s.includes('ON FEED') },
  { value: 'CALVES',  label: 'Calves',
    matches: s => s.includes('CALVES') && !s.includes('INCL CALVES') },
];

/* ── Hogs ──────────────────────────────────────────────────────── */

/**
 * NASS Hogs & Pigs report is quarterly:
 *   - Mar 1, Jun 1, Sep 1, Dec 1
 */
export const HOGS_MONTHS: MonthOption[] = [
  { value: '3',  label: 'March 1 (Q1)'      },
  { value: '6',  label: 'June 1 (Q2)'       },
  { value: '9',  label: 'September 1 (Q3)'  },
  { value: '12', label: 'December 1 (Q4)'   },
];

export const HOGS_CATEGORIES: CategoryDef[] = [
  { value: 'ALL',      label: 'All Categories', matches: () => true },
  { value: 'TOTAL',    label: 'All Classes (Total Hogs)',
    matches: s => /^HOGS\b[^,]*-\s*INVENTORY/.test(s) && !s.includes('BREEDING') && !s.includes('MARKET') },
  { value: 'BREEDING', label: 'Breeding Hogs',
    matches: s => s.includes('BREEDING') },
  { value: 'MARKET',   label: 'Market Hogs',
    matches: s => s.includes('MARKET') },
  { value: 'PIG_CROP', label: 'Pig Crop',
    matches: s => s.includes('PIG CROP') },
];
