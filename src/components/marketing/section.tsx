import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Paper stacks marketing sections inside the page frame, each closed by a
// hairline. "flush" drops the padding for sections that draw their own cells.
export function Section({
  children,
  className,
  id,
  padding = "default",
  testId,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  padding?: "default" | "hero" | "flush";
  testId?: string;
  variant?: "default" | "secondary";
}) {
  return (
    <section
      className={cn(
        "border-line scroll-mt-14 border-b",
        variant === "secondary" && "bg-surface-sub",
        padding === "default" && "py-10 md:py-16",
        padding === "hero" && "pt-10 pb-10 md:pt-[72px] md:pb-12",
        className
      )}
      data-testid={testId}
      id={id}
    >
      {children}
    </section>
  );
}
