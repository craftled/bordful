import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Pricing } from "@/components/marketing/pricing";
import { ProductStrip } from "@/components/marketing/product-strip";
import { Showcase } from "@/components/marketing/showcase";
import { Statement } from "@/components/marketing/statement";
import { TechStack } from "@/components/marketing/tech-stack";

export function MarketingHomeView() {
  return (
    <MarketingShell testId="marketing-home">
      <Hero />
      <TechStack />
      <Statement />
      <Features />
      <Showcase />
      <ProductStrip />
      <Pricing />
      <Faq />
      <FinalCta />
    </MarketingShell>
  );
}
