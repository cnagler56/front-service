'use client';

import styles from '@/src/styles/farm.module.css';

export type AuthMode = 'signin' | 'signup';

/** Tab pills toggling between Sign In and Sign Up. */
export default function AuthTabs({
  mode, onChange,
}: { mode: AuthMode; onChange: (m: AuthMode) => void }) {
  return (
    <div className={styles.authTabs}>
      <button
        type="button"
        className={`${styles.authTab} ${mode === 'signin' ? styles.authTabActive : ''}`}
        onClick={() => onChange('signin')}
      >
        Sign In
      </button>
      <button
        type="button"
        className={`${styles.authTab} ${mode === 'signup' ? styles.authTabActive : ''}`}
        onClick={() => onChange('signup')}
      >
        Sign Up
      </button>
    </div>
  );
}
