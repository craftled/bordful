import type { Metadata } from "next";
import { headers } from "next/headers";

import { FaqPageTabs } from "@/components/marketing/faq-page-tabs";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { resolveServerUrl } from "@/config/server-url";
import { faqPageJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "Short answers about the Bordful template, Bordfeed, posting your own jobs, and updating a fork.",
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
      <JsonLd data={faqPageJsonLd(resolveServerUrl())} nonce={nonce} />
      <FaqPageTabs />
      <MarketingCta
        actions={[
          {
            external: true,
            href: `${GITHUB_URL}/issues`,
            label: "Open an issue",
          },
          { href: "/docs", label: "Read the docs" },
        ]}
        description="Still stuck? Read the docs or open an issue on GitHub."
        title="Still have"
        titleMuted="a question?"
      />
      <MarketingSlimFooter />
    </>
  );
}
