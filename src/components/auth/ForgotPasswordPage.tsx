'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

/**
 * /forgot-password — collects an email and asks the server to send a reset
 * link. The response is intentionally generic (no account enumeration), so
 * we always show the same "check your inbox" confirmation on success.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 460, margin: '3rem auto' }}>
        <div className={styles.sectionHead}>
          
          <h2>Reset Your Password</h2>
        </div>
        <div className={styles.sectionBody}>
          {sent ? (
            <>
              <p style={{
                background: '#f0fdf4', border: '1px solid #c3e6cb', color: '#27ae60',
                borderRadius: 4, padding: '.75rem .9rem', fontSize: '.9rem',
                fontFamily: 'Lato, sans-serif', marginBottom: '1rem',
              }}>
                If an account exists for <strong>{email}</strong>, a password-reset link
                is on its way. The link expires in one hour.
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666' }}>
                Didn’t get it? Check your spam folder, or{' '}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => { setSent(false); setEmail(''); }}
                >
                  try a different email
                </button>.
              </p>
            </>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: '0 0 1rem' }}>
                Enter the email you signed up with and we’ll send you a link to set a new password.
              </p>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.formRow}>
                <label>Email</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required
                />
              </div>
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className={styles.authSwitch}>
                Remembered it?{' '}
                <Link href="/signin" className={styles.linkBtn}>Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
