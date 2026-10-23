import Link from "next/link";

import { BoardFilters } from "@/components/board/board-filters";
import { BoardList } from "@/components/board/board-list";
import { BoardPagination } from "@/components/board/board-pagination";
import { BoardSearchForm } from "@/components/board/board-search-form";
import { BoardToolbar } from "@/components/board/board-toolbar";
import { PostJobCard } from "@/components/board/post-job-card";
import { boardStateHref } from "@/lib/board/links";
import type { TaxonomyKind } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  boardQueryHasFilters,
  clearBoardFilters,
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
  postJob = null,
  query,
  showControls = true,
  showFilters = true,
  showHeading = true,
  showSearch = showControls,
}: {
  archiveKind?: TaxonomyKind;
  archiveValue?: string;
  cards: JobListItem[];
  heading?: string;
  headingTestId?: string;
  intro?: string;
  marketing: boolean;
  options: BoardQueryOptions;
  postJob?: { durationDays: number; priceLabel: string } | null;
  query: BoardQuery;
  showControls?: boolean;
  showFilters?: boolean;
  showHeading?: boolean;
  showSearch?: boolean;
}) {
  const view = buildBoardView(cards, query);
  const now = Date.now();

  return (
    <div className="space-y-6">
      {showHeading ? (
        <div className="space-y-2">
          <h1
            className="font-[var(--font-heading)] font-semibold text-3xl"
            data-testid={headingTestId}
          >
            {heading}
          </h1>
          {intro ? <p className="text-muted-foreground">{intro}</p> : null}
        </div>
      ) : null}
      {showSearch ? <BoardSearchForm options={options} query={query} /> : null}
      <div
        className={
          showFilters
            ? "grid gap-8 md:grid-cols-[minmax(0,1fr)_17.5rem]"
            : undefined
        }
      >
        {showFilters ? (
          <div className="space-y-6 md:order-last">
            <BoardFilters
              facets={view.facets}
              marketing={marketing}
              options={options}
              query={query}
            />
            {postJob ? (
              <PostJobCard
                durationDays={postJob.durationDays}
                priceLabel={postJob.priceLabel}
              />
            ) : null}
          </div>
        ) : null}
        <div className="min-w-0 space-y-4">
          <BoardToolbar
            marketing={marketing}
            options={options}
            query={query}
            showControls={showControls}
            shown={view.docs.length}
            total={view.matchCount}
          />
          {view.docs.length > 0 ? (
            <BoardList jobs={view.docs} now={now} />
          ) : (
            <div
              className="space-y-3 rounded-lg border bg-card p-6 text-center"
              data-testid="board-empty-box"
            >
              <p data-testid="board-empty">No matching jobs</p>
              {boardQueryHasFilters(query) ? (
                <Link
                  data-testid="board-empty-clear"
                  href={boardStateHref(
                    clearBoardFilters(query),
                    options,
                    marketing
                  )}
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
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
