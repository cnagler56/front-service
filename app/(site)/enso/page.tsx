import EnsoPage from '@/src/components/enso/EnsoPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <EnsoPage />;
}

export const metadata = pageMetadata('/enso');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/enso" />
    </>
  );
}
