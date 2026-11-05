import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { FeaturesPageGrid } from "@/components/marketing/features-page-grid";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Section } from "@/components/marketing/section";
import { GITHUB_URL } from "@/components/marketing/site";
import { Button } from "@/components/ui/button";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "The board, filters, email alerts, Post a Job, theming, feeds and SEO, the Bordfeed sync, and the admin. Everything Bordful does today.",
  path: "/features",
  title: "Features",
});

// Paper's stats strip, with facts the site already states: the license, the
// 1.0 release on Payload and Postgres, and "live in two minutes" from the
// home hero. Paper's "100% TypeScript" and "5 min" cells are not claims the
// site makes, so they are swapped for these.
const STATS = [
  { label: "Open source license", value: "MIT" },
  { label: "Now on Payload and Postgres", value: "1.0" },
  { label: "From Deploy to a live board", value: "2 min" },
] as const;

function FeaturesStats() {
  return (
    <section
      aria-label="Bordful at a glance"
      className="border-line border-b px-4 py-6 md:px-0 md:py-0"
    >
      <dl className="flex flex-col md:flex-row">
        {STATS.map((stat) => (
          <div
            className="border-line flex flex-col gap-0.5 border-b py-4 last:border-b-0 md:flex-1 md:gap-1.5 md:border-b-0 md:border-l md:px-8 md:py-9 md:first:border-l-0"
            key={stat.value}
          >
            <dt className="text-muted-foreground order-2 text-[14px] leading-[18px] md:leading-[21px]">
              {stat.label}
            </dt>
            <dd className="text-foreground order-1 text-[30px] leading-9 font-medium tracking-[-0.03em] md:text-[40px] md:leading-[44px]">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

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
      <FeaturesStats />
      <FeaturesPageGrid />
      {/* Paper's features CTA sits on the page color, not the tinted band
          MarketingCta draws elsewhere. */}
      <div className="[&>section]:bg-transparent">
        <MarketingCta
          actions={[
            { external: true, href: GITHUB_URL, label: "Clone now" },
            { href: "/jobs", label: "Live demo" },
          ]}
          description="Clone the repository and launch your board today."
          title="Ready to launch your"
          titleMuted="job board?"
        />
      </div>
      <MarketingSlimFooter />
    </>
  );
}
