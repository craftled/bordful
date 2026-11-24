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
  DOCS_SLUGS,
  firstSentence,
  listDocs,
  readDoc,
} from "@/components/marketing/docs-content";
import { resolveDocHref } from "@/components/marketing/docs-markdown";
import { MARKETING_DESCRIPTION } from "@/components/marketing/site";
import { AGENT_PAGES } from "@/lib/docs/agent-pages";
import {
  AGENT_PAGE_PATHS,
  BOARD_AGENT_PAGE_PATHS,
  LLMS_FULL_TXT_PATH,
  llmsTxtDirective,
  markdownPathFor,
} from "./agent-docs-paths";

export {
  DOCS_MARKDOWN_ROUTE,
  docsHtmlPath,
  docsMarkdownPath,
  LLMS_FULL_TXT_PATH,
  LLMS_TXT_PATH,
  llmsTxtDirective,
} from "./agent-docs-paths";

// Static on the CDN; a deploy refreshes it, browsers revalidate.
export const AGENT_DOCS_CACHE_CONTROL = "public, max-age=0, must-revalidate";

// The plain-text body for 404s from the agent docs routes. Matched by afdocs
// soft-404 detection only as "Not found", never rendered as HTML.
export function notFoundText(): string {
  return "Not found\n";
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

// The body of one doc with every link made absolute, without the llms.txt
// directive. Unknown slugs return null.
export function docBody(slug: string, siteUrl: string): string | null {
  const source = readDoc(slug);
  if (source === null) {
    return null;
  }
  const normalized = source.replaceAll("\r\n", "\n");
  const body = absolutizeDocLinks(normalized, slug, siteUrl);
  return `${body.replace(TRAILING_NEWLINES, "")}\n`;
}

// The markdown version of one doc: the repo file with a llms.txt directive
// after the H1 and every link made absolute. Unknown slugs return null.
export function docMarkdown(slug: string, siteUrl: string): string | null {
  const body = docBody(slug, siteUrl);
  if (body === null) {
    return null;
  }
  const lines = body.split("\n");
  const h1 = lines.findIndex((line) => H1.test(line));
  if (h1 === -1) {
    return `${llmsTxtDirective(siteUrl)}\n\n${body}`;
  }
  // The doc's own blank line after the H1 is dropped so the directive is
  // framed by exactly one blank line on each side.
  let rest = h1 + 1;
  while (rest < lines.length && (lines[rest] ?? "").trim() === "") {
    rest += 1;
  }
  return [
    ...lines.slice(0, h1 + 1),
    "",
    llmsTxtDirective(siteUrl),
    "",
    ...lines.slice(rest),
  ].join("\n");
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

// The board index pages' titles, from their own page metadata. They have no
// static description (the HTML subtitle counts live rows), so llms.txt lists
// them without one.
export const BOARD_PAGE_TITLES: Readonly<Record<string, string>> = {
  "/companies": "Companies",
  "/jobs": "Jobs",
  "/jobs/languages": "Jobs by language",
  "/jobs/levels": "Jobs by level",
  "/jobs/locations": "Jobs by location",
  "/jobs/types": "Jobs by type",
};

// The llms.txt line for one agent page: the page's title, its markdown URL
// (built with markdownPathFor, so "/" lists /index.md) and the description
// its page metadata shows.
function agentPageLines(paths: readonly string[], siteUrl: string): string[] {
  return paths.flatMap((path) => {
    const page = AGENT_PAGES[path];
    if (page) {
      return [
        `- [${page.title}](${siteUrl}${markdownPathFor(path)}): ${page.description}`,
      ];
    }
    const title = BOARD_PAGE_TITLES[path];
    return title ? [`- [${title}](${siteUrl}${markdownPathFor(path)})`] : [];
  });
}

// The llms.txt sections, in order: the docs groups first (the sidebar order,
// the overview first), then the product pages, the alternatives, the board
// indexes and the optional legal pages.
// /llms.txt: the proposed llms.txt structure. Docs groups in sidebar order
// (the overview first), then one H2 per section of the public site. Every
// link is the page's markdown version; no job posting, archive or company
// detail URL is ever listed.
export function llmsTxt(siteUrl: string): string {
  const lines = [
    "# Bordful",
    "",
    `> ${MARKETING_DESCRIPTION}`,
    "",
    "Docs for deploying, configuring, theming and extending a Bordful job board. Every link below is the page's markdown version. The HTML page is the same URL without `.md`.",
    "",
    `The complete docs in one file: [llms-full.txt](${siteUrl}${LLMS_FULL_TXT_PATH})`,
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
  lines.push(
    "## Product",
    "",
    ...agentPageLines(
      AGENT_PAGE_PATHS.filter(
        (path) => AGENT_PAGES[path]?.section === "Product" && path !== "/"
      ),
      siteUrl
    ),
    ...agentPageLines(["/"], siteUrl),
    "",
    "## Alternatives",
    "",
    ...agentPageLines(
      AGENT_PAGE_PATHS.filter(
        (path) => AGENT_PAGES[path]?.section === "Alternatives"
      ),
      siteUrl
    ),
    "",
    "## Job board",
    "",
    ...agentPageLines(BOARD_AGENT_PAGE_PATHS, siteUrl),
    "",
    "## Optional",
    "",
    ...agentPageLines(
      AGENT_PAGE_PATHS.filter(
        (path) => AGENT_PAGES[path]?.section === "Optional"
      ),
      siteUrl
    )
  );
  return `${lines.join("\n").replace(TRAILING_NEWLINES, "")}\n`;
}

// /llms-full.txt: every docs page in one file. The pages appear in sidebar
// order (the overview first), each behind a `---` separator with a Source
// line, so an agent can read the whole documentation in one request. The
// directive is not repeated per page: the intro points at llms.txt instead.
export function llmsFullTxt(siteUrl: string): string {
  const lines = [
    "# Bordful docs",
    "",
    `> ${MARKETING_DESCRIPTION}`,
    "",
    `This is every documentation page in one file. The index with every other page lives in [llms.txt](${siteUrl}/llms.txt).`,
    "",
  ];
  const overview = docsIndexMarkdown(siteUrl).split("\n");
  lines.push(
    "---",
    "",
    `Source: ${siteUrl}/docs.md`,
    "",
    ...overview.slice(4),
    ""
  );
  for (const slug of DOCS_SLUGS) {
    const body = docBody(slug, siteUrl);
    if (body === null) {
      continue;
    }
    lines.push(
      "---",
      "",
      `Source: ${siteUrl}/docs/${slug}.md`,
      "",
      ...body.split("\n"),
      ""
    );
  }
  return `${lines.join("\n").replace(TRAILING_NEWLINES, "")}\n`;
}
