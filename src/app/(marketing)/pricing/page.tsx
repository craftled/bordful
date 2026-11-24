import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { Faq } from "@/components/marketing/faq";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import {
  PRICING_PAGE_CTA,
  PRICING_PAGE_HEADER,
  Pricing,
} from "@/components/marketing/pricing";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { agentPageDescription } from "@/lib/docs/agent-pages";

export const metadata: Metadata = marketingPageMetadata({
  description: agentPageDescription("/pricing"),
  markdownPath: markdownPathFor("/pricing"),
  path: "/pricing",
  title: "Pricing",
});

export default function PricingPage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container>
          <SectionHeader
            className="md:gap-[18px]"
            description={PRICING_PAGE_HEADER.description}
            eyebrow={PRICING_PAGE_HEADER.eyebrow}
            headingLevel="h1"
            title={PRICING_PAGE_HEADER.title}
            titleMuted={PRICING_PAGE_HEADER.titleMuted}
          />
        </Container>
      </Section>
      <Section className="md:py-14">
        <Container>
          <Pricing variant="standalone" />
        </Container>
      </Section>
      <Faq variant="page" />
      <MarketingCta
        actions={[
          { external: true, href: GITHUB_URL, label: "Clone now" },
          { href: "/jobs", label: "Live demo" },
        ]}
        description={PRICING_PAGE_CTA.description}
        title={PRICING_PAGE_CTA.heading[0]}
        titleMuted={PRICING_PAGE_CTA.heading[1]}
      />
      <MarketingSlimFooter />
    </>
  );
}
