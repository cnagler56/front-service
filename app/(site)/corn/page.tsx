'use client';

import { useState, useEffect } from 'react';
import { api, CornGuess, GrainYield } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function CornPage() {
  const [yields, setYields] = useState<GrainYield[]>([]);
  const [estimates, setEstimates] = useState<CornGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [yieldGuess, setYieldGuess] = useState('');
  const [formName, setFormName] = useState('');
  const [formState, setFormState] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    Promise.all([api.getCornYields(), api.getCornEstimates()])
      .then(([y, e]) => { setYields(y); setEstimates(e); })
      .catch(() => setError('Failed to load corn data. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const stored = localStorage.getItem('agri_user');
      const user = stored ? JSON.parse(stored) : null;
      await api.addCornGuess({
        grain: 'CORN',
        yiel: yieldGuess,
        name: formName,
        state: formState,
        interest: formInterest,
        userId: user?.userId ?? 0,
      });
      setSubmitMsg('Your estimate was submitted!');
      setYieldGuess(''); setFormName(''); setFormState(''); setFormInterest('');
      const updated = await api.getCornEstimates();
      setEstimates(updated);
    } catch {
      setSubmitMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🌽</span>
          <h2>Corn Yield Data — 2023</h2>
        </div>
        <div className={styles.sectionBody}>
          {loading ? (
            <p className={styles.loading}>Loading…</p>
          ) : yields.length === 0 ? (
            <p className={styles.empty}>No yield data available.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>State</th>
                  <th>Yield (bu/ac)</th>
                  <th>Acres</th>
                  <th>3-yr Avg</th>
                </tr>
              </thead>
              <tbody>
                {yields.map(row => (
                  <tr key={row.id}>
                    <td>{row.state}</td>
                    <td>{row.yield}</td>
                    <td>{row.acres?.toLocaleString()}</td>
                    <td>{row.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📊</span>
          <h2>Submit Your National Yield Estimate</h2>
        </div>
        <div className={styles.sectionBody}>
          {submitMsg && (
            <p className={submitMsg.includes('Failed') ? styles.error : styles.success}>{submitMsg}</p>
          )}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label>Your Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} required />
            </div>
            <div className={styles.formRow}>
              <label>State</label>
              <input value={formState} onChange={e => setFormState(e.target.value)} placeholder="e.g. Iowa" required />
            </div>
            <div className={styles.formRow}>
              <label>Your Interest</label>
              <input value={formInterest} onChange={e => setFormInterest(e.target.value)} placeholder="e.g. Farmer, Analyst" />
            </div>
            <div className={styles.formRow}>
              <label>National Yield Estimate (bu/ac)</label>
              <input
                type="number"
                step="0.1"
                value={yieldGuess}
                onChange={e => setYieldGuess(e.target.value)}
                placeholder="e.g. 177.3"
                required
              />
            </div>
            <button className={styles.btn} type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Estimate'}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>👥</span>
          <h2>Community Estimates</h2>
        </div>
        <div className={styles.sectionBody}>
          {estimates.length === 0 ? (
            <p className={styles.empty}>No estimates yet — be the first!</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>State</th>
                  <th>Estimate (bu/ac)</th>
                  <th>Interest</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map(e => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.state}</td>
                    <td>{e.yiel}</td>
                    <td>{e.interest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
