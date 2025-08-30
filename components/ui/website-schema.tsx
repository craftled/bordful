import Script from 'next/script';
import type {
  EntryPoint,
  Organization,
  SearchAction,
  WebSite,
  WithContext,
} from 'schema-dts';
import config from '@/config';

export function WebsiteSchema() {
  // We won't have an explicit disable option, so always render unless
  // the config is clearly missing required properties

  // Get base values from existing config
  const baseUrl =
    config.url || process.env.NEXT_PUBLIC_APP_URL || 'https://bordful.com';
  const siteName = config.nav.title;
  const siteDescription = config.description;

  // If there is no site name or URL, we can't create a valid schema
  if (!(siteName && baseUrl)) {
    return null;
  }

  // Derive social links from navigation settings
  const socialLinks = [];
  if (config.nav.github?.show && config.nav.github?.url) {
    socialLinks.push(config.nav.github.url);
  }
  if (config.nav.linkedin?.show && config.nav.linkedin?.url) {
    socialLinks.push(config.nav.linkedin.url);
  }
  if (config.nav.twitter?.show && config.nav.twitter?.url) {
    socialLinks.push(config.nav.twitter.url);
  }
  if (config.nav.bluesky?.show && config.nav.bluesky?.url) {
    socialLinks.push(config.nav.bluesky.url);
  }
  if (config.nav.reddit?.show && config.nav.reddit?.url) {
    socialLinks.push(config.nav.reddit.url);
  }

  // Always include search - it's a standard feature
  const includeSearch = true;

  // Create publisher entity based on site info
  const publisher: Organization = {
    '@type': 'Organization',
    name: siteName,
  };

  // Add logo if available
  if (config.nav.logo?.enabled && config.nav.logo?.src) {
    const logoUrl = config.nav.logo.src.startsWith('http')
      ? config.nav.logo.src
      : `${baseUrl}${config.nav.logo.src}`;

    publisher.logo = logoUrl;
  }

  // Build the schema data object
  const schemaData: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,

    // Add description if available
    ...(siteDescription && {
      description: siteDescription,
    }),

    // Add publisher data
    publisher,

    // Add social links if available
    ...(socialLinks.length > 0 && {
      sameAs: socialLinks,
    }),
  };

  // Add search actions
  if (includeSearch) {
    // Create search actions array
    const searchActions = [];

    // Standard search URL template for general site search
    const generalSearchUrlTemplate = `${baseUrl}/search?q={search_term_string}`;

    // Job-specific search URL template
    const jobSearchUrlTemplate = `${baseUrl}/jobs?q={search_term_string}`;

    // Always include general site search
    const generalSearchAction: SearchAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: generalSearchUrlTemplate,
      } as EntryPoint,
      description: 'Search across the entire site',
    };

    // Add non-standard query-input property required by Google
    const generalSearchWithQueryInput = {
      ...generalSearchAction,
      'query-input': 'required name=search_term_string',
    };

    searchActions.push(generalSearchWithQueryInput);

    // Job-specific search - always include as this is a job board
    const jobSearchAction: SearchAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: jobSearchUrlTemplate,
      } as EntryPoint,
      description: 'Search for jobs by title, skills, or keywords',
    };

    // Add non-standard query-input property required by Google
    const jobSearchWithQueryInput = {
      ...jobSearchAction,
      'query-input': 'required name=search_term_string',
    };

    searchActions.push(jobSearchWithQueryInput);

    // Assign the search actions to the schema
    // Cast to SearchAction to satisfy TypeScript
    schemaData.potentialAction =
      searchActions.length === 1
        ? (searchActions[0] as SearchAction)
        : (searchActions as SearchAction[]);
  }

  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
      id="website-schema"
      type="application/ld+json"
    />
  );
}
