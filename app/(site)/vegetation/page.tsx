import VegetationPage from '@/src/components/vegetation/VegetationPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <VegetationPage />;
}

export const metadata = pageMetadata('/vegetation');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/vegetation" />
    </>
  );
}
