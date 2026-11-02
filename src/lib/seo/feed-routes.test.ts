import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/read", () => ({
  getSiteSettings: vi.fn(async () => ({
    board: { description: "Jobs" },
    name: "Board",
    tagline: "",
  })),
}));
vi.mock("@/lib/seo/queries", () => ({ getFeedJobs: vi.fn(async () => []) }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// No shared or browser lifetime: a cached copy would keep serving expired jobs
// after the jobs tag is revalidated (E5 failed on Vercel with max-age=300).
test("feed.xml makes the CDN revalidate on every request", async () => {
  const { GET } = await import("@/app/feed.xml/route");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=0, must-revalidate"
  );
});

test("feed.json makes the CDN revalidate on every request", async () => {
  const { GET } = await import("@/app/feed.json/route");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=0, must-revalidate"
  );
});
