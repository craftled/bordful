import type { Payload } from "payload";

import { toJobListItem } from "@/lib/read/mappers";
import type { JobListItem } from "@/lib/read/types";

import { rankSimilarJobs, type SimilarSource } from "./similar";

// Uncached twin of getSimilarJobs (index.ts). Tests call this directly.
export async function querySimilarJobs(
  payload: Payload,
  job: SimilarSource,
  includeSamples: boolean
): Promise<JobListItem[]> {
  const location = job.locationDisplay?.trim() ?? "";
  if (location.length === 0) {
    return [];
  }

  const result = await payload.find({
    collection: "jobs",
    depth: 1,
    draft: false,
    limit: 50,
    overrideAccess: false,
    sort: ["-publishedAt", "-id"],
    where: {
      and: [
        { id: { not_equals: job.id } },
        { locationDisplay: { equals: location } },
        ...(includeSamples
          ? []
          : [{ origin: { not_equals: "bordfeed_sample" } }]),
      ],
    },
  });

  return rankSimilarJobs(
    job,
    result.docs.map((doc) => toJobListItem(doc)),
    { includeSamples }
  );
}
