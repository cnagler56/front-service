import { Suspense } from 'react';
import UsdaReportsPage from '@/src/components/usdaReports/UsdaReportsPage';
import UsdaReportsFromUrl from '@/src/components/usdaReports/UsdaReportsFromUrl';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/usda-reports');

/**
 * The ?report= tab is read in the browser (UsdaReportsFromUrl) rather than via
 * the searchParams prop, which would make this page server-render on every
 * request. useSearchParams() must sit inside Suspense; the fallback renders
 * the default tab so the static HTML still has the page content.
 */
export default function Page() {
  return (
    <>
      <Suspense fallback={<UsdaReportsPage />}>
        <UsdaReportsFromUrl />
      </Suspense>
      <PageAbout path="/usda-reports" />
    </>
  );
}
