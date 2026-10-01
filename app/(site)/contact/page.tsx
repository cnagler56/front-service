import ContactPage from '@/src/components/contact/ContactPage';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/contact');

export default function Page() {
  return <ContactPage />;
}
