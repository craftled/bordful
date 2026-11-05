import { type NextRequest, NextResponse } from "next/server";

import { isMarketingEnabled } from "@/config/flags";
import { buildCsp } from "@/lib/csp/build-csp";
import { createNonce } from "@/lib/csp/nonce";
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

  const nonce = createNonce();
  const isDev = process.env.NODE_ENV !== "production";
  const csp = buildCsp({ admin: isAdminPath(pathname), isDev, nonce });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const init = { request: { headers: requestHeaders } };
  const response = hasMalformedEncoding(pathname)
    ? NextResponse.rewrite(new URL(MALFORMED_PATH_REWRITE, request.url), init)
    : NextResponse.next(init);
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      missing: [{ key: "next-router-prefetch", type: "header" }],
      // Static files and prefetches skip the nonce. /api and /admin stay covered.
      // /favicon.ico runs here only for the rewrite above.
      source: "/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)",
    },
  ],
};
