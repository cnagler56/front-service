'use client';

import { useUser } from './UserContext';
import { User } from './api';

/**
 * Legacy hook name from when the user was read from localStorage. Now a
 * thin wrapper around {@link useUser} from the UserContext so old call sites
 * (which only need read access) keep working.
 *
 * New code should prefer `useUser()` (typed return) or `useAuth()` (mutating).
 */
export function useStoredUser(): User | null {
  return useUser().user;
}
