import UsdaResultsPage from '@/src/components/usdaResults/UsdaResultsPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <UsdaResultsPage />;
}

export const metadata = pageMetadata('/usda-results');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/usda-results" />
    </>
  );
}
