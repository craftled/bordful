import { expect, test } from "vitest";

import { MARKETING_DESCRIPTION } from "@/components/marketing/site";

import { jobsIndexMetadata } from "./jobs-index";

test("the jobs index advertises the feeds and a description", () => {
  const marketing = jobsIndexMetadata({
    description: MARKETING_DESCRIPTION,
    marketing: true,
    siteUrl: "https://bordful.com",
  });

  expect(marketing.description).toBe(MARKETING_DESCRIPTION);
  expect(marketing.alternates).toEqual({
    canonical: "https://bordful.com/jobs",
    types: {
      "application/feed+json": "https://bordful.com/feed.json",
      "application/rss+xml": "https://bordful.com/feed.xml",
    },
  });
  expect(marketing.openGraph).toMatchObject({
    description: MARKETING_DESCRIPTION,
    title: "Jobs",
    url: "https://bordful.com/jobs",
  });
  expect(marketing.twitter).toMatchObject({
    card: "summary_large_image",
    title: "Jobs",
  });

  const fork = jobsIndexMetadata({
    description: "Browse open roles.",
    marketing: false,
    siteUrl: "https://jobs.example/",
  });
  expect(fork.description).toBe("Browse open roles.");
  expect(fork.openGraph).toMatchObject({
    images: undefined,
    url: "https://jobs.example/jobs",
  });
  expect(fork.twitter).toMatchObject({ card: "summary" });
});
