import Home from "@/src/components/Home/Home";
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <Home />;
}

export const metadata = pageMetadata('/');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/" />
    </>
  );
}
