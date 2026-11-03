import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { FeaturesPageGrid } from "@/components/marketing/features-page-grid";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { Section } from "@/components/marketing/section";
import { GITHUB_URL } from "@/components/marketing/site";
import { Button } from "@/components/ui/button";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "The board, filters, email alerts, Post a Job, theming, feeds and SEO, the Bordfeed sync, and the admin. Everything Bordful does today.",
  title: "Features",
};

export default function FeaturesPage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container className="flex flex-col gap-5 md:items-center md:gap-[18px] md:text-center">
          <p className="bg-card ring-line-strong text-muted-foreground md:text-foreground self-start rounded-full px-2.5 py-0.5 text-[12px] leading-4 font-medium ring-1 md:self-center md:bg-transparent md:px-0 md:py-0 md:text-[13px] md:leading-[19px] md:ring-0">
            Features
          </p>
          <h1 className="flex flex-col text-[32px] leading-10 font-medium tracking-[-0.035em] text-balance md:text-[48px] md:leading-[54px]">
            <span className="text-foreground">Everything you need</span>
            <span className="text-subtle">to run a job board.</span>
          </h1>
          <p className="text-muted-foreground max-w-[560px] text-[16px] leading-6 md:leading-[25px] md:text-balance">
            An open-source job board with the pieces already wired together.
          </p>
          <div className="flex flex-col gap-2 self-stretch md:flex-row md:self-auto">
            <Button
              asChild
              className="h-11 px-4 text-[15px] md:h-9 md:text-[13px]"
            >
              <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
                Clone now
              </a>
            </Button>
            <Button
              asChild
              className="h-11 px-4 text-[15px] md:h-9 md:text-[13px]"
              variant="outline"
            >
              <Link href="/jobs">Live demo</Link>
            </Button>
          </div>
        </Container>
      </Section>
      <FeaturesPageGrid />
      <MarketingCta
        actions={[
          { external: true, href: GITHUB_URL, label: "Clone now" },
          { href: "/jobs", label: "Live demo" },
        ]}
        description="Clone the repository and launch your board today."
        title="Ready to launch your"
        titleMuted="job board?"
      />
    </>
  );
}
