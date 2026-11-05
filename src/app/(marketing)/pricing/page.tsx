import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { Faq } from "@/components/marketing/faq";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Pricing } from "@/components/marketing/pricing";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "Simple pricing for your job board. Bordful is open source and free to use commercially. Custom setup service available for a one-time fee.",
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
            description="Self-host for free, or let us set everything up for you."
            eyebrow="Pricing"
            headingLevel="h1"
            title="Simple pricing,"
            titleMuted="pay once or not at all."
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
        description="Start free, upgrade only if you want us to do the setup."
        title="Ready to launch your"
        titleMuted="job board?"
      />
      <MarketingSlimFooter />
    </>
  );
}
