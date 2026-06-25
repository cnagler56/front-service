'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, AnimalData } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';
import card from './reportCards.module.css';

/** A category bucket — each row's short_desc is tested against `matches`. */
export interface CategoryDef {
  value: string;          // unique key e.g. "BREEDING"
  label: string;          // display "Breeding Hogs"
  matches: (s: string) => boolean;
}

/** Month option in the dropdown — value is what's sent to NASS, label what's displayed.
 *  Mark one option `default: true` to pre-select it (else the last option wins). */
export interface MonthOption {
  value: string;
  label: string;
  default?: boolean;
}

interface Props {
  commodity: 'CATTLE' | 'HOGS';
  commodityLabel: string;     // "Cattle" / "Hogs"
  icon: string;                // "🐄" / "🐖"
  categories: CategoryDef[];   // commodity-specific category buckets
  months: MonthOption[];       // months NASS publishes for this report
}

/** Classify a NASS short_desc into one of our categories. Falls back to "OTHER".
 *  The "ALL" entry is a UI filter pseudo-category (matches everything) — skip it
 *  here, or every row would bucket into "ALL" and the real groups stay empty. */
function classify(shortDesc: string, categories: CategoryDef[]): string {
  const s = (shortDesc || '').toUpperCase();
  for (const c of categories) {
    if (c.value === 'ALL') continue;
    if (c.matches(s)) return c.value;
  }
  return 'OTHER';
}

/** A report's title is its NASS short_desc minus the redundant "- INVENTORY". */
function reportTitle(shortDesc: string): string {
  return (shortDesc || '').replace(' - INVENTORY', '').trim();
}

/** NASS sends ALL-CAPS state names; render them title-cased ("NORTH DAKOTA" → "North Dakota"). */
function titleCaseState(s: string): string {
  return (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/** Numeric value for sorting; withheld/NA ("(D)", "(NA)", …) sort last. */
function parseInv(v?: string): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[,\s]/g, ''), 10);
  return isNaN(n) ? null : n;
}
function byInventoryDesc(a: AnimalData, b: AnimalData): number {
  const av = parseInv(a.Value), bv = parseInv(b.Value);
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return bv - av;
}

/**
 * Reusable cattle/hogs inventory pivot. Pulls NASS inventory rows, classifies
 * each by short_desc, and renders one labeled table per non-empty category.
 *
 * The classification rules are passed in as `categories` so this same panel
 * powers both the Cattle Inventory and Hogs & Pigs reports without changes.
 */
export default function LivestockInventoryPanel({
  commodity, commodityLabel, icon, categories, months,
}: Props) {
  // Pre-select the report's most reliable recent period (the option flagged
  // `default`), falling back to the last option.
  const [month, setMonth]   = useState(
    (months.find(m => m.default) ?? months[months.length - 1])?.value ?? '1'
  );
  const [year, setYear]     = useState(new Date().getFullYear() - 1);
  const [category, setCategory] = useState<string>('ALL');
  const [data, setData]     = useState<AnimalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);
  const { user } = useUser();

  // Last 6 years, newest first
  const years = useMemo(
    () => Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  // Reset fetched state on commodity change (when used across tabs)
  useEffect(() => {
    setData([]);
    setFetched(false);
    setError('');
  }, [commodity]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const result = commodity === 'CATTLE'
        ? await api.getCattle(month, String(year))
        : await api.getHogs(month, String(year));
      setData(result);
      setFetched(true);
    } catch {
      setError(`Failed to load ${commodityLabel.toLowerCase()} data. Is the server running?`);
    } finally {
      setLoading(false);
    }
  }

  // One report per distinct description (short_desc), honoring the category
  // filter. Ordered by the category order, then by description.
  const reports = useMemo(() => {
    const catOrder = new Map(categories.map((c, i) => [c.value, i]));
    const byDesc = new Map<string, AnimalData[]>();
    for (const r of data) {
      const cls = classify(r.short_desc, categories);
      if (cls === 'OTHER') continue;
      if (category !== 'ALL' && cls !== category) continue;
      if (!byDesc.has(r.short_desc)) byDesc.set(r.short_desc, []);
      byDesc.get(r.short_desc)!.push(r);
    }
    return Array.from(byDesc, ([description, rows]) => ({
      description,
      category: classify(description, categories),
      rows: [...rows].sort(byInventoryDesc),
    })).sort((a, b) =>
      ((catOrder.get(a.category) ?? 99) - (catOrder.get(b.category) ?? 99)) ||
      a.description.localeCompare(b.description)
    );
  }, [data, category, categories]);

  const userStateName = (user?.state ?? '').trim().toUpperCase();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{commodityLabel} Inventory Report</h2>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.filters}>
          <div className={styles.formRow}>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Month</label>
            <select value={month} onChange={e => setMonth(e.target.value)}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className={styles.btn} onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch Report'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!fetched && !loading && (
          <p className={styles.empty}>
            Pick a month and year, then click Fetch Report.
          </p>
        )}
        {fetched && data.length === 0 && !loading && (
          <p className={styles.empty}>
            No {commodityLabel.toLowerCase()} data found for that period. The report may not have
            been issued for this month — try a different one.
          </p>
        )}
        {fetched && data.length > 0 && reports.length === 0 && (
          <p className={styles.empty}>
            No rows for the selected category in this period. Try <em>All Categories</em>.
          </p>
        )}

        <div className={card.grid}>
          {reports.map(report => (
            <div key={report.description} className={card.card}>
              <div className={card.cardHead}>
                <h3 className={card.cardTitle}>{reportTitle(report.description)}</h3>
                <span className={card.count}>
                  {report.rows.length} state{report.rows.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className={card.scroll}>
                <table className={card.table}>
                  <thead>
                    <tr>
                      <th>State</th>
                      <th className={card.num}>Inventory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, i) => {
                      const isUserState = userStateName &&
                        (row.location_desc ?? '').toUpperCase() === userStateName;
                      return (
                        <tr key={i} className={isUserState ? card.userRow : undefined}>
                          <td>{titleCaseState(row.location_desc)}{isUserState ? ' ⭐' : ''}</td>
                          <td className={card.num}>{row.Value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
