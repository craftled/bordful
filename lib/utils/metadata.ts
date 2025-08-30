import type { Metadata } from 'next';
import type { BreadcrumbList, ListItem, WithContext } from 'schema-dts';
import config from '@/config';

type OpenGraphType =
  | 'website'
  | 'article'
  | 'book'
  | 'profile'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other';

type MetadataParams = {
  title: string;
  description: string;
  path: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: OpenGraphType;
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

/**
 * Generates consistent metadata with proper hreflang tags for any page
 * @param params Metadata parameters including title, description, and path
 * @returns Next.js Metadata object with proper hreflang tags
 */
export function generateMetadata({
  title,
  description,
  path,
  openGraph,
}: MetadataParams): Metadata {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Create full URLs for hreflang tags
  const pageUrl = `${config.url}${normalizedPath}`;

  // Build the Twitter metadata object
  const twitterMetadata: Record<string, string> = {
    card: 'summary_large_image',
    title,
    description,
  };

  // Only add site handle if Twitter is enabled and URL is provided
  if (config.nav.twitter.show && config.nav.twitter.url) {
    const twitterUrl = config.nav.twitter.url;
    const twitterHandle = twitterUrl.split('/').pop();
    if (twitterHandle) {
      twitterMetadata.site = `@${twitterHandle}`;
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: normalizedPath,
      languages: {
        en: pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      title: openGraph?.title || title,
      description: openGraph?.description || description,
      type: openGraph?.type || 'website',
      url: pageUrl,
      ...(openGraph?.images && { images: openGraph.images }),
    },
    twitter: twitterMetadata,
  };
}

/**
 * Generates schema.org breadcrumb markup for SEO
 * @param items Array of breadcrumb items with name and URL
 * @returns JSON string of schema.org breadcrumb markup
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): string {
  type SchemaListItem = {
    '@type': string;
    position: number;
    name: string;
    item?: string;
  };

  // Create type-safe schema using schema-dts
  const breadcrumbSchema: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLastItem = index === items.length - 1;
      const listItem: SchemaListItem = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };

      // For the last item, omit the item property entirely
      // For other items, use a simple URL string with the full URL
      if (!isLastItem) {
        listItem.item = `${config.url}${item.url}`;
      }

      return listItem as ListItem;
    }),
  };

  return JSON.stringify(breadcrumbSchema);
}
