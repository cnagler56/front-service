'use client';

import { useMemo, useState } from 'react';
import { api, PlantingSearchResult } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';
import card from './reportCards.module.css';

const CROPS = [
  { code: 'CORN',     label: 'Corn',     icon: '🌽' },
  { code: 'SOYBEANS', label: 'Soybeans', icon: '🫘' },
  { code: 'WHEAT',    label: 'Wheat',    icon: '🌾' },
];

const YEARS = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i);

/** NASS sends ALL-CAPS state names; render them title-cased. */
function titleCaseState(s: string): string {
  return (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Planted-acres reports for all three crops in one view. Pick a year once; corn,
 * soybeans, and wheat render side-by-side as cards (state-level planted acres
 * with the year-over-year change).
 */
export default function PlantingAcresPanel() {
  const [year, setYear]       = useState(YEARS[0]);
  const [data, setData]       = useState<Record<string, PlantingSearchResult | null>>({});
  const [loadedYear, setLoadedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchData() {
    const y = year;                  // pin the year for this fetch
    setLoading(true);
    setError('');
    try {
      const entries = await Promise.all(
        CROPS.map(c =>
          api.getPlantingSearch(c.code, y)
            .then(d => [c.code, d] as const)
            .catch(() => [c.code, null] as const)
        )
      );
      setData(Object.fromEntries(entries));
      setLoadedYear(y);
      setFetched(true);
    } catch {
      setError('Could not load planting data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Planted Acres by State</h2>
      </div>
      <div className={styles.sectionBody}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', marginBottom: '1rem' }}>
          NASS planted acres (Prospective Plantings + Acreage). Pick a year to see state-level planted
          acres for corn, soybeans, and wheat, each with the year-over-year change.
        </p>

        <div className={styles.filters}>
          <div className={styles.formRow}>
            <label>Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className={styles.btn} onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch Report'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {!fetched && !loading && (
          <p className={styles.empty}>Pick a year and click Fetch Report.</p>
        )}
        {loading && <p className={styles.loading}>Loading planting data…</p>}

        {!loading && fetched && (
          <div className={`${card.grid} ${card.gridCenter}`}>
            {CROPS.map(c => (
              <CropCard key={c.code} icon={c.icon} label={c.label} year={loadedYear ?? year} result={data[c.code] ?? null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CropCard({
  icon, label, year, result,
}: {
  icon: string; label: string; year: number; result: PlantingSearchResult | null;
}) {
  const { user } = useUser();
  const userStateName = (user?.state ?? '').trim().toUpperCase();

  const rows = useMemo(() => {
    if (!result) return [];
    const prior = new Map(result.priorYearPlantings.map(p => [p.state, p.acres]));
    return result.plantings
      .map(p => {
        const priorAcres = prior.get(p.state) ?? null;
        const yoy = priorAcres ? ((p.acres - priorAcres) / priorAcres) * 100 : null;
        return { state: p.state, acres: p.acres, yoy };
      })
      .sort((a, b) => b.acres - a.acres);
  }, [result]);

  const total = useMemo(
    () => (rows.length === 0 ? null : rows.reduce((s, r) => s + r.acres, 0) / 1_000_000),
    [rows]
  );

  return (
    <div className={card.card}>
      <div className={card.cardHead}>
        <h3 className={card.cardTitle}>{label}</h3>
        <span className={card.count}>
          {total != null ? `${total.toFixed(2)} M acres` : '—'}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className={card.cardNote}>No {label.toLowerCase()} planted-acres data for {year}.</p>
      ) : (
        <div className={card.scroll}>
          <table className={card.table}>
            <thead>
              <tr>
                <th>State</th>
                <th className={card.num}>Acres</th>
                <th className={card.yoy}>YoY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isUserState = userStateName && r.state.toUpperCase() === userStateName;
                return (
                  <tr key={i} className={isUserState ? card.userRow : undefined}>
                    <td>{titleCaseState(r.state)}{isUserState ? ' ⭐' : ''}</td>
                    <td className={card.num}>{r.acres.toLocaleString()}</td>
                    <td className={`${card.yoy} ${r.yoy != null ? (r.yoy >= 0 ? card.up : card.down) : ''}`}>
                      {r.yoy != null ? `${r.yoy > 0 ? '+' : ''}${r.yoy.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
