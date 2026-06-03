'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /logout — clears the stored user + token, fires the same-tab event so the
 * NavigationBar flips Sign In ↔ Logout immediately, and redirects to /signin.
 * Lives next to SignInPage since both handle the auth session lifecycle.
 */
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('agri_user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('agri-auth-changed'));
    router.push('/signin');
  }, [router]);

  return (
    <p style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Lato, sans-serif', color: '#666' }}>
      Signing out…
    </p>
  );
}
