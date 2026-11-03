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

// Footer text stays opacity-free so it keeps the contrast the theme tests.
const FOOTER_LINK_CLASS = "text-background hover:underline underline-offset-4";
const FOOTER_ICON_CLASS = "text-background hover:opacity-80";

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
    <footer className="bg-foreground text-background" data-testid="site-footer">
      {showCta ? (
        <div className="bordful-inverse border-background/20 border-b">
          <div className="max-w-board mx-auto flex w-full flex-wrap items-center justify-between gap-6 px-4 py-10">
            <div>
              <h2 className="text-xl font-semibold">
                Post a Job for {durationDays} Days
              </h2>
              <p className="text-background mt-1 text-sm">
                {priceLabel
                  ? `${priceLabel} per listing. Reach candidates browsing this board.`
                  : "Reach candidates browsing this board."}
              </p>
            </div>
            <Link
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
              href="/post"
            >
              Post a Job
            </Link>
          </div>
        </div>
      ) : null}
      <div className="bordful-inverse max-w-board mx-auto w-full px-4 py-10">
        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <div className="max-w-xs space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              {logoUrl ? (
                // biome-ignore lint/performance/noImgElement: footer logo is a native img at 28px
                <img
                  alt=""
                  className="h-7 w-auto"
                  height={28}
                  src={logoUrl}
                  width={28}
                />
              ) : (
                <BrandMark />
              )}
              <span>{name}</span>
            </div>
            {tagline ? (
              <p className="text-background text-sm">{tagline}</p>
            ) : null}
            <SocialLinks linkClassName={FOOTER_ICON_CLASS} links={social} />
          </div>
          {columns.map((column) => (
            <nav aria-label={column.title} key={column.id}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="text-background mt-3 space-y-2 text-sm">
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
                      <span className="border-background/30 rounded border px-1.5 text-[10px] leading-4 uppercase">
                        {FEED_PILLS[item.id]}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-background/20 text-background mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm">
          <p>
            © {year} {name}
          </p>
          {showAttribution ? <BordfeedCredit /> : null}
        </div>
      </div>
    </footer>
  );
}
