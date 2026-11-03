import { Bento } from "@/components/marketing/bento";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Pricing } from "@/components/marketing/pricing";
import { Statement } from "@/components/marketing/statement";
import { TechStack } from "@/components/marketing/tech-stack";
import { Timeline } from "@/components/marketing/timeline";
import { Walkthrough } from "@/components/marketing/walkthrough";

// Paper's home, top to bottom: hero and product shot, stack strip, statement,
// tabbed walkthrough, timeline, feature bento, pricing, FAQ and the CTA band.
export function MarketingHomeView() {
  return (
    <MarketingShell testId="marketing-home">
      <Hero />
      <TechStack />
      <Statement />
      <Walkthrough />
      <Timeline />
      <Bento />
      <Pricing />
      <Faq />
      <FinalCta />
    </MarketingShell>
  );
}
