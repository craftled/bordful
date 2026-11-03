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

export default function DocsHomePage() {
  assertMarketingEnabled();
  const entries = listDocs();

  return (
    <DocsFrame active="" entries={entries}>
      <p className="text-[13px] leading-4">
        <span className="text-subtle">Docs / </span>
        <span className="text-foreground">Overview</span>
      </p>
      <h1 className="text-foreground mt-5 text-[32px] leading-10 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
        Documentation
      </h1>
      <p className="text-muted-foreground mt-3 max-w-[560px] text-[16px] leading-6">
        Everything you need to deploy a Bordful board, connect Bordfeed, and
        make it yours.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              className="border-line bg-card hover:bg-surface-sub flex h-full flex-col gap-1.5 rounded-lg border p-4"
              href={`/docs/${entry.slug}`}
            >
              <span className="text-foreground text-[15px] leading-5 font-medium">
                {entry.title}
              </span>
              <span className="text-muted-foreground line-clamp-3 text-[13px] leading-[19px]">
                {entry.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </DocsFrame>
  );
}
