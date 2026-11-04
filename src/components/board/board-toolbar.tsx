import Link from "next/link";
import {
  buildFilterGroups,
  FilterChips,
} from "@/components/board/board-filters";
import { MenuDetails } from "@/components/board/menu-details";
import { SaveSearchButton } from "@/components/board/save-search-button";
import type { BoardFacets } from "@/lib/board/filter";
import { boardStateHref } from "@/lib/board/links";
import {
  type BoardQuery,
  type BoardQueryOptions,
  type BoardSort,
  boardQueryHasFilters,
  clearBoardFilters,
  PER_PAGE_OPTIONS,
} from "@/lib/board/query";
import { cn } from "@/lib/utils";

const DEFAULT_TITLE = "Latest Opportunities";

const SORTS: { id: BoardSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "salary", label: "Highest salary" },
];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function resultsLabel(total: number, updated?: string | null): string {
  const count = total === 1 ? "1 result" : `${total} results`;
  return updated ? `${count} · updated ${updated}` : count;
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
  className,
  label,
  options,
  testId,
}: {
  className?: string;
  label: string;
  options: MenuOption[];
  testId: string;
}) {
  return (
    <MenuDetails
      className={cn("group relative", className)}
      data-testid={testId}
    >
      <summary
        className={cn(
          "text-muted-foreground hover:text-foreground -my-1.5 flex h-7 cursor-pointer list-none items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium whitespace-nowrap lg:my-0 lg:text-[13px] [&::-webkit-details-marker]:hidden",
          FOCUS
        )}
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </summary>
      <ul className="bg-popover text-popover-foreground ring-line absolute top-full right-0 z-30 mt-1 min-w-full space-y-0.5 rounded-xl p-1.5 shadow-lg ring-1">
        {options.map((option) => (
          <li key={option.key}>
            <a
              aria-current={option.active ? "true" : undefined}
              className={cn(
                "block rounded-[6px] px-2 py-1.5 text-[13px] whitespace-nowrap",
                option.active
                  ? "bg-selected text-foreground font-medium"
                  : "text-muted-foreground hover:bg-selected hover:text-foreground",
                FOCUS
              )}
              data-active={option.active ? "true" : undefined}
              href={option.href}
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </MenuDetails>
  );
}

// The filter bar: filter chips, Clear and Save this search on the left, the
// result count and sort on the right. Search lives in the site header. Below
// lg it stacks into a scrolling chip row, then count and sort.
export function BoardToolbar({
  className,
  facets,
  marketing,
  options,
  query,
  saveSearch,
  showControls,
  title = DEFAULT_TITLE,
  total,
  updated,
}: {
  className?: string;
  facets?: BoardFacets;
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
  // The current filter URL and a suggested name, when it can be saved.
  saveSearch?: { href: string; name: string } | null;
  showControls: boolean;
  title?: string;
  total: number;
  updated?: string | null;
}) {
  const perPage = perPageChoices(options.defaultPerPage);
  const groups =
    showControls && facets
      ? buildFilterGroups({ facets, marketing, options, query })
      : null;

  return (
    <div
      className={cn(
        "border-line relative flex flex-wrap items-center gap-y-3 border-b px-4 lg:min-h-12 lg:gap-x-1.5 lg:gap-y-2 lg:py-2",
        !groups && "pt-3",
        className
      )}
    >
      <h2 className="sr-only">{title}</h2>
      {groups ? (
        <div className="-mx-4 flex min-w-0 basis-full [scrollbar-width:none] items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:shrink-0 lg:basis-auto lg:overflow-visible lg:px-0">
          <FilterChips
            footer={{
              currentHref: boardStateHref(
                { ...query, page: 1 },
                options,
                marketing
              ),
              total,
            }}
            groups={groups}
          />
          {boardQueryHasFilters(query) ? (
            <Link
              className={cn(
                "text-subtle hover:text-foreground hidden h-7 shrink-0 items-center rounded-[6px] px-2 text-[13px] lg:inline-flex",
                FOCUS
              )}
              data-testid="filter-clear"
              href={boardStateHref(
                clearBoardFilters(query),
                options,
                marketing
              )}
            >
              Clear
            </Link>
          ) : null}
          {saveSearch && boardQueryHasFilters(query) ? (
            <SaveSearchButton
              defaultName={saveSearch.name}
              href={saveSearch.href}
            />
          ) : null}
        </div>
      ) : null}
      <div className="flex min-w-0 basis-full items-center justify-between gap-3 pt-1 pb-2 lg:ml-auto lg:basis-auto lg:justify-end lg:gap-1.5 lg:pt-0 lg:pb-0">
        <p
          className="text-subtle flex min-w-0 items-center gap-1.5 text-[12px] leading-4"
          data-count={total}
          data-testid="job-count"
        >
          <span
            aria-hidden="true"
            className="bg-new size-1.5 shrink-0 rounded-full"
          />
          <span className="truncate">{resultsLabel(total, updated)}</span>
        </p>
        {showControls ? (
          <div className="flex shrink-0 items-center lg:pl-1.5">
            <LinkMenu
              className="hidden lg:block"
              label={`${query.perPage} per page`}
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
            />
            <LinkMenu
              label={SORTS.find((sort) => sort.id === query.sort)?.label ?? ""}
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
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
