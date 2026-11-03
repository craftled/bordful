import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { Pricing } from "@/components/marketing/pricing";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "Simple pricing for your job board. Bordful is open source and free to use commercially. Custom setup service available for a one-time fee.",
  title: "Pricing",
};

export default function PricingPage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <div className="mx-auto max-w-[800px]">
          <SectionHeader
            description="Bordful is open source and free to use commercially. Need help getting started? We offer custom setup services for a one-time fee."
            headingLevel="h1"
            title="Simple Pricing"
          />
          <div className="mt-16">
            <Pricing variant="standalone" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
