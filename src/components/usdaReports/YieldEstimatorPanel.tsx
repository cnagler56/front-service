'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, UsdaPlantingReport, UsdaYieldReport, YieldGuess } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

interface Props {
  commodity: string;            // "CORN" / "SOYBEANS" / "WHEAT"
  commodityLabel: string;
  unit?: string;                // default "bu/acre"
}

/** "AUG" → "Aug 2026", "YEAR" → "Final 2026" */
function refPeriodLabel(p: string | undefined, year: number): string {
  if (!p) return `${year}`;
  const map: Record<string, string> = {
    YEAR: 'Final', MAY: 'May', JUN: 'Jun', JUL: 'Jul',
    AUG: 'Aug', SEP: 'Sep', OCT: 'Oct', NOV: 'Nov', DEC: 'Dec',
  };
  return `${map[p] ?? p} ${year}`;
}

export default function YieldEstimatorPanel({ commodity, commodityLabel, unit = 'bu/acre' }: Props) {
  const [data, setData] = useState<UsdaYieldReport | null>(null);
  const [planting, setPlanting] = useState<UsdaPlantingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [userYields, setUserYields] = useState<Record<string, number>>({});

  // Community guess state
  const [guesses, setGuesses] = useState<YieldGuess[]>([]);
  const [name, setName]         = useState('');
  const [userState, setUserState] = useState('');
  const [interest, setInterest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { user } = useUser();

  // Pre-fill name / state / interest from the signed-in user when known
  useEffect(() => {
    if (!user) return;
    if (user.firstName) setName(`${user.firstName} ${user.lastName ?? ''}`.trim());
    if (user.state)     setUserState(user.state);
    if (user.interest)  setInterest(user.interest);
  }, [user]);

  // Initial load — USDA data + community guesses for this commodity
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSubmitMsg(null);

    Promise.all([
      api.getUsdaYield(commodity),
      api.getYieldGuesses(commodity),
      // Pull planted acres too — after the June 30 Acreage report this gives the
      // current-year planted acres for the weighting + the table column. If the
      // report hasn't been released yet this gracefully returns last year's data
      // and we fall back to prior-year harvested.
      api.getUsdaPlanting(commodity).catch(() => null),
    ])
      .then(([d, g, p]) => {
        if (cancelled) return;
        setData(d);
        setPlanting(p);
        const init: Record<string, number> = {};
        d.currentEstimates.forEach(row => { init[row.state.toLowerCase()] = row.yieldBu; });
        setUserYields(init);
        setGuesses(g);
      })
      .catch(() => { if (!cancelled) setError(`Could not load ${commodityLabel} yield data.`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity, commodityLabel]);

  /**
   * Choose the "best available" acreage source for the production-weighted
   * national average and for the table's Acres column. Most accurate first:
   *
   *   1. Current-year HARVESTED acres — published monthly by NASS during the
   *      season and attached to each state's yield snapshot. This is the exact
   *      denominator USDA uses, so the national yield matches USDA's own.
   *   2. Current-year PLANTED acres — from the Prospective Plantings (Mar 31)
   *      and Acreage (Jun 30) reports, before harvested forecasts begin.
   *   3. Prior-year HARVESTED acres — the stable off-season / early-season
   *      fallback, and a per-state fallback for states missing newer data.
   */
  const acresSource = useMemo<{
    byState: Map<string, number>;
    label: string;            // human label for the table column header
    sourceYear: number | null;
    isLive: boolean;          // true when using current-year data (harvested or planted)
  }>(() => {
    // Prior-year harvested — always built as the base fallback layer
    const priorHarvested = new Map<string, number>();
    data?.priorYearFinal.forEach(r => { if (r.acres != null) priorHarvested.set(r.state, r.acres); });

    // 1. Current-year harvested acres ride along on the current yield snapshots
    const currentHarvested = new Map<string, number>();
    data?.currentEstimates.forEach(r => { if (r.acres != null) currentHarvested.set(r.state, r.acres); });
    if (!data?.fellBack && currentHarvested.size > 0) {
      priorHarvested.forEach((v, k) => { if (!currentHarvested.has(k)) currentHarvested.set(k, v); });
      return {
        byState: currentHarvested,
        label: `Harvested Acres ${data.currentYear}`,
        sourceYear: data.currentYear,
        isLive: true,
      };
    }

    // 2. Current-year planted acres (before harvested forecasts begin)
    if (planting && !planting.fellBack && planting.currentPlantings.length > 0) {
      const planted = new Map<string, number>();
      planting.currentPlantings.forEach(p => { planted.set(p.state, p.acres); });
      priorHarvested.forEach((v, k) => { if (!planted.has(k)) planted.set(k, v); });
      return {
        byState: planted,
        label: `Planted Acres ${planting.currentYear}`,
        sourceYear: planting.currentYear,
        isLive: true,
      };
    }

    // 3. Prior-year harvested fallback
    return {
      byState: priorHarvested,
      label: `Harvested Acres ${data?.priorYear ?? ''}`.trim(),
      sourceYear: data?.priorYear ?? null,
      isLive: false,
    };
  }, [data, planting]);

  const stateRows = useMemo(() => {
    if (!data) return [];
    const priorByState = new Map<string, number>();
    data.priorYearFinal.forEach(r => { priorByState.set(r.state, r.yieldBu); });
    return data.currentEstimates
      .map(c => ({
        state:   c.state,
        current: c.yieldBu,
        prior:   priorByState.get(c.state) ?? null,
        acres:   acresSource.byState.get(c.state) ?? 0,
        refPeriod: c.referencePeriod,
      }))
      .sort((a, b) => b.acres - a.acres);
  }, [data, acresSource]);

  const nationalEstimate = useMemo<string | null>(() => {
    if (stateRows.length === 0) return null;
    let wsum = 0, asum = 0;
    stateRows.forEach(r => {
      const yld = userYields[r.state.toLowerCase()] ?? r.current;
      wsum += yld * r.acres;
      asum += r.acres;
    });
    return asum === 0 ? null : (wsum / asum).toFixed(1);
  }, [stateRows, userYields]);

  const crowdAvg = useMemo<string | null>(() => {
    if (guesses.length === 0) return null;
    const sum = guesses.reduce((acc, g) => acc + (g.estimate ?? 0), 0);
    return (sum / guesses.length).toFixed(1);
  }, [guesses]);

  function updateYield(stateKey: string, value: string) {
    const n = parseFloat(value);
    if (!isNaN(n)) setUserYields(prev => ({ ...prev, [stateKey]: n }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nationalEstimate) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await api.submitYieldGuess({
        commodity,
        estimate: parseFloat(nationalEstimate),
        name: name.trim(),
        state: userState.trim(),
        interest: interest.trim(),
        userId: user?.userId ?? 0,
      });
      setSubmitMsg({ ok: true, text: `Your ${commodityLabel.toLowerCase()} estimate of ${nationalEstimate} ${unit} was submitted!` });
      const updated = await api.getYieldGuesses(commodity);
      setGuesses(updated);
    } catch {
      setSubmitMsg({ ok: false, text: 'Submit failed. Try again in a moment.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading {commodityLabel} yield data…</p>;
  if (error)   return <p className={styles.error}>{error}</p>;
  if (!data || stateRows.length === 0) {
    return (
      <p className={styles.empty}>
        No yield data returned. AgriServer may still be fetching from NASS — try refreshing in a moment.
      </p>
    );
  }

  return (
    <div className={styles.cornLayout}>
      {/* LEFT: state table */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📊</span>
          <h2>{commodityLabel} — Yield by State</h2>
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
            Edit any row to adjust your estimate
          </span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '62vh' }}>
          <table className={styles.cornTable}>
            <thead>
              <tr>
                <th>State</th>
                <th>Your Estimate</th>
                <th>
                  USDA {refPeriodLabel(data.currentAsOf, data.currentYear)}
                  {data.fellBack && (
                    <div style={{ fontSize: '.65rem', fontWeight: 400, color: '#a16207', marginTop: 2 }}>
                      (no {new Date().getFullYear()} forecast yet)
                    </div>
                  )}
                </th>
                <th>vs USDA</th>
                {!data.fellBack && <th>USDA Final {data.priorYear}</th>}
                <th title={acresSource.isLive
                    ? 'Current-year acres from USDA NASS — the denominator used to weight the national yield'
                    : 'Prior-year harvested acres — used until current-year USDA estimates are published'}>
                  {acresSource.label} (000s)
                  {acresSource.isLive && (
                    <span style={{ color: '#3d6b2a', fontSize: '.65rem', marginLeft: '.35rem' }}>
                      • LIVE
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {stateRows.map(row => {
                const key      = row.state.toLowerCase();
                const userVal  = userYields[key] ?? row.current;
                const diff     = +(userVal - row.current).toFixed(1);
                const modified = Math.abs(diff) > 0.05;
                return (
                  <tr key={row.state}>
                    <td style={{ fontWeight: 700, color: '#2c4a1e' }}>{row.state}</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={userVal}
                        onChange={e => updateYield(key, e.target.value)}
                        className={`${styles.stateInput} ${modified ? styles.stateInputModified : ''}`}
                      />
                    </td>
                    <td style={{ color: '#555' }}>{row.current.toFixed(1)}</td>
                    <td>
                      {modified && (
                        <span className={diff > 0 ? styles.diffUp : styles.diffDown}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      )}
                    </td>
                    {!data.fellBack && (
                      <td style={{ color: '#777' }}>{row.prior != null ? row.prior.toFixed(1) : '—'}</td>
                    )}
                    <td style={{ color: '#777', fontSize: '.82rem' }}>
                      {row.acres ? Math.round(row.acres / 1000).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: live rollup + submit + community guesses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.estimateDisplay}>
          <p className={styles.estimateLabel}>Your National Estimate</p>
          <div className={styles.estimateValue}>{nationalEstimate ?? '—'}</div>
          <p className={styles.estimateUnit}>{unit} · production-weighted</p>
        </div>

        {/* Submit form */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span>✏️</span>
            <h2>Lock In Your Guess</h2>
          </div>
          <div className={styles.sectionBody}>
            {submitMsg && (
              <div style={{
                background: submitMsg.ok ? '#f0fdf4' : '#fdf0f0',
                border: `1px solid ${submitMsg.ok ? '#27ae60' : '#e74c3c'}`,
                color: submitMsg.ok ? '#27ae60' : '#c0392b',
                borderRadius: 4,
                padding: '.6rem .9rem',
                fontSize: '.85rem',
                marginBottom: '.85rem',
                fontFamily: 'Lato, sans-serif',
              }}>
                {submitMsg.text}
              </div>
            )}
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <label>Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" required />
              </div>
              <div className={styles.formRow}>
                <label>Your State</label>
                <input value={userState} onChange={e => setUserState(e.target.value)} placeholder="Iowa" required />
              </div>
              <div className={styles.formRow}>
                <label>Your Role</label>
                <input value={interest} onChange={e => setInterest(e.target.value)} placeholder="Farmer, Analyst, Trader…" />
              </div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #c3e6cb',
                borderRadius: 4,
                padding: '.6rem .9rem',
                textAlign: 'center',
                fontFamily: 'Lato, sans-serif',
              }}>
                <span style={{ fontSize: '.78rem', color: '#555' }}>Submitting estimate: </span>
                <strong style={{ fontSize: '1.15rem', color: '#2c4a1e' }}>
                  {nationalEstimate ?? '—'} {unit}
                </strong>
              </div>
              <button
                type="submit"
                className={styles.btn}
                disabled={submitting || !nationalEstimate || !name}
                style={{ width: '100%', textAlign: 'center' }}
              >
                {submitting ? 'Submitting…' : `✏️ Submit My ${commodityLabel} Estimate`}
              </button>
            </form>
          </div>
        </div>

        {/* Community */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span>👥</span>
            <h2>Community Guesses</h2>
            {guesses.length > 0 && (
              <span style={{
                marginLeft: 'auto', background: '#8fbc45', color: '#1a2e0f',
                borderRadius: 12, padding: '0 .6rem', fontSize: '.72rem', fontWeight: 700,
                fontFamily: 'Lato, sans-serif',
              }}>
                {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {crowdAvg && (
            <div style={{
              background: '#f4f0e8', borderBottom: '1px solid #ddd8cc',
              padding: '.55rem 1rem', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', fontFamily: 'Lato, sans-serif',
            }}>
              <span style={{ fontSize: '.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Crowd Average
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2c4a1e',
                              fontFamily: 'Playfair Display, Georgia, serif' }}>
                {crowdAvg} {unit}
              </span>
            </div>
          )}

          <div style={{ maxHeight: '32vh', overflowY: 'auto' }}>
            {guesses.length === 0 ? (
              <p className={styles.empty}>No guesses yet — be the first!</p>
            ) : (
              guesses.map((g, i) => (
                <div key={g.id ?? i} className={styles.guessCard}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.guessName}>{g.name || 'Anonymous'}</div>
                    <div className={styles.guessMeta}>
                      {[g.state, g.interest].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className={styles.guessValue}>{g.estimate.toFixed(1)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
