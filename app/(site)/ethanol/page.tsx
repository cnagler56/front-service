import EthanolPage from '@/src/components/ethanol/EthanolPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <EthanolPage />;
}

export const metadata = pageMetadata('/ethanol');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/ethanol" />
    </>
  );
}
