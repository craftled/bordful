import { expect, test } from "vitest";

import {
  faqPageJsonLd,
  jsonLdHtml,
  marketingHomeJsonLd,
} from "./structured-data";

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
  const data = faqPageJsonLd("https://bordful.com/");

  expect(data["@type"]).toBe("FAQPage");
  expect(data.url).toBe("https://bordful.com/faq");
  expect(data.mainEntity).toHaveLength(5);
  expect(
    data.mainEntity.every((item) => item.acceptedAnswer.text.length > 0)
  ).toBe(true);
});
