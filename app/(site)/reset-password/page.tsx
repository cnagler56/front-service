import { Suspense } from 'react';
import ResetPasswordPage from '@/src/components/auth/ResetPasswordPage';

/**
 * ResetPasswordPage uses useSearchParams() to read ?token — which the App
 * Router requires inside a Suspense boundary or the production build fails.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}
