import UsdaChallengePage from '@/src/components/usdaChallenge/UsdaChallengePage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <UsdaChallengePage />;
}

export const metadata = pageMetadata('/usda-challenge');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/usda-challenge" />
    </>
  );
}
