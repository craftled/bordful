"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/board/brand-mark";
import { MobileNav } from "@/components/board/mobile-nav";
import { isActivePath } from "@/components/board/nav-active";
import {
  SocialLinks,
  type SocialProfiles,
} from "@/components/board/social-links";
import type { NavItem } from "@/config/nav";

export function SiteHeader({
  cta,
  homeHref,
  logoUrl,
  name,
  navItems,
  social,
}: {
  cta: NavItem | null;
  homeHref: string;
  logoUrl: string | null;
  name: string;
  navItems: NavItem[];
  social: SocialProfiles;
}) {
  const pathname = usePathname();

  return (
    <header
      className="relative z-30 border-border border-b bg-background"
      data-testid="site-header"
    >
      <div className="mx-auto flex h-14 w-full max-w-board items-center gap-3 px-4">
        <Link
          className="flex min-w-0 items-center gap-2 font-semibold text-base"
          data-testid="site-name"
          href={homeHref}
        >
          {logoUrl ? (
            // biome-ignore lint/performance/noImgElement: site-logo is a native img at 28px
            <img
              alt=""
              className="h-7 w-auto"
              data-testid="site-logo"
              height={28}
              src={logoUrl}
              width={28}
            />
          ) : (
            <BrandMark />
          )}
          <span className="truncate">{name}</span>
        </Link>
        <div className="ml-auto flex items-center gap-4" data-testid="site-nav">
          <nav aria-label="Primary">
            <ul className="hidden items-center gap-4 text-sm md:flex">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden md:block">
            <SocialLinks links={social} />
          </div>
          {cta ? (
            <Link
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm hover:bg-primary/90"
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
