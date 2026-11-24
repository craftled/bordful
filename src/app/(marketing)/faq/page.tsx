import type { Metadata } from "next";
import { headers } from "next/headers";
import { FAQ_PAGE_CTA, faqPlainAnswers } from "@/components/marketing/faq";
import { FaqPageTabs } from "@/components/marketing/faq-page-tabs";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { resolveServerUrl } from "@/config/server-url";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { agentPageDescription } from "@/lib/docs/agent-pages";
import { faqPageJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = marketingPageMetadata({
  description: agentPageDescription("/faq"),
  markdownPath: markdownPathFor("/faq"),
  path: "/faq",
  title: "FAQ",
});

// The questions live in the shared Faq component, so the home page, pricing
// and this page never drift apart.
export default async function FaqPage() {
  assertMarketingEnabled();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd
        data={faqPageJsonLd(resolveServerUrl(), {
          path: "/faq",
          items: faqPlainAnswers(),
        })}
        nonce={nonce}
      />
      <FaqPageTabs />
      <MarketingCta
        actions={FAQ_PAGE_CTA.actions.map((action) => ({ ...action }))}
        description={FAQ_PAGE_CTA.description}
        title={FAQ_PAGE_CTA.heading[0]}
        titleMuted={FAQ_PAGE_CTA.heading[1]}
      />
      <MarketingSlimFooter />
    </>
  );
}
