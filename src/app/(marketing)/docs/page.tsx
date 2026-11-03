import {
  Bell,
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
import { listDocs } from "@/components/marketing/docs-content";
import { DocsFrame } from "@/components/marketing/docs-layout";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "Guides for deploying, configuring, theming and extending a Bordful job board.",
  title: "Docs",
};

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
    <DocsFrame active="" entries={entries}>
      <div className="flex flex-col gap-3">
        <p className="text-foreground text-[13px] leading-[19px] font-medium">
          Docs
        </p>
        <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] md:text-[34px] md:leading-10">
          Documentation
        </h1>
        <p className="text-muted-foreground text-[16px] leading-[25px]">
          Everything you need to deploy a Bordful board, connect Bordfeed, and
          make it yours.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
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
                <span className="text-muted-foreground line-clamp-3 text-[13px] leading-[19px]">
                  {entry.summary}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </DocsFrame>
  );
}
