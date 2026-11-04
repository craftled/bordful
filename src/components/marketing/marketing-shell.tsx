import type { ReactNode } from "react";

import { MAIN_CONTENT_ID, SkipLink } from "@/components/skip-link";
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
      <SkipLink />
      <MarketingHeader />
      <div className="group/shell border-line mx-auto flex w-full max-w-[1200px] flex-1 flex-col min-[1200px]:border-x">
        {/* A page that brings Paper's slim desktop footer (docs, the 404)
            marks it with data-slim-footer: the full footer then shows on
            phones only, and main stretches so the slim one sits at the
            bottom. */}
        <main
          className="flex-1 has-[[data-slim-footer]]:flex has-[[data-slim-footer]]:flex-col"
          id={MAIN_CONTENT_ID}
        >
          {children}
        </main>
        <MarketingFooter className="md:group-has-[[data-slim-footer]]/shell:hidden" />
      </div>
    </div>
  );
}
