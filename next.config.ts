import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/:path*",
      },
    ];
  },
  images: {
    contentDispositionType: "attachment",
    dangerouslyAllowSVG: false,
    localPatterns: [
      {
        pathname: "/api/media/file/**",
      },
    ],
    remotePatterns: [
      {
        hostname: "*.public.blob.vercel-storage.com",
        protocol: "https",
      },
      {
        hostname: "bordfeed.com",
        protocol: "https",
      },
      {
        hostname: "*.bordfeed.com",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
