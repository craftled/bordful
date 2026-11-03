import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { DocsEntry } from "./docs-content";
import { DOCS_GROUPS } from "./docs-content";
import type { DocsHeading } from "./docs-markdown";
import { DocsSectionNav } from "./docs-section-nav";

function itemClass(active: boolean): string {
  return cn(
    "flex h-7 items-center rounded-md px-2 text-[13px] leading-[19px]",
    active
      ? "bg-card text-foreground font-medium shadow-[0_0_0_1px_rgb(0_0_0/6%),0_1px_2px_rgb(0_0_0/5%)] dark:shadow-[0_0_0_1px_rgb(255_255_255/8%)]"
      : "text-muted-foreground hover:text-foreground"
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-subtle px-2 pt-3.5 pb-1 text-[11px] leading-4 font-medium">
      {children}
    </p>
  );
}

export function DocsSidebar({
  active,
  entries,
}: {
  active: string;
  entries: DocsEntry[];
}) {
  const byslug = new Map(entries.map((entry) => [entry.slug, entry]));

  return (
    <nav
      aria-label="Documentation"
      className="border-line hidden flex-col gap-0.5 px-4 py-6 md:flex md:w-[240px] md:shrink-0 md:border-r"
    >
      {DOCS_GROUPS.map((group, groupIndex) => (
        <div className="flex flex-col gap-0.5" key={group.title}>
          <GroupLabel>{group.title}</GroupLabel>
          {groupIndex === 0 ? (
            <Link
              aria-current={active === "" ? "page" : undefined}
              className={itemClass(active === "")}
              href="/docs"
            >
              Overview
            </Link>
          ) : null}
          {group.slugs.map((slug) => (
            <Link
              aria-current={active === slug ? "page" : undefined}
              className={itemClass(active === slug)}
              href={`/docs/${slug}`}
              key={slug}
            >
              {byslug.get(slug)?.title ?? slug}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

const mobileSummary =
  "bg-card ring-line-strong text-foreground flex h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-[13px] leading-[18px] ring-1 ring-inset [&::-webkit-details-marker]:hidden";
const mobilePanel =
  "bg-card ring-line-strong absolute top-10 z-20 flex max-h-[60vh] min-w-full flex-col gap-0.5 overflow-y-auto rounded-lg p-1.5 shadow-lg ring-1";

function MobileChevron() {
  return (
    <svg
      aria-hidden="true"
      className="text-subtle size-3.5 shrink-0"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </svg>
  );
}

// Phones get a compact bar instead of the sidebar and the right-hand list.
export function DocsMobileNav({
  active,
  entries,
  headings,
}: {
  active: string;
  entries: DocsEntry[];
  headings: DocsHeading[];
}) {
  const byslug = new Map(entries.map((entry) => [entry.slug, entry]));
  const group = DOCS_GROUPS.find((entry) => entry.slugs.includes(active));
  const current =
    active === "" ? "Overview" : (byslug.get(active)?.title ?? active);
  const toc = headings.filter((heading) => heading.level === 2);

  return (
    <div className="border-line flex gap-2 border-b px-4 py-2.5 md:hidden">
      <details className="relative min-w-0 flex-1">
        <summary className={mobileSummary}>
          <span className="truncate">
            {(group ?? DOCS_GROUPS[0])?.title} / {current}
          </span>
          <MobileChevron />
        </summary>
        <div className={mobilePanel}>
          <Link className={itemClass(active === "")} href="/docs">
            Overview
          </Link>
          {DOCS_GROUPS.flatMap((entry) => entry.slugs).map((slug) => (
            <Link
              className={itemClass(active === slug)}
              href={`/docs/${slug}`}
              key={slug}
            >
              {byslug.get(slug)?.title ?? slug}
            </Link>
          ))}
        </div>
      </details>
      {toc.length > 0 ? (
        <details className="relative">
          <summary className={cn(mobileSummary, "text-muted-foreground")}>
            On this page
          </summary>
          <div className={cn(mobilePanel, "right-0 w-64")}>
            {toc.map((heading) => (
              <a
                className={itemClass(false)}
                href={`#${heading.id}`}
                key={heading.id}
              >
                {heading.text}
              </a>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function DocsToc({ headings }: { headings: DocsHeading[] }) {
  const items = headings
    .filter((heading) => heading.level === 2)
    .map((heading) => ({ id: heading.id, label: heading.text }));
  if (items.length === 0) {
    return null;
  }

  return <DocsSectionNav items={items} variant="docs" />;
}

// Paper's docs footer on desktop: a slim bar under the sidebar and content,
// in place of the full marketing footer (the shell hides that one at md+).
// Phones keep the full marketing footer.
export function DocsFooter({ editHref }: { editHref: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-line hidden items-center justify-between border-t px-6 py-5 text-[12px] leading-[17px] md:flex"
      data-slim-footer=""
      data-testid="docs-footer"
    >
      <p className="text-subtle">&copy; {year} Craftled · MIT License</p>
      <a
        className="text-muted-foreground hover:text-foreground rounded-sm font-medium"
        href={editHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        Edit this page on GitHub <span aria-hidden="true">↗</span>
      </a>
    </footer>
  );
}

export function DocsFrame({
  active,
  children,
  editHref,
  entries,
  headings = [],
}: {
  active: string;
  children: ReactNode;
  editHref: string;
  entries: DocsEntry[];
  headings?: DocsHeading[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col">
      <div className="flex flex-1 flex-col md:min-h-[640px] md:flex-row">
        <DocsMobileNav active={active} entries={entries} headings={headings} />
        <DocsSidebar active={active} entries={entries} />
        <div className="min-w-0 flex-1 px-4 pt-6 pb-10 md:px-10 md:py-10">
          <div className="flex max-w-[680px] flex-col gap-6 md:gap-5">
            {children}
          </div>
        </div>
        <DocsToc headings={headings} />
      </div>
      <DocsFooter editHref={editHref} />
    </div>
  );
}

export function DocsPager({
  next,
  previous,
}: {
  next?: { href: string; label: string };
  previous?: { href: string; label: string };
}) {
  const card =
    "ring-line-strong hover:bg-card flex w-full flex-col gap-0.5 rounded-[10px] px-3.5 py-3 ring-1 ring-inset sm:w-[300px]";

  return (
    <div className="flex flex-col justify-between gap-3 pt-4 sm:flex-row">
      {previous ? (
        <Link className={card} href={previous.href}>
          <span className="text-subtle text-[11px] leading-4">Previous</span>
          <span className="text-foreground text-[14px] leading-5 font-medium">
            {previous.label}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          className={cn(card, "sm:items-end sm:text-right")}
          href={next.href}
        >
          <span className="text-subtle text-[11px] leading-4">Next</span>
          <span className="text-foreground text-[14px] leading-5 font-medium">
            {next.label}
          </span>
        </Link>
      ) : null}
    </div>
  );
}
