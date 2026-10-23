import Link from "next/link";

import { boardStateHref } from "@/lib/board/links";
import { buildTaxonomyArchivePath, type TaxonomyKind } from "@/lib/board/paths";
import type { BoardQuery, BoardQueryOptions } from "@/lib/board/query";

function pageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  return [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);
}

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

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap gap-2"
      data-testid="pagination"
    >
      {page > 1 ? (
        <Link
          data-testid="pagination-prev"
          href={pageHref(
            page - 1,
            query,
            options,
            marketing,
            archiveKind,
            archiveValue
          )}
        >
          Previous
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((number) => (
        <Link
          aria-current={number === page ? "page" : undefined}
          data-testid={`pagination-page-${number}`}
          href={pageHref(
            number,
            query,
            options,
            marketing,
            archiveKind,
            archiveValue
          )}
          key={number}
        >
          {number}
        </Link>
      ))}
      {page < totalPages ? (
        <Link
          data-testid="pagination-next"
          href={pageHref(
            page + 1,
            query,
            options,
            marketing,
            archiveKind,
            archiveValue
          )}
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
