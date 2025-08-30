'use client';

import type { FC } from 'react';
import type { AboutPage, WithContext } from 'schema-dts';
import config from '@/config';

type AboutSchemaProps = {
  companyName?: string;
  description?: string;
  url?: string;
  logo?: string;
};

export const AboutSchema: FC<AboutSchemaProps> = ({
  companyName = config.title,
  description = 'Learn about our mission to connect talented professionals with exciting career opportunities.',
  url = `${config.url}/about` || 'https://example.com/about',
  logo = config.nav?.logo?.enabled
    ? `${config.url}${config.nav.logo.src}`
    : undefined,
}) => {
  // Create type-safe schema using schema-dts
  const aboutSchema: WithContext<AboutPage> = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${companyName}`,
    description,
    mainEntity: {
      '@type': 'Organization',
      name: companyName,
      description,
      url: config.url,
      ...(logo && { logo }),
    },
    url,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      type="application/ld+json"
    />
  );
};
