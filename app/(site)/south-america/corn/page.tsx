import SouthAmericaPage from '@/src/components/southamerica/SouthAmericaPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <SouthAmericaPage
      commodity="CORN"
      commodityLabel="Corn"
      regions={[
        { key: 'SOUTH_AMERICA', label: 'All SA' },
        { key: 'BRAZIL', label: 'Brazil' },
        { key: 'ARGENTINA', label: 'Argentina' },
      ]}
    />
  );
}

export const metadata = pageMetadata('/south-america/corn');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/south-america/corn" />
    </>
  );
}
