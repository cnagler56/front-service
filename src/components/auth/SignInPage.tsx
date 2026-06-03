'use client';

import { useState } from 'react';
import styles from '@/src/styles/farm.module.css';
import AuthTabs, { AuthMode } from './AuthTabs';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

/**
 * /signin orchestrator — owns the tab mode and the shared error message,
 * delegates the form mechanics to SignInForm / SignUpForm.
 */
export default function SignInPage() {
  const [mode, setMode]   = useState<AuthMode>('signin');
  const [error, setError] = useState('');

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
          {error && <p className={styles.error}>{error}</p>}
          {mode === 'signin'
            ? <SignInForm onSwitchToSignUp={() => switchMode('signup')} onError={setError} />
            : <SignUpForm onSwitchToSignIn={() => switchMode('signin')} onError={setError} />}
        </div>
      </div>
    </div>
  );
}
