import { headers } from "next/headers";
import type { ReactNode } from "react";

import { LlmsTxtPointer } from "@/components/llms-txt-pointer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ThemeScript } from "@/components/theme/theme-script";

export async function MarketingFrame({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body className="bg-background">
        <LlmsTxtPointer />
        <MarketingShell>{children}</MarketingShell>
      </body>
    </html>
  );
}
