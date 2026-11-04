import { searchJobIdsByText } from "@/lib/read";

import { BOARD_POOL_LIMIT } from "./constants";
import type { BoardQuery } from "./query";

// Adds the ids of jobs whose summary or skills match q, so filterBoard can
// match text the board cards do not carry. A failed lookup falls back to the
// card match (title, company, location) instead of failing the search page.
export async function withTextMatches(query: BoardQuery): Promise<BoardQuery> {
  if (query.q.length === 0) {
    return query;
  }

  const textMatchIds = await searchJobIdsByText({
    limit: BOARD_POOL_LIMIT,
    q: query.q,
  }).catch(() => []);

  return { ...query, textMatchIds };
}
