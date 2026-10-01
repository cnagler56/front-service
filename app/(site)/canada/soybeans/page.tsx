import CanadaPage from '@/src/components/canada/CanadaPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <CanadaPage commodity="SOYBEANS" commodityLabel="Soybeans" />;
}

export const metadata = pageMetadata('/canada/soybeans');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/canada/soybeans" />
    </>
  );
}
