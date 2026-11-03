import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import type { DocsEntry } from "./docs-content";
import { DOCS_GROUPS } from "./docs-content";
import type { DocsHeading } from "./docs-markdown";

function itemClass(active: boolean): string {
  return cn(
    "block rounded-md px-2.5 py-1.5 text-[13px] leading-5",
    active
      ? "bg-card ring-line text-foreground font-medium ring-1"
      : "text-muted-foreground hover:text-foreground"
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
      className="border-line flex flex-col gap-5 border-b py-4 md:w-[240px] md:shrink-0 md:border-r md:border-b-0 md:py-10 md:pr-4"
    >
      <div className="flex flex-col gap-0.5">
        <Link
          aria-current={active === "" ? "page" : undefined}
          className={itemClass(active === "")}
          href="/docs"
        >
          Overview
        </Link>
      </div>
      {DOCS_GROUPS.map((group) => (
        <div className="flex flex-col gap-0.5" key={group.title}>
          <p className="text-subtle px-2.5 pb-1 text-[11px] leading-4">
            {group.title}
          </p>
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

export function DocsToc({ headings }: { headings: DocsHeading[] }) {
  const items = headings.filter((heading) => heading.level === 2);
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="On this page"
      className="hidden w-[180px] shrink-0 py-10 xl:block"
    >
      <p className="text-subtle mb-3 font-mono text-[11px] leading-4 tracking-[0.08em] uppercase">
        On this page
      </p>
      <ul className="border-line flex flex-col gap-1 border-l">
        {items.map((heading) => (
          <li key={heading.id}>
            <a
              className="text-muted-foreground hover:text-foreground -ml-px block border-l border-transparent py-1 pl-3 text-[13px] leading-5 hover:border-current"
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocsFrame({
  active,
  children,
  entries,
  headings = [],
}: {
  active: string;
  children: ReactNode;
  entries: DocsEntry[];
  headings?: DocsHeading[];
}) {
  return (
    <Container className="flex flex-col md:min-h-[640px] md:flex-row md:gap-10">
      <DocsSidebar active={active} entries={entries} />
      <div className="min-w-0 flex-1 py-8 md:max-w-[680px] md:py-10">
        {children}
      </div>
      <DocsToc headings={headings} />
    </Container>
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
    "border-line bg-card hover:bg-surface-sub flex w-full flex-col gap-0.5 rounded-lg border px-3.5 py-3 sm:w-[300px]";

  return (
    <div className="mt-12 flex flex-col justify-between gap-3 sm:flex-row">
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
