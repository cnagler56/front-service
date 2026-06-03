'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import { completeAuth } from './completeAuth';

interface Props {
  onSwitchToSignUp: () => void;
  onError: (msg: string) => void;
}

/** Email + password sign-in form. */
export default function SignInForm({ onSwitchToSignUp, onError }: Props) {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError('');
    setLoading(true);
    try {
      const user = await api.login(email, password);
      completeAuth(user, router);
    } catch {
      onError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <label>Email</label>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email" required
        />
      </div>
      <div className={styles.formRow}>
        <label>Password</label>
        <input
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password" required
        />
      </div>
      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p className={styles.authSwitch}>
        New to Just4Ag?{' '}
        <button type="button" className={styles.linkBtn} onClick={onSwitchToSignUp}>
          Create an account
        </button>
      </p>
    </form>
  );
}
