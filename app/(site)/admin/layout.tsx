import { NOINDEX } from '@/src/lib/seo';

/** Admin tools: keep every /admin page out of search results. */
export const metadata = NOINDEX;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
