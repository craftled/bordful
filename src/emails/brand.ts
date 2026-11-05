import type { SiteSettingsView } from "@/lib/read/types";

const TRAILING_SLASH = /\/+$/u;
const REM_PX = 16;
// Media also accepts webp and avif, which Outlook desktop cannot show.
const EMAIL_IMAGE_EXTENSION = /\.(?:png|jpe?g|gif)$/iu;

// The Bordful mark as a PNG. Gmail does not render SVG.
const BORDFUL_MARK_PNG = "/marketing/apple-icon.png";

export interface EmailBrand {
  logoUrl: string | null;
  primary: string;
  primaryForeground: string;
  radiusPx: number;
  siteName: string;
  siteUrl: string;
}

function imageUrl(value: string, base: string): string | null {
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (!EMAIL_IMAGE_EXTENSION.test(url.pathname)) {
    return null;
  }
  return url.href;
}

// Forks never wear the Bordful mark (see src/lib/seo/icons.ts), so only
// bordful.com falls back to it when Site settings has no usable logo.
export function emailBrand(
  settings: Pick<SiteSettingsView, "logoUrl" | "name" | "theme">,
  siteUrl: string,
  marketing: boolean
): EmailBrand {
  const base = siteUrl.replace(TRAILING_SLASH, "");
  const uploaded = settings.logoUrl ? imageUrl(settings.logoUrl, base) : null;
  const fallback = marketing ? imageUrl(BORDFUL_MARK_PNG, base) : null;

  return {
    logoUrl: uploaded ?? fallback,
    primary: settings.theme.colors.primary,
    primaryForeground: settings.theme.colors.primaryForeground,
    radiusPx: Math.round(settings.theme.radius * REM_PX),
    siteName: settings.name,
    siteUrl: base,
  };
}
