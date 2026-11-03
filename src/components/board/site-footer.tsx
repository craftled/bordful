import Link from "next/link";

import { BordfeedCredit } from "@/components/board/bordfeed-credit";
import { BrandMark } from "@/components/board/brand-mark";
import {
  SocialLinks,
  type SocialProfiles,
} from "@/components/board/social-links";
import type { FooterColumn } from "@/config/nav";

const FEED_IDS = new Set(["feed-atom", "feed-json", "feed-rss"]);

// Sub-labels for feed links whose label does not already name the format.
const FEED_PILLS: Record<string, string> = {
  "feed-atom": "XML",
  "feed-rss": "XML",
};

const FOOTER_LINK_CLASS =
  "text-muted-foreground hover:text-foreground transition-colors";
const FOOTER_ICON_CLASS = "text-muted-foreground hover:text-foreground";

export function SiteFooter({
  columns,
  durationDays,
  logoUrl,
  name,
  priceLabel,
  showAttribution,
  showCta,
  social,
  tagline,
}: {
  columns: FooterColumn[];
  durationDays: number;
  logoUrl: string | null;
  name: string;
  priceLabel: string;
  showAttribution: boolean;
  showCta: boolean;
  social: SocialProfiles;
  tagline: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-muted text-foreground border-line border-t"
      data-testid="site-footer"
    >
      {showCta ? (
        <div className="border-line border-b">
          <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-6">
            <div>
              <h2 className="text-[16px] font-medium">
                Post a Job for {durationDays} Days
              </h2>
              <p className="text-muted-foreground mt-1 text-[13px]">
                {priceLabel
                  ? `${priceLabel} per listing. Reach candidates browsing this board.`
                  : "Reach candidates browsing this board."}
              </p>
            </div>
            <Link
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium"
              href="/post"
            >
              Post a Job
            </Link>
          </div>
        </div>
      ) : null}
      <div className="flex w-full flex-col gap-7 px-4 pt-10 pb-7">
        <div className="flex flex-wrap justify-between gap-x-12 gap-y-10">
          <div className="flex w-full max-w-[300px] flex-col gap-2.5">
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
                <BrandMark />
              )}
              <span>{name}</span>
            </div>
            {tagline ? (
              <p className="text-subtle text-[13px] leading-5">{tagline}</p>
            ) : null}
            <SocialLinks
              className="pt-1"
              linkClassName={FOOTER_ICON_CLASS}
              links={social}
            />
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-8">
            {columns.map((column) => (
              <nav
                aria-label={column.title}
                className="w-[140px]"
                key={column.id}
              >
                <h2 className="text-subtle text-[12px] font-medium">
                  {column.title}
                </h2>
                <ul className="mt-[9px] space-y-[9px] text-[13px]">
                  {column.items.map((item) => (
                    <li className="flex items-center gap-2" key={item.id}>
                      {FEED_IDS.has(item.id) ? (
                        // Feeds are route handlers, not pages. next/link would prefetch them with ?_rsc, which never settles.
                        <a className={FOOTER_LINK_CLASS} href={item.href}>
                          {item.label}
                        </a>
                      ) : (
                        <Link className={FOOTER_LINK_CLASS} href={item.href}>
                          {item.label}
                        </Link>
                      )}
                      {FEED_PILLS[item.id] ? (
                        <span className="border-line-strong text-subtle rounded-xs border px-1.5 text-[10px] leading-4 uppercase">
                          {FEED_PILLS[item.id]}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-line text-subtle flex flex-wrap items-center justify-between gap-4 border-t pt-[18px] text-[12px]">
          <p>
            © {year} {name}
          </p>
          {showAttribution ? <BordfeedCredit /> : null}
        </div>
      </div>
    </footer>
  );
}
