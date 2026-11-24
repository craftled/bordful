import { afterEach, expect, test, vi } from "vitest";

import { llmsFullTxt } from "@/lib/docs/agent-docs";

afterEach(() => {
  vi.unstubAllEnvs();
});

const siteUrl = "http://localhost:3000";

async function get(marketing = "true") {
  vi.stubEnv("BORDFUL_MARKETING", marketing);
  vi.stubEnv("NEXT_PUBLIC_SERVER_URL", siteUrl);
  const { GET } = await import("./route");
  return GET();
}

test("serves the full docs file as text", async () => {
  const response = await get();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=0, must-revalidate"
  );
  expect(await response.text()).toBe(llmsFullTxt(siteUrl));
});

test("404s in plain text when marketing is off", async () => {
  const response = await get("false");
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(await response.text()).toBe("Not found\n");
});
