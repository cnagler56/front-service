'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/src/styles/farm.module.css';
import AuthTabs, { AuthMode } from './AuthTabs';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

/**
 * /signin orchestrator — owns the tab mode and the shared error message,
 * delegates the form mechanics to SignInForm / SignUpForm.
 *
 * Reads ?reason=inactivity from the URL so the inactivity logout flow
 * can explain to the user why they're staring at a login form again.
 */
export default function SignInPage() {
  const [mode, setMode]   = useState<AuthMode>('signin');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason');

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 460, margin: '3rem auto' }}>
        <div className={styles.sectionHead}>
          <span>{mode === 'signin' ? '🔐' : '🌱'}</span>
          <h2>{mode === 'signin' ? 'Sign In to Just4Ag' : 'Create Your Just4Ag Account'}</h2>
        </div>

        <AuthTabs mode={mode} onChange={switchMode} />

        <div className={styles.sectionBody}>
          {reason === 'inactivity' && !error && (
            <p style={{
              background: '#fef7e6',
              border: '1px solid #f4d77a',
              color: '#8a6500',
              borderRadius: 4,
              padding: '.6rem .9rem',
              fontSize: '.85rem',
              marginBottom: '.85rem',
              fontFamily: 'Lato, sans-serif',
            }}>
              You were signed out after 4 hours of inactivity. Sign in again to pick up where you left off.
            </p>
          )}
          {reason === 'reset' && !error && (
            <p style={{
              background: '#f0fdf4',
              border: '1px solid #c3e6cb',
              color: '#27ae60',
              borderRadius: 4,
              padding: '.6rem .9rem',
              fontSize: '.85rem',
              marginBottom: '.85rem',
              fontFamily: 'Lato, sans-serif',
            }}>
              ✓ Your password has been reset. Sign in with your new password.
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}
          {mode === 'signin'
            ? <SignInForm onSwitchToSignUp={() => switchMode('signup')} onError={setError} />
            : <SignUpForm onSwitchToSignIn={() => switchMode('signin')} onError={setError} />}
        </div>
      </div>
    </div>
  );
}
