'use client';

import Link from 'next/link';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

interface Props {
  /** What the visitor is trying to reach, e.g. "the Forecast Map". */
  feature?: string;
  children: React.ReactNode;
}

/**
 * Gate page content behind sign-in. The nav links stay visible to everyone, but
 * a guest who clicks through (or hits the URL directly) gets a prompt to log in
 * or create an account instead of the feature. Signed-in users see the children
 * — and because the children aren't rendered for guests, their data hooks don't
 * run either. We render nothing while auth is still bootstrapping to avoid a
 * flash of the prompt for users who are actually signed in.
 */
export default function AuthRequired({ feature = 'this feature', children }: Props) {
  const { user, loading } = useUser();

  if (loading) return null;
  if (user) return <>{children}</>;

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 460, margin: '3rem auto', textAlign: 'center' }}>
        <div className={styles.sectionHead}>
          <span>🔒</span>
          <h2>Sign in to continue</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', margin: '0 0 1.25rem' }}>
            {feature[0].toUpperCase() + feature.slice(1)} is available to members. Sign in or create a
            free account to use it.
          </p>
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signin" className={styles.btnSecondary} style={{ textDecoration: 'none' }}>
              Sign in
            </Link>
            <Link href="/signin?mode=signup" className={styles.btn} style={{ textDecoration: 'none' }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
