import { isAuthorizedCronRequest } from "@/lib/cron/authorize";

export const runtime = "nodejs";

export function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return Response.json(
    { queued: false, reason: "not implemented" },
    { status: 202 }
  );
}
