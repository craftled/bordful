import { expect, test } from "vitest";

import { resolveServerUrl } from "./server-url";

test("prefers NEXT_PUBLIC_SERVER_URL and strips one trailing slash", () => {
  expect(
    resolveServerUrl({ NEXT_PUBLIC_SERVER_URL: "http://localhost:3100/" })
  ).toBe("http://localhost:3100");
});

test("uses the Vercel production host when that env is production", () => {
  expect(
    resolveServerUrl({
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "bordful.com",
    })
  ).toBe("https://bordful.com");
});

test("uses VERCEL_URL outside production", () => {
  expect(resolveServerUrl({ VERCEL_URL: "bordful-abc.vercel.app" })).toBe(
    "https://bordful-abc.vercel.app"
  );
});

test("falls back to localhost", () => {
  expect(resolveServerUrl({})).toBe("http://localhost:3000");
});
