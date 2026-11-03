import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { marketingFontVariables } from "./fonts";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";

import "./marketing.css";

// Paper's page frame: a full-width header, then a 1200px column with
// hairline sides that holds every section and the footer.
export function MarketingShell({
  children,
  className,
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={cn(
        marketingFontVariables,
        "bordful-marketing bg-background text-foreground flex min-h-screen flex-col font-sans antialiased",
        className
      )}
      data-testid={testId}
    >
      <MarketingHeader />
      <div className="border-line mx-auto flex w-full max-w-[1200px] flex-1 flex-col min-[1200px]:border-x">
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
