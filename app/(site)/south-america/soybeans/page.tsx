import SouthAmericaPage from '@/src/components/southamerica/SouthAmericaPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <SouthAmericaPage
      commodity="SOYBEANS"
      commodityLabel="Soybeans"
      regions={[
        { key: 'SOUTH_AMERICA', label: 'All SA' },
        { key: 'BRAZIL', label: 'Brazil' },
        { key: 'ARGENTINA', label: 'Argentina' },
        { key: 'PARAGUAY', label: 'Paraguay' },
      ]}
    />
  );
}

export const metadata = pageMetadata('/south-america/soybeans');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/south-america/soybeans" />
    </>
  );
}
