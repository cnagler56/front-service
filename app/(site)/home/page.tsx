import Home from "@/src/components/Home/Home";
import { pageMetadata } from '@/src/lib/seo';

// Duplicate of the home page; the canonical tag points Google at "/".
export const metadata = pageMetadata('/');

export default function HomePage() {
  return <Home />;
}
