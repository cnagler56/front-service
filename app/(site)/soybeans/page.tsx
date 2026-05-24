'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, GrainYield, BeanGuess } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function SoybeansPage() {
  // ── Data from backend ──────────────────────────────────────────────────
  const [yieldData, setYieldData]     = useState<GrainYield[]>([]);
  const [estimates, setEstimates]     = useState<BeanGuess[]>([]);
  const [userYields, setUserYields]   = useState<Record<string, number>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // ── Submission form ────────────────────────────────────────────────────
  const [name, setName]             = useState('');
  const [homeState, setHomeState]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agri_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.firstName) setName(`${u.firstName} ${u.lastName ?? ''}`.trim());
        if (u.state)     setHomeState(u.state);
      }
    } catch {}

    Promise.all([api.getBeans(), api.getBeanEstimates()])
      .then(([data, ests]) => {
        const sorted = [...data].sort((a, b) => (b.acres ?? 0) - (a.acres ?? 0));
        setYieldData(sorted);
        const initial: Record<string, number> = {};
        sorted.forEach(row => {
          const key = (row.state ?? '').toLowerCase();
          initial[key] = row.yield;
        });
        setUserYields(initial);
        setEstimates(ests);
      })
      .catch(() => setError('Could not reach AgriServer on port 8081. Start the server and refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Live weighted-average national estimate ────────────────────────────
  const nationalEstimate = useMemo<string | null>(() => {
    if (yieldData.length === 0) return null;
    let totalWeighted = 0;
    let totalAcres    = 0;
    yieldData.forEach(row => {
      const key   = (row.state ?? '').toLowerCase();
      const yld   = userYields[key] ?? row.yield;
      const acres = row.acres ?? 0;
      totalWeighted += yld * acres;
      totalAcres    += acres;
    });
    return totalAcres === 0 ? null : (totalWeighted / totalAcres).toFixed(1);
  }, [yieldData, userYields]);

  // My-state yield pulled automatically from the table
  const myStateEstimate = useMemo<number | null>(() => {
    if (!homeState) return null;
    const key = homeState.toLowerCase();
    // Try exact key match first, then search state names
    if (userYields[key] !== undefined) return userYields[key];
    const match = yieldData.find(r => r.state?.toLowerCase() === key);
    return match ? (userYields[match.state!.toLowerCase()] ?? match.yield) : null;
  }, [homeState, userYields, yieldData]);

  // ── Handlers ───────────────────────────────────────────────────────────
  function updateYield(stateKey: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setUserYields(prev => ({ ...prev, [stateKey]: num }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nationalEstimate) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const stored = localStorage.getItem('agri_user');
      const user   = stored ? JSON.parse(stored) : null;
      await api.addBeanGuess({
        nationalGuess: Math.round(Number(nationalEstimate)),
        myState:       Math.round(myStateEstimate ?? Number(nationalEstimate)),
        userId:        user?.userId ?? 0,
      });
      setSubmitMsg({ ok: true, text: `Your estimate of ${nationalEstimate} bu/ac was submitted!` });
      const updated = await api.getBeanEstimates();
      setEstimates(updated);
    } catch {
      setSubmitMsg({ ok: false, text: 'Submit failed — check the server connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.45rem', color: '#2c4a1e', margin: '0 0 .35rem' }}>
          🌱 USDA Soybean Yield Estimator
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#666', fontSize: '.875rem', margin: 0, lineHeight: 1.6 }}>
          Adjust each state's soybean yield below — your national estimate recalculates in real time
          as a production-weighted average. When you're satisfied, submit your guess.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.cornLayout}>

        {/* ════════════════════════════════════════════════════════════════
            LEFT — interactive state table
        ════════════════════════════════════════════════════════════════ */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span>📊</span>
            <h2>State-by-State Yield Table</h2>
            <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
              Edit any row to adjust your estimate
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '62vh' }}>
            {loading ? (
              <p className={styles.loading}>Loading USDA yield data…</p>
            ) : yieldData.length === 0 ? (
              <p className={styles.empty}>No yield data returned. Is AgriServer running?</p>
            ) : (
              <table className={styles.cornTable}>
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Your Estimate</th>
                    <th>USDA 2023</th>
                    <th>vs USDA</th>
                    <th>Acres (000s)</th>
                  </tr>
                </thead>
                <tbody>
                  {yieldData.map(row => {
                    const key      = (row.state ?? '').toLowerCase();
                    const userVal  = userYields[key] ?? row.yield;
                    const diff     = +(userVal - row.yield).toFixed(1);
                    const modified = Math.abs(diff) > 0.05;
                    const isHome   = homeState && row.state?.toLowerCase() === homeState.toLowerCase();

                    return (
                      <tr key={row.id} style={isHome ? { outline: '2px solid #8fbc45', outlineOffset: '-2px' } : {}}>
                        <td style={{ fontWeight: 700, color: '#2c4a1e' }}>
                          {row.state}
                          {isHome && (
                            <span style={{ marginLeft: '.4rem', fontSize: '.65rem', background: '#8fbc45', color: '#1a2e0f', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>
                              YOUR STATE
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                            <input
                              type="number"
                              step="0.1"
                              value={userVal}
                              onChange={e => updateYield(key, e.target.value)}
                              className={`${styles.stateInput} ${modified ? styles.stateInputModified : ''}`}
                            />
                          </div>
                        </td>
                        <td style={{ color: '#555' }}>{row.yield}</td>
                        <td>
                          {modified && (
                            <span className={diff > 0 ? styles.diffUp : styles.diffDown}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          )}
                        </td>
                        <td style={{ color: '#777', fontSize: '.82rem' }}>
                          {row.acres?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT — live estimate + submit
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Live national estimate ── */}
          <div className={styles.estimateDisplay}>
            <p className={styles.estimateLabel}>Your National Estimate</p>
            <div className={styles.estimateValue}>
              {loading ? '…' : (nationalEstimate ?? '—')}
            </div>
            <p className={styles.estimateUnit}>bu / acre &nbsp;·&nbsp; production-weighted avg</p>
          </div>

          {/* ── My state callout (shown once homeState is known) ── */}
          {homeState && myStateEstimate !== null && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #8fbc45',
              borderRadius: 8,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#555', margin: '0 0 .2rem' }}>
                  {homeState} Estimate
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.8rem', color: '#888', margin: 0 }}>
                  Your row value from the table
                </p>
              </div>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2c4a1e' }}>
                {myStateEstimate} <span style={{ fontSize: '.85rem', fontFamily: 'Lato, sans-serif', fontWeight: 300, color: '#666' }}>bu/ac</span>
              </div>
            </div>
          )}

          {/* ── Submit form ── */}
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

              <form className={styles.form} onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
                <div className={styles.formRow}>
                  <label>Your Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Your State</label>
                  <input
                    value={homeState}
                    onChange={e => setHomeState(e.target.value)}
                    placeholder="Iowa"
                    required
                  />
                </div>

                {/* Preview */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #c3e6cb',
                  borderRadius: 4,
                  padding: '.65rem .9rem',
                  fontFamily: 'Lato, sans-serif',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' }}>
                    <span style={{ fontSize: '.75rem', color: '#555' }}>National estimate</span>
                    <strong style={{ fontSize: '1.1rem', color: '#2c4a1e' }}>{nationalEstimate ?? '—'} bu/ac</strong>
                  </div>
                  {myStateEstimate !== null && homeState && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.75rem', color: '#555' }}>{homeState} estimate</span>
                      <strong style={{ fontSize: '1rem', color: '#3d6b2a' }}>{myStateEstimate} bu/ac</strong>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.btn}
                  disabled={submitting || !nationalEstimate || !name}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  {submitting ? 'Submitting…' : '🌱 Submit My Estimate'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Community guesses ── */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span>👥</span>
              <h2>Community Guesses</h2>
              {estimates.length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#8fbc45',
                  color: '#1a2e0f',
                  borderRadius: 12,
                  padding: '0 .6rem',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  fontFamily: 'Lato, sans-serif',
                }}>
                  {estimates.length} guess{estimates.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>

            <div style={{ maxHeight: '28vh', overflowY: 'auto' }}>
              {estimates.length === 0 ? (
                <p className={styles.empty}>No guesses yet — be the first!</p>
              ) : (
                estimates.map((e, i) => (
                  <div key={e.id ?? i} className={styles.guessCard}>
                    <div style={{ flex: 1 }}>
                      <div className={styles.guessName}>Estimate #{i + 1}</div>
                      <div className={styles.guessMeta}>
                        State est: {e.myState} bu/ac
                      </div>
                    </div>
                    <div className={styles.guessValue}>{e.nationalGuess}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
