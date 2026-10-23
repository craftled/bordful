import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { boardStateHref } from "@/lib/board/links";
import { pageSlots } from "@/lib/board/pagination";
import { buildTaxonomyArchivePath, type TaxonomyKind } from "@/lib/board/paths";
import type { BoardQuery, BoardQueryOptions } from "@/lib/board/query";
import { cn } from "@/lib/utils";

const CONTROL =
  "inline-flex h-9 items-center gap-1 rounded-[var(--radius)] border border-input bg-background px-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function pageHref(
  nextPage: number,
  query: BoardQuery,
  options: BoardQueryOptions,
  marketing: boolean,
  archiveKind: TaxonomyKind | undefined,
  archiveValue: string | undefined
): string {
  if (archiveKind !== undefined && archiveValue !== undefined) {
    return buildTaxonomyArchivePath(archiveKind, archiveValue, nextPage);
  }

  return boardStateHref({ ...query, page: nextPage }, options, marketing);
}

export function BoardPagination({
  archiveKind,
  archiveValue,
  marketing,
  options,
  page,
  query,
  totalPages,
}: {
  archiveKind?: TaxonomyKind;
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
    pageHref(target, query, options, marketing, archiveKind, archiveValue);

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
      data-testid="pagination"
    >
      {page > 1 ? (
        <Link
          className={CONTROL}
          data-testid="pagination-prev"
          href={hrefOf(page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(CONTROL, "pointer-events-none text-muted-foreground")}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Previous
        </span>
      )}
      {pageSlots(page, totalPages).map((slot, index) =>
        slot === "gap" ? (
          <span
            aria-hidden="true"
            className="px-2 text-muted-foreground text-sm"
            // biome-ignore lint/suspicious/noArrayIndexKey: a gap never reorders, so its position is a stable key
            key={`gap-${index}`}
          >
            …
          </span>
        ) : (
          <Link
            aria-current={slot === page ? "page" : undefined}
            className={cn(
              CONTROL,
              "min-w-9 justify-center",
              slot === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary"
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
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(CONTROL, "pointer-events-none text-muted-foreground")}
        >
          Next
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      )}
    </nav>
  );
}
