import { BoardFilters, SortLinks } from "@/components/board/board-filters";
import { BoardList, jobCountLabel } from "@/components/board/board-list";
import { BoardPagination } from "@/components/board/board-pagination";
import { BoardSearchForm } from "@/components/board/board-search-form";
import { boardStateHref } from "@/lib/board/links";
import type { TaxonomyKind } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  PER_PAGE_OPTIONS,
} from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import type { JobListItem } from "@/lib/read/types";

export function BoardListing({
  archiveKind,
  archiveValue,
  cards,
  heading,
  headingTestId,
  intro,
  marketing,
  options,
  query,
  showFilters = true,
}: {
  archiveKind?: TaxonomyKind;
  archiveValue?: string;
  cards: JobListItem[];
  heading: string;
  headingTestId?: string;
  intro?: string;
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
  showFilters?: boolean;
}) {
  const view = buildBoardView(cards, query);
  const now = Date.now();
  const perPageChoices = PER_PAGE_OPTIONS.includes(
    options.defaultPerPage as (typeof PER_PAGE_OPTIONS)[number]
  )
    ? PER_PAGE_OPTIONS
    : [...PER_PAGE_OPTIONS, options.defaultPerPage].sort(
        (left, right) => left - right
      );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-[var(--font-heading)] font-semibold text-3xl"
          data-testid={headingTestId}
        >
          {heading}
        </h1>
        {intro ? <p className="text-muted-foreground">{intro}</p> : null}
      </div>
      <BoardSearchForm options={options} query={query} />
      <div className="grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        {showFilters ? (
          <BoardFilters
            facets={view.facets}
            marketing={marketing}
            options={options}
            query={query}
          />
        ) : null}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p data-count={view.matchCount} data-testid="job-count">
              {jobCountLabel(view.matchCount)}
            </p>
            <SortLinks marketing={marketing} options={options} query={query} />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {perPageChoices.map((choice) => (
              <a
                aria-current={query.perPage === choice ? "true" : undefined}
                data-active={query.perPage === choice ? "true" : undefined}
                href={boardStateHref(
                  { ...query, page: 1, perPage: choice },
                  options,
                  marketing
                )}
                key={choice}
              >
                {choice} per page
              </a>
            ))}
          </div>
          {view.docs.length > 0 ? (
            <BoardList jobs={view.docs} now={now} />
          ) : (
            <p data-testid="board-empty">No matching jobs</p>
          )}
          <BoardPagination
            archiveKind={archiveKind}
            archiveValue={archiveValue}
            marketing={marketing}
            options={options}
            page={view.page}
            query={query}
            totalPages={view.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
