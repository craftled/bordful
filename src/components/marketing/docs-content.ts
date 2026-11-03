// biome-ignore-all lint/performance/useTopLevelRegex: small build-time parser
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const DOCS_REPO_BASE = "https://github.com/craftled/bordful/blob/main";

export interface DocsGroup {
  slugs: string[];
  title: string;
}

// Sidebar order. Every file in /docs must be listed here; docs-content.test.ts
// checks that.
export const DOCS_GROUPS: DocsGroup[] = [
  { slugs: ["deploy", "configuration"], title: "Getting started" },
  { slugs: ["customization", "theming"], title: "Customize" },
  { slugs: ["bordfeed", "post-a-job", "alerts"], title: "Features" },
];

export const DOCS_SLUGS = DOCS_GROUPS.flatMap((group) => group.slugs);

const SLUG = /^[a-z0-9-]+$/u;

export function readDoc(slug: string): string | null {
  if (!(SLUG.test(slug) && DOCS_SLUGS.includes(slug))) {
    return null;
  }
  return readFileSync(join(process.cwd(), "docs", `${slug}.md`), "utf8");
}

export function docTitle(source: string, fallback: string): string {
  const match = /^#\s+(.+)$/mu.exec(source);
  return match?.[1]?.trim() ?? fallback;
}

export function docSummary(source: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex(
    (line) => line.trim() !== "" && !line.startsWith("#")
  );
  const text = start === -1 ? "" : (lines[start] ?? "").trim();
  return text.replace(/`/gu, "").replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1");
}

export interface DocsEntry {
  slug: string;
  summary: string;
  title: string;
}

export function listDocs(): DocsEntry[] {
  return DOCS_SLUGS.map((slug) => {
    const source = readDoc(slug) ?? "";
    return { slug, summary: docSummary(source), title: docTitle(source, slug) };
  });
}
