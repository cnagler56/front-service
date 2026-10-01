import LogoutPage from '@/src/components/auth/LogoutPage';
import { NOINDEX } from '@/src/lib/seo';

export const metadata = NOINDEX;

export default function Page() {
  return <LogoutPage />;
}
