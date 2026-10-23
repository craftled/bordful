import type { Payload } from "payload";

import { runSampleSync } from "./sync";

export async function ensureSampleJobs(
  payload: Payload,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const connection = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
  // A failed cron after a successful sample must not preview on every cold start.
  const failedFirstBoot =
    connection.state === "error" &&
    connection.previousState === "sample" &&
    !connection.lastSyncAt;
  const firstBoot = connection.state === "sample" && !connection.lastSyncAt;
  if (!(failedFirstBoot || firstBoot)) {
    return;
  }

  const existing = await payload.count({
    collection: "jobs",
    overrideAccess: true,
    where: { origin: { equals: "bordfeed_sample" } },
  });
  if (existing.totalDocs > 0) {
    return;
  }

  await runSampleSync(payload, { signal: options?.signal });
}
