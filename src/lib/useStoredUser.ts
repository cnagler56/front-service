'use client';

import { useEffect, useState } from 'react';
import { User } from './api';

/**
 * Read the signed-in user from localStorage. Returns null until the effect
 * has run (which means SSR sees null too — important for hydration safety).
 *
 * Used by the half-dozen pages that need to greet the user, default form
 * fields, or gate writes by user identity.
 */
export function useStoredUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore corrupt storage */ }
  }, []);
  return user;
}
