'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

interface Props {
  onSwitchToSignIn: () => void;
  onError: (msg: string) => void;
}

/** New-account registration form. Client-side validates password + confirmation. */
export default function SignUpForm({ onSwitchToSignIn, onError }: Props) {
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [city,      setCity]      = useState('');
  const [stateName, setStateName] = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError('');
    if (password.length < 6) {
      onError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      onError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        city:      city.trim(),
        state:     stateName.trim(),
      });
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      onError(/409|exists/i.test(msg)
        ? 'An account with that email already exists.'
        : 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className={styles.formRow} style={{ flex: 1 }}>
          <label>First Name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" required />
        </div>
        <div className={styles.formRow} style={{ flex: 1 }}>
          <label>Last Name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" required />
        </div>
      </div>

      <div className={styles.formRow}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className={styles.formRow} style={{ flex: 1 }}>
          <label>City</label>
          <input value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
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
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password" minLength={6} required
        />
      </div>
      <div className={styles.formRow}>
        <label>Confirm Password</label>
        <input
          type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" minLength={6} required
        />
      </div>

      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
      <p className={styles.authSwitch}>
        Already have an account?{' '}
        <button type="button" className={styles.linkBtn} onClick={onSwitchToSignIn}>
          Sign in
        </button>
      </p>
    </form>
  );
}
