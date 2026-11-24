import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import {
  AGENT_PAGE_PATHS,
  DOCS_HTML_URL_PATTERNS,
} from "./src/lib/docs/agent-docs-paths";
import {
  isSentryConfigured,
  sentryBuildOptions,
} from "./src/lib/sentry/config";
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
    // The app router owns the Vary header on HTML pages (rsc, router state)
    // and replaces anything the proxy sets there, so the Accept token for
    // content negotiation rides in a headers() entry as well. Generated
    // from agent-docs-paths.ts, never hand listed, so a new negotiated page
    // cannot be forgotten: locally these entries merge into the markdown
    // routes' own Vary. On Vercel the edge is expected to apply them to the
    // final HTML responses after the function, but that is not yet verified
    // against a deployment: nothing has been deployed from this branch, and
    // the PR keeps a post-deploy curl -sI check as a release gate for it.
    const negotiated = [
      ...DOCS_HTML_URL_PATTERNS,
      ...AGENT_PAGE_PATHS.map((path) => path.replaceAll(".", "\\.")),
    ];
    return [
      {
        headers: securityHeaders,
        source: "/:path*",
      },
      ...negotiated.map((source) => ({
        headers: [{ key: "Vary", value: "Accept" }],
        source,
      })),
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

// withSentryConfig must be the outermost wrapper. With no DSN configured it
// is never called, so no Sentry plugin runs, no upload is attempted, and the
// build prints no Sentry output.
const config = withPayload(nextConfig, { devBundleServerPackages: false });

export default isSentryConfigured()
  ? withSentryConfig(config, sentryBuildOptions())
  : config;
