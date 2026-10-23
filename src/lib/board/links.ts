import { BOARD_SEARCH_PATH, buildBoardPagePath } from "./paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  boardQueryHasFilters,
  serializeBoardQuery,
} from "./query";

export function boardStateHref(
  query: BoardQuery,
  options: BoardQueryOptions,
  marketing: boolean
): string {
  if (
    !boardQueryHasFilters(query) &&
    query.sort === "newest" &&
    query.perPage === options.defaultPerPage
  ) {
    return buildBoardPagePath(marketing, query.page);
  }

  const qs = serializeBoardQuery(query, options).toString();
  return qs.length > 0 ? `${BOARD_SEARCH_PATH}?${qs}` : BOARD_SEARCH_PATH;
}
