import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import {
  BOARD_PAGE_CACHE_CONTROL,
  boardPageMarkdown,
} from "@/lib/docs/agent-board-pages";
import { AGENT_DOCS_CACHE_CONTROL, notFoundText } from "@/lib/docs/agent-docs";
import {
  BOARD_AGENT_PAGE_PATHS,
  STATIC_AGENT_PAGE_PATHS,
} from "@/lib/docs/agent-docs-paths";
import { pageMarkdown } from "@/lib/docs/agent-pages";

// Internal route the proxy rewrites markdown requests to. Public URLs never
// point here. generateStaticParams covers the static marketing pages only:
// the board pages stay dynamic so a static build never opens the database
// (see the comment in src/app/sitemap.ts). dynamicParams stays at its default
// (true) so an unknown path reaches this handler and gets a plain-text 404,
// not the HTML 404 page.
const LEADING_SLASH = /^\//u;

export function generateStaticParams() {
  return STATIC_AGENT_PAGE_PATHS.map((path) => ({
    path: path === "/" ? ["index"] : path.replace(LEADING_SLASH, "").split("/"),
  }));
}

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
