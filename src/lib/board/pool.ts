import { listPublishedJobs } from "@/lib/read";
import type { JobListItem } from "@/lib/read/types";

import { BOARD_POOL_LIMIT } from "./constants";

export async function loadBoardPool(): Promise<JobListItem[]> {
  const listed = await listPublishedJobs({
    limit: BOARD_POOL_LIMIT,
    page: 1,
  });

  return listed.items;
}
