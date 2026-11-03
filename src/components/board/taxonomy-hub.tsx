import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Crumb {
  href?: string;
  label: string;
}

export function Crumbs({
  compact = false,
  items,
}: {
  // Paper's type, level and language indexes set the trail on a 16px line;
  // the locations index and the archives use 19px.
  compact?: boolean;
  items: Crumb[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-subtle flex flex-wrap items-center gap-2 text-[13px] leading-4",
        compact ? null : "md:leading-[19px]"
      )}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span className="flex items-center gap-2" key={item.label}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href && !last ? (
              <Link
                className="hover:text-foreground transition-colors"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={last ? "text-foreground" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageTitle({
  children,
  subtitle,
  tight = false,
  testId,
}: {
  children: ReactNode;
  subtitle?: ReactNode;
  // Paper sets the location pages on a 44px line and the rest on 48px.
  tight?: boolean;
  testId?: string;
}) {
  return (
    <h1
      className={cn(
        "text-foreground text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px]",
        tight ? "md:leading-[44px]" : "md:leading-[48px]"
      )}
      data-testid={testId}
    >
      {children}
      {subtitle ? <span className="text-subtle block">{subtitle}</span> : null}
    </h1>
  );
}

// The padded column every taxonomy and company page sits in: Paper's 1072px
// content width, 28px above and 72px below on desktop.
export function PageFrame({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-[1104px] flex-col gap-5 px-4 pt-2 pb-7 md:gap-8 md:pt-7 md:pb-[72px]"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
