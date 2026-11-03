import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { Showcase } from "@/components/marketing/showcase";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "The live Bordful demo, and room for community boards that choose to be listed.",
  title: "Showcase",
};

export default function ShowcasePage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <SectionHeader
          description="The live Bordful demo. Community boards show up here after they opt in."
          headingLevel="h1"
          title="Showcase"
        />
        <div className="mx-auto mt-16 max-w-[800px]">
          <Showcase variant="page" />
        </div>
      </Container>
    </Section>
  );
}
