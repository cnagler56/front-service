'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, GuessRosterEntry, UsdaPlantingReport, UsdaYieldReport, YieldGuess } from '@/src/lib/api';
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

/** localStorage key holding this commodity's per-state edits. */
const overridesKey = (commodity: string) => `yieldChallenge:overrides:${commodity}`;

/** Read saved per-state edits (SSR-safe). */
function loadOverrides(commodity: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(overridesKey(commodity));
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export default function YieldEstimatorPanel({ commodity, commodityLabel, unit = 'bu/acre' }: Props) {
  const [data, setData] = useState<UsdaYieldReport | null>(null);
  const [planting, setPlanting] = useState<UsdaPlantingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  // Per-state edits, keyed by lowercased state. Only states the user actually
  // changed are stored (everything else falls back to the live USDA value), and
  // they're hydrated from localStorage so edits survive leaving the page.
  const [userYields, setUserYields] = useState<Record<string, number>>(() => loadOverrides(commodity));

  // Community guess state
  const [guesses, setGuesses] = useState<GuessRosterEntry[]>([]);
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Lazy-loaded change logs, keyed by userId; null entry = currently loading.
  const [history, setHistory] = useState<Record<number, YieldGuess[] | null>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  // Guests can browse, but the first attempt to edit a value prompts them to sign in.
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { user } = useUser();

  // Name and state are taken straight from the account — not editable here, so
  // people can't enter the challenge under a different name or location. Role
  // (interest) is likewise sent automatically from the profile.
  const guessName = useMemo(() => {
    if (!user) return '';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || user.username || '';
  }, [user]);
  const guessState = user?.state ?? '';

  // Has the signed-in user already entered the challenge? (controls form wording)
  const alreadyGuessed = useMemo(
    () => user != null && guesses.some(g => g.userId === user.userId),
    [guesses, user],
  );

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
        // NB: we intentionally don't seed userYields here — unedited states fall
        // back to the live USDA value, and the user's saved edits (hydrated from
        // localStorage) stay intact across reloads.
        setGuesses(g);
      })
      .catch(() => { if (!cancelled) setError(`Could not load ${commodityLabel} yield data.`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity, commodityLabel]);

  // Persist edits whenever they change so they survive navigating away.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = overridesKey(commodity);
      if (Object.keys(userYields).length === 0) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(userYields));
    } catch {
      /* ignore storage errors (quota / private mode) */
    }
  }, [userYields, commodity]);

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
    if (data && !data.fellBack && currentHarvested.size > 0) {
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

  // Baseline (live USDA) value per state, for pruning no-op edits.
  const baseline = useMemo(() => {
    const m = new Map<string, number>();
    data?.currentEstimates.forEach(r => m.set(r.state.toLowerCase(), r.yieldBu));
    return m;
  }, [data]);

  const editedCount = Object.keys(userYields).length;

  function updateYield(stateKey: string, value: string) {
    const n = parseFloat(value);
    if (isNaN(n)) return;
    setUserYields(prev => {
      const next = { ...prev };
      const base = baseline.get(stateKey);
      // If the user lands back on the USDA value, drop the override entirely so
      // unedited states keep tracking live USDA data.
      if (base != null && Math.abs(n - base) < 0.05) delete next[stateKey];
      else next[stateKey] = n;
      return next;
    });
  }

  function resetEdits() {
    setUserYields({});
  }

  async function submitGuess() {
    if (!user || !nationalEstimate) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await api.submitYieldGuess({
        commodity,
        estimate: parseFloat(nationalEstimate),
        name: guessName,                  // from the account, not editable
        state: guessState,                // from the account, not editable
        interest: user.interest ?? '',    // sent automatically from the profile
        note: note.trim() || undefined,
      });
      setSubmitMsg({
        ok: true,
        text: `${alreadyGuessed ? 'Your updated' : 'Your'} ${commodityLabel.toLowerCase()} estimate of ${nationalEstimate} ${unit} was submitted!`,
      });
      setNote('');
      // Refresh the roster, and drop any cached change log so it reloads on demand.
      setHistory({});
      setExpanded(null);
      const updated = await api.getYieldGuesses(commodity);
      setGuesses(updated);
    } catch {
      setSubmitMsg({ ok: false, text: 'Submit failed. Try again in a moment.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Expand/collapse a user's change log, fetching it the first time it's opened.
  async function toggleHistory(userId: number | null) {
    if (userId == null) return;
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (history[userId] === undefined) {
      setHistory(prev => ({ ...prev, [userId]: null }));   // mark loading
      try {
        const log = await api.getGuessHistory(commodity, userId);
        setHistory(prev => ({ ...prev, [userId]: log }));
      } catch {
        setHistory(prev => ({ ...prev, [userId]: [] }));
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitGuess();
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
          <h2>{commodityLabel} — Yield by State</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            {editedCount > 0 && (
              <button
                type="button"
                onClick={resetEdits}
                title="Discard your edits and snap every state back to the USDA value"
                style={{
                  background: 'transparent', border: '1px solid #a8cc78', color: '#d8ecc0',
                  borderRadius: 4, padding: '.2rem .55rem', fontSize: '.72rem', cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap',
                }}
              >
                ↺ Reset to USDA
              </button>
            )}
            <span style={{ color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>
              {editedCount > 0
                ? `${editedCount} edited · saved`
                : 'Edit any row to adjust your estimate'}
            </span>
          </div>
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
                        readOnly={!user}
                        onChange={e => { if (user) updateYield(key, e.target.value); }}
                        onMouseDown={!user ? e => { e.preventDefault(); setShowAuthPrompt(true); } : undefined}
                        onFocus={!user ? () => setShowAuthPrompt(true) : undefined}
                        title={!user ? 'Sign in to adjust estimates' : undefined}
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
            {!user ? (
              <p className={styles.empty} style={{ margin: 0 }}>
                <Link href="/signin" style={{ color: '#3d6b2a', fontWeight: 700 }}>Sign in</Link>{' '}
                to lock in your guess. Your name, state, and role come from your account.
              </p>
            ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div style={{
                fontFamily: 'Lato, sans-serif', fontSize: '.8rem', color: '#555',
                background: '#f7f5ef', border: '1px solid #e1dccc', borderRadius: 4,
                padding: '.55rem .8rem',
              }}>
                Entering as <strong style={{ color: '#2c4a1e' }}>{guessName || '—'}</strong>
                {guessState && <> · <strong style={{ color: '#2c4a1e' }}>{guessState}</strong></>}
                <div style={{ fontSize: '.7rem', color: '#888', marginTop: '.15rem' }}>
                  Name and state come from your account.
                </div>
              </div>
              {alreadyGuessed && (
                <div className={styles.formRow}>
                  <label>Why the change? <span style={{ fontWeight: 400, color: '#888' }}>(optional)</span></label>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    maxLength={280}
                    placeholder="e.g. USDA raised Iowa & Illinois"
                  />
                </div>
              )}
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
                disabled={submitting || !nationalEstimate}
                style={{ width: '100%', textAlign: 'center' }}
              >
                {submitting
                  ? 'Submitting…'
                  : alreadyGuessed
                    ? `Update My ${commodityLabel} Estimate`
                    : `Submit My ${commodityLabel} Estimate`}
              </button>
            </form>
            )}
          </div>
        </div>

        {/* Community */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
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
              guesses.map((g, i) => {
                const open = g.userId != null && expanded === g.userId;
                const log = g.userId != null ? history[g.userId] : undefined;
                // Badge wording/colors reflect which way they moved their estimate.
                const badge = !g.updated ? null
                  : g.direction === 'up'
                    ? { label: 'Raised estimate', fg: '#1a7f37', bg: '#e6f4ea', bd: '#b7e0c2' }
                    : g.direction === 'down'
                      ? { label: 'Lowered estimate', fg: '#b42318', bg: '#fbe9e7', bd: '#f0c2bb' }
                      : { label: 'Updated', fg: '#7a5c00', bg: '#fdf1c9', bd: '#ecd98a' };
                return (
                  <div key={g.latestId ?? i}>
                    <div className={styles.guessCard}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.guessName}>
                          {g.name || 'Anonymous'}
                          {badge && (
                            <span
                              title={`Updated ${g.revisions - 1} time${g.revisions - 1 !== 1 ? 's' : ''}`}
                              style={{
                                marginLeft: '.4rem', fontSize: '.62rem', fontWeight: 700,
                                color: badge.fg, background: badge.bg, border: `1px solid ${badge.bd}`,
                                borderRadius: 10, padding: '0 .4rem', verticalAlign: 'middle',
                                fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '.03em',
                              }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <div className={styles.guessMeta}>
                          {[g.state, g.interest].filter(Boolean).join(' · ')}
                        </div>
                        {g.updated && g.note && badge && (
                          <div style={{
                            marginTop: '.4rem',
                            background: badge.bg,
                            border: `1px solid ${badge.bd}`,
                            borderLeft: `4px solid ${badge.fg}`,
                            borderRadius: 6,
                            padding: '.45rem .7rem',
                            fontFamily: 'Lato, sans-serif',
                          }}>
                            <div style={{
                              fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '.05em', color: badge.fg, marginBottom: '.2rem',
                            }}>
                              Why they changed
                            </div>
                            <div style={{ fontSize: '.9rem', color: '#33402a', lineHeight: 1.45 }}>
                              “{g.note}”
                            </div>
                          </div>
                        )}
                        {g.updated && (
                          <button
                            type="button"
                            onClick={() => toggleHistory(g.userId)}
                            style={{
                              background: 'none', border: 'none', padding: 0, marginTop: '.25rem',
                              color: '#3d6b2a', fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'Lato, sans-serif',
                            }}
                          >
                            {open ? '▾ Hide history' : `▸ History (${g.revisions})`}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
                        <div className={styles.guessValue} style={{ margin: 0 }}>{g.estimate.toFixed(1)}</div>
                        {g.direction && g.direction !== 'same' && g.delta != null && (
                          <span className={g.direction === 'up' ? styles.diffUp : styles.diffDown} style={{ minWidth: 0 }}>
                            {g.direction === 'up' ? '▲' : '▼'} {g.delta > 0 ? '+' : ''}{g.delta.toFixed(1)} vs last
                          </span>
                        )}
                      </div>
                    </div>

                    {open && (
                      <div style={{
                        background: '#f9fbf4', borderBottom: '1px solid #f0ede8',
                        padding: '.4rem 1rem .65rem 1.5rem', fontFamily: 'Lato, sans-serif',
                      }}>
                        {log === null || log === undefined ? (
                          <div style={{ fontSize: '.74rem', color: '#888' }}>Loading history…</div>
                        ) : log.length === 0 ? (
                          <div style={{ fontSize: '.74rem', color: '#888' }}>No earlier revisions.</div>
                        ) : (
                          [...log].reverse().map((rev, j) => {
                            const earlier = log[log.length - 2 - j];   // revision just before this one
                            const d = earlier ? +(rev.estimate - earlier.estimate).toFixed(1) : null;
                            return (
                              <div key={rev.id ?? j} style={{
                                display: 'flex', alignItems: 'baseline', gap: '.5rem',
                                fontSize: '.74rem', color: '#555', padding: '.15rem 0',
                              }}>
                                <span style={{ color: '#999', minWidth: 86 }}>
                                  {rev.date ? new Date(rev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                                </span>
                                <strong style={{ color: '#2c4a1e' }}>{rev.estimate.toFixed(1)}</strong>
                                {d != null && d !== 0 && (
                                  <span className={d > 0 ? styles.diffUp : styles.diffDown} style={{ minWidth: 0 }}>
                                    {d > 0 ? '+' : ''}{d.toFixed(1)}
                                  </span>
                                )}
                                {j === 0 && <span style={{ color: '#999' }}>(current)</span>}
                                {rev.note && <span style={{ fontStyle: 'italic', color: '#777' }}>— “{rev.note}”</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAuthPrompt && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget) setShowAuthPrompt(false); }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHead}>
              <h2>Join the USDA Challenge</h2>
              <button className={styles.modalClose} onClick={() => setShowAuthPrompt(false)} aria-label="Close">×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', margin: '0 0 1rem' }}>
                Sign in or create a free account to adjust state yields and lock in your own{' '}
                {commodityLabel.toLowerCase()} estimate. You can keep browsing without an account.
              </p>
              <div className={styles.modalActions}>
                <Link href="/signin" className={styles.btnSecondary} style={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
                <Link href="/signin?mode=signup" className={styles.btn} style={{ textDecoration: 'none' }}>
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
