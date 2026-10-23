import config from "@payload-config";
import { getPayload, type Payload } from "payload";

import { countDuePublishedJobs } from "@/jobs/expire-job";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { resolveCronNow } from "@/lib/cron/now";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Payload | undefined;
  try {
    const now = resolveCronNow(request);
    payload = await getPayload({ config });
    const dueBefore = await countDuePublishedJobs(payload, now);
    const queued = await payload.jobs.queue({
      input: { now: now.toISOString() },
      overrideAccess: true,
      task: "expire-jobs",
    });
    const ran = await payload.jobs.runByID({
      id: queued.id,
      overrideAccess: true,
    });
    const status = ran.jobStatus?.[String(queued.id)]?.status;
    if (status !== "success") {
      payload.logger.error(
        { jobId: queued.id, status: status ?? null },
        "expire cron job failed"
      );
      return Response.json({ ok: false }, { status: 500 });
    }

    const dueAfter = await countDuePublishedJobs(payload, now);
    return Response.json({
      now: now.toISOString(),
      ok: true,
      unpublished: dueBefore - dueAfter,
    });
  } catch (error) {
    if (payload) {
      payload.logger.error({ err: error }, "expire cron failed");
    } else {
      console.error("expire cron failed", error);
    }
    return Response.json({ ok: false }, { status: 500 });
  }
}
