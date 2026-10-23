export const MARKETING_DESCRIPTION =
  "Open-source job board template built with Next.js, Payload, and Postgres. Deploy to Vercel and launch with real jobs from Bordfeed.";

export const GITHUB_URL = "https://github.com/craftled/bordful";

export const BORDFEED_PRICING_URL =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=marketing&utm_campaign=pricing";

export const BORDFEED_ABOUT_URL =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=marketing&utm_campaign=about";

export const SHOWCASE_ISSUE_URL =
  "https://github.com/craftled/bordful/issues/new?title=Showcase%3A%20";

export const SOCIAL_LINKS = [
  { href: GITHUB_URL, label: "GitHub" },
  { href: "https://twitter.com/bordful", label: "X" },
  { href: "https://linkedin.com/company/bordful", label: "LinkedIn" },
  { href: "https://bsky.app/profile/bordful.com", label: "Bluesky" },
  // r/bordful still had posts on 2026-10-23, so the source link stays.
  { href: "https://www.reddit.com/r/bordful/", label: "Reddit" },
] as const;
