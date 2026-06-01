'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

type Mode = 'signin' | 'signup';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign-up only
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [city,      setCity]      = useState('');
  const [stateName, setStateName] = useState('');
  const [confirm,   setConfirm]   = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(email, password);
      localStorage.setItem('agri_user', JSON.stringify(user));
      localStorage.setItem('token', 'logged_in');
      window.dispatchEvent(new Event('agri-auth-changed'));
      router.push('/');
      router.refresh();
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.register({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        city:      city.trim(),
        state:     stateName.trim(),
      });
      localStorage.setItem('agri_user', JSON.stringify(user));
      localStorage.setItem('token', 'logged_in');
      window.dispatchEvent(new Event('agri-auth-changed'));
      router.push('/');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      setError(/409|exists/i.test(msg)
        ? 'An account with that email already exists.'
        : 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 460, margin: '3rem auto' }}>
        <div className={styles.sectionHead}>
          <span>{mode === 'signin' ? '🔐' : '🌱'}</span>
          <h2>{mode === 'signin' ? 'Sign In to Just4Ag' : 'Create Your Just4Ag Account'}</h2>
        </div>

        <div className={styles.authTabs}>
          <button
            type="button"
            className={`${styles.authTab} ${mode === 'signin' ? styles.authTabActive : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.authTab} ${mode === 'signup' ? styles.authTabActive : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className={styles.sectionBody}>
          {error && <p className={styles.error}>{error}</p>}

          {mode === 'signin' ? (
            <form className={styles.form} onSubmit={handleSignIn}>
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
              <p className={styles.authSwitch}>
                New to Just4Ag?{' '}
                <button type="button" className={styles.linkBtn} onClick={() => switchMode('signup')}>
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleSignUp}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formRow} style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className={styles.formRow} style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formRow} style={{ flex: 1 }}>
                  <label>City</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>
                <div className={styles.formRow} style={{ flex: 1 }}>
                  <label>State</label>
                  <input
                    value={stateName}
                    onChange={e => setStateName(e.target.value)}
                    autoComplete="address-level1"
                    placeholder="e.g. Iowa"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className={styles.authSwitch}>
                Already have an account?{' '}
                <button type="button" className={styles.linkBtn} onClick={() => switchMode('signin')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
