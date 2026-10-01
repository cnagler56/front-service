import type { MetadataRoute } from 'next';
import { PAGES, SITE_URL } from '@/src/lib/seo';

/** Every public page registered in src/lib/seo.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(PAGES).map(([path, page]) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
