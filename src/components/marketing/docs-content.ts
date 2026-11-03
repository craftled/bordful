// biome-ignore-all lint/performance/useTopLevelRegex: small build-time parser
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here
import { execFileSync } from "node:child_process";
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

// The docs index shows a doc's opening sentence, so a long first paragraph
// never ends mid-word. A lead-in that ends with a colon reads as a sentence.
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = /^.*?[.!?](?=\s|$)/u.exec(trimmed);
  const sentence = (match?.[0] ?? trimmed).trim();
  return sentence.endsWith(":") ? `${sentence.slice(0, -1)}.` : sentence;
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

// The date of the last commit that touched a doc, read from git when the page
// is built. A shallow clone (or no git at all) cannot tell when a file last
// changed, so it returns null and the page shows no date rather than a wrong
// one.
// Filled by next.config.ts at build time.
function builtDocDates(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(
      process.env.BORDFUL_DOCS_UPDATED ?? "{}"
    );
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function docLastUpdated(slug: string): string | null {
  if (!(SLUG.test(slug) && DOCS_SLUGS.includes(slug))) {
    return null;
  }
  const built = builtDocDates()[slug];
  if (built) {
    return built;
  }
  try {
    const git = (args: string[]) =>
      execFileSync("git", args, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5000,
      }).trim();
    if (git(["rev-parse", "--is-shallow-repository"]) !== "false") {
      return null;
    }
    const date = git(["log", "-1", "--format=%cs", "--", `docs/${slug}.md`]);
    return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : null;
  } catch {
    return null;
  }
}

// "2026-11-03" -> "Nov 3, 2026".
export function formatDocDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}
