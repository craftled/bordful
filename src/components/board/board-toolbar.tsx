import { ChevronDownIcon } from "lucide-react";

import { boardStateHref } from "@/lib/board/links";
import {
  type BoardQuery,
  type BoardQueryOptions,
  type BoardSort,
  PER_PAGE_OPTIONS,
} from "@/lib/board/query";

const SORTS: { id: BoardSort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "salary", label: "Highest salary" },
];

export function showingLabel(shown: number, total: number): string {
  const noun = total === 1 ? "position" : "positions";
  return `Showing ${shown} of ${total} ${noun}`;
}

export function perPageChoices(defaultPerPage: number): number[] {
  return PER_PAGE_OPTIONS.includes(
    defaultPerPage as (typeof PER_PAGE_OPTIONS)[number]
  )
    ? [...PER_PAGE_OPTIONS]
    : [...PER_PAGE_OPTIONS, defaultPerPage].sort((left, right) => left - right);
}

interface MenuOption {
  active: boolean;
  href: string;
  key: string;
  label: string;
}

// A <details> disclosure keeps the menu usable without JS: every option is a
// plain link that navigates to a crawlable URL.
function LinkMenu({
  label,
  options,
  testId,
  value,
}: {
  label: string;
  options: MenuOption[];
  testId: string;
  value: string;
}) {
  return (
    <details className="group relative" data-testid={testId}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 min-w-full space-y-0.5 rounded-md border border-border bg-popover p-1 shadow-md">
        {options.map((option) => (
          <li key={option.key}>
            <a
              aria-current={option.active ? "true" : undefined}
              className={
                option.active
                  ? "block whitespace-nowrap rounded-sm bg-primary px-2 py-1 text-primary-foreground text-sm"
                  : "block whitespace-nowrap rounded-sm px-2 py-1 text-sm hover:bg-muted"
              }
              data-active={option.active ? "true" : undefined}
              href={option.href}
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function BoardToolbar({
  marketing,
  options,
  query,
  shown,
  showControls,
  total,
}: {
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
  shown: number;
  showControls: boolean;
  total: number;
}) {
  const perPage = perPageChoices(options.defaultPerPage);
  const sortLabel = SORTS.find((sort) => sort.id === query.sort)?.label ?? "";

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">Latest Opportunities</h2>
        <p
          className="text-muted-foreground text-sm"
          data-count={total}
          data-testid="job-count"
        >
          {showingLabel(shown, total)}
        </p>
      </div>
      {showControls ? (
        <div className="flex flex-wrap gap-2">
          <LinkMenu
            label="Jobs per page:"
            options={perPage.map((choice) => ({
              active: query.perPage === choice,
              href: boardStateHref(
                { ...query, page: 1, perPage: choice },
                options,
                marketing
              ),
              key: String(choice),
              label: String(choice),
            }))}
            testId="per-page-menu"
            value={String(query.perPage)}
          />
          <LinkMenu
            label="Sort by:"
            options={SORTS.map((sort) => ({
              active: query.sort === sort.id,
              href: boardStateHref(
                { ...query, page: 1, sort: sort.id },
                options,
                marketing
              ),
              key: sort.id,
              label: sort.label,
            }))}
            testId="sort-menu"
            value={sortLabel}
          />
        </div>
      ) : null}
    </div>
  );
}
