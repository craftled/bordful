import { isMarketingEnabled } from "../../config/flags";

// Old bordful.com URLs from the pre-rebuild marketing site. The
// demo.bordful.com host rule stays in vercel.json and is not listed here.
export const legacyRedirects = [
  { destination: "/", source: "/blog", statusCode: 301 },
  { destination: "/", source: "/blog/:path*", statusCode: 301 },
  { destination: "/", source: "/use-cases", statusCode: 301 },
  { destination: "/", source: "/use-cases/:path*", statusCode: 301 },
  { destination: "/docs/deploy", source: "/docs/quick-start", statusCode: 301 },
  { destination: "/faq", source: "/help", statusCode: 301 },
  {
    destination: "/marketing/icon.svg",
    source: "/icon.png",
    statusCode: 301,
  },
  {
    destination: "/marketing/apple-icon.png",
    source: "/apple-icon.png",
    statusCode: 301,
  },
  {
    destination: "/manifest.webmanifest",
    source: "/manifest.json",
    statusCode: 301,
  },
] as const;

// Build-time gate: forks must not inherit bordful.com URL rewrites.
export function legacyRedirectsFor(
  env: Partial<NodeJS.ProcessEnv> = process.env
): (typeof legacyRedirects)[number][] {
  if (!isMarketingEnabled(env)) {
    return [];
  }

  return [...legacyRedirects];
}
