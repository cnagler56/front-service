'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, UsdaPlantingReport } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Props {
  commodity: string;
  commodityLabel: string;
}

/**
 * Interactive Intended-Plantings / Acreage report. Lets the user adjust each
 * state's planted acres and watch the national total move in real time.
 *
 * NASS publishes two plantings reports per year:
 *   - Prospective Plantings  (March 31)  — intended
 *   - Acreage                (June 30)   — refined estimate
 * Both come through statisticcat_desc=AREA PLANTED. The latest one (by NASS load_time)
 * wins on a per-state basis.
 */
export default function PlantingEstimatorPanel({ commodity, commodityLabel }: Props) {
  const [data, setData] = useState<UsdaPlantingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [userAcres, setUserAcres] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getUsdaPlanting(commodity)
      .then(d => {
        if (cancelled) return;
        setData(d);
        const init: Record<string, number> = {};
        d.currentPlantings.forEach(row => {
          init[row.state.toLowerCase()] = row.acres;
        });
        setUserAcres(init);
      })
      .catch(() => { if (!cancelled) setError(`Could not load ${commodityLabel} planting data.`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity, commodityLabel]);

  const stateRows = useMemo(() => {
    if (!data) return [];
    const priorByState = new Map<string, number>();
    data.priorYearPlantings.forEach(p => priorByState.set(p.state, p.acres));
    return data.currentPlantings
      .map(p => ({
        state:   p.state,
        current: p.acres,
        prior:   priorByState.get(p.state) ?? null,
      }))
      .sort((a, b) => b.current - a.current);
  }, [data]);

  const nationalTotal = useMemo<string | null>(() => {
    if (stateRows.length === 0) return null;
    const sum = stateRows.reduce((acc, r) => acc + (userAcres[r.state.toLowerCase()] ?? r.current), 0);
    return (sum / 1_000_000).toFixed(2);  // millions of acres
  }, [stateRows, userAcres]);

  function update(stateKey: string, value: string) {
    const n = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(n)) setUserAcres(prev => ({ ...prev, [stateKey]: n }));
  }

  if (loading) return <p className={styles.loading}>Loading {commodityLabel} planting data…</p>;
  if (error)   return <p className={styles.error}>{error}</p>;
  if (!data || stateRows.length === 0) {
    return (
      <p className={styles.empty}>
        No planting data returned yet. The first Prospective Plantings report for the year
        publishes on March 31 — try again after then if it's still early.
      </p>
    );
  }

  return (
    <div className={styles.cornLayout}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌱</span>
          <h2>{commodityLabel} — Planted Acres by State ({data.currentYear})</h2>
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
            Edit any row
          </span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '62vh' }}>
          <table className={styles.cornTable}>
            <thead>
              <tr>
                <th>State</th>
                <th>Your Estimate (acres)</th>
                <th>USDA {data.currentYear}</th>
                <th>vs USDA</th>
                {!data.fellBack && <th>USDA {data.priorYear}</th>}
                <th>YoY %</th>
              </tr>
            </thead>
            <tbody>
              {stateRows.map(row => {
                const key   = row.state.toLowerCase();
                const userV = userAcres[key] ?? row.current;
                const diff  = userV - row.current;
                const modified = Math.abs(diff) > 100;
                const yoy = row.prior ? ((row.current - row.prior) / row.prior) * 100 : null;
                return (
                  <tr key={row.state}>
                    <td style={{ fontWeight: 700, color: '#2c4a1e' }}>{row.state}</td>
                    <td>
                      <input
                        type="number"
                        step="1000"
                        value={userV}
                        onChange={e => update(key, e.target.value)}
                        className={`${styles.stateInput} ${modified ? styles.stateInputModified : ''}`}
                      />
                    </td>
                    <td style={{ color: '#555' }}>{row.current.toLocaleString()}</td>
                    <td>
                      {modified && (
                        <span className={diff > 0 ? styles.diffUp : styles.diffDown}>
                          {diff > 0 ? '+' : ''}{Math.round(diff).toLocaleString()}
                        </span>
                      )}
                    </td>
                    {!data.fellBack && (
                      <td style={{ color: '#777' }}>
                        {row.prior != null ? row.prior.toLocaleString() : '—'}
                      </td>
                    )}
                    <td>
                      {yoy != null ? (
                        <span className={yoy > 0 ? styles.diffUp : styles.diffDown}>
                          {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className={styles.estimateDisplay}>
          <p className={styles.estimateLabel}>National Total</p>
          <div className={styles.estimateValue}>{nationalTotal ?? '—'}</div>
          <p className={styles.estimateUnit}>million acres · sum across states</p>
        </div>
      </div>
    </div>
  );
}
