import CropSummaryPage from '@/src/components/cropSummary/CropSummaryPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <CropSummaryPage />;
}

export const metadata = pageMetadata('/report-summary');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/report-summary" />
    </>
  );
}
