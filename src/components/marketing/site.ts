export const MARKETING_DESCRIPTION =
  "Open-source job board template built with Next.js, Payload, and Postgres. Deploy to Vercel and launch with real jobs from Bordfeed.";

export const GITHUB_URL = "https://github.com/craftled/bordful";

export const BORDFEED_PRICING_URL =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=marketing&utm_campaign=pricing";

export const BORDFEED_ABOUT_URL =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=marketing&utm_campaign=about";

export const SHOWCASE_ISSUE_URL =
  "https://github.com/craftled/bordful/issues/new?title=Showcase%3A%20";

export const DOCS_URL = "https://github.com/craftled/bordful/tree/main/docs";

export const SOCIAL_LINKS = [
  {
    href: GITHUB_URL,
    icon: "/marketing/logos/github.svg",
    label: "GitHub",
    name: "GitHub, craftled/bordful",
  },
  {
    href: "https://twitter.com/bordful",
    icon: "/marketing/logos/twitter.svg",
    label: "X",
    name: "X, @bordful",
  },
  {
    href: "https://linkedin.com/company/bordful",
    icon: "/marketing/logos/linkedin.svg",
    label: "LinkedIn",
    name: "LinkedIn, Bordful",
  },
  {
    href: "https://bsky.app/profile/bordful.com",
    icon: "/marketing/logos/bluesky.svg",
    label: "Bluesky",
    name: "Bluesky, bordful.com",
  },
  // r/bordful still had posts on 2026-10-23, so the source link stays.
  {
    href: "https://www.reddit.com/r/bordful/",
    icon: "/marketing/logos/reddit.svg",
    label: "Reddit",
    name: "Reddit, r/bordful",
  },
] as const;
