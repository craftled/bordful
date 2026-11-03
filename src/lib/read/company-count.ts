import config from "@payload-config";
import { unstable_cache } from "next/cache";
import type { Payload } from "payload";
import { getPayload } from "payload";

import { READ_TAGS } from "./tags";

/** Number of live jobs a company has. Sample jobs count only when the board shows samples. */
export async function queryCompanyJobCount(
  payload: Payload,
  companySlug: string,
  includeSamples: boolean
): Promise<number> {
  const result = await payload.count({
    collection: "jobs",
    overrideAccess: false,
    where: {
      and: [
        { companySlug: { equals: companySlug } },
        ...(includeSamples
          ? []
          : [{ origin: { not_equals: "bordfeed_sample" } }]),
      ],
    },
  });

  return result.totalDocs;
}

export function getCompanyJobCount(
  companySlug: string,
  includeSamples: boolean
): Promise<number> {
  const load = async () => {
    const payload = await getPayload({ config });
    return queryCompanyJobCount(payload, companySlug, includeSamples);
  };

  // Same rule as the other reads: never cache the build machine's database.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return load();
  }

  return unstable_cache(
    load,
    ["getCompanyJobCount", companySlug, includeSamples ? "samples" : "live"],
    { revalidate: 300, tags: [READ_TAGS.jobs] }
  )();
}
