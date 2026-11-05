import type { Payload } from "payload";

import { revalidateReadTags } from "@/lib/read/revalidate";
import { READ_TAGS } from "@/lib/read/tags";

import type { ConnectionRecord } from "./connection-machine";
import { dispatchConnectionEvent, readConnection } from "./connection-store";
import { runSampleSync, type SyncSummary } from "./sync";
import { acquireSyncLease, releaseSyncLease } from "./sync-budget";

// The first boot has not landed a sample sync yet. A failed cron after a
// successful sample must not preview on every cold start, so a recorded sync
// ends the first boot even when the state later moved to error.
function isFirstBoot(connection: ConnectionRecord): boolean {
  if (connection.lastSyncAt) {
    return false;
  }

  return (
    connection.state === "sample" ||
    (connection.state === "error" && connection.previousState === "sample")
  );
}

async function countSamples(payload: Payload): Promise<number> {
  const existing = await payload.count({
    collection: "jobs",
    overrideAccess: true,
    where: { origin: { equals: "bordfeed_sample" } },
  });
  return existing.totalDocs;
}

// Samples are on the board but the connection never recorded the sync: a
// boot that raced another one wrote its failure over the winner's success.
// Recording the sync here puts the connection back into the sample state
// instead of leaving it in error with a board full of jobs.
async function recordSeeded(payload: Payload, created: number): Promise<void> {
  const now = new Date();
  const summary: SyncSummary = {
    checkedJobs: 0,
    created,
    deletedSamples: 0,
    durationMs: 0,
    fetch: "sample",
    fetchedJobs: 0,
    mode: "sample",
    pages: 1,
    skipped: 0,
    unpublished: 0,
    updated: 0,
  };
  await dispatchConnectionEvent(
    payload,
    { at: now.toISOString(), summary, type: "sync_succeeded" },
    now
  );
}

export async function ensureSampleJobs(
  payload: Payload,
  options?: { signal?: AbortSignal }
): Promise<void> {
  if (!isFirstBoot(await readConnection(payload))) {
    return;
  }

  // A fresh deploy gets several requests at once, each on its own cold
  // start. The sync lease lets one of them seed; the others skip and serve
  // whatever has landed. The lease is released in every case, so a failed
  // seed is retried on the next boot rather than after the lease expires.
  const token = await acquireSyncLease(payload, new Date());
  if (!token) {
    return;
  }

  try {
    if (!isFirstBoot(await readConnection(payload))) {
      return;
    }

    const existing = await countSamples(payload);
    if (existing > 0) {
      await recordSeeded(payload, existing);
    } else {
      await runSampleSync(payload, { signal: options?.signal });
    }
  } finally {
    await releaseSyncLease(payload, token);
  }

  // The hooks already revalidate on each write. A page rendered during the
  // seed can still have cached the empty board, so revalidate once more
  // after everything has landed.
  revalidateReadTags([
    READ_TAGS.jobs,
    READ_TAGS.companies,
    READ_TAGS.bordfeedConnection,
  ]);
}
