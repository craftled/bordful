// Dependency-free path helpers shared by the agent docs routes, the proxy and
// the pointer component. Keep this module free of node:fs imports so client
// components (and the proxy) can use it.

// Relative import: next.config.ts loads this module without tsconfig path
// aliases, so the chain has to stay alias-free all the way down.
import { ALTERNATIVE_SLUGS } from "../../components/marketing/alternatives/registry";

export const LLMS_TXT_PATH = "/llms.txt";

// The complete docs index, linked from every markdown page.
export const LLMS_FULL_TXT_PATH = "/llms-full.txt";

// Internal route prefix the proxy rewrites markdown requests to. Never linked.
export const DOCS_MARKDOWN_ROUTE = "/docs-md";

// Internal route prefix for the markdown versions of the public marketing and
// board index pages. Same rules as /docs-md: never linked, direct hits get
// the regular 404 page via the proxy.
export const PAGES_MARKDOWN_ROUTE = "/pages-md";

// The taxonomy index paths. Kept inline (not imported from
// @/components/board/taxonomy-tabs) so this module stays dependency free;
// agent-docs-paths.test.ts asserts the values match TAXONOMY_INDEX_PATH.
export const AGENT_TAXONOMY_INDEX_PATHS = [
  "/jobs/types",
  "/jobs/levels",
  "/jobs/locations",
  "/jobs/languages",
] as const;

// The static marketing pages that serve a markdown version at their own URL
// plus ".md" (the home page at "/index.md"). Same data as the sitemap: the
// registry is plain data with no node:fs import.
export const STATIC_AGENT_PAGE_PATHS: readonly string[] = [
  "/",
  "/pricing",
  "/features",
  "/faq",
  "/showcase",
  "/changelog",
  "/about",
  "/privacy",
  "/terms",
  "/alternatives",
  ...ALTERNATIVE_SLUGS.map((slug) => `/alternatives/${slug}`),
];

// The board index pages that serve a markdown version: the jobs and
// companies directories plus the four taxonomy indexes. Always rendered on
// demand (never at build time): the build must not open the database.
export const BOARD_AGENT_PAGE_PATHS: readonly string[] = [
  "/jobs",
  "/companies",
  ...AGENT_TAXONOMY_INDEX_PATHS,
];

export const AGENT_PAGE_PATHS: readonly string[] = [
  ...STATIC_AGENT_PAGE_PATHS,
  ...BOARD_AGENT_PAGE_PATHS,
];

// The sitemap section paths that have no markdown version, with the reason.
// agent-pages.test.ts walks buildSitemapEntries and fails when a section path
// is neither served by the markdown registry nor listed here.
export const NO_MARKDOWN: Readonly<Record<string, string>> = {
  "/alerts": "a sign-up form; the visible copy comes from site settings",
  "/post": "a Stripe payment form, not reading material",
};

export function docsHtmlPath(slug: string | null): string {
  return slug === null ? "/docs" : `/docs/${slug}`;
}

export function docsMarkdownPath(slug: string | null): string {
  return slug === null ? "/docs.md" : `/docs/${slug}.md`;
}

// "/" maps to "/index.md"; every other path maps to "<path>.md".
export function markdownPathFor(htmlPath: string): string {
  return htmlPath === "/" ? "/index.md" : `${htmlPath}.md`;
}

// The inverse of markdownPathFor: "/index.md" maps to "/", "<path>.md" maps
// to "<path>". Anything that is not a page's markdown URL returns null.
export function htmlPathFor(mdPath: string): string | null {
  if (mdPath === "/index.md") {
    return "/";
  }
  if (!mdPath.endsWith(".md")) {
    return null;
  }
  const html = mdPath.slice(0, -3);
  return html === "" || html === "/" ? null : html;
}

// The internal route path a public page URL rewrites to: "/" becomes
// "/pages-md/index" (never "/pages-md/"), everything else maps straight
// through after the route prefix.
export function pagesMarkdownRoutePath(htmlPath: string): string {
  return `${PAGES_MARKDOWN_ROUTE}${htmlPath === "/" ? "/index" : htmlPath}`;
}

// The agent-readable llms.txt directive, inserted after the H1 of every
// markdown page. Kept here so both agent-docs.ts and agent-pages.ts can use
// it without an import cycle.
export function llmsTxtDirective(siteUrl: string): string {
  return `> For the complete documentation index, see [llms.txt](${siteUrl}/llms.txt).`;
}

// next.config.ts header sources for the docs HTML paths. path-to-regexp
// syntax, not the regexes the proxy uses.
export const DOCS_HTML_URL_PATTERNS = ["/docs/:path*"] as const;
