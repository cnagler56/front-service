'use client';

import { useState, useEffect } from 'react';
import { api, GrainYield } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function SoybeansPage() {
  const [beans, setBeans] = useState<GrainYield[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nationalGuess, setNationalGuess] = useState('');
  const [myState, setMyState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    api.getBeans()
      .then(setBeans)
      .catch(() => setError('Failed to load soybean data. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const stored = localStorage.getItem('agri_user');
      const user = stored ? JSON.parse(stored) : null;
      await api.addBeanGuess({
        nationalGuess: Number(nationalGuess),
        myState: Number(myState),
        userId: user?.userId ?? 0,
      });
      setSubmitMsg('Your soybean estimate was submitted!');
      setNationalGuess(''); setMyState('');
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
          <span>🌱</span>
          <h2>Soybean Yield Data — 2023</h2>
        </div>
        <div className={styles.sectionBody}>
          {loading ? (
            <p className={styles.loading}>Loading…</p>
          ) : beans.length === 0 ? (
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
                {beans.map(row => (
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
          <h2>Submit Your Soybean Yield Estimate</h2>
        </div>
        <div className={styles.sectionBody}>
          {submitMsg && (
            <p className={submitMsg.includes('Failed') ? styles.error : styles.success}>{submitMsg}</p>
          )}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label>National Yield Estimate (bu/ac)</label>
              <input
                type="number"
                step="0.1"
                value={nationalGuess}
                onChange={e => setNationalGuess(e.target.value)}
                placeholder="e.g. 51.7"
                required
              />
            </div>
            <div className={styles.formRow}>
              <label>My State Estimate (bu/ac)</label>
              <input
                type="number"
                step="0.1"
                value={myState}
                onChange={e => setMyState(e.target.value)}
                placeholder="e.g. 58.0"
                required
              />
            </div>
            <button className={styles.btn} type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Estimate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
