import type { Metadata } from "next";

// The Bordful mark the marketing pages declare.
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
