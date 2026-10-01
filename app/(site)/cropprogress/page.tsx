import CropProgressPage from '@/src/components/cropProgress/CropProgressPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <CropProgressPage />;
}

export const metadata = pageMetadata('/cropprogress');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/cropprogress" />
    </>
  );
}
