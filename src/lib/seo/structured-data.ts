import { ALTERNATIVES_HUB } from "@/components/marketing/alternatives/registry";
import type {
  Alternative,
  FaqItem,
} from "@/components/marketing/alternatives/types";
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

export function faqPageJsonLd(
  siteUrl: string,
  input: { path: string; items: readonly FaqItem[] }
) {
  const origin = originOf(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.items.map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
    url: `${origin}${input.path}`,
  };
}

export function breadcrumbListJsonLd(
  siteUrl: string,
  crumbs: readonly { name: string; path: string }[]
) {
  const origin = originOf(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      item: `${origin}${crumb.path}`,
      name: crumb.name,
      position: index + 1,
    })),
  };
}

export function alternativePageJsonLd(siteUrl: string, page: Alternative) {
  const origin = originOf(siteUrl);
  const path = `/alternatives/${page.slug}`;
  const breadcrumb = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Alternatives", path: "/alternatives" },
    { name: page.name, path },
  ]);
  const faq = faqPageJsonLd(siteUrl, { path, items: page.faq });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        description: page.metaDescription,
        name: page.metaTitle,
        url: `${origin}${path}`,
      },
      {
        "@type": breadcrumb["@type"],
        itemListElement: breadcrumb.itemListElement,
      },
      {
        "@type": faq["@type"],
        mainEntity: faq.mainEntity,
        url: faq.url,
      },
    ],
  };
}

export function alternativesHubJsonLd(siteUrl: string) {
  const origin = originOf(siteUrl);
  const breadcrumb = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Alternatives", path: "/alternatives" },
  ]);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        description: ALTERNATIVES_HUB.metaDescription,
        name: ALTERNATIVES_HUB.metaTitle,
        url: `${origin}/alternatives`,
      },
      {
        "@type": breadcrumb["@type"],
        itemListElement: breadcrumb.itemListElement,
      },
    ],
  };
}
