'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, NASSYieldData, User } from '@/src/lib/api';
import YieldHistoryChart, { Series, colorFor } from '@/src/components/YieldHistoryChart';
import styles from '@/src/styles/farm.module.css';

const GRAINS = [
  { value: 'CORN',     label: 'Corn'     },
  { value: 'SOYBEANS', label: 'Soybeans' },
  { value: 'WHEAT',    label: 'Wheat'    },
  { value: 'COTTON',   label: 'Cotton'   },
  { value: 'SORGHUM',  label: 'Sorghum'  },
];

const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

/** Pull the "class" part out of a NASS short_desc. */
function classify(shortDesc: string | undefined): string {
  if (!shortDesc) return 'Unspecified';
  const dash = shortDesc.indexOf(' - ');
  const before = dash === -1 ? shortDesc : shortDesc.substring(0, dash);
  const comma = before.indexOf(', ');
  if (comma === -1) return 'ALL CLASSES';
  return before.substring(comma + 2).trim();
}

function unit(shortDesc: string | undefined): string {
  if (!shortDesc) return '';
  const m = shortDesc.match(/MEASURED IN ([^,]+)/);
  return m ? m[1].trim() : '';
}

/** Parse "175.4" or "1,234" into a number, returning null if not numeric. */
function toNum(v: string | undefined | null): number | null {
  if (v == null) return null;
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export default function UsdaPage() {
  // Snapshot view state
  const [grain, setGrain] = useState('CORN');
  const [year, setYear]   = useState(YEARS[1]);
  const [data, setData]   = useState<NASSYieldData[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);

  // History view state
  const [historyOpen, setHistoryOpen]     = useState(false);
  const [historyYears, setHistoryYears]   = useState(5);
  const [historyData, setHistoryData]     = useState<NASSYieldData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState('');
  const [historyClass, setHistoryClass]     = useState<string>('');     // chosen class within history
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);

  // Pull stored user so we can default the chart to their state
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getNassYield(grain, '', year);
      setData(result);
      setCategory('ALL');
      setFetched(true);
    } catch {
      setError('Failed to load NASS data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const rows = await api.getYieldHistory(grain, historyYears);
      setHistoryData(rows);
      // Pick the most common class as default (usually GRAIN)
      const counts = new Map<string, number>();
      for (const r of rows) {
        const c = classify(r.short_desc);
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      const defaultClass = sorted[0]?.[0] ?? '';
      setHistoryClass(defaultClass);
      // Default selected states: user's state (if normalized name matches), else top 3 yielders by latest year
      const inClass = rows.filter(r => classify(r.short_desc) === defaultClass);
      const userState = (user?.state ?? '').trim().toUpperCase();
      const haveUserState = userState && inClass.some(r => r.state_name?.toUpperCase() === userState);
      let initial: string[] = [];
      if (haveUserState) initial.push(userState);
      // Add top yielders from the latest year that aren't already in
      const latest = Math.max(...inClass.map(r => r.year ?? 0));
      const top = inClass
        .filter(r => r.year === latest)
        .map(r => ({ s: r.state_name?.toUpperCase() ?? '', v: toNum(r.Value) ?? 0 }))
        .sort((a, b) => b.v - a.v)
        .map(r => r.s);
      for (const s of top) {
        if (initial.length >= 3) break;
        if (!initial.includes(s)) initial.push(s);
      }
      setSelectedStates(new Set(initial));
    } catch {
      setHistoryError('Failed to load history. Is the server running?');
    } finally {
      setHistoryLoading(false);
    }
  }

  // Group snapshot rows by class for the existing tables
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

  // Build chart series from history data
  const { series, availableStates, classOptions, chartUnit } = useMemo(() => {
    const filtered = historyData.filter(r => classify(r.short_desc) === historyClass);

    // All states available for this class
    const allStates = Array.from(new Set(filtered.map(r => r.state_name?.toUpperCase() ?? '').filter(Boolean))).sort();

    // All classes present in this history result
    const classes = Array.from(new Set(historyData.map(r => classify(r.short_desc))));

    // Build a series per selected state
    const byState = new Map<string, { year: number; value: number }[]>();
    for (const r of filtered) {
      const st = r.state_name?.toUpperCase() ?? '';
      if (!selectedStates.has(st)) continue;
      const v = toNum(r.Value);
      const yr = r.year;
      if (v == null || yr == null) continue;
      if (!byState.has(st)) byState.set(st, []);
      byState.get(st)!.push({ year: yr, value: v });
    }

    // Compute a national average per year across ALL states in this class (not just selected)
    const yearTotals = new Map<number, { sum: number; n: number }>();
    for (const r of filtered) {
      const yr = r.year;
      const v = toNum(r.Value);
      if (v == null || yr == null) continue;
      const t = yearTotals.get(yr) ?? { sum: 0, n: 0 };
      t.sum += v; t.n += 1;
      yearTotals.set(yr, t);
    }
    const natlPoints = Array.from(yearTotals.entries())
      .map(([year, { sum, n }]) => ({ year, value: Math.round((sum / n) * 10) / 10 }))
      .sort((a, b) => a.year - b.year);

    const seriesOut: Series[] = [];
    const orderedStates = Array.from(selectedStates).sort();
    orderedStates.forEach((st, i) => {
      if (byState.has(st)) {
        seriesOut.push({ state: st, color: colorFor(i), points: byState.get(st)! });
      }
    });
    if (selectedStates.has('__NATIONAL__') && natlPoints.length) {
      seriesOut.push({ state: 'US AVG', color: '#000000', points: natlPoints });
    }

    return {
      series: seriesOut,
      availableStates: allStates,
      classOptions: classes,
      chartUnit: unit(filtered[0]?.short_desc) || 'units / acre',
    };
  }, [historyData, historyClass, selectedStates]);

  function toggleState(s: string) {
    setSelectedStates(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🏛️</span>
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
              <select value={grain} onChange={e => setGrain(e.target.value)}>
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

          {visibleGroups.map(group => {
            const yieldUnit = unit(group.rows[0]?.short_desc) || 'units / acre';
            return (
              <div key={group.cls} style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  color: '#2c4a1e',
                  fontSize: '1.1rem',
                  margin: '0 0 .35rem',
                  borderBottom: '2px solid #c9dfa3',
                  paddingBottom: '.35rem',
                }}>
                  {grain} — {group.cls}
                  <span style={{ color: '#888', fontSize: '.75rem', fontWeight: 400, marginLeft: '.5rem' }}>
                    ({group.rows.length} state{group.rows.length === 1 ? '' : 's'})
                  </span>
                </h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Yield ({yieldUnit})</th>
                      <th>Acres Harvested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.state_name}</td>
                        <td>{row.Value}</td>
                        <td>{row.acresValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Yield History panel ─────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📊</span>
          <h2>{grain} Yield History</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.filters}>
            <div className={styles.formRow}>
              <label>Years Back</label>
              <select value={historyYears} onChange={e => setHistoryYears(Number(e.target.value))}>
                <option value={5}>Last 5 years</option>
                <option value={10}>Last 10 years</option>
                <option value={20}>Last 20 years</option>
              </select>
            </div>
            {classOptions.length > 1 && (
              <div className={styles.formRow}>
                <label>Class</label>
                <select value={historyClass} onChange={e => setHistoryClass(e.target.value)}>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <button className={styles.btn} onClick={() => { setHistoryOpen(true); fetchHistory(); }} disabled={historyLoading}>
              {historyLoading ? 'Loading…' : historyOpen ? 'Refresh' : 'Load Chart'}
            </button>
          </div>

          {historyError && <p className={styles.error}>{historyError}</p>}

          {!historyOpen && !historyLoading && (
            <p className={styles.empty}>Click <strong>Load Chart</strong> to see a multi-year line chart of state yields.</p>
          )}

          {historyOpen && !historyLoading && historyData.length === 0 && !historyError && (
            <p className={styles.empty}>No history data returned for {grain}.</p>
          )}

          {historyOpen && historyData.length > 0 && (
            <>
              {/* State chip selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', margin: '0 0 1rem' }}>
                <button
                  type="button"
                  onClick={() => toggleState('__NATIONAL__')}
                  className={styles.filterPill + ' ' + (selectedStates.has('__NATIONAL__') ? styles.filterPillActive : '')}
                  title="Simple average across all reporting states"
                >
                  📊 US AVG
                </button>
                {availableStates.map(st => {
                  const on = selectedStates.has(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleState(st)}
                      className={styles.filterPill + ' ' + (on ? styles.filterPillActive : '')}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              {series.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '0 0 .75rem', fontSize: '.82rem' }}>
                  {series.map(s => (
                    <span key={s.state} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ display: 'inline-block', width: 14, height: 3, background: s.color, borderRadius: 2 }} />
                      <strong style={{ color: '#2c4a1e' }}>{s.state}</strong>
                    </span>
                  ))}
                </div>
              )}

              <YieldHistoryChart
                series={series}
                yLabel={`Yield (${chartUnit})`}
              />

              {series.length === 0 && (
                <p className={styles.empty} style={{ marginTop: '1rem' }}>
                  Pick at least one state above to plot.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
