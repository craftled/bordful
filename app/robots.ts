import type { MetadataRoute } from 'next';
import config from '@/config';

export default function robots(): MetadataRoute.Robots {
  // Use the URL from config
  const baseUrl = config.url;

  return {
    rules: {
      userAgent: '*',
      // Allow root path and /api/og/* paths for Open Graph images
      allow: ['/', '/api/og/*'],
      // Disallow any potential admin or private routes
      disallow: ['/api/subscribe/*', '/api/encharge-logs/*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
