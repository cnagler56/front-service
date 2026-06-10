'use client';

import { useMemo, useState } from 'react';
import { api, NASSYieldData } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import YieldHistoryChart, { Series, colorFor } from '@/src/components/YieldHistoryChart';
import styles from '@/src/styles/farm.module.css';
import { classify, unit, toNum } from './nassClassify';

interface Props {
  grain: string;
}

/**
 * 5/10/20-year history panel with state-chip selector + line chart.
 * National average (across reporting states) is rendered when the user
 * activates the "US AVG" chip via the special "__NATIONAL__" key.
 */
export default function HistoryPanel({ grain }: Props) {
  const [open, setOpen]                 = useState(false);
  const [yearsBack, setYearsBack]       = useState(5);
  const [data, setData]                 = useState<NASSYieldData[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [historyClass, setHistoryClass] = useState<string>('');
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const { user } = useUser();

  async function fetchHistory() {
    setLoading(true);
    setError('');
    try {
      const rows = await api.getYieldHistory(grain, yearsBack);
      setData(rows);
      pickDefaults(rows);
    } catch {
      setError('Failed to load history. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  /** After a fresh fetch, default the class to the most populated and seed the chart. */
  function pickDefaults(rows: NASSYieldData[]) {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const c = classify(r.short_desc);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const defaultClass = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    setHistoryClass(defaultClass);

    // Pre-select user's state if it has data, otherwise top yielders of latest year
    const inClass = rows.filter(r => classify(r.short_desc) === defaultClass);
    const userState = (user?.state ?? '').trim().toUpperCase();
    const haveUserState = userState && inClass.some(r => r.state_name?.toUpperCase() === userState);
    const initial: string[] = haveUserState ? [userState] : [];

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
  }

  // Build chart series from filtered data
  const { series, availableStates, classOptions, chartUnit } = useMemo(() => {
    const filtered = data.filter(r => classify(r.short_desc) === historyClass);
    const allStates = Array.from(
      new Set(filtered.map(r => r.state_name?.toUpperCase() ?? '').filter(Boolean))
    ).sort();
    const classes = Array.from(new Set(data.map(r => classify(r.short_desc))));

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

    // National average per year across ALL states in the chosen class
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

    const out: Series[] = [];
    Array.from(selectedStates).sort().forEach((st, i) => {
      if (byState.has(st)) out.push({ state: st, color: colorFor(i), points: byState.get(st)! });
    });
    if (selectedStates.has('__NATIONAL__') && natlPoints.length) {
      out.push({ state: 'US AVG', color: '#000000', points: natlPoints });
    }

    return {
      series: out,
      availableStates: allStates,
      classOptions: classes,
      chartUnit: unit(filtered[0]?.short_desc) || 'units / acre',
    };
  }, [data, historyClass, selectedStates]);

  function toggleState(s: string) {
    setSelectedStates(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span>📊</span>
        <h2>{grain} Yield History</h2>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.filters}>
          <div className={styles.formRow}>
            <label>Years Back</label>
            <select value={yearsBack} onChange={e => setYearsBack(Number(e.target.value))}>
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
          <button
            className={styles.btn}
            onClick={() => { setOpen(true); fetchHistory(); }}
            disabled={loading}
          >
            {loading ? 'Loading…' : open ? 'Refresh' : 'Load Chart'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {!open && !loading && (
          <p className={styles.empty}>Click <strong>Load Chart</strong> to see a multi-year line chart of state yields.</p>
        )}
        {open && !loading && data.length === 0 && !error && (
          <p className={styles.empty}>No history data returned for {grain}.</p>
        )}

        {open && data.length > 0 && (
          <>
            <StateChipRow
              states={availableStates}
              selected={selectedStates}
              onToggle={toggleState}
            />
            <SeriesLegend series={series} />
            <YieldHistoryChart series={series} yLabel={`Yield (${chartUnit})`} />
            {series.length === 0 && (
              <p className={styles.empty} style={{ marginTop: '1rem' }}>
                Pick at least one state above to plot.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Chip-style toggle for each state + a US AVG meta-chip. */
function StateChipRow({
  states, selected, onToggle,
}: { states: string[]; selected: Set<string>; onToggle: (s: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', margin: '0 0 1rem' }}>
      <button
        type="button"
        onClick={() => onToggle('__NATIONAL__')}
        className={styles.filterPill + ' ' + (selected.has('__NATIONAL__') ? styles.filterPillActive : '')}
        title="Simple average across all reporting states"
      >
        📊 US AVG
      </button>
      {states.map(st => (
        <button
          key={st}
          type="button"
          onClick={() => onToggle(st)}
          className={styles.filterPill + ' ' + (selected.has(st) ? styles.filterPillActive : '')}
        >
          {st}
        </button>
      ))}
    </div>
  );
}

/** Color swatch + label per series. */
function SeriesLegend({ series }: { series: Series[] }) {
  if (!series.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '0 0 .75rem', fontSize: '.82rem' }}>
      {series.map(s => (
        <span key={s.state} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
          <span style={{ display: 'inline-block', width: 14, height: 3, background: s.color, borderRadius: 2 }} />
          <strong style={{ color: '#2c4a1e' }}>{s.state}</strong>
        </span>
      ))}
    </div>
  );
}
