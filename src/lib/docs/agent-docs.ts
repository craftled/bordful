// String builders for the agent-readable docs: /llms.txt and the markdown
// versions of the docs pages. Pure functions over docs-content.ts so the React
// pages and the generated markdown cannot drift. Server only: docs-content
// reads /docs from disk.
// biome-ignore-all lint/performance/useTopLevelRegex: small build-time generators
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here

import {
  DOCS_GROUPS,
  DOCS_OVERVIEW,
  DOCS_REPO_BASE,
  firstSentence,
  listDocs,
  readDoc,
} from "@/components/marketing/docs-content";
import { resolveDocHref } from "@/components/marketing/docs-markdown";
import { MARKETING_DESCRIPTION } from "@/components/marketing/site";

export {
  DOCS_MARKDOWN_ROUTE,
  docsHtmlPath,
  docsMarkdownPath,
  LLMS_TXT_PATH,
} from "./agent-docs-paths";

// Static on the CDN; a deploy refreshes it, browsers revalidate.
export const AGENT_DOCS_CACHE_CONTROL = "public, max-age=0, must-revalidate";

// The plain-text body for 404s from the agent docs routes. Matched by afdocs
// soft-404 detection only as "Not found", never rendered as HTML.
export function notFoundText(): string {
  return "Not found\n";
}

export function llmsTxtDirective(siteUrl: string): string {
  return `> For the complete documentation index, see [llms.txt](${siteUrl}/llms.txt).`;
}

const FENCE = /^```/u;
const INLINE_CODE = /(`[^`]+`)/u;
const LINK = /\[(?<text>[^\]]+)\]\((?<href>[^)]+)\)/gu;
const DOC_PATH = /^\/docs\/(?<slug>[a-z0-9-]+)(?<fragment>#[\w-]+)?$/u;
const SCHEME = /^(?:https?:|mailto:)/u;
const H1 = /^#\s/u;
const TRAILING_NEWLINES = /\n+$/u;

function rewriteHref(href: string, slug: string, siteUrl: string): string {
  if (SCHEME.test(href)) {
    return href;
  }
  if (href.startsWith("#")) {
    return `${siteUrl}/docs/${slug}.md${href}`;
  }
  const resolved = resolveDocHref(href, DOCS_REPO_BASE);
  const docPath = DOC_PATH.exec(resolved);
  if (docPath?.groups) {
    return `${siteUrl}/docs/${docPath.groups.slug}.md${
      docPath.groups.fragment ?? ""
    }`;
  }
  return resolved;
}

function rewriteLine(line: string, slug: string, siteUrl: string): string {
  // Inline code spans are left alone: only the prose around them is rewritten.
  return line
    .split(INLINE_CODE)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(
            LINK,
            (_match, text: string, href: string) =>
              `[${text}](${rewriteHref(href, slug, siteUrl)})`
          )
    )
    .join("");
}

// Every relative link in a doc becomes absolute: docs pages point at their
// own markdown URL, repo files at GitHub. Fenced code blocks are untouched.
export function absolutizeDocLinks(
  source: string,
  slug: string,
  siteUrl: string
): string {
  let inFence = false;
  return source
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : rewriteLine(line, slug, siteUrl);
    })
    .join("\n");
}

// The markdown version of one doc: the repo file with a llms.txt directive
// after the H1 and every link made absolute. Unknown slugs return null.
export function docMarkdown(slug: string, siteUrl: string): string | null {
  const source = readDoc(slug);
  if (source === null) {
    return null;
  }
  const normalized = source.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const h1 = lines.findIndex((line) => H1.test(line));
  const head = h1 === -1 ? [] : [lines[h1] as string];
  const rest =
    h1 === -1 ? lines : lines.slice(0, h1).concat(lines.slice(h1 + 1));
  const intro = [...head, "", llmsTxtDirective(siteUrl), "", ...rest].join(
    "\n"
  );
  const body = absolutizeDocLinks(intro, slug, siteUrl);
  return `${body.replace(TRAILING_NEWLINES, "")}\n`;
}

// The markdown version of the docs overview, mirroring the React page: the
// same title, directive, lede and card list (listDocs order, flat).
export function docsIndexMarkdown(siteUrl: string): string {
  const lines = [
    `# ${DOCS_OVERVIEW.title}`,
    "",
    llmsTxtDirective(siteUrl),
    "",
    DOCS_OVERVIEW.lede,
    "",
  ];
  for (const entry of listDocs()) {
    lines.push(
      `- [${entry.title}](${siteUrl}/docs/${entry.slug}.md): ${firstSentence(entry.summary)}`
    );
  }
  return `${lines.join("\n")}\n`;
}

// /llms.txt: one H2 per docs group in sidebar order, the overview first in
// the first group, exactly like the sidebar. Docs pages only.
export function llmsTxt(siteUrl: string): string {
  const lines = [
    "# Bordful",
    "",
    `> ${MARKETING_DESCRIPTION}`,
    "",
    "Docs for deploying, configuring, theming and extending a Bordful job board. Every link below is the page's markdown version. The HTML page is the same URL without `.md`.",
    "",
  ];
  const entries = listDocs();
  DOCS_GROUPS.forEach((group, groupIndex) => {
    lines.push(`## ${group.title}`, "");
    if (groupIndex === 0) {
      lines.push(`- [Overview](${siteUrl}/docs.md): ${DOCS_OVERVIEW.lede}`);
    }
    for (const slug of group.slugs) {
      const entry = entries.find((item) => item.slug === slug);
      if (entry) {
        lines.push(
          `- [${entry.title}](${siteUrl}/docs/${slug}.md): ${firstSentence(entry.summary)}`
        );
      }
    }
    lines.push("");
  });
  return `${lines.join("\n").replace(TRAILING_NEWLINES, "")}\n`;
}
