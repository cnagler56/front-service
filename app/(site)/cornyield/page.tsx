import CornYieldPage from '@/src/components/cornyield/CornYieldPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <CornYieldPage />;
}

export const metadata = pageMetadata('/cornyield');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/cornyield" />
    </>
  );
}
