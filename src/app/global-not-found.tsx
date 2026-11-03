import type { Metadata } from "next";
import { headers } from "next/headers";

import { MarketingFrame } from "@/app/(marketing)/_components/marketing-frame";
import { MarketingNotFound } from "@/app/(marketing)/not-found";
import BoardNotFound from "@/app/(site)/not-found";
import { ThemeScript } from "@/components/theme/theme-script";
import { isMarketingEnabled } from "@/config/flags";
import { getSiteSettings } from "@/lib/read";
import { FONT_VARIABLE_CLASSES } from "@/theme/fonts";
import { resolveThemeTokens, tokensToCssVariables } from "@/theme/tokens";

import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found",
};

// Unmatched URLs skip the route-group layouts, so this renders the same
// Paper 404 as the group not-found pages, inside the matching frame.
export default async function GlobalNotFound() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  if (isMarketingEnabled()) {
    return (
      <MarketingFrame>
        <MarketingNotFound enabled />
      </MarketingFrame>
    );
  }

  let css = tokensToCssVariables(resolveThemeTokens(null));
  try {
    css = tokensToCssVariables(
      resolveThemeTokens((await getSiteSettings()).theme)
    );
  } catch {
    // Settings unavailable: keep the default theme for the 404.
  }

  return (
    <html className={FONT_VARIABLE_CLASSES} lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
        <style nonce={nonce}>{`:root{${css}}`}</style>
      </head>
      <body className="antialiased">
        <BoardNotFound />
      </body>
    </html>
  );
}
