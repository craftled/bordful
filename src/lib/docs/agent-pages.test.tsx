// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { TAXONOMY_INDEX_PATH } from "@/components/board/taxonomy-tabs";
import { LlmsTxtPointer } from "@/components/llms-txt-pointer";
import { Bento } from "@/components/marketing/bento";
import { DOCS_SLUGS } from "@/components/marketing/docs-content";
import { FAQ_PAGE_HEADER, Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { PRICING_PAGE_HEADER, Pricing } from "@/components/marketing/pricing";
import { SectionHeader } from "@/components/marketing/section-header";
import { Statement } from "@/components/marketing/statement";
import { TechStack } from "@/components/marketing/tech-stack";
import { Timeline } from "@/components/marketing/timeline";
import { Walkthrough } from "@/components/marketing/walkthrough";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

import {
  AGENT_PAGE_PATHS,
  BOARD_AGENT_PAGE_PATHS,
  llmsTxtDirective,
  NO_MARKDOWN,
  STATIC_AGENT_PAGE_PATHS,
} from "./agent-docs-paths";
import { AGENT_PAGES, agentPageDescription, pageMarkdown } from "./agent-pages";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const siteUrl = "http://localhost:3000";
const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

test("the registry covers exactly the static page list", () => {
  expect(Object.keys(AGENT_PAGES).sort()).toEqual(
    [...STATIC_AGENT_PAGE_PATHS].sort()
  );
  for (const path of STATIC_AGENT_PAGE_PATHS) {
    expect(agentPageDescription(path), path).toBeTruthy();
  }
});

test("every sitemap section path is served or has a written reason", () => {
  const entries = buildSitemapEntries({
    alerts: true,
    jobs: [],
    marketing: true,
    postJob: true,
    siteUrl,
  });
  const paths = new Set(entries.map((entry) => new URL(entry.url).pathname));
  for (const path of Object.values(TAXONOMY_INDEX_PATH)) {
    paths.add(path);
  }

  const served = new Set<string>([
    ...AGENT_PAGE_PATHS,
    ...BOARD_AGENT_PAGE_PATHS,
    ...DOCS_SLUGS.map((slug) => `/docs/${slug}`),
    "/docs",
  ]);

  const missing = [...paths].filter(
    (path) => !(served.has(path) || path in NO_MARKDOWN)
  );
  expect(missing).toEqual([]);
});

const RELATIVE_LINK = /\]\((?!https?:|mailto:)[^)]+\)/u;
const FENCE = /^```/u;

function unfencedRelativeLinks(markdown: string): string[] {
  let inFence = false;
  return markdown.split("\n").filter((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
    }
    return !inFence && RELATIVE_LINK.test(line);
  });
}

test("every page renders markdown with a title, the directive and absolute links", () => {
  for (const path of STATIC_AGENT_PAGE_PATHS) {
    const markdown = pageMarkdown(path, siteUrl);
    expect(markdown, path).not.toBeNull();
    expect(markdown?.startsWith("# "), path).toBe(true);
    expect(markdown?.includes(llmsTxtDirective(siteUrl)), path).toBe(true);
    expect(markdown?.includes("](http://"), path).toBe(true);
    // No relative links outside code fences, no dash characters.
    expect(unfencedRelativeLinks(markdown ?? ""), path).toEqual([]);
    expect(markdown).not.toContain(EM_DASH);
    expect(markdown).not.toContain(EN_DASH);
  }
});

// -- Parity with the React pages ---------------------------------------------
//
// Mirrors afdocs' markdown-content-parity: every text segment the rendered
// page shows (a block-level line of 20+ characters, with button/nav/footer/
// aside, sr-only and data-markdown-ignore chrome removed) must appear in the
// markdown, and every rendered h1/h2/h3 must appear in it too.

const STRIP_TAGS = [
  "script",
  "style",
  "nav",
  "footer",
  "header",
  "noscript",
  "button",
  "svg",
  "aside",
  "select",
  "input",
  "textarea",
];

const BLOCK_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "ul",
  "ol",
  "td",
  "th",
  "tr",
  "dt",
  "dd",
  "div",
  "section",
  "article",
  "details",
  "summary",
  "blockquote",
  "pre",
  "figcaption",
  "figcaption",
]);

const WHITESPACE = /\s+/gu;

function normalize(value: string): string {
  return value.replace(WHITESPACE, " ").trim().toLowerCase();
}

function blockText(node: Node): string {
  if (node.nodeType === 3 /* TEXT_NODE */) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== 1 /* ELEMENT_NODE */) {
    return "";
  }
  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (
    STRIP_TAGS.includes(tag) ||
    element.hasAttribute("data-markdown-ignore")
  ) {
    return "";
  }
  if (element.classList.contains("sr-only")) {
    return "";
  }
  if (tag === "pre") {
    return `\n${element.textContent ?? ""}\n`;
  }
  const separator = BLOCK_TAGS.has(tag) ? "\n" : "";
  return (
    separator + [...element.childNodes].map(blockText).join("") + separator
  );
}

function pageSegments(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [
    ...new Set(
      blockText(doc.body)
        .split("\n")
        .map((line) => normalize(line))
        .filter((line) => line.length >= 20)
    ),
  ];
}

function pageHeadings(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [
    ...new Set(
      [...doc.body.querySelectorAll("h1,h2,h3")]
        .map((element) => normalize(element.textContent ?? ""))
        .filter((heading) => heading.length > 0)
    ),
  ];
}

// A markdown link, where the URL may wrap parts in one level of parentheses
// (the Vercel clone link does). Links reduce to their labels.
const MD_LINK = /\[(?<label>[^\]]+)\]\((?<url>[^()]*(?:\([^)]*\)[^()]*)*)\)/gu;

function markdownPlain(markdown: string): string {
  return normalize(
    markdown
      .replace(/```[\s\S]*?```/gu, " ")
      .replace(MD_LINK, "$<label>")
      .replace(/^#+\s+/gimu, "")
      .replace(/^>\s+/gimu, "")
      .replace(/^[-*]\s+/gimu, "")
      .replace(/^\d+\.\s+/gimu, "")
  );
}

function markdownCode(markdown: string): string {
  const lines: string[] = [];
  for (const block of markdown.matchAll(/```[\s\S]*?```/gu)) {
    lines.push(...(block[0] ?? "").split("\n"));
  }
  return normalize(lines.join("\n"));
}

function pointerHtml(): string {
  return render(<LlmsTxtPointer />).container.innerHTML;
}

function expectParity(path: string, html: string): void {
  const markdown = pageMarkdown(path, siteUrl);
  expect(markdown, path).not.toBeNull();
  const md = markdownPlain(markdown ?? "");
  const code = markdownCode(markdown ?? "");
  const full = `${html}${pointerHtml()}`;

  for (const segment of pageSegments(full)) {
    expect(
      md.includes(segment) || code.includes(segment),
      `${path}: "${segment}"`
    ).toBe(true);
  }
  for (const heading of pageHeadings(full)) {
    expect(md.includes(heading), `${path}: heading "${heading}"`).toBe(true);
  }
}

test("the home markdown matches the rendered sections", () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const html = [
    render(<Hero />).container.innerHTML,
    render(<TechStack />).container.innerHTML,
    render(<Statement />).container.innerHTML,
    render(<Walkthrough />).container.innerHTML,
    render(<Timeline />).container.innerHTML,
    render(<Bento />).container.innerHTML,
    render(<Pricing />).container.innerHTML,
    render(<Faq />).container.innerHTML,
    render(<FinalCta />).container.innerHTML,
  ].join("\n");
  expectParity("/", html);
});

test("the pricing markdown matches the rendered page", () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const html = [
    render(
      <SectionHeader
        description={PRICING_PAGE_HEADER.description}
        eyebrow={PRICING_PAGE_HEADER.eyebrow}
        headingLevel="h1"
        title={PRICING_PAGE_HEADER.title}
        titleMuted={PRICING_PAGE_HEADER.titleMuted}
      />
    ).container.innerHTML,
    render(<Pricing variant="standalone" />).container.innerHTML,
    render(
      <SectionHeader
        description={FAQ_PAGE_HEADER.description}
        headingLevel="h2"
        title={FAQ_PAGE_HEADER.title}
        titleMuted={FAQ_PAGE_HEADER.titleMuted}
      />
    ).container.innerHTML,
    render(<Faq variant="page" />).container.innerHTML,
  ].join("\n");
  expectParity("/pricing", html);
});

test("the features markdown matches the rendered page", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const { default: FeaturesPage } = await import(
    "@/app/(marketing)/features/page"
  );
  const html = [render(<FeaturesPage />).container.innerHTML].join("\n");
  expectParity("/features", html);
});

test("unknown paths return null", () => {
  expect(pageMarkdown("/nonexistent", siteUrl)).toBeNull();
  expect(pageMarkdown("/jobs/some-role", siteUrl)).toBeNull();
});
