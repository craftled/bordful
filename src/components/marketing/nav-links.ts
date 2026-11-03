import { BORDFEED_ABOUT_URL, GITHUB_URL } from "./site";

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
  { href: "/features", label: "Product" },
  { href: "/showcase", label: "Showcase" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

export const MARKETING_FOOTER_COLUMNS: MarketingLinkColumn[] = [
  {
    items: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/showcase", label: "Showcase" },
      { href: "/changelog", label: "Changelog" },
    ],
    title: "Product",
  },
  {
    items: [
      { href: "/docs", label: "Docs" },
      { href: "/faq", label: "FAQ" },
      { href: "/jobs", label: "Live demo" },
      { href: GITHUB_URL, label: "GitHub" },
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
