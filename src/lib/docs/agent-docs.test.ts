import { afterEach, expect, test, vi } from "vitest";

import {
  DOCS_GROUPS,
  DOCS_OVERVIEW,
  DOCS_REPO_BASE,
  DOCS_SLUGS,
  firstSentence,
  listDocs,
  readDoc,
} from "@/components/marketing/docs-content";
import {
  absolutizeDocLinks,
  docBody,
  docMarkdown,
  docsIndexMarkdown,
  llmsFullTxt,
  llmsTxt,
  llmsTxtDirective,
} from "./agent-docs";
import {
  BOARD_AGENT_PAGE_PATHS,
  LLMS_FULL_TXT_PATH,
  LLMS_TXT_PATH,
  markdownPathFor,
  STATIC_AGENT_PAGE_PATHS,
} from "./agent-docs-paths";
import { AGENT_PAGES } from "./agent-pages";

const siteUrl = "http://localhost:3000";

// Any absolute markdown link on this site: a docs page or a public page.
const ABSOLUTE_MD_LINK = /\]\(http:\/\/localhost:3000\/(?:[^)]+)?\.md\)/u;
const RELATIVE_LINK = /\]\((?!https?:\/\/|mailto:)/u;
const H1 = /^#\s/u;

afterEach(() => {
  vi.unstubAllEnvs();
});

test("llmsTxt lists every docs page as an absolute markdown link", () => {
  const text = llmsTxt(siteUrl);
  expect(text.startsWith("# Bordful\n\n> ")).toBe(true);

  const h2s = text
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3));
  // The docs groups come first, in sidebar order, then the site sections.
  expect(h2s.slice(0, DOCS_GROUPS.length)).toEqual(
    DOCS_GROUPS.map((group) => group.title)
  );

  const linkLines = text.split("\n").filter((line) => line.startsWith("- ["));
  // Overview plus every doc, every static agent page and every board index.
  expect(linkLines).toHaveLength(
    DOCS_SLUGS.length +
      1 +
      STATIC_AGENT_PAGE_PATHS.length +
      BOARD_AGENT_PAGE_PATHS.length
  );
  expect(linkLines[0]).toContain(`(${siteUrl}/docs.md)`);
  for (const line of linkLines) {
    expect(line).toMatch(ABSOLUTE_MD_LINK);
  }
  for (const slug of DOCS_SLUGS) {
    expect(text).toContain(`(${siteUrl}/docs/${slug}.md)`);
  }
  expect(text.length).toBeLessThan(50_000);
});

test("llmsTxtDirective is the exact blockquote", () => {
  expect(llmsTxtDirective(siteUrl)).toBe(
    `> For the complete documentation index, see [llms.txt](${siteUrl}/llms.txt).`
  );
});

test("absolutizeDocLinks rewrites doc, anchor, fragment and repo links", () => {
  const source = [
    "See [deploy](deploy.md) and [env](deploy.md#environment-variables).",
    "See [credits](bordfeed.md#credits-per-sync).",
    "Anchor [daily](#daily-sync).",
    "Repo [upgrading](../UPGRADING.md) and [readme](../README.md).",
    "External [site](https://example.com) and [mail](mailto:a@b.c).",
    "Inline code `[x](deploy.md)` is untouched.",
    "",
    "```",
    "Fenced [x](deploy.md) is untouched.",
    "```",
  ].join("\n");
  const out = absolutizeDocLinks(source, "configuration", siteUrl);
  expect(out).toContain(`[deploy](${siteUrl}/docs/deploy.md)`);
  expect(out).toContain(
    `[env](${siteUrl}/docs/deploy.md#environment-variables)`
  );
  expect(out).toContain(
    `[credits](${siteUrl}/docs/bordfeed.md#credits-per-sync)`
  );
  expect(out).toContain(`[daily](${siteUrl}/docs/configuration.md#daily-sync)`);
  expect(out).toContain(`[upgrading](${DOCS_REPO_BASE}/UPGRADING.md)`);
  expect(out).toContain(`[readme](${DOCS_REPO_BASE}/README.md)`);
  expect(out).toContain("[site](https://example.com)");
  expect(out).toContain("[mail](mailto:a@b.c)");
  expect(out).toContain("`[x](deploy.md)`");
  expect(out).toContain("Fenced [x](deploy.md) is untouched.");
});

test("every doc renders markdown with the H1, directive and absolute links", () => {
  for (const slug of DOCS_SLUGS) {
    const source = (readDoc(slug) ?? "").replaceAll("\r\n", "\n");
    const markdown = docMarkdown(slug, siteUrl) ?? "";
    const lines = markdown.split("\n");
    expect(lines[0]).toMatch(H1);
    expect(lines[0]).toBe(
      source.split("\n").find((line) => H1.test(line)) ?? lines[0]
    );
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe(llmsTxtDirective(siteUrl));
    expect(lines[3]).toBe("");
    // Fences stay balanced.
    const fences = lines.filter((line) => line.startsWith("```"));
    expect(fences.length % 2).toBe(0);
    // No relative markdown links outside fences.
    let inFence = false;
    for (const line of lines) {
      if (line.startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (!inFence) {
        expect(line).not.toMatch(RELATIVE_LINK);
      }
    }
    // Parity: every source line without a link appears verbatim.
    for (const line of source.split("\n")) {
      if (!line.includes("](")) {
        expect(markdown).toContain(line);
      }
    }
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  }
});

test("docMarkdown returns null for unknown slugs", () => {
  expect(docMarkdown("nope", siteUrl)).toBeNull();
  expect(docMarkdown("../package", siteUrl)).toBeNull();
});

test("docsIndexMarkdown mirrors the React overview", () => {
  const markdown = docsIndexMarkdown(siteUrl);
  expect(markdown).toContain(`# ${DOCS_OVERVIEW.title}`);
  expect(markdown).toContain(llmsTxtDirective(siteUrl));
  expect(markdown).toContain(DOCS_OVERVIEW.lede);
  const expected = listDocs().map(
    (entry) =>
      `- [${entry.title}](${siteUrl}/docs/${entry.slug}.md): ${firstSentence(entry.summary)}`
  );
  const actual = markdown.split("\n").filter((line) => line.startsWith("- ["));
  expect(actual).toEqual(expected);
});

test("llmsTxt links the llms-full.txt file and every agent page", () => {
  const text = llmsTxt(siteUrl);
  expect(text).toContain(`[llms-full.txt](${siteUrl}${LLMS_FULL_TXT_PATH})`);
  for (const path of STATIC_AGENT_PAGE_PATHS) {
    const page = AGENT_PAGES[path];
    expect(page, `no agent page for ${path}`).toBeDefined();
    expect(text).toContain(
      `[${page?.title}](${siteUrl}${markdownPathFor(path)})`
    );
    expect(text).toContain(page?.description ?? "");
  }
  for (const path of BOARD_AGENT_PAGE_PATHS) {
    expect(text).toContain(`${siteUrl}${markdownPathFor(path)}`);
  }
});

// No job posting, company detail or archive URLs: /jobs/<kind>/<value>
// archives would need a whole page per value.
const JOB_DETAIL_URL =
  /\/jobs\/(?!types\.md|levels\.md|locations\.md|languages\.md)[a-z0-9-]+/u;

test("llmsTxt stays small, links no job URLs and uses no dash characters", () => {
  const text = llmsTxt(siteUrl);
  expect(text.length).toBeLessThan(50_000);
  expect(text).not.toMatch(JOB_DETAIL_URL);
  expect(text).not.toContain("\u2014");
  expect(text).not.toContain("\u2013");
});

test("llmsFullTxt carries every docs page in sidebar order without repeating the directive", () => {
  const text = llmsFullTxt(siteUrl);
  expect(text).toContain("# Bordful docs");
  expect(text).toContain(`[llms.txt](${siteUrl}${LLMS_TXT_PATH})`);
  // The directive is not repeated once per page: llms-full.txt points at
  // llms.txt once instead.
  expect(text.split(llmsTxtDirective(siteUrl)).length - 1).toBe(0);

  // Every page appears behind a Source line, overview first, then sidebar order.
  const sources = [`Source: ${siteUrl}/docs.md`];
  for (const slug of DOCS_SLUGS) {
    sources.push(`Source: ${siteUrl}/docs/${slug}.md`);
  }
  const positions = sources.map((source) => text.indexOf(source));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((left, right) => left - right));

  // The overview lede and every doc body are present.
  expect(text).toContain(DOCS_OVERVIEW.lede);
  for (const slug of DOCS_SLUGS) {
    const body = docBody(slug, siteUrl);
    expect(body).not.toBeNull();
    // The H1 line of every doc body rides along in the full file.
    expect(text).toContain(
      `# ${listDocs().find((entry) => entry.slug === slug)?.title ?? ""}`
    );
  }
  expect(text.length).toBeLessThan(50_000);
});
