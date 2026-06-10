'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, User } from './api';

/** Sign-out automatically after this many ms of total inactivity. */
const INACTIVITY_LIMIT_MS = 4 * 60 * 60 * 1000;     // 4 hours
/** How often the timer is checked. 60s is fine — it caps imprecision at one minute. */
const INACTIVITY_CHECK_MS = 60 * 1000;

/**
 * Single source of truth for "who's signed in." Replaces the prior
 * localStorage-driven approach.
 *
 * On mount, calls /me. If the session cookie is valid the server returns
 * the user; otherwise we treat the session as anonymous. Sign-in /
 * sign-up flows below update the in-memory state without a refetch.
 */
interface UserContextValue {
  /** Null while loading; null after explicit logout; populated after sign-in. */
  user: User | null;
  /** True only during the initial /me bootstrap. */
  loading: boolean;
  /** Sign in with email + password. Throws on auth failure. */
  signIn: (email: string, password: string) => Promise<User>;
  /** Register a new account. Throws on validation / conflict. */
  signUp: (body: SignUpBody) => Promise<User>;
  /** Clear the session both server-side and in memory. */
  signOut: () => Promise<void>;
  /** Force a /me refetch — useful if a profile edit just happened. */
  refresh: () => Promise<void>;
}

interface SignUpBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city?: string;
  state?: string;
  interest?: string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      setUser(await api.getMe());
    } catch {
      setUser(null);
    }
  }, []);

  // Bootstrap: ask the server who we are. Runs once.
  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try { await api.logout(); } catch { /* best effort */ }
    setUser(null);
  }, []);

  /**
   * Auto-logout after INACTIVITY_LIMIT_MS without input. Active tabs broadcast
   * their activity via BroadcastChannel so a user clicking around in another
   * tab keeps THIS tab's session alive. On expiry we sign out and bounce to
   * /signin with a reason flag the page reads to show a friendly banner.
   */
  useEffect(() => {
    if (!user) return;

    let lastActivity = Date.now();
    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('agri-activity')
      : null;

    const markActive = () => {
      lastActivity = Date.now();
      channel?.postMessage('active');
    };
    const onPeerActive = () => { lastActivity = Date.now(); };
    channel?.addEventListener('message', onPeerActive);

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, markActive, { passive: true }));

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        // Tear down listeners immediately so we don't queue another logout
        events.forEach(e => window.removeEventListener(e, markActive));
        channel?.close();
        window.clearInterval(interval);
        void signOut().then(() => router.push('/signin?reason=inactivity'));
      }
    }, INACTIVITY_CHECK_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, markActive));
      channel?.removeEventListener('message', onPeerActive);
      channel?.close();
      window.clearInterval(interval);
    };
  }, [user, signOut, router]);

  const signIn = useCallback(async (email: string, password: string) => {
    const fresh = await api.login(email, password);
    setUser(fresh);
    return fresh;
  }, []);

  const signUp = useCallback(async (body: SignUpBody) => {
    const fresh = await api.register(body);
    setUser(fresh);
    return fresh;
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Read-only hook for components that only need the user identity. Returns
 * the user (or null) and the loading flag. For mutating operations
 * (signIn / signOut), use {@link useAuth} instead.
 */
export function useUser(): { user: User | null; loading: boolean } {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  const { user, loading } = ctx;
  return { user, loading };
}

/** Full context — use this in the sign-in form, sign-up form, and logout page. */
export function useAuth(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useAuth must be used inside <UserProvider>');
  return ctx;
}
