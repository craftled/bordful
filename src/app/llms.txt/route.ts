import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import {
  AGENT_DOCS_CACHE_CONTROL,
  llmsTxt,
  notFoundText,
} from "@/lib/docs/agent-docs";

// Static on the CDN; a deploy refreshes it. The marketing gate is fixed at
// build time, the same as the static docs pages: the build must see
// BORDFUL_MARKETING=true and the right NEXT_PUBLIC_SERVER_URL.
export const dynamic = "force-static";

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
