import config from "@payload-config";
import { getPayload } from "payload";

import { unsubscribeByToken } from "@/lib/alerts/subscribe";

export const runtime = "nodejs";

export function GET() {
  return new Response("method not allowed", {
    headers: { allow: "POST" },
    status: 405,
  });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (token.length === 0) {
    return new Response("missing token", {
      headers: { "content-type": "text/plain; charset=utf-8" },
      status: 400,
    });
  }

  const payload = await getPayload({ config });
  await unsubscribeByToken(payload, token);
  return new Response("unsubscribed", {
    headers: { "content-type": "text/plain; charset=utf-8" },
    status: 200,
  });
}
