'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(email, password);
      localStorage.setItem('agri_user', JSON.stringify(user));
      localStorage.setItem('token', 'logged_in');
      router.push('/');
      router.refresh();
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 420, margin: '3rem auto' }}>
        <div className={styles.sectionHead}>
          <span>🔐</span>
          <h2>Sign In to Just4Ag</h2>
        </div>
        <div className={styles.sectionBody}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formRow}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className={styles.formRow}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
