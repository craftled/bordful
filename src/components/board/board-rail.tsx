import Link from "next/link";

import {
  RailJobLists,
  RailSavedSearches,
} from "@/components/board/board-rail-client";
import {
  RAIL_COUNT,
  RAIL_FOCUS,
  RAIL_HEADING,
  railLinkClass,
} from "@/components/board/rail-styles";
import { buildBoardFacets, filterBoard } from "@/lib/board/filter";
import { boardStateHref } from "@/lib/board/links";
import { loadBoardPool } from "@/lib/board/pool";
import {
  type BoardQuery,
  type BoardQueryOptions,
  boardQueryHasFilters,
  clearBoardFilters,
} from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";
import { cn } from "@/lib/utils";

// Categories past this many sit behind "Show more".
const CATEGORY_PREVIEW = 8;

export type RailView = "applied" | "saved" | null;

function CategoryLink({
  active,
  count,
  href,
  label,
  value,
}: {
  active: boolean;
  count: number;
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={railLinkClass(active)}
      data-testid={`rail-category-${value}`}
      href={href}
    >
      <span className="truncate">
        {label}
        {active ? <span className="sr-only"> (selected)</span> : null}
      </span>
      <span className={RAIL_COUNT}>{count}</span>
    </Link>
  );
}

// The desktop left rail: board views, saved searches, categories and the
// digest card. Its counts cover the whole board, like the header pills; the
// toolbar chips (and the phone sheet) narrow the current list.
export async function BoardRail({
  marketing,
  options,
  query,
  view = null,
}: {
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
  // Set on the saved and applied lists, which are not board queries.
  view?: RailView;
}) {
  const [settings, pool] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const facets = buildBoardFacets(pool);
  const base = clearBoardFilters({ ...query, sort: "newest" });
  const hrefFor = (next: BoardQuery) =>
    boardStateHref({ ...next, page: 1 }, options, marketing);
  const latestActive = view === null && !boardQueryHasFilters(query);
  const featuredActive =
    view === null &&
    query.featured &&
    !boardQueryHasFilters({ ...query, featured: false });
  const currentHref = hrefFor(query);
  const { categories } = facets;
  const shown = categories.slice(0, CATEGORY_PREVIEW);
  const more = categories.slice(CATEGORY_PREVIEW);
  const categoryLink = (facet: (typeof categories)[number]) => (
    <CategoryLink
      active={
        view === null &&
        query.categories.length === 1 &&
        query.categories[0] === facet.value
      }
      count={facet.count}
      href={hrefFor({ ...base, categories: [facet.value] })}
      key={facet.value}
      label={facet.label ?? facet.value}
      value={facet.value}
    />
  );

  return (
    <nav
      aria-label="Board"
      className="hidden min-h-[calc(100dvh-6.25rem)] flex-col gap-5 px-2 py-3 lg:flex"
      data-testid="board-rail"
    >
      <div className="flex flex-col gap-0.5">
        <Link
          aria-current={latestActive ? "page" : undefined}
          className={railLinkClass(latestActive)}
          href={hrefFor(base)}
        >
          <span className="truncate">Latest jobs</span>
          <span className={RAIL_COUNT}>{pool.length}</span>
        </Link>
        {facets.featured > 0 || query.featured ? (
          <Link
            aria-current={featuredActive ? "page" : undefined}
            className={railLinkClass(featuredActive)}
            data-testid="rail-featured"
            href={hrefFor({ ...base, featured: true })}
          >
            <span className="truncate">Featured</span>
            <span className={RAIL_COUNT}>{facets.featured}</span>
          </Link>
        ) : null}
        <RailJobLists active={view} />
      </div>
      <RailSavedSearches
        currentCount={view === null ? filterBoard(pool, query).length : null}
        currentHref={view === null ? currentHref : ""}
      />
      {categories.length > 0 ? (
        <section aria-labelledby="rail-categories" className="flex flex-col">
          <h2 className={RAIL_HEADING} id="rail-categories">
            Categories
          </h2>
          <div className="flex flex-col gap-0.5">{shown.map(categoryLink)}</div>
          {more.length > 0 ? (
            <details
              className="group mt-0.5"
              open={more.some((facet) =>
                query.categories.includes(facet.value)
              )}
            >
              <summary
                className={cn(
                  "text-subtle hover:text-foreground w-fit cursor-pointer list-none rounded-[6px] px-2 py-1.5 text-[12px] [&::-webkit-details-marker]:hidden",
                  RAIL_FOCUS
                )}
              >
                <span className="group-open:hidden">Show more</span>
                <span className="hidden group-open:inline">Show less</span>
              </summary>
              <div className="flex flex-col gap-0.5">
                {more.map(categoryLink)}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}
      {settings.alerts.enabled ? (
        <Link
          className={cn(
            "bg-card ring-line hover:ring-line-strong mt-auto flex flex-col gap-1 rounded-[8px] p-2.5 shadow-xs ring-1 transition-shadow",
            RAIL_FOCUS
          )}
          href="/alerts"
        >
          <span className="text-foreground text-[12px] leading-4 font-medium">
            {settings.alerts.defaultFrequency === "daily"
              ? "Daily digest"
              : "Weekly digest"}
          </span>
          <span className="text-subtle text-[12px] leading-4">
            New jobs by email
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
