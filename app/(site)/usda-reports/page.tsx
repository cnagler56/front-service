import UsdaReportsPage from '@/src/components/usdaReports/UsdaReportsPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/usda-reports');

export default function Page({ searchParams }: { searchParams: { report?: string } }) {
  return (
    <>
      <UsdaReportsPage initialReport={searchParams?.report} />
      <PageAbout path="/usda-reports" />
    </>
  );
}
