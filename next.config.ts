import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  env: {
    AIRTABLE_ACCESS_TOKEN: process.env.AIRTABLE_ACCESS_TOKEN,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME,
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value:
              'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        ],
      },
      {
        // Apply specific headers to image files
        source: '/:path*.jpg',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, max-image-preview:large',
          },
        ],
      },
      {
        // Apply specific headers to image files
        source: '/:path*.jpeg',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, max-image-preview:large',
          },
        ],
      },
      {
        // Apply specific headers to image files
        source: '/:path*.png',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, max-image-preview:large',
          },
        ],
      },
      {
        // Apply specific headers to image files
        source: '/:path*.svg',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, max-image-preview:large',
          },
        ],
      },
      {
        // Apply specific headers to PDF files
        source: '/:path*.pdf',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, nosnippet',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
