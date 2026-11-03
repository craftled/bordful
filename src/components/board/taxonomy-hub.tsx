import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  href?: string;
  label: string;
}

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-subtle flex flex-wrap items-center gap-2 text-[13px] md:text-[14px]"
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
  testId,
}: {
  children: ReactNode;
  subtitle?: ReactNode;
  testId?: string;
}) {
  return (
    <h1
      className="text-foreground text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[44px]"
      data-testid={testId}
    >
      {children}
      {subtitle ? <span className="text-subtle block">{subtitle}</span> : null}
    </h1>
  );
}
