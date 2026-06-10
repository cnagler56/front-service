'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, AnimalData } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/** A category bucket — each row's short_desc is tested against `matches`. */
export interface CategoryDef {
  value: string;          // unique key e.g. "BREEDING"
  label: string;          // display "Breeding Hogs"
  matches: (s: string) => boolean;
}

/** Month option in the dropdown — value is what's sent to NASS, label what's displayed. */
export interface MonthOption {
  value: string;
  label: string;
}

interface Props {
  commodity: 'CATTLE' | 'HOGS';
  commodityLabel: string;     // "Cattle" / "Hogs"
  icon: string;                // "🐄" / "🐖"
  categories: CategoryDef[];   // commodity-specific category buckets
  months: MonthOption[];       // months NASS publishes for this report
}

/** Classify a NASS short_desc into one of our categories. Falls back to "OTHER". */
function classify(shortDesc: string, categories: CategoryDef[]): string {
  const s = (shortDesc || '').toUpperCase();
  for (const c of categories) {
    if (c.matches(s)) return c.value;
  }
  return 'OTHER';
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
  // Use the latest month a report is published for as the default
  const [month, setMonth]   = useState(months[months.length - 1]?.value ?? '1');
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

  // Group rows by category in the order defined in `categories`
  const grouped = useMemo(() => {
    return categories
      .filter(c => c.value !== 'ALL')
      .map(cat => ({
        cat,
        rows: data.filter(r => classify(r.short_desc, categories) === cat.value),
      }))
      .filter(g => g.rows.length > 0);
  }, [data, categories]);

  const visibleGroups = category === 'ALL'
    ? grouped
    : grouped.filter(g => g.cat.value === category);

  const userStateName = (user?.state ?? '').trim().toUpperCase();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span>{icon}</span>
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
        {fetched && data.length > 0 && visibleGroups.length === 0 && (
          <p className={styles.empty}>
            No rows for the selected category in this period. Try <em>All Categories</em>.
          </p>
        )}

        {visibleGroups.map(group => (
          <div key={group.cat.value} style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              color: '#2c4a1e',
              fontSize: '1.1rem',
              margin: '0 0 .35rem',
              borderBottom: '2px solid #c9dfa3',
              paddingBottom: '.35rem',
            }}>
              {group.cat.label}
              <span style={{ color: '#888', fontSize: '.75rem', fontWeight: 400, marginLeft: '.5rem' }}>
                ({group.rows.length} row{group.rows.length === 1 ? '' : 's'})
              </span>
            </h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>State</th>
                  <th>Inventory</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row, i) => {
                  const isUserState = userStateName &&
                    (row.location_desc ?? '').toUpperCase() === userStateName;
                  return (
                    <tr key={i} style={isUserState ? { background: 'rgba(143, 188, 69, 0.12)' } : {}}>
                      <td>{row.short_desc}</td>
                      <td style={{ fontWeight: isUserState ? 700 : 400 }}>
                        {row.location_desc}{isUserState ? ' ⭐' : ''}
                      </td>
                      <td>{row.Value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
