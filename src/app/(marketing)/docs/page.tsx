import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  type LucideIcon,
  Palette,
  Rocket,
  Rss,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { firstSentence, listDocs } from "@/components/marketing/docs-content";
import { DocsFrame } from "@/components/marketing/docs-layout";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "Guides for deploying, configuring, theming and extending a Bordful job board.",
  path: "/docs",
  title: "Docs",
});

const ICONS: Record<string, LucideIcon> = {
  alerts: Bell,
  bordfeed: Rss,
  configuration: Settings2,
  customization: SlidersHorizontal,
  deploy: Rocket,
  "post-a-job": CreditCard,
  theming: Palette,
};

export default function DocsHomePage() {
  assertMarketingEnabled();
  const entries = listDocs();

  return (
    <DocsFrame
      active=""
      editHref={`${GITHUB_URL}/edit/main/src/app/(marketing)/docs/page.tsx`}
      entries={entries}
    >
      <div className="flex flex-col gap-6 md:gap-3">
        <p className="text-foreground text-[13px] leading-4 font-medium md:leading-[19px]">
          Docs
        </p>
        <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] md:text-[34px] md:leading-10">
          Documentation
        </h1>
        <p className="text-muted-foreground text-[16px] leading-6 md:leading-[25px]">
          Everything you need to deploy a Bordful board, connect Bordfeed, and
          make it yours.
        </p>
      </div>
      <ul className="bg-card ring-line flex flex-col overflow-hidden rounded-[14px] ring-1 md:hidden">
        {entries.map((entry) => (
          <li className="border-line border-b last:border-b-0" key={entry.slug}>
            <Link
              className="hover:bg-surface-sub flex items-center gap-3 px-4 py-3.5"
              href={`/docs/${entry.slug}`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-foreground text-[15px] leading-[18px] font-medium">
                  {entry.title}
                </span>
                <span className="text-muted-foreground text-[13px] leading-4">
                  {firstSentence(entry.summary)}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="text-subtle size-3.5 shrink-0"
                strokeWidth={1.8}
              />
            </Link>
          </li>
        ))}
      </ul>
      <ul className="hidden gap-3 md:grid md:grid-cols-2">
        {entries.map((entry) => {
          const Icon = ICONS[entry.slug] ?? FileText;

          return (
            <li key={entry.slug}>
              <Link
                className="bg-card ring-line-strong hover:bg-surface-sub flex h-full flex-col gap-2.5 rounded-xl p-4 ring-1 ring-inset"
                href={`/docs/${entry.slug}`}
              >
                <span className="bg-tag text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
                  <Icon
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={1.4}
                  />
                </span>
                <span className="text-foreground text-[14px] leading-5 font-medium">
                  {entry.title}
                </span>
                <span className="text-muted-foreground text-[13px] leading-[19px]">
                  {firstSentence(entry.summary)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </DocsFrame>
  );
}
