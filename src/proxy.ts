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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Crawlers ask for /favicon.ico. bordful.com points it at the Bordful mark;
  // a fork has no such file, so its request falls through to the 404.
  if (pathname === "/favicon.ico") {
    return isMarketingEnabled()
      ? NextResponse.redirect(new URL(BORDFUL_ICON, request.url))
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
      // /favicon.ico runs here only for the redirect above.
      source: "/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)",
    },
  ],
};
