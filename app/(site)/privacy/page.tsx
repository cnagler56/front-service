import PrivacyPage from '@/src/components/legal/PrivacyPage';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/privacy');

export default function Page() {
  return <PrivacyPage />;
}
