import { expect, test } from "vitest";

import { marketingLayoutMetadata } from "./metadata";
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
