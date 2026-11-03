import config from "@payload-config";
import { getPayload } from "payload";
import { readConnection } from "@/lib/bordfeed/connection-store";
import { toSafeError } from "@/lib/bordfeed/errors";
import type { SafeError } from "@/lib/bordfeed/types";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";

export const runtime = "nodejs";
export const maxDuration = 300;

function storedError(value: unknown): SafeError | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.at !== "string" ||
    typeof record.code !== "string" ||
    typeof record.message !== "string"
  ) {
    return null;
  }

  return {
    at: record.at,
    code: record.code as SafeError["code"],
    message: record.message,
  };
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await getPayload({ config });
    const queued = await payload.jobs.queue({
      input: {},
      overrideAccess: true,
      task: "bordfeed-sync",
    });
    const ran = await payload.jobs.runByID({
      id: queued.id,
      overrideAccess: true,
    });
    const failed = Object.values(ran.jobStatus ?? {}).some(
      (status) => status.status !== "success"
    );
    const connection = await readConnection(payload);
    if (failed) {
      return Response.json(
        {
          error:
            storedError(connection.lastError) ??
            toSafeError(new Error("sync failed")),
          ok: false,
        },
        { status: 500 }
      );
    }

    return Response.json({
      lastSyncAt: connection.lastSyncAt,
      ok: true,
      state: connection.state,
    });
  } catch (error) {
    return Response.json(
      { error: toSafeError(error), ok: false },
      { status: 500 }
    );
  }
}
