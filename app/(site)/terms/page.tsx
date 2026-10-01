import TermsPage from '@/src/components/legal/TermsPage';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/terms');

export default function Page() {
  return <TermsPage />;
}
