import { Suspense } from 'react';
import SignInPage from '@/src/components/auth/SignInPage';
import { NOINDEX } from '@/src/lib/seo';

export const metadata = NOINDEX;

/**
 * SignInPage uses useSearchParams() (to read ?reason=inactivity), which the
 * App Router requires to sit inside a Suspense boundary — otherwise the
 * production build fails. The fallback renders nothing for the split second
 * before the client component hydrates.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  );
}
