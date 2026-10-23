import type { Payload, TaskConfig, Where } from "payload";
import { z } from "zod";

const DAY_MS = 86_400_000;
const BATCH_SIZE = 100;

const expireJobsInputSchema = z.object({
  now: z.iso.datetime().optional(),
});

export interface ValidThroughInput {
  durationDays: number;
  origin: string;
  publishedAt: string | null;
  validThrough: string | null;
}

export interface ExpireJobsResult {
  failed: number;
  failedIds: string[];
  ids: string[];
  unpublished: number;
}

export function computeValidThrough(args: ValidThroughInput): string | null {
  if (args.origin !== "paid") {
    return args.validThrough;
  }

  if (args.validThrough !== null) {
    return args.validThrough;
  }

  if (args.publishedAt === null) {
    return null;
  }

  const publishedAt = new Date(args.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) {
    return args.validThrough;
  }

  const validThrough = new Date(
    publishedAt.getTime() + args.durationDays * DAY_MS
  );
  if (Number.isNaN(validThrough.getTime())) {
    return args.validThrough;
  }

  return validThrough.toISOString();
}

function publishedJobsDueWhere(
  now: Date,
  failedIds: ReadonlyArray<number | string> = []
): Where {
  const due: Where[] = [
    { _status: { equals: "published" } },
    { validThrough: { less_than_equal: now.toISOString() } },
  ];

  if (failedIds.length > 0) {
    // A failed row stays on page 1. Skip it or the seen guard aborts the sweep
    // on that same row every day.
    due.push({ id: { not_in: [...failedIds] } });
  }

  return { and: due };
}

export async function countDuePublishedJobs(
  payload: Payload,
  now: Date
): Promise<number> {
  const found = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: 1,
    overrideAccess: true,
    where: publishedJobsDueWhere(now),
  });

  return found.totalDocs;
}

async function unpublishJob(
  payload: Payload,
  id: number | string,
  ids: string[],
  failedIds: Array<number | string>
): Promise<void> {
  try {
    await payload.update({
      collection: "jobs",
      data: { _status: "draft" },
      depth: 0,
      id,
      overrideAccess: true,
    });
    ids.push(String(id));
  } catch (err) {
    failedIds.push(id);
    payload.logger.error({ err, id }, "expire job update failed");
  }
}

async function expireDueBatch(
  payload: Payload,
  now: Date,
  ids: string[],
  failedIds: Array<number | string>,
  seen: Set<string>
): Promise<void> {
  const found = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: BATCH_SIZE,
    overrideAccess: true,
    where: publishedJobsDueWhere(now, failedIds),
  });

  if (found.docs.length === 0) {
    return;
  }

  const batch: Array<number | string> = [];
  for (const doc of found.docs) {
    const id = String(doc.id);
    if (seen.has(id)) {
      throw new Error("Job stayed published after expiry.");
    }
    seen.add(id);
    batch.push(doc.id);
  }

  for (const id of batch) {
    // biome-ignore lint/performance/noAwaitInLoops: a failed row must not reject the page, and one transaction at a time keeps the pool intact
    await unpublishJob(payload, id, ids, failedIds);
  }

  // Query page 1 again. Unpublishing removes these rows, so a higher page
  // would skip the next batch.
  await expireDueBatch(payload, now, ids, failedIds, seen);
}

export async function expireJobs(
  payload: Payload,
  now: Date
): Promise<ExpireJobsResult> {
  const ids: string[] = [];
  const failedIds: Array<number | string> = [];
  await expireDueBatch(payload, now, ids, failedIds, new Set<string>());
  return {
    failed: failedIds.length,
    failedIds: failedIds.map(String),
    ids,
    unpublished: ids.length,
  };
}

export const expireJobsTask: TaskConfig<"expire-jobs"> = {
  handler: async ({ input, req }) => {
    const parsed = expireJobsInputSchema.parse(
      input === undefined || input === null ? {} : input
    );
    const now = parsed.now === undefined ? new Date() : new Date(parsed.now);
    const result = await expireJobs(req.payload, now);
    return { output: result };
  },
  slug: "expire-jobs",
};
