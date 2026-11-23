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
  docMarkdown,
  docsIndexMarkdown,
  llmsTxt,
  llmsTxtDirective,
} from "./agent-docs";

const siteUrl = "http://localhost:3000";

const ABSOLUTE_MD_LINK =
  /\]\(http:\/\/localhost:3000\/docs(?:\/[a-z0-9-]+)?\.md\)/u;
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
  expect(h2s).toEqual(DOCS_GROUPS.map((group) => group.title));

  const linkLines = text.split("\n").filter((line) => line.startsWith("- ["));
  // Overview plus every doc.
  expect(linkLines).toHaveLength(DOCS_SLUGS.length + 1);
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
