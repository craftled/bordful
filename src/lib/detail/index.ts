import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import { jobTag, READ_TAGS } from "@/lib/read/tags";
import type { JobListItem } from "@/lib/read/types";

import { querySimilarJobs } from "./queries";

// Same rules as cachedRead in lib/read: the build machine's database must not
// be cached for real requests.
function cachedDetailRead<T>(
  load: () => Promise<T>,
  keyParts: string[],
  tags: string[]
): Promise<T> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return load();
  }

  return unstable_cache(load, keyParts, { revalidate: 300, tags })();
}

export function getSimilarJobs(
  job: JobListItem,
  includeSamples: boolean
): Promise<JobListItem[]> {
  return cachedDetailRead(
    async () => {
      const payload = await getPayload({ config });
      return querySimilarJobs(payload, job, includeSamples);
    },
    [
      "getSimilarJobs",
      job.slug,
      job.locationDisplay ?? "",
      includeSamples ? "samples" : "live",
    ],
    [READ_TAGS.jobs, jobTag(job.slug)]
  );
}
