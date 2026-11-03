"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { BOARD_SEARCH_INPUT_ID } from "@/components/board/board-search-form";
import { BrandMark } from "@/components/board/brand-mark";
import { MobileNav } from "@/components/board/mobile-nav";
import { isActiveItem } from "@/components/board/nav-active";
import { useJobList } from "@/components/board/saved-jobs";
import {
  SocialLinks,
  type SocialProfiles,
} from "@/components/board/social-links";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

export const SAVED_PATH = "/saved";

export interface HeaderViews {
  allCount: number;
  allHref: string;
  remoteCount: number;
  remoteHref: string;
}

type ViewId = "all" | "remote" | "saved";

function isUnder(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function activeView(pathname: string, views: HeaderViews): ViewId | null {
  if (pathname === SAVED_PATH) {
    return "saved";
  }
  if (
    pathname === views.remoteHref ||
    pathname.startsWith(`${views.remoteHref}/page/`)
  ) {
    return "remote";
  }
  // Every board list (search, pages, taxonomy indexes and archives), job
  // pages, alerts and the post flow keep "All" selected, as Paper does.
  if (
    pathname === views.allHref ||
    isUnder(pathname, "/jobs") ||
    isUnder(pathname, "/alerts") ||
    isUnder(pathname, "/post")
  ) {
    return "all";
  }
  return null;
}

// All / Remote / Saved. Saved counts the browser-local list, so it shows
// after hydration only.
function ViewPills({ views }: { views: HeaderViews }) {
  const pathname = usePathname();
  const saved = useJobList("saved");
  const active = activeView(pathname, views);
  const pills: {
    count: number | null;
    href: string;
    id: ViewId;
    label: string;
  }[] = [
    { count: views.allCount, href: views.allHref, id: "all", label: "All" },
    {
      count: views.remoteCount,
      href: views.remoteHref,
      id: "remote",
      label: "Remote",
    },
    {
      count: saved.slugs.length > 0 ? saved.slugs.length : null,
      href: SAVED_PATH,
      id: "saved",
      label: "Saved",
    },
  ];

  return (
    <nav
      aria-label="Views"
      className="bg-tag hidden shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 xl:flex"
    >
      {pills.map((pill) => {
        const on = active === pill.id;
        return (
          <Link
            aria-current={on ? "page" : undefined}
            className={cn(
              "rounded-[6px] px-2.5 py-1 text-[13px] leading-[18px] whitespace-nowrap transition-colors",
              on
                ? "bg-card text-foreground ring-line font-medium shadow-xs ring-1"
                : "text-muted-foreground hover:text-foreground",
              FOCUS
            )}
            href={pill.href}
            key={pill.id}
          >
            {pill.label}
            {pill.count === null ? null : (
              <>
                {" "}
                <span className="tabular-nums">{pill.count}</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 20 20"
    >
      <path d="M5 13.5V9a5 5 0 0 1 10 0v4.5l1.2 1.5H3.8z" />
      <path d="M8.5 17a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

// ⌘K / Ctrl-K focuses the header search from anywhere on the page.
function useSearchHotkey(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      const input = document.querySelector(`#${BOARD_SEARCH_INPUT_ID}`);
      if (input instanceof HTMLInputElement) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

export function SiteHeader({
  cta,
  homeHref,
  bordfulMark = false,
  logoUrl,
  name,
  navItems,
  search,
  searchOnPhone = false,
  social,
  views,
}: {
  cta: NavItem | null;
  homeHref: string;
  // bordful.com shows the Bordful mark when no logo is set.
  bordfulMark?: boolean;
  logoUrl: string | null;
  name: string;
  navItems: NavItem[];
  // The board search form. Rendered once; it moves between the phone row and
  // the desktop bar with CSS only.
  search?: ReactNode;
  // Board pages show the search as a row under the brand bar on phones.
  searchOnPhone?: boolean;
  social: SocialProfiles;
  views?: HeaderViews;
}) {
  const pathname = usePathname();
  useSearchHotkey(Boolean(search));
  // From xl the view pills replace the Jobs link; job alerts become a button.
  const alerts = navItems.find((item) => item.id === "alerts") ?? null;
  const links = navItems.filter((item) => item.id !== "alerts");

  return (
    <header
      // Paper's phone header has no bottom rule; it starts at lg.
      className="bg-background lg:border-line relative z-30 lg:border-b"
      data-testid="site-header"
    >
      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-1 lg:h-[51px] lg:flex-nowrap lg:pt-0",
          !searchOnPhone && "pb-3 lg:pb-0"
        )}
      >
        <Link
          className="flex h-[30px] min-w-0 items-center gap-2 text-[14px] font-medium tracking-[-0.01em] lg:h-auto lg:w-[200px] lg:shrink-0"
          data-testid="site-name"
          href={homeHref}
        >
          {logoUrl ? (
            // biome-ignore lint/performance/noImgElement: site-logo is a native img at 20px
            <img
              alt=""
              className="h-5 w-auto"
              data-testid="site-logo"
              height={20}
              src={logoUrl}
              width={20}
            />
          ) : (
            <BrandMark bordful={bordfulMark} />
          )}
          <span className="truncate">{name}</span>
        </Link>
        {search ? (
          <div
            className={cn(
              "order-last basis-full pb-3 lg:order-none lg:max-w-[480px] lg:min-w-0 lg:flex-1 lg:basis-auto lg:pb-0",
              !searchOnPhone && "max-lg:hidden"
            )}
          >
            {search}
          </div>
        ) : null}
        {views ? <ViewPills views={views} /> : null}
        <div
          className="ml-auto flex items-center gap-3 lg:gap-4"
          data-testid="site-nav"
        >
          <nav aria-label="Primary">
            <ul className="hidden items-center gap-1 text-[14px] font-medium md:flex">
              {links.map((item) => {
                const active = isActiveItem(pathname, item);
                return (
                  <li
                    className={cn(views && item.id === "jobs" && "xl:hidden")}
                    key={item.id}
                  >
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-md px-2 py-1 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                        FOCUS
                      )}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {alerts ? (
                <li className="pl-3">
                  <Link
                    aria-current={
                      isActiveItem(pathname, alerts) ? "page" : undefined
                    }
                    className={cn(
                      "bg-card text-foreground ring-line-strong hover:bg-surface-sub inline-flex h-7 items-center rounded-[8px] px-2.5 text-[13px] font-medium ring-1 ring-inset",
                      FOCUS
                    )}
                    href={alerts.href}
                  >
                    Create alert
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
          <div className="hidden 2xl:block">
            <SocialLinks links={social} />
          </div>
          <ThemeToggle />
          {alerts ? (
            <Link
              aria-label="Job alerts"
              className={cn(
                "text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md md:hidden",
                FOCUS
              )}
              href={alerts.href}
            >
              <BellIcon />
            </Link>
          ) : null}
          {cta ? (
            <Link
              className={cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[30px] items-center rounded-full px-3 text-[14px] font-medium md:h-7 md:rounded-[8px] md:px-2.5 md:text-[13px]",
                FOCUS
              )}
              href={cta.href}
            >
              {cta.label}
            </Link>
          ) : null}
          <MobileNav items={navItems} social={social} />
        </div>
      </div>
    </header>
  );
}
