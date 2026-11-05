import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { legacyRedirectsFor } from "./src/lib/seo/legacy-redirects";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

// Each doc's last commit date, read once at build time. Serverless functions
// ship without .git, so the docs pages cannot ask git at request time.
function docsUpdatedDates(): Record<string, string> {
  const dates: Record<string, string> = {};
  try {
    const git = (args: string[]) =>
      execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5000,
      }).trim();
    if (git(["rev-parse", "--is-shallow-repository"]) !== "false") {
      return dates;
    }
    for (const file of readdirSync("docs")) {
      if (!file.endsWith(".md")) {
        continue;
      }
      const date = git(["log", "-1", "--format=%cs", "--", `docs/${file}`]);
      if (ISO_DATE.test(date)) {
        dates[file.slice(0, -3)] = date;
      }
    }
  } catch {
    // No git (or a shallow clone): the docs pages show no date.
  }
  return dates;
}

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
  env: {
    BORDFUL_DOCS_UPDATED: JSON.stringify(docsUpdatedDates()),
  },
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
  async redirects() {
    return legacyRedirectsFor().map((redirect) => ({ ...redirect }));
  },
  // `bun run typecheck` runs in CI and in `bun run check`. Running tsc again
  // inside `next build` added about nine seconds to every Vercel deploy.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
