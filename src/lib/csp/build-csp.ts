const BASE64_NONCE =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const FORBIDDEN_ORIGIN_CHARS = /['";\s]/;

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
      "CSP origin must be an https URL without quotes, semicolons, or spaces"
    );
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch (error) {
    throw new Error("CSP origin must be an https URL", { cause: error });
  }

  if (url.protocol !== "https:") {
    throw new Error("CSP origin must be an https URL");
  }
}
