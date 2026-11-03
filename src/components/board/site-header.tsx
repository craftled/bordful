"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/board/brand-mark";
import { MobileNav } from "@/components/board/mobile-nav";
import { isActiveItem } from "@/components/board/nav-active";
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
      className="border-line bg-background relative z-30 border-b"
      data-testid="site-header"
    >
      <div className="flex h-[52px] w-full items-center gap-4 px-4">
        <Link
          className="flex min-w-0 items-center gap-2 text-[14px] font-medium tracking-[-0.01em]"
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
            <BrandMark />
          )}
          <span className="truncate">{name}</span>
        </Link>
        <div className="ml-auto flex items-center gap-4" data-testid="site-nav">
          <nav aria-label="Primary">
            <ul className="hidden items-center gap-1 text-[14px] font-medium md:flex">
              {navItems.map((item) => {
                const active = isActiveItem(pathname, item);
                return (
                  <li key={item.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`rounded-md px-2 py-1 transition-colors ${
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[30px] items-center rounded-full px-3 text-[14px] font-medium md:h-7 md:rounded-md md:px-2.5 md:text-[13px]"
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
