import { normalizeDomain } from "@/lib/bordfeed/map-company";

// Logo.dev serves company marks by domain. Bordful falls back to it when a
// company has no uploaded logo and no logo URL, and only when a publishable
// key (pk_...) is set. The key ends up in public HTML, so a secret key
// (sk_...) is ignored rather than leaked.

export const LOGO_DEV_IMAGE_ORIGIN = "https://img.logo.dev";
export const LOGO_DEV_ATTRIBUTION_HREF = "https://logo.dev";
export const LOGO_DEV_ATTRIBUTION_LABEL = "Logos provided by Logo.dev";

// The largest company mark renders at 64 CSS px; retina=true doubles it.
const LOGO_DEV_SIZE_PX = 64;

export interface LogoDevEnv {
  NEXT_PUBLIC_LOGO_DEV_TOKEN?: string;
}

function processEnv(): LogoDevEnv {
  return { NEXT_PUBLIC_LOGO_DEV_TOKEN: process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN };
}

export function readLogoDevToken(
  env: LogoDevEnv = processEnv()
): string | null {
  const token = env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim() ?? "";
  return token.startsWith("pk_") ? token : null;
}

export function isLogoDevConfigured(env: LogoDevEnv = processEnv()): boolean {
  return readLogoDevToken(env) !== null;
}

export function logoDevUrl(
  domain: unknown,
  env: LogoDevEnv = processEnv()
): string | null {
  const token = readLogoDevToken(env);
  const host = typeof domain === "string" ? normalizeDomain(domain) : null;
  if (!(token && host)) {
    return null;
  }

  // PNG, not WebP: the same URL lands in alert emails and JobPosting JSON-LD.
  const params = new URLSearchParams({
    format: "png",
    retina: "true",
    size: String(LOGO_DEV_SIZE_PX),
    token,
  });
  return `${LOGO_DEV_IMAGE_ORIGIN}/${host}?${params.toString()}`;
}
