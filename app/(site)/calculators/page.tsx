import CalculatorsPage from '@/src/components/calculators/CalculatorsPage';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/calculators');

export default function Page() {
  return <CalculatorsPage />;
}
