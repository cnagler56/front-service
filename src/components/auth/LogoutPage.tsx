'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/UserContext';

/**
 * /logout — calls the server to invalidate the session cookie, then clears
 * the in-memory user via the UserContext. Redirects to /signin.
 *
 * Lives in the auth folder since it's part of the auth lifecycle.
 */
export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    (async () => {
      await signOut();
      router.push('/signin');
    })();
  }, [router, signOut]);

  return (
    <p style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Lato, sans-serif', color: '#666' }}>
      Signing out…
    </p>
  );
}
