import ForgotPasswordPage from '@/src/components/auth/ForgotPasswordPage';
import { NOINDEX } from '@/src/lib/seo';

export const metadata = NOINDEX;

export default function Page() {
  return <ForgotPasswordPage />;
}
