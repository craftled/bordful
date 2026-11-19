const BASE64_NONCE =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
// Payload admin renders one inline theme script without a nonce (ResolveThemeOnClient).
// payload-theme-hash.test.ts fails when a Payload bump changes its content.
export const PAYLOAD_THEME_SCRIPT_SHA256 =
  "eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=";
// Payload's code editor (Monaco) loads its stylesheet from this CDN folder.
// Its scripts are inserted by a nonced script, so 'strict-dynamic' covers
// them, and its icon font is inlined as data:. monaco-cdn.test.ts fails when
// a Payload bump changes the folder.
export const PAYLOAD_MONACO_CDN =
  "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/";
export const TOP_BOILERPLATES_ORIGIN = "https://topboilerplates.com";
const FORBIDDEN_ORIGIN_CHARS = /['";\s,]/u;
const LEADING_WILDCARD_ORIGIN = /^https:\/\/\*\.[^*.]+\.[^*]+$/u;

// The remote image hosts every site page allows. Logos from anywhere else
// (an employer's ATS, say) are blocked, so the read layer checks a logo URL
// against this list with isCspAllowedImageUrl before it reaches an <img>.
export const IMG_SRC_REMOTE_ORIGINS = [
  "https://*.public.blob.vercel-storage.com",
  "https://bordfeed.com",
  "https://*.bordfeed.com",
  "https://img.logo.dev",
] as const;

function hostMatchesOrigin(host: string, origin: string): boolean {
  const pattern = origin.slice("https://".length);
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    return host.endsWith(suffix) && host.length > suffix.length;
  }
  return host === pattern;
}

// True for a root-relative path ('self') or an https URL on one of the
// remote img-src origins. Anything else would be blocked by the policy.
export function isCspAllowedImageUrl(value: string): boolean {
  if (value.startsWith("/")) {
    return !(value.startsWith("//") || value.startsWith("/\\"));
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || url.port !== "") {
    return false;
  }
  return IMG_SRC_REMOTE_ORIGINS.some((origin) =>
    hostMatchesOrigin(url.hostname, origin)
  );
}

export function buildCsp({
  nonce,
  isDev,
  admin = false,
  marketing = false,
  extraScriptOrigins = [],
  extraConnectOrigins = [],
}: {
  nonce: string;
  isDev: boolean;
  // Payload admin pages, which also allow the code editor's stylesheet.
  admin?: boolean;
  marketing?: boolean;
  extraScriptOrigins?: readonly string[];
  extraConnectOrigins?: readonly string[];
}): string {
  if (nonce.length === 0 || !BASE64_NONCE.test(nonce)) {
    throw new Error("CSP nonce must be base64");
  }

  for (const origin of [...extraScriptOrigins, ...extraConnectOrigins]) {
    assertCspOrigin(origin);
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

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(admin ? [PAYLOAD_MONACO_CDN] : []),
  ].join(" ");

  const imgSrc = [
    "'self'",
    "blob:",
    "data:",
    ...IMG_SRC_REMOTE_ORIGINS,
    ...(marketing ? [TOP_BOILERPLATES_ORIGIN] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
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

// Also run by bordful.config.ts parsing, so a bad origin fails at boot and
// build instead of throwing on every request in the proxy.
export function assertCspOrigin(origin: string): void {
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
