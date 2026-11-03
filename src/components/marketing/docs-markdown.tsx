// biome-ignore-all lint/performance/useTopLevelRegex: small build-time parser
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here
// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: line-based block parser
// biome-ignore-all lint/suspicious/noArrayIndexKey: static markdown never reorders
import Link from "next/link";
import type { ReactNode } from "react";

// A small markdown renderer for the repo's /docs files. It covers headings,
// paragraphs, lists, fenced code, inline code, bold, links and tables. React
// escapes every text node, and nothing here uses dangerouslySetInnerHTML.

export interface DocsHeading {
  id: string;
  level: number;
  text: string;
}

type Block =
  | { id: string; level: number; text: string; type: "heading" }
  | { lang: string; text: string; type: "code" }
  | { items: string[]; ordered: boolean; type: "list" }
  | { header: string[]; rows: string[][]; type: "table" }
  | { text: string; type: "paragraph" };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/gu, "")
    .replace(/[^a-z0-9\s-]/gu, "")
    .trim()
    .replace(/\s+/gu, "-");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());
}

const HEADING = /^(#{1,6})\s+(.*)$/u;
const FENCE = /^```(\w*)\s*$/u;
const ORDERED = /^\d+\.\s+(.*)$/u;
const UNORDERED = /^[-*]\s+(.*)$/u;
const TABLE_RULE = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/u;

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/gu, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      blocks.push({
        lang: fence[1] ?? "",
        text: code.join("\n"),
        type: "code",
      });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const text = (heading[2] ?? "").trim();
      blocks.push({
        id: slugifyHeading(text),
        level: (heading[1] ?? "#").length,
        text,
        type: "heading",
      });
      index += 1;
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      TABLE_RULE.test(lines[index + 1] ?? "")
    ) {
      const header = splitRow(line);
      const rows: string[][] = [];
      index += 2;
      while ((lines[index] ?? "").trim().startsWith("|")) {
        rows.push(splitRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ header, rows, type: "table" });
      continue;
    }

    const ordered = ORDERED.test(line);
    if (ordered || UNORDERED.test(line)) {
      const pattern = ordered ? ORDERED : UNORDERED;
      const items: string[] = [];
      while (index < lines.length) {
        const match = pattern.exec(lines[index] ?? "");
        if (!match) {
          break;
        }
        items.push(match[1] ?? "");
        index += 1;
      }
      blocks.push({ items, ordered, type: "list" });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? "";
      if (
        current.trim() === "" ||
        HEADING.test(current) ||
        FENCE.test(current) ||
        ORDERED.test(current) ||
        UNORDERED.test(current)
      ) {
        break;
      }
      paragraph.push(current.trim());
      index += 1;
    }
    blocks.push({ text: paragraph.join(" "), type: "paragraph" });
  }

  return blocks;
}

export function extractHeadings(source: string): DocsHeading[] {
  return parseMarkdown(source).flatMap((block) =>
    block.type === "heading" && block.level >= 2
      ? [{ id: block.id, level: block.level, text: block.text }]
      : []
  );
}

// Relative links between docs (alerts.md, bordfeed.md#anchor) become
// /docs/<slug>. Anything else that is relative points into the repo.
export function resolveDocHref(href: string, repoBase: string): string {
  if (/^(https?:|mailto:)/u.test(href) || href.startsWith("#")) {
    return href;
  }
  const doc = /^(?:\.\/)?([\w-]+)\.md(#[\w-]+)?$/u.exec(href);
  if (doc) {
    return `/docs/${doc[1]}${doc[2] ?? ""}`;
  }
  const repoPath = href.replace(/^(\.\.\/|\.\/)+/u, "");
  return `${repoBase}/${repoPath}`;
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/gu;
const linkClass = "text-foreground underline underline-offset-4";

function renderInline(text: string, repoBase: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${index}-${part}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code
          className="bg-tag text-foreground rounded-sm px-1 py-0.5 font-mono text-[0.9em]"
          key={key}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong className="text-foreground font-medium" key={key}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/u.exec(part);
    if (link) {
      const href = resolveDocHref(link[2] ?? "", repoBase);
      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link className={linkClass} href={href} key={key}>
            {link[1]}
          </Link>
        );
      }
      return (
        <a
          className={linkClass}
          href={href}
          key={key}
          rel="noopener noreferrer"
          target="_blank"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

const headingClass: Record<number, string> = {
  1: "text-[30px] leading-9 tracking-[-0.03em] md:text-[36px] md:leading-[44px]",
  2: "mt-10 text-[22px] leading-7 tracking-[-0.02em]",
  3: "mt-8 text-[16px] leading-6",
  4: "mt-6 text-[14px] leading-5",
};

export function DocsMarkdown({
  repoBase,
  source,
  skipTitle = false,
}: {
  repoBase: string;
  skipTitle?: boolean;
  source: string;
}) {
  const blocks = parseMarkdown(source).filter(
    (block, index) => !(skipTitle && index === 0 && block.type === "heading")
  );

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        const key = `${index}-${block.type}`;
        switch (block.type) {
          case "heading": {
            const Tag = `h${Math.min(Math.max(block.level, 1), 6)}` as
              | "h1"
              | "h2"
              | "h3"
              | "h4"
              | "h5"
              | "h6";
            return (
              <Tag
                className={`text-foreground scroll-mt-20 font-medium ${headingClass[block.level] ?? headingClass[4]}`}
                id={block.id}
                key={key}
              >
                {block.text}
              </Tag>
            );
          }
          case "code":
            return (
              <pre
                className="bg-card border-line text-foreground overflow-x-auto rounded-lg border p-4 font-mono text-[13px] leading-5"
                key={key}
              >
                <code>{block.text}</code>
              </pre>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                className={`text-muted-foreground flex flex-col gap-1.5 pl-5 text-[14px] leading-[22px] ${block.ordered ? "list-decimal" : "list-disc"}`}
                key={key}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${itemIndex}-${item}`}>
                    {renderInline(item, repoBase)}
                  </li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <div
                className="border-line overflow-x-auto rounded-lg border"
                key={key}
              >
                <table className="w-full text-left text-[13px] leading-5">
                  <thead className="bg-surface-sub text-foreground">
                    <tr>
                      {block.header.map((cell) => (
                        <th
                          className="px-3 py-2 font-medium"
                          key={cell}
                          scope="col"
                        >
                          {renderInline(cell, repoBase)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        className="border-line border-t"
                        key={`${rowIndex}-${row[0]}`}
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            className="px-3 py-2 align-top"
                            key={`${cellIndex}-${cell}`}
                          >
                            {renderInline(cell, repoBase)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return (
              <p
                className="text-muted-foreground text-[14px] leading-[22px]"
                key={key}
              >
                {renderInline(block.text, repoBase)}
              </p>
            );
        }
      })}
    </div>
  );
}
