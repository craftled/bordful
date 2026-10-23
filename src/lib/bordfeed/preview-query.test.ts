import { expect, test } from "vitest";

import {
  buildPreviewSearchParams,
  buildPreviewUrl,
  previewQuerySchema,
} from "./preview-query";

test("repeats preview keys instead of joining them", () => {
  expect(
    buildPreviewSearchParams(
      previewQuerySchema.parse({
        category: ["Computer & IT", "Media, Communications & Writing"],
        country_code: ["US", "DE"],
        limit: 20,
        workplace_type: ["Remote", "On-site"],
      })
    ).toString()
  ).toBe(
    "category=Computer+%26+IT&category=Media%2C+Communications+%26+Writing&workplace_type=Remote&workplace_type=On-site&country_code=US&country_code=DE&limit=20"
  );
});

test("an empty preview query still sends the default limit", () => {
  expect(
    buildPreviewSearchParams(previewQuerySchema.parse({})).toString()
  ).toBe("limit=10");
});

test("buildPreviewUrl uses the templates preview path", () => {
  expect(
    buildPreviewUrl(
      "https://bordfeed.com",
      "remote-engineering",
      previewQuerySchema.parse({})
    )
  ).toBe(
    "https://bordfeed.com/api/v1/templates/remote-engineering/preview?limit=10"
  );
});

test("previewQuerySchema rejects out of range and unknown input", () => {
  const rejected = [
    { category: ["a", "b", "c", "d"] },
    { country_code: ["US", "DE", "FR", "GB", "CA", "AU"] },
    { country_code: ["us"] },
    { limit: 0 },
    { limit: 21 },
    { limit: 1.5 },
    { workplace_type: ["remote"] },
    { q: "x" },
  ];

  for (const input of rejected) {
    expect(previewQuerySchema.safeParse(input).success).toBe(false);
  }
});
