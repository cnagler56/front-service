import EnergyPage from '@/src/components/energy/EnergyPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <EnergyPage />;
}

export const metadata = pageMetadata('/energy');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/energy" />
    </>
  );
}
