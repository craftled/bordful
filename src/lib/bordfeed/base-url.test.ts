import { expect, test } from "vitest";

import { bordfulConfig } from "@/config";

import { resolveBordfeedBaseUrl } from "./base-url";

test("resolveBordfeedBaseUrl prefers the env override and rejects other protocols", () => {
  expect(resolveBordfeedBaseUrl({}, bordfulConfig)).toBe(
    "https://bordfeed.com"
  );
  expect(
    resolveBordfeedBaseUrl(
      { BORDFEED_BASE_URL: "http://127.0.0.1:4999/" },
      bordfulConfig
    )
  ).toBe("http://127.0.0.1:4999");
  expect(() =>
    resolveBordfeedBaseUrl({ BORDFEED_BASE_URL: "ftp://x.test" }, bordfulConfig)
  ).toThrow();
});
