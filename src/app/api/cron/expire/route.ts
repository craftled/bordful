import config from "@payload-config";
import { getPayload } from "payload";

import { countDuePublishedJobs } from "@/jobs/expire-job";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { resolveCronNow } from "@/lib/cron/now";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const now = resolveCronNow(request);
    const payload = await getPayload({ config });
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
      return Response.json({ ok: false }, { status: 500 });
    }

    const dueAfter = await countDuePublishedJobs(payload, now);
    return Response.json({
      now: now.toISOString(),
      ok: true,
      unpublished: dueBefore - dueAfter,
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
