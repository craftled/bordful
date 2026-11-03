import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  padding = "default",
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  padding?: "default" | "hero";
  variant?: "default" | "secondary";
}) {
  return (
    <section
      className={cn(
        variant === "secondary" && "bg-secondary/50",
        padding === "default" ? "py-20" : "pt-40 pb-12",
        className
      )}
      id={id}
    >
      {children}
    </section>
  );
}
