import ForecastMapPage from '@/src/components/forecast/ForecastMapPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

// Public: the forecast map is read-only and a key draw for new visitors, so
// it's open without sign-in. (Editing tracked locations is still admin-gated.)
function PageContent() {
  return <ForecastMapPage />;
}

export const metadata = pageMetadata('/forecast-map');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/forecast-map" />
    </>
  );
}
