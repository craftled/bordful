import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import {
  AGENT_DOCS_CACHE_CONTROL,
  llmsTxt,
  notFoundText,
} from "@/lib/docs/agent-docs";

// Rendered per request so the marketing gate reads the runtime env. A
// build-time render fixed it to whatever the build saw, so one build served
// to a marketing and a fork server answered both the same way.
export const dynamic = "force-dynamic";

function notFoundResponse(): Response {
  return new Response(notFoundText(), {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export function GET() {
  if (!isMarketingEnabled()) {
    return notFoundResponse();
  }
  return new Response(llmsTxt(resolveServerUrl()), {
    headers: {
      "cache-control": AGENT_DOCS_CACHE_CONTROL,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
