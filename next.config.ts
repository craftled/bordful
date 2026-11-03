import type { NextConfig } from 'next';
import config from './config';

const isDev = process.env.NODE_ENV === 'development';

// Origins of scripts in config.scripts are added automatically. Other
// third-party resources (iframes, remote fonts, etc.) need manual additions.
function scriptOrigins(): string[] {
  const scripts = [
    ...(config.scripts?.head ?? []),
    ...(config.scripts?.body ?? []),
  ];
  const origins = new Set<string>();

  for (const script of scripts) {
    const src = script?.src;
    if (typeof src !== 'string') {
      continue;
    }
    if (!(src.startsWith('https://') || src.startsWith('http://'))) {
      continue;
    }
    try {
      origins.add(new URL(src).origin);
    } catch {
      // Skip relative or invalid src values.
    }
  }

  return [...origins];
}

const thirdPartyScriptOrigins = scriptOrigins().join(' ');
const scriptOriginSuffix = thirdPartyScriptOrigins
  ? ` ${thirdPartyScriptOrigins}`
  : '';

// Content Security Policy. Next.js App Router without nonces needs
// 'unsafe-inline' for scripts and styles.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${scriptOriginSuffix}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${scriptOriginSuffix}${isDev ? ' ws: wss:' : ''}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  {
    key: 'Strict-Transport-Security',
    // includeSubDomains; preload can be added once every subdomain serves HTTPS.
    value: 'max-age=63072000',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          ...securityHeaders,
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
