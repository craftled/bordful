import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { FeaturesPageGrid } from "@/components/marketing/features-page-grid";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { GITHUB_URL } from "@/components/marketing/site";
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
        <Container>
          <SectionHeader
            description="An open-source job board with the pieces already wired together."
            eyebrow="Features"
            headingLevel="h1"
            title="Everything you need"
            titleMuted="to run a job board."
          />
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
