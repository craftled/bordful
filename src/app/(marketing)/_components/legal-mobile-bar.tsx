"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";

const PAGES = [
  { href: "/terms", id: "terms", label: "Terms of Service" },
  { href: "/privacy", id: "privacy", label: "Privacy Policy" },
] as const;

export type LegalPageId = (typeof PAGES)[number]["id"];

const summaryClass =
  "bg-card ring-line-strong flex h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-[13px] leading-4 ring-1 [&::-webkit-details-marker]:hidden";
const panelClass =
  "bg-card ring-line-strong absolute top-10 z-20 flex max-h-[60vh] min-w-full flex-col gap-0.5 overflow-y-auto rounded-lg p-1.5 shadow-lg ring-1";

function itemClass(active: boolean): string {
  return cn(
    "flex min-h-8 items-center rounded-md px-2 py-1 text-[13px] leading-[19px]",
    active
      ? "bg-surface-sub text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground"
  );
}

// Close the open menu once a link inside it is picked.
function closeMenu(event: MouseEvent<HTMLElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      className="text-subtle size-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

/**
 * Paper's phone bar for the legal pages: a page select (Terms / Privacy) and
 * a "Sections" menu, pinned under the header. Desktop keeps the side list.
 */
export function LegalMobileBar({
  current,
  sections,
}: {
  current: LegalPageId;
  sections: { id: string; label: string }[];
}) {
  const page = PAGES.find((entry) => entry.id === current) ?? PAGES[0];

  return (
    <div
      className="bg-background border-line sticky top-14 z-40 flex gap-2 border-b px-4 py-2.5 md:top-[52px] lg:hidden"
      data-testid="legal-mobile-bar"
    >
      <details className="relative min-w-0 flex-1">
        <summary className={cn(summaryClass, "text-foreground")}>
          <span className="truncate">{page.label}</span>
          <Chevron />
        </summary>
        <div className={panelClass}>
          {PAGES.map((entry) => (
            <Link
              aria-current={entry.id === current ? "page" : undefined}
              className={itemClass(entry.id === current)}
              href={entry.href}
              key={entry.id}
              onClick={closeMenu}
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </details>
      <details className="relative">
        <summary className={cn(summaryClass, "text-muted-foreground")}>
          Sections
        </summary>
        <nav aria-label="Sections" className={cn(panelClass, "right-0 w-64")}>
          {sections.map((section) => (
            <a
              className={itemClass(false)}
              href={`#${section.id}`}
              key={section.id}
              onClick={closeMenu}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </details>
    </div>
  );
}

export function LegalBreadcrumb({ label }: { label: string }) {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex gap-2 text-[13px] leading-4 lg:hidden"
      >
        <span className="text-subtle">Legal</span>
        <span aria-hidden="true" className="text-subtle">
          /
        </span>
        <span aria-current="page" className="text-foreground">
          {label}
        </span>
      </nav>
      <p className="text-foreground hidden text-[13px] font-medium lg:block">
        {label}
      </p>
    </>
  );
}
