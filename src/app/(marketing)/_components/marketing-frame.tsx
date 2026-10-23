import type { ReactNode } from "react";

import { geist } from "@/components/marketing/fonts";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

import "@/components/marketing/marketing.css";

export function MarketingFrame({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} bordful-marketing antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <MarketingHeader />
          <main className="flex-1">{children}</main>
          <MarketingFooter />
        </div>
      </body>
    </html>
  );
}
