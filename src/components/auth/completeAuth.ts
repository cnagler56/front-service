import { User } from '@/src/lib/api';

/**
 * Shared post-auth flow: persist the user, set the legacy token flag,
 * dispatch a same-tab event so the NavigationBar can flip Sign In ↔ Logout,
 * and bounce home. Used identically by sign-in and sign-up.
 */
export function completeAuth(
  user: User,
  router: { push: (href: string) => void; refresh: () => void },
): void {
  localStorage.setItem('agri_user', JSON.stringify(user));
  localStorage.setItem('token', 'logged_in');
  window.dispatchEvent(new Event('agri-auth-changed'));
  router.push('/');
  router.refresh();
}
