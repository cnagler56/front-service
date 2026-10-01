import OutlookPage from '@/src/components/weather/OutlookPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <OutlookPage />;
}

export const metadata = pageMetadata('/outlook');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/outlook" />
    </>
  );
}
