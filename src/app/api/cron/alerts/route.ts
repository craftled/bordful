import config from "@payload-config";
import { getPayload } from "payload";
import { takeAlertDigestResult } from "@/jobs/send-alerts";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { resolveCronNow } from "@/lib/cron/now";

export const runtime = "nodejs";
export const maxDuration = 300;

const COUNT_KEYS = ["due", "empty", "failed", "sent", "skipped"] as const;

function countsFrom(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const row = value as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const key of COUNT_KEYS) {
    if (key in row) {
      picked[key] = row[key];
    }
  }
  return picked;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = resolveCronNow(request);
  const payload = await getPayload({ config });
  const queued = await payload.jobs.queue({
    input: { now: now.toISOString() },
    overrideAccess: true,
    task: "send-alerts",
  });
  const ran = await payload.jobs.runByID({
    id: queued.id,
    overrideAccess: true,
  });
  const statuses = Object.values(ran.jobStatus ?? {});
  const failed = statuses.some((status) => status.status !== "success");
  if (failed || statuses.length === 0) {
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({
    ok: true,
    ...countsFrom(takeAlertDigestResult(queued.id)),
  });
}
