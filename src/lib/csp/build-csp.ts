const BASE64_NONCE =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
// Payload admin renders one inline theme script without a nonce (ResolveThemeOnClient).
// payload-theme-hash.test.ts fails when a Payload bump changes its content.
export const PAYLOAD_THEME_SCRIPT_SHA256 =
  "eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=";
const FORBIDDEN_ORIGIN_CHARS = /['";\s,]/;
const LEADING_WILDCARD_ORIGIN = /^https:\/\/\*\.[^*.]+\.[^*]+$/;

export function buildCsp({
  nonce,
  isDev,
  extraScriptOrigins = [],
  extraConnectOrigins = [],
}: {
  nonce: string;
  isDev: boolean;
  extraScriptOrigins?: string[];
  extraConnectOrigins?: string[];
}): string {
  if (nonce.length === 0 || !BASE64_NONCE.test(nonce)) {
    throw new Error("CSP nonce must be base64");
  }

  for (const origin of [...extraScriptOrigins, ...extraConnectOrigins]) {
    assertHttpsOrigin(origin);
  }

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    `'sha256-${PAYLOAD_THEME_SCRIPT_SHA256}'`,
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...extraScriptOrigins,
  ].join(" ");

  const connectSrc = [
    "'self'",
    ...extraConnectOrigins,
    ...(isDev ? ["ws:"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://buy.stripe.com https://checkout.stripe.com",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

function assertHttpsOrigin(origin: string): void {
  if (origin.length === 0 || FORBIDDEN_ORIGIN_CHARS.test(origin)) {
    throw new Error(
      "CSP origin must be an https URL without quotes, semicolons, spaces, or commas"
    );
  }

  // One leading wildcard label is the only star form. Parse it as a real host.
  const wildcard = LEADING_WILDCARD_ORIGIN.test(origin);
  if (origin.includes("*") && !wildcard) {
    throw new Error("CSP origin must be an https URL");
  }
  const parsedOrigin = wildcard
    ? origin.replace("https://*.", "https://wildcard.")
    : origin;

  let url: URL;
  try {
    url = new URL(parsedOrigin);
  } catch (error) {
    throw new Error("CSP origin must be an https URL", { cause: error });
  }

  if (url.protocol !== "https:" || url.origin !== parsedOrigin) {
    throw new Error("CSP origin must be an https URL");
  }
}
