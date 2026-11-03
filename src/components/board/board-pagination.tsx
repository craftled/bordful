import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { boardStateHref } from "@/lib/board/links";
import { pageSlots } from "@/lib/board/pagination";
import { buildTaxonomyArchivePath, type TaxonomyKind } from "@/lib/board/paths";
import type { BoardQuery, BoardQueryOptions } from "@/lib/board/query";
import { cn } from "@/lib/utils";

const CONTROL =
  "inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] leading-4 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function pageHref(
  nextPage: number,
  query: BoardQuery,
  options: BoardQueryOptions,
  marketing: boolean,
  archiveKind: TaxonomyKind | undefined,
  archiveValue: string | undefined,
  archiveSearch: string
): string {
  if (archiveKind !== undefined && archiveValue !== undefined) {
    const path = buildTaxonomyArchivePath(archiveKind, archiveValue, nextPage);
    return archiveSearch ? `${path}?${archiveSearch}` : path;
  }

  return boardStateHref({ ...query, page: nextPage }, options, marketing);
}

export function BoardPagination({
  archiveKind,
  archiveSearch = "",
  archiveValue,
  marketing,
  options,
  page,
  query,
  totalPages,
}: {
  archiveKind?: TaxonomyKind;
  // An archive's refining filters (its chips), kept across its pages.
  archiveSearch?: string;
  archiveValue?: string;
  marketing: boolean;
  options: BoardQueryOptions;
  page: number;
  query: BoardQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefOf = (target: number) =>
    pageHref(
      target,
      query,
      options,
      marketing,
      archiveKind,
      archiveValue,
      archiveSearch
    );

  return (
    <nav
      aria-label="Pagination"
      className="flex min-h-10 flex-wrap items-center justify-center gap-1 py-1.5"
      data-testid="pagination"
    >
      {page > 1 ? (
        <Link
          className={CONTROL}
          data-testid="pagination-prev"
          href={hrefOf(page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(CONTROL, "text-subtle pointer-events-none")}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
          Previous
        </span>
      )}
      {pageSlots(page, totalPages).map((slot, index) =>
        slot === "gap" ? (
          <span
            aria-hidden="true"
            className="text-subtle px-1 text-[12px]"
            // biome-ignore lint/suspicious/noArrayIndexKey: a gap never reorders, so its position is a stable key
            key={`gap-${index}`}
          >
            …
          </span>
        ) : (
          <Link
            aria-current={slot === page ? "page" : undefined}
            aria-label={`Page ${slot}`}
            className={cn(
              CONTROL,
              "min-w-7 justify-center tabular-nums",
              slot === page &&
                "bg-card text-foreground ring-line font-medium shadow-xs ring-1"
            )}
            data-testid={`pagination-page-${slot}`}
            href={hrefOf(slot)}
            key={slot}
          >
            {slot}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link
          className={CONTROL}
          data-testid="pagination-next"
          href={hrefOf(page + 1)}
        >
          Next
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(CONTROL, "text-subtle pointer-events-none")}
        >
          Next
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </span>
      )}
    </nav>
  );
}
