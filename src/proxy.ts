import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { bordfulConfig } from "@/config";
import { isMarketingEnabled } from "@/config/flags";
import { buildCsp } from "@/lib/csp/build-csp";
import { createNonce } from "@/lib/csp/nonce";
import {
  AGENT_PAGE_PATHS,
  DOCS_MARKDOWN_ROUTE,
  htmlPathFor,
  PAGES_MARKDOWN_ROUTE,
  pagesMarkdownRoutePath,
} from "@/lib/docs/agent-docs-paths";
import { sentryConnectOrigins, sentryWorkerSources } from "@/lib/sentry/config";
import { BORDFUL_ICON } from "@/lib/seo/icons";

// No route serves this path, so a rewrite here renders the regular 404 page.
export const MALFORMED_PATH_REWRITE = "/_bordful/malformed-path";

// A broken percent escape (/jobs/%ZZ) makes Next throw while decoding the
// dynamic segment, which ends in a plain-text 500.
export function hasMalformedEncoding(pathname: string): boolean {
  try {
    decodeURIComponent(pathname);
    return false;
  } catch {
    return true;
  }
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const CANONICAL_ORIGIN = "https://bordful.com";

// Hostname only. Host headers may include a port (`bordful.com:443`).
export function hostnameFromHostHeader(
  hostHeader: string | null
): string | null {
  if (!hostHeader) {
    return null;
  }
  const value = hostHeader.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end === -1 ? null : value.slice(1, end);
  }
  const [name] = value.split(":");
  return name || null;
}

// Staging and preview deploys on *.vercel.app must not serve the app.
// Canonical and local hosts stay put. demo.bordful.com is redirected in vercel.json.
export function shouldRedirectVercelAppHost(
  hostHeader: string | null
): boolean {
  const host = hostnameFromHostHeader(hostHeader);
  if (!host) {
    return false;
  }
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "bordful.com" ||
    host === "www.bordful.com"
  ) {
    return false;
  }
  return host === "vercel.app" || host.endsWith(".vercel.app");
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

const DOCS_MARKDOWN_URL = /^\/docs(?:\/(?<slug>[a-z0-9-]+))?\.md$/u;
const DOCS_HTML_URL = /^\/docs(?:\/(?<slug>[a-z0-9-]+))?\/?$/u;
const Q_PARAM = /^q\s*=\s*(?<q>\S+)$/iu;

// True when any media range is text/markdown with q > 0. Browsers never send
// text/markdown, so no text/html comparison is needed.
export function acceptsMarkdown(accept: string | null): boolean {
  if (accept === null) {
    return false;
  }
  for (const part of accept.split(",")) {
    const [mediaType, ...params] = part.trim().split(";");
    // Media types and parameter names are case-insensitive per HTTP.
    if ((mediaType ?? "").trim().toLowerCase() !== "text/markdown") {
      continue;
    }
    let q = 1;
    for (const param of params) {
      const match = Q_PARAM.exec(param.trim());
      const value = match?.groups?.q;
      if (value !== undefined) {
        q = Number.parseFloat(value);
      }
    }
    if (q > 0) {
      return true;
    }
  }
  return false;
}

// "/docs-md" or "/docs-md/<slug>" for /docs.md, /docs/<slug>.md and for
// /docs, /docs/<slug> when acceptsMarkdown(accept). Otherwise null.
export function docsMarkdownRewrite(
  pathname: string,
  accept: string | null
): string | null {
  const markdown = DOCS_MARKDOWN_URL.exec(pathname);
  const html = markdown ? null : DOCS_HTML_URL.exec(pathname);
  const slug = (markdown ?? html)?.groups?.slug;
  if (!markdown && (html === null || !acceptsMarkdown(accept))) {
    return null;
  }
  return slug ? `${DOCS_MARKDOWN_ROUTE}/${slug}` : DOCS_MARKDOWN_ROUTE;
}

// True for the HTML path of a page that serves a markdown version.
export function isAgentPagePath(pathname: string): boolean {
  return (AGENT_PAGE_PATHS as readonly string[]).includes(pathname);
}

// True for every path whose response depends on the Accept header: the docs
// pages and the pages with a markdown version, in both their .md and HTML
// forms. The proxy sets Vary: Accept on the HTML responses that reach the
// app; the markdown routes set it themselves.
export function isNegotiatedPath(pathname: string): boolean {
  if (DOCS_HTML_URL.test(pathname) || DOCS_MARKDOWN_URL.test(pathname)) {
    return true;
  }
  if (isAgentPagePath(pathname)) {
    return true;
  }
  const htmlOfMd = htmlPathFor(pathname);
  return htmlOfMd !== null && isAgentPagePath(htmlOfMd);
}

// Appends a token to a Vary header without dropping the tokens Next added
// itself (rsc, next-router-state-tree, ...). Merge, never replace.
export function mergeVary(vary: string | null, token: string): string {
  const tokens = new Set(
    (vary ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
  );
  tokens.add(token);
  return [...tokens].join(", ");
}

// "/pages-md/<path>" for every ".md" URL (known pages serve markdown, the
// rest get the route's plain-text 404) and for the HTML URL of a page with a
// markdown version ("/pricing", "/", "/alternatives/wp-job-manager") when
// acceptsMarkdown(accept). Docs paths go through docsMarkdownRewrite
// first. Otherwise null.
export function markdownRewrite(
  pathname: string,
  accept: string | null
): string | null {
  const docs = docsMarkdownRewrite(pathname, accept);
  if (docs !== null) {
    return docs;
  }
  const htmlOfMd = htmlPathFor(pathname);
  if (htmlOfMd !== null) {
    return pagesMarkdownRoutePath(htmlOfMd);
  }
  if (isAgentPagePath(pathname) && acceptsMarkdown(accept)) {
    return pagesMarkdownRoutePath(pathname);
  }
  return null;
}

// Direct hits on the internal routes never reach the handler.
export function isInternalDocsMarkdownPath(pathname: string): boolean {
  return (
    pathname === DOCS_MARKDOWN_ROUTE ||
    pathname.startsWith(`${DOCS_MARKDOWN_ROUTE}/`)
  );
}

export function isInternalPagesMarkdownPath(pathname: string): boolean {
  return (
    pathname === PAGES_MARKDOWN_ROUTE ||
    pathname.startsWith(`${PAGES_MARKDOWN_ROUTE}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Only bordful.com (marketing on) sends *.vercel.app traffic to the
  // canonical host. Forks keep their own vercel.app URL. Cron and other
  // /api calls hit the deployment host and must not follow a 301.
  if (
    !isApiPath(pathname) &&
    isMarketingEnabled() &&
    shouldRedirectVercelAppHost(request.headers.get("host"))
  ) {
    return NextResponse.redirect(
      `${CANONICAL_ORIGIN}${pathname}${search}`,
      301
    );
  }
  // Crawlers ask for /favicon.ico. bordful.com rewrites it to the Bordful mark
  // so the response is 200 with the SVG body. A fork has no such file, so its
  // request falls through to the 404.
  if (pathname === "/favicon.ico") {
    return isMarketingEnabled()
      ? NextResponse.rewrite(new URL(BORDFUL_ICON, request.url))
      : NextResponse.next();
  }

  // Markdown requests are rewritten to the internal routes; the handlers are
  // unit tested in src/app/docs-md and src/app/pages-md. rsc-bearing client
  // navigations stay with the App Router so it never receives markdown.
  if (isMarketingEnabled() && request.headers.get("rsc") === null) {
    const markdown = markdownRewrite(pathname, request.headers.get("accept"));
    if (markdown) {
      return NextResponse.rewrite(new URL(markdown, request.url));
    }
  }

  const nonce = createNonce();
  const isDev = process.env.NODE_ENV !== "production";
  const csp = buildCsp({
    admin: isAdminPath(pathname),
    extraConnectOrigins: [
      ...bordfulConfig.csp.extraConnectOrigins,
      ...sentryConnectOrigins(process.env.NEXT_PUBLIC_SENTRY_DSN),
    ],
    extraScriptOrigins: bordfulConfig.csp.extraScriptOrigins,
    isDev,
    marketing: isMarketingEnabled(),
    nonce,
    workerSrc: sentryWorkerSources({
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_SENTRY_REPLAY: process.env.NEXT_PUBLIC_SENTRY_REPLAY,
    }),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const init = { request: { headers: requestHeaders } };
  const response =
    hasMalformedEncoding(pathname) ||
    isInternalDocsMarkdownPath(pathname) ||
    isInternalPagesMarkdownPath(pathname)
      ? NextResponse.rewrite(new URL(MALFORMED_PATH_REWRITE, request.url), init)
      : NextResponse.next(init);
  response.headers.set("Content-Security-Policy", csp);

  // A CDN must not serve the markdown body to a browser that asked for HTML:
  // every negotiated HTML response declares what varied it.
  if (isNegotiatedPath(pathname)) {
    response.headers.set(
      "Vary",
      mergeVary(response.headers.get("vary"), "Accept")
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Direct hits on /docs-md and /pages-md must always run the proxy,
    // prefetch or not, so they are rewritten to the 404 page and get the CSP
    // instead of serving 200 markdown without it.
    "/docs-md",
    "/docs-md/:path*",
    "/pages-md",
    "/pages-md/:path*",
    {
      missing: [{ key: "next-router-prefetch", type: "header" }],
      // Static files and prefetches skip the nonce. /api and /admin stay covered.
      // /favicon.ico runs here only for the rewrite above.
      source: "/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)",
    },
  ],
};
