import type { APIRequestContext, APIResponse } from "@playwright/test";

const CRON_SECRET = ["e2e-cron-secret", "0123456789"].join("-");

export function runCron(
  request: APIRequestContext,
  name: "alerts" | "bordfeed" | "expire",
  now?: string
): Promise<APIResponse> {
  const path = new URL(`http://127.0.0.1/api/cron/${name}`);
  if (now !== undefined) {
    path.searchParams.set("now", now);
  }

  return request.get(`${path.pathname}${path.search}`, {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}
