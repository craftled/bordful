import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import {
  BOARD_PAGE_CACHE_CONTROL,
  boardPageMarkdown,
} from "@/lib/docs/agent-board-pages";
import { AGENT_DOCS_CACHE_CONTROL, notFoundText } from "@/lib/docs/agent-docs";
import { BOARD_AGENT_PAGE_PATHS } from "@/lib/docs/agent-docs-paths";
import { pageMarkdown } from "@/lib/docs/agent-pages";

// Internal route the proxy rewrites markdown requests to. Public URLs never
// point here. Rendered per request, with no generateStaticParams: the
// marketing gate then reads the runtime env, a static build never opens the
// database for the board pages (see src/app/sitemap.ts), board markdown is
// never frozen in a cache, and an unknown path reaches this handler for a
// plain-text 404, not the HTML 404 page.
export const dynamic = "force-dynamic";

function notFoundResponse(): Response {
  return new Response(notFoundText(), {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      vary: "Accept",
    },
  });
}

function isBoardPath(path: string): boolean {
  return (BOARD_AGENT_PAGE_PATHS as readonly string[]).includes(path);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  // "index" is the home page's markdown segment ("/index.md"); every other
  // path maps straight through.
  const htmlPath =
    path.length === 1 && path[0] === "index" ? "/" : `/${path.join("/")}`;

  if (!isMarketingEnabled()) {
    return notFoundResponse();
  }

  const siteUrl = resolveServerUrl();
  const body = isBoardPath(htmlPath)
    ? await boardPageMarkdown(htmlPath, siteUrl)
    : pageMarkdown(htmlPath, siteUrl);

  if (body === null) {
    return notFoundResponse();
  }

  return new Response(body, {
    headers: {
      "cache-control": isBoardPath(htmlPath)
        ? BOARD_PAGE_CACHE_CONTROL
        : AGENT_DOCS_CACHE_CONTROL,
      "content-disposition": "inline",
      "content-type": "text/markdown; charset=utf-8",
      link: `<${siteUrl}${htmlPath}>; rel="canonical"`,
      vary: "Accept",
    },
  });
}
