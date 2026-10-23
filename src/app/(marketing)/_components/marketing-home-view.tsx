import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { geist } from "@/components/marketing/fonts";
import { Hero } from "@/components/marketing/hero";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Pricing } from "@/components/marketing/pricing";
import { Showcase } from "@/components/marketing/showcase";
import { TechStack } from "@/components/marketing/tech-stack";

import "@/components/marketing/marketing.css";

export function MarketingHomeView() {
  return (
    <div
      className={`${geist.variable} bordful-marketing flex min-h-screen flex-col`}
      data-testid="marketing-home"
    >
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <TechStack />
        <Features />
        <Showcase />
        <Pricing />
        <Faq />
      </main>
      <MarketingFooter />
    </div>
  );
}
