'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

/**
 * /reset-password?token=... — sets a new password using the emailed token.
 * On success the server has already invalidated the token and signed the
 * user out everywhere, so we bounce to /signin to log in fresh.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/signin?reason=reset'), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 460, margin: '3rem auto' }}>
        <div className={styles.sectionHead}>
          <span>🔑</span>
          <h2>Choose a New Password</h2>
        </div>
        <div className={styles.sectionBody}>
          {!token ? (
            <p className={styles.error}>
              This reset link is missing its token. Please use the link from your email, or{' '}
              <Link href="/forgot-password" className={styles.linkBtn}>request a new one</Link>.
            </p>
          ) : done ? (
            <p style={{
              background: '#f0fdf4', border: '1px solid #c3e6cb', color: '#27ae60',
              borderRadius: 4, padding: '.75rem .9rem', fontSize: '.9rem',
              fontFamily: 'Lato, sans-serif',
            }}>
              ✓ Password reset. Redirecting you to sign in…
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.formRow}>
                <label>New Password</label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password" minLength={6} required
                />
              </div>
              <div className={styles.formRow}>
                <label>Confirm New Password</label>
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password" minLength={6} required
                />
              </div>
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
              <p className={styles.authSwitch}>
                <Link href="/forgot-password" className={styles.linkBtn}>Request a new link</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
