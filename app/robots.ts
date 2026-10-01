import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/src/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Account and subscriber pages carry a noindex tag instead; a Disallow
      // here would stop Google from ever seeing that tag.
      disallow: ['/admin/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
