import type { Metadata } from "next";

import { Faq } from "@/components/marketing/faq";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "Short answers about the Bordful template, Bordfeed, posting your own jobs, and updating a fork.",
  title: "FAQ",
};

// The questions live in the shared Faq component, so the home page, pricing
// and this page never drift apart.
export default function FaqPage() {
  assertMarketingEnabled();

  return (
    <>
      <h1 className="sr-only">Frequently asked questions</h1>
      <Faq variant="page" />
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
    </>
  );
}
