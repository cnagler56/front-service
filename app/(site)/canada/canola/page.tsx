import CanadaPage from '@/src/components/canada/CanadaPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <CanadaPage commodity="CANOLA" commodityLabel="Canola" />;
}

export const metadata = pageMetadata('/canada/canola');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/canada/canola" />
    </>
  );
}
