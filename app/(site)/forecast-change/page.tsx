import ForecastChangePage from '@/src/components/forecast/ForecastChangePage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

// Public: read-only forecast comparison, open without sign-in so visitors can
// explore it. Add/edit/delete/refresh controls remain admin-only in the page.
function PageContent() {
  return <ForecastChangePage />;
}

export const metadata = pageMetadata('/forecast-change');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/forecast-change" />
    </>
  );
}
