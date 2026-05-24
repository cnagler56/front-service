'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('agri_user');
    localStorage.removeItem('token');
    router.push('/signin');
  }, [router]);

  return (
    <p style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Lato, sans-serif', color: '#666' }}>
      Signing out…
    </p>
  );
}
