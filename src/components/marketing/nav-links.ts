import { BORDFEED_ABOUT_URL, DOCS_URL, GITHUB_URL } from "./site";

export interface MarketingLink {
  href: string;
  label: string;
}

export interface MarketingLinkColumn {
  items: MarketingLink[];
  title: string;
}

// Only targets that exist on bordful.com. nav-links.test.ts checks the
// in-app ones against the route files.
export const MARKETING_HEADER_LINKS: MarketingLink[] = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/showcase", label: "Showcase" },
  { href: DOCS_URL, label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

export const MARKETING_FOOTER_COLUMNS: MarketingLinkColumn[] = [
  {
    items: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/showcase", label: "Showcase" },
      { href: "/changelog", label: "Changelog" },
    ],
    title: "Product",
  },
  {
    items: [
      { href: DOCS_URL, label: "Docs" },
      { href: GITHUB_URL, label: "GitHub" },
      { href: "/jobs", label: "Live demo" },
      { href: "/feed.xml", label: "RSS" },
      { href: BORDFEED_ABOUT_URL, label: "Bordfeed" },
    ],
    title: "Resources",
  },
  {
    items: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
    title: "Company",
  },
];
