import WeatherPage from '@/src/components/weather/WeatherPage';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return <WeatherPage />;
}

export const metadata = pageMetadata('/weather');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/weather" />
    </>
  );
}
