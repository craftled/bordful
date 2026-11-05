import type { Metadata } from "next";

// The Bordful mark the marketing pages declare.
//
// Do not add src/app/icon.svg or src/app/apple-icon.png. Those file
// conventions apply to every route, including forks and the Payload admin.
// Forks must not wear the Bordful mark. bordful.com gets icon links from
// boardIcons (the (site) layout) and marketingLayoutMetadata (marketing
// pages). /favicon.ico is rewritten to BORDFUL_ICON only when marketing is on.
export const BORDFUL_ICON = "/marketing/icon.svg";

export const BORDFUL_ICONS = {
  apple: "/marketing/apple-icon.png",
  icon: BORDFUL_ICON,
} satisfies Metadata["icons"];

// bordful.com's board wears the Bordful mark. A fork uses its Site Settings
// logo and never the Bordful brand, so no logo means no icon.
export function boardIcons(
  marketing: boolean,
  logoUrl: string | null
): Metadata["icons"] {
  if (marketing) {
    return BORDFUL_ICONS;
  }

  return logoUrl ? { icon: logoUrl } : undefined;
}
