import { faqPlainAnswers } from "@/components/marketing/faq";
import {
  MARKETING_DESCRIPTION,
  SOCIAL_LINKS,
} from "@/components/marketing/site";

function originOf(siteUrl: string): string {
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

// JSON-LD is inlined in a script tag. "<" would close the tag early.
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function marketingHomeJsonLd(siteUrl: string) {
  const origin = originOf(siteUrl);
  const organizationId = `${origin}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${origin}/#website`,
        "@type": "WebSite",
        description: MARKETING_DESCRIPTION,
        name: "Bordful",
        publisher: { "@id": organizationId },
        url: `${origin}/`,
      },
      {
        "@id": organizationId,
        "@type": "Organization",
        logo: `${origin}/marketing/apple-icon.png`,
        name: "Bordful",
        sameAs: SOCIAL_LINKS.map((link) => link.href),
        url: origin,
      },
    ],
  };
}

export function faqPageJsonLd(siteUrl: string) {
  const origin = originOf(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPlainAnswers().map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
    url: `${origin}/faq`,
  };
}
