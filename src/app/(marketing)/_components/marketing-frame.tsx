import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export function MarketingFrame({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background">
        <MarketingShell>{children}</MarketingShell>
      </body>
    </html>
  );
}
