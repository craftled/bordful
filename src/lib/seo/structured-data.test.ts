import { expect, test } from "vitest";
import { ALTERNATIVES_HUB } from "@/components/marketing/alternatives/registry";
import { wpJobManager } from "@/components/marketing/alternatives/wp-job-manager";
import { faqPlainAnswers } from "@/components/marketing/faq";

import {
  alternativePageJsonLd,
  alternativesHubJsonLd,
  breadcrumbListJsonLd,
  faqPageJsonLd,
  jsonLdHtml,
  marketingHomeJsonLd,
} from "./structured-data";

const BANNED_SCHEMA_PATTERN =
  /AggregateRating|Review|SoftwareApplication|Product/u;

test("JSON-LD escapes < so a script tag cannot close early", () => {
  const html = jsonLdHtml({ name: "</script><script>alert(1)</script>" });

  expect(html).not.toContain("<");
  expect(html).toContain("\\u003c");
});

test("the marketing home JSON-LD is a WebSite and an Organization", () => {
  const data = marketingHomeJsonLd("https://bordful.com");

  expect(data["@graph"].map((node) => node["@type"])).toEqual([
    "WebSite",
    "Organization",
  ]);
  expect(data["@graph"][0]).toMatchObject({
    name: "Bordful",
    url: "https://bordful.com/",
  });
  expect(data["@graph"][1]).toMatchObject({
    name: "Bordful",
    url: "https://bordful.com",
  });
  expect(jsonLdHtml(data)).not.toContain("<");
});

test("the FAQ page JSON-LD lists every question", () => {
  const data = faqPageJsonLd("https://bordful.com/", {
    items: faqPlainAnswers(),
    path: "/faq",
  });

  expect(data["@type"]).toBe("FAQPage");
  expect(data.url).toBe("https://bordful.com/faq");
  expect(data.mainEntity).toHaveLength(5);
  expect(
    data.mainEntity.every((item) => item.acceptedAnswer.text.length > 0)
  ).toBe(true);
});

test("alternative JSON-LD includes the page, breadcrumbs and its FAQ", () => {
  const data = alternativePageJsonLd("https://bordful.com/", wpJobManager);
  const [page, breadcrumb, faq] = data["@graph"];

  expect(data["@graph"].map((node) => node["@type"])).toEqual([
    "WebPage",
    "BreadcrumbList",
    "FAQPage",
  ]);
  if (faq?.["@type"] !== "FAQPage") {
    throw new Error("Expected a FAQPage graph node");
  }
  expect(breadcrumb).toMatchObject({
    itemListElement: [
      {
        item: "https://bordful.com/",
        name: "Home",
        position: 1,
      },
      {
        item: "https://bordful.com/alternatives",
        name: "Alternatives",
        position: 2,
      },
      {
        item: "https://bordful.com/alternatives/wp-job-manager",
        name: "WP Job Manager",
        position: 3,
      },
    ],
  });
  expect(page).toMatchObject({
    name: "WP Job Manager Alternative: Bordful vs WP Job Manager",
    url: "https://bordful.com/alternatives/wp-job-manager",
  });
  expect(faq.mainEntity ?? []).toHaveLength(wpJobManager.faq.length);
  expect(faq.mainEntity?.map((item) => item.name)).toEqual(
    wpJobManager.faq.map((item) => item.question)
  );
  expect(faq.mainEntity?.[0]?.name).toBe(
    "Is Bordful a good WP Job Manager alternative?"
  );
  expect(JSON.stringify(data)).not.toMatch(BANNED_SCHEMA_PATTERN);
  expect(jsonLdHtml(data)).not.toContain("<");
});

test("alternatives hub JSON-LD has a collection page and breadcrumb", () => {
  const data = alternativesHubJsonLd("https://bordful.com");

  expect(data["@graph"].map((node) => node["@type"])).toEqual([
    "CollectionPage",
    "BreadcrumbList",
  ]);
  expect(data["@graph"][0]).toMatchObject({
    description: ALTERNATIVES_HUB.metaDescription,
    name: "Alternatives and Comparisons",
  });
  expect(
    breadcrumbListJsonLd("https://bordful.com", [
      { name: "Home", path: "/" },
      { name: "Alternatives", path: "/alternatives" },
    ]).itemListElement
  ).toHaveLength(2);
  expect(jsonLdHtml(data)).not.toContain("<");
});
