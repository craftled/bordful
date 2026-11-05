import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { Showcase } from "@/components/marketing/showcase";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "The live Bordful demo, and room for community boards that choose to be listed.",
  path: "/showcase",
  title: "Showcase",
});

export default function ShowcasePage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container>
          <SectionHeader
            className="md:gap-[18px]"
            description="The live Bordful demo. Community boards show up here after they opt in."
            eyebrow="Showcase"
            headingLevel="h1"
            title="Job boards"
            titleMuted="built with Bordful."
          />
        </Container>
      </Section>
      <Showcase variant="page" />
      <MarketingSlimFooter />
    </>
  );
}
