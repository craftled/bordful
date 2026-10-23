import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { getSiteSettings } from "@/lib/read";
import { resolveThemeTokens, tokensToCssVariables } from "@/theme/tokens";

import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await headers();
  const settings = await getSiteSettings();

  return {
    title: {
      default: settings.name,
      template: `%s | ${settings.name}`,
    },
  };
}

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const settings = await getSiteSettings();
  const css = tokensToCssVariables(resolveThemeTokens(settings.theme));

  return (
    <html lang="en">
      <head>
        <style nonce={nonce}>{`:root{${css}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
