import { afterEach, expect, test, vi } from "vitest";
import { resolveServerUrl } from "@/config/server-url";
import { llmsTxt } from "@/lib/docs/agent-docs";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("llms.txt serves the generated index when marketing is on", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000");
  const { GET } = await import("./route");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(await response.text()).toBe(llmsTxt(resolveServerUrl()));
});

test("llms.txt 404s in plain text when marketing is off", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");
  const { GET } = await import("./route");
  const response = await GET();
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(await response.text()).toBe("Not found\n");
});
