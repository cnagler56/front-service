import FeedbackInboxPage from '@/src/components/feedback/FeedbackInboxPage';
import { NOINDEX } from '@/src/lib/seo';

export const metadata = NOINDEX;

export default function Page() {
  return <FeedbackInboxPage />;
}
