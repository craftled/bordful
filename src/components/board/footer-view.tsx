import Link from "next/link";

import { BordfeedCredit } from "@/components/board/bordfeed-credit";
import { BrandMark } from "@/components/board/brand-mark";
import {
  SocialLinks,
  type SocialProfiles,
} from "@/components/board/social-links";
import type { FooterColumn } from "@/config/nav";

const FOOTER_LINK_CLASS =
  "text-muted-foreground hover:text-foreground transition-colors";
const FOOTER_ICON_CLASS = "text-muted-foreground hover:text-foreground";
const FOOTER_BUTTON_CLASS =
  "bg-card text-foreground ring-line-strong hover:bg-selected inline-flex h-7 items-center rounded-lg px-2.5 text-[13px] font-medium ring-1 ring-inset transition-colors";

export interface FooterStats {
  companies: number;
  openRoles: number;
}

export function FooterView({
  bordfulMark = false,
  columns,
  logoUrl,
  name,
  showAlert,
  showAttribution,
  social,
  stats,
  tagline,
}: {
  bordfulMark?: boolean;
  columns: FooterColumn[];
  logoUrl: string | null;
  name: string;
  showAlert: boolean;
  showAttribution: boolean;
  social: SocialProfiles;
  stats: FooterStats | null;
  tagline: string;
}) {
  const year = new Date().getFullYear();
  const hasSocial = Object.values(social).some(Boolean);

  return (
    <footer
      className="text-foreground border-line border-t bg-[color-mix(in_srgb,var(--background)_97.5%,black)] dark:bg-[color-mix(in_srgb,var(--background)_80%,black)]"
      data-testid="site-footer"
    >
      <div className="flex w-full flex-col gap-7 px-4 pt-10 pb-7">
        <div className="flex flex-col justify-between gap-x-12 gap-y-10 lg:flex-row">
          <div className="flex w-full max-w-[300px] shrink-0 flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[14px] font-medium tracking-[-0.01em]">
              {logoUrl ? (
                // biome-ignore lint/performance/noImgElement: footer logo is a native img at 20px
                <img
                  alt=""
                  className="h-5 w-auto"
                  height={20}
                  src={logoUrl}
                  width={20}
                />
              ) : (
                <BrandMark bordful={bordfulMark} />
              )}
              <span>{name}</span>
            </div>
            {tagline ? (
              <p className="text-subtle text-[13px] leading-5">{tagline}</p>
            ) : null}
            <div className="flex gap-1.5 pt-1">
              {showAlert ? (
                <Link className={FOOTER_BUTTON_CLASS} href="/alerts">
                  Create alert
                </Link>
              ) : null}
              {/* Plain anchor: feeds are route handlers, and next/link would prefetch them. */}
              <a className={FOOTER_BUTTON_CLASS} href="/feed.xml">
                RSS
              </a>
            </div>
            {hasSocial ? (
              <SocialLinks
                className="pt-1"
                linkClassName={FOOTER_ICON_CLASS}
                links={social}
                showRss={false}
              />
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 lg:flex lg:min-w-0">
            {columns.map((column) => (
              <nav
                aria-label={column.title}
                className="lg:w-[140px] lg:min-w-0"
                key={column.id}
              >
                <h2 className="text-subtle text-[12px] leading-4 font-medium">
                  {column.title}
                </h2>
                <ul className="mt-[9px] space-y-[9px] text-[13px] leading-[18px]">
                  {column.items.map((item) => (
                    <li key={item.id}>
                      <Link className={FOOTER_LINK_CLASS} href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-line text-subtle flex flex-wrap items-center justify-between gap-4 border-t pt-[18px] text-[12px] leading-4">
          <p data-testid="footer-stats">
            © {year}
            {stats && stats.openRoles > 0
              ? ` · ${stats.openRoles.toLocaleString("en-US")} open ${
                  stats.openRoles === 1 ? "role" : "roles"
                } from ${stats.companies.toLocaleString("en-US")} ${
                  stats.companies === 1 ? "company" : "companies"
                }`
              : ` ${name}`}
          </p>
          {showAttribution ? <BordfeedCredit /> : null}
        </div>
      </div>
    </footer>
  );
}
