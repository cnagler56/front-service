import BuySellPage from '@/src/components/buysell/BuySellPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <BuySellPage />;
}

export const metadata = pageMetadata('/buysell');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/buysell" />
    </>
  );
}
