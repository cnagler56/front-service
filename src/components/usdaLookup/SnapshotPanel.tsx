'use client';

import { useMemo, useState } from 'react';
import { api, NASSYieldData } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import card from '@/src/components/usdaReports/reportCards.module.css';
import { classify, unit } from './nassClassify';

/** NASS sends ALL-CAPS state names; render them title-cased. */
function titleCaseState(s: string): string {
  return (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/** Numeric value for sorting; non-numeric ("N/A", "(D)", …) sort last. */
function parseNum(v?: string): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[,\s]/g, ''));
  return isNaN(n) ? null : n;
}

const GRAINS = [
  { value: 'CORN',     label: 'Corn'     },
  { value: 'SOYBEANS', label: 'Soybeans' },
  { value: 'WHEAT',    label: 'Wheat'    },
  { value: 'COTTON',   label: 'Cotton'   },
  { value: 'SORGHUM',  label: 'Sorghum'  },
];

const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

interface Props {
  grain: string;
  onGrainChange: (g: string) => void;
}

/**
 * Snapshot panel — pick a commodity + year, fetch state-level yields,
 * and render one labeled table per NASS class (grain / silage / etc).
 */
export default function SnapshotPanel({ grain, onGrainChange }: Props) {
  const [year, setYear]         = useState(YEARS[1]);
  const [data, setData]         = useState<NASSYieldData[]>([]);
  // The commodity the displayed `data` belongs to — drives the table titles so
  // they don't change when the dropdown changes before a new Fetch.
  const [loadedGrain, setLoadedGrain] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fetched, setFetched]   = useState(false);

  async function fetchData() {
    const g = grain;                 // pin the commodity for this fetch
    setLoading(true);
    setError('');
    try {
      const result = await api.getNassYield(g, '', year);
      setData(result);
      setLoadedGrain(g);
      setCategory('ALL');
      setFetched(true);
    } catch {
      setError('Failed to load NASS data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  // Group rows by class
  const grouped = useMemo(() => {
    const buckets = new Map<string, NASSYieldData[]>();
    for (const row of data) {
      const cls = classify(row.short_desc);
      if (!buckets.has(cls)) buckets.set(cls, []);
      buckets.get(cls)!.push(row);
    }
    return Array.from(buckets, ([cls, rows]) => ({ cls, rows }));
  }, [data]);

  const visibleGroups = category === 'ALL' ? grouped : grouped.filter(g => g.cls === category);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        
        <h2>USDA NASS Yield Reports</h2>
      </div>
      <div className={styles.sectionBody}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1.25rem' }}>
          State-level annual yield and area harvested from USDA NASS. NASS may publish several
          <em> classes </em> per crop (e.g. corn for grain vs corn for silage) — each appears as its own report below.
        </p>

        <div className={styles.filters}>
          <div className={styles.formRow}>
            <label>Commodity</label>
            <select value={grain} onChange={e => onGrainChange(e.target.value)}>
              {GRAINS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Year</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {grouped.length > 1 && (
            <div className={styles.formRow}>
              <label>Class</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="ALL">All Classes ({grouped.length})</option>
                {grouped.map(g => (
                  <option key={g.cls} value={g.cls}>{g.cls} ({g.rows.length})</option>
                ))}
              </select>
            </div>
          )}
          <button className={styles.btn} onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch Report'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {!fetched && !loading && (
          <p className={styles.empty}>Select a commodity and year, then click Fetch Report.</p>
        )}
        {fetched && data.length === 0 && !loading && (
          <p className={styles.empty}>
            No data found for {grain} in {year}. Try a different year — final yields are usually published in early winter.
          </p>
        )}

        {visibleGroups.length > 0 && (
          <div className={`${card.grid} ${card.gridCenter}`}>
            {visibleGroups.map(group => <ClassCard key={group.cls} grain={loadedGrain} cls={group.cls} rows={group.rows} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/** One card per NASS class, sorted by acres harvested (largest first). */
function ClassCard({ grain, cls, rows }: { grain: string; cls: string; rows: NASSYieldData[] }) {
  const yieldUnit = unit(rows[0]?.short_desc) || 'units / acre';
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = parseNum(a.acresValue), bv = parseNum(b.acresValue);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [rows]);

  return (
    <div className={card.card}>
      <div className={card.cardHead}>
        <h3 className={card.cardTitle}>{grain} — {cls}</h3>
        <span className={card.count}>
          {rows.length} state{rows.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className={card.scroll}>
        <table className={card.table}>
          <thead>
            <tr>
              <th>State</th>
              <th className={card.num}>Yield ({yieldUnit})</th>
              <th className={card.num}>Acres Harv.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i}>
                <td>{titleCaseState(row.state_name)}</td>
                <td className={card.num}>{row.Value}</td>
                <td className={card.num}>{row.acresValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
