import type { JobListItem } from "@/lib/read/types";
import type { BoardFacets } from "./filter";
import {
  buildBoardFacets,
  filterBoard,
  paginateBoard,
  sortBoard,
} from "./filter";
import { type BoardQuery, boardQueryHasFilters } from "./query";

export interface BoardView {
  docs: JobListItem[];
  facets: BoardFacets;
  hasFilters: boolean;
  matchCount: number;
  outOfRange: boolean;
  page: number;
  total: number;
  totalPages: number;
}

export function buildBoardView(
  cards: JobListItem[],
  query: BoardQuery,
  now = Date.now()
): BoardView {
  const filtered = filterBoard(cards, query);
  const sorted = sortBoard(filtered, query.sort, now);
  const page = paginateBoard(sorted, query.perPage, query.page);

  return {
    docs: page.docs,
    facets: buildBoardFacets(cards),
    hasFilters: boardQueryHasFilters(query),
    matchCount: filtered.length,
    outOfRange: page.outOfRange,
    page: query.page,
    total: filtered.length,
    totalPages: page.totalPages,
  };
}
