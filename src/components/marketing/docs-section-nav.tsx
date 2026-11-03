"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface DocsSectionNavItem {
  id: string;
  label: string;
}

/**
 * "On this page" list for long single-page documents. Highlights the section
 * currently in view, starting with the first one.
 */
export function DocsSectionNav({
  items,
  variant = "page",
}: {
  items: DocsSectionNavItem[];
  variant?: "page" | "docs";
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.querySelector(`#${CSS.escape(item.id)}`);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = item.id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "shrink-0",
        variant === "docs"
          ? "hidden w-[200px] py-10 pr-5 xl:block"
          : "w-full lg:w-[200px]"
      )}
    >
      <div
        className={cn(
          "flex flex-col lg:sticky",
          variant === "docs" ? "top-20 gap-2.5" : "top-24 gap-1.5"
        )}
      >
        <p className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase">
          On this page
        </p>
        <ul className={cn("flex flex-col", variant === "page" && "pt-2")}>
          {items.map((item) => (
            <li key={item.id}>
              <a
                aria-current={active === item.id ? "location" : undefined}
                className={cn(
                  "block border-l-2 py-[5px] pl-3 text-[13px] leading-[19px]",
                  active === item.id
                    ? "border-foreground text-foreground font-medium"
                    : "border-line text-subtle hover:text-foreground hover:border-line-strong"
                )}
                href={`#${item.id}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
