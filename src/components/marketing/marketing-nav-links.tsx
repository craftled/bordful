"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { MarketingLink } from "./nav-links";

function isCurrent(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// Header links. Paper prints the current section's link in the text color.
export function MarketingNavLinks({
  items,
  native = false,
}: {
  items: MarketingLink[];
  native?: boolean;
}) {
  const pathname = usePathname();

  return (
    <ul className={native ? "flex flex-col" : "flex items-center gap-[22px]"}>
      {items.map((item) => {
        const current = isCurrent(pathname, item.href);
        const className = cn(
          native
            ? "block py-2 text-[14px] leading-[18px]"
            : "text-[13px] leading-[18px] font-medium",
          current
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        );

        return (
          <li key={item.href}>
            {native ? (
              <a
                aria-current={current ? "page" : undefined}
                className={className}
                href={item.href}
              >
                {item.label}
              </a>
            ) : (
              <Link
                aria-current={current ? "page" : undefined}
                className={className}
                href={item.href}
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
