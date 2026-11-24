import { DOCS_SLUGS } from "@/components/marketing/docs-content";
import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import {
  AGENT_DOCS_CACHE_CONTROL,
  docMarkdown,
  docsHtmlPath,
  docsIndexMarkdown,
  notFoundText,
} from "@/lib/docs/agent-docs";

// Internal route the proxy rewrites markdown requests to. Public URLs never
// point here. Rendered per request, with no generateStaticParams, so the
// marketing gate reads the runtime env and an unknown slug reaches this
// handler for a plain-text 404, not the HTML 404 page (which would be served
// without a CSP header here).
export const dynamic = "force-dynamic";

function notFoundResponse(): Response {
  return new Response(notFoundText(), {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // The 404 is itself a negotiated response (the .md URL reached this
      // route through the Accept-aware proxy rewrite), so it varies too.
      vary: "Accept",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = await params;
  if (
    !isMarketingEnabled() ||
    slug.length > 1 ||
    (slug.length === 1 && !DOCS_SLUGS.includes(slug[0] as string))
  ) {
    return notFoundResponse();
  }
  const siteUrl = resolveServerUrl();
  const slugOrNull = slug.length === 0 ? null : (slug[0] as string);
  const body =
    slugOrNull === null
      ? docsIndexMarkdown(siteUrl)
      : docMarkdown(slugOrNull, siteUrl);
  if (body === null) {
    return notFoundResponse();
  }
  return new Response(body, {
    headers: {
      "cache-control": AGENT_DOCS_CACHE_CONTROL,
      "content-disposition": "inline",
      "content-type": "text/markdown; charset=utf-8",
      link: `<${siteUrl}${docsHtmlPath(slugOrNull)}>; rel="canonical"`,
      vary: "Accept",
    },
  });
}
