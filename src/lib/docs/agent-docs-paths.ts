// Dependency-free path helpers shared by the agent docs routes, the proxy and
// the pointer component. Keep this module free of node:fs imports so client
// components (and the proxy) can use it.

export const LLMS_TXT_PATH = "/llms.txt";

// Internal route prefix the proxy rewrites markdown requests to. Never linked.
export const DOCS_MARKDOWN_ROUTE = "/docs-md";

export function docsHtmlPath(slug: string | null): string {
  return slug === null ? "/docs" : `/docs/${slug}`;
}

export function docsMarkdownPath(slug: string | null): string {
  return slug === null ? "/docs.md" : `/docs/${slug}.md`;
}
