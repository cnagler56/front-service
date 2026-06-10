'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

interface Props {
  onSwitchToSignUp: () => void;
  onError: (msg: string) => void;
}

/** Email + password sign-in form. */
export default function SignInForm({ onSwitchToSignUp, onError }: Props) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
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
