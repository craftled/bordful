import { getJobTextIndex } from "@/lib/read";

import { BOARD_POOL_LIMIT } from "./constants";
import type { BoardQuery } from "./query";
import { matchTextIndex } from "./text-index";

// Adds the ids of jobs whose summary or skills match q, so filterBoard can
// match text the board cards do not carry. The index is cached per period, so
// any number of distinct search strings costs one database read. A failed
// lookup falls back to the card match (title, company, location) instead of
// failing the search page.
export async function withTextMatches(query: BoardQuery): Promise<BoardQuery> {
  if (query.q.length === 0) {
    return query;
  }

  const index = await getJobTextIndex({ limit: BOARD_POOL_LIMIT }).catch(
    () => []
  );

  return { ...query, textMatchIds: matchTextIndex(index, query.q) };
}
