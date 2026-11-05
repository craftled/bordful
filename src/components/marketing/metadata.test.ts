import { expect, test } from "vitest";

import {
  marketingHomeMetadata,
  marketingLayoutMetadata,
  marketingPageMetadata,
} from "./metadata";
import { MARKETING_DESCRIPTION } from "./site";

test("marketing layout metadata is empty when the flag is off", () => {
  expect(marketingLayoutMetadata(false)).toEqual({});
});

test("marketing layout metadata is the Bordful card when the flag is on", () => {
  const metadata = marketingLayoutMetadata(true);

  expect(metadata.title).toEqual({
    default: "Bordful: open-source job board template",
    template: "%s | Bordful",
  });
  expect(metadata.description).toBe(MARKETING_DESCRIPTION);
  expect(metadata.icons).toEqual({
    apple: "/marketing/apple-icon.png",
    icon: "/marketing/icon.svg",
  });
  expect(metadata.openGraph).toMatchObject({
    images: [
      {
        height: 630,
        url: "/marketing/bordful-job-board-software.png",
        width: 1200,
      },
    ],
    siteName: "Bordful",
  });
  expect(metadata.twitter).toMatchObject({
    creator: "@bordful",
    site: "@bordful",
  });
  expect(metadata.metadataBase).toBeInstanceOf(URL);
});

test("the marketing home takes the same card with its own title", () => {
  const layout = marketingLayoutMetadata(true);
  const home = marketingHomeMetadata();

  expect(home.title).toEqual({
    absolute: "Bordful: open-source job board template",
  });
  expect(home.description).toBe(MARKETING_DESCRIPTION);
  expect(home.icons).toEqual(layout.icons);
  expect(home.openGraph).toEqual({ ...layout.openGraph, url: "/" });
  expect(home.twitter).toEqual(layout.twitter);
  expect(home.alternates).toEqual({ canonical: "/" });
  expect(home.metadataBase).toBeInstanceOf(URL);
});

test("a marketing page sets its own canonical and og:url", () => {
  const page = marketingPageMetadata({
    description: "Simple pricing.",
    path: "/pricing",
    title: "Pricing",
  });

  expect(page.alternates).toEqual({ canonical: "/pricing" });
  expect(page.description).toBe("Simple pricing.");
  expect(page.title).toBe("Pricing");
  expect(page.icons).toEqual(marketingLayoutMetadata(true).icons);
  expect(page.openGraph).toMatchObject({
    description: "Simple pricing.",
    title: "Pricing",
    url: "/pricing",
  });
  expect(page.twitter).toMatchObject({
    description: "Simple pricing.",
    title: "Pricing",
  });
});
