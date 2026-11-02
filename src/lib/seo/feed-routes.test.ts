import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/read", () => ({
  getSiteSettings: vi.fn(async () => ({
    board: { description: "Jobs" },
    name: "Board",
    tagline: "",
  })),
}));
vi.mock("@/lib/seo/queries", () => ({ getFeedJobs: vi.fn(async () => []) }));

const ZERO_MAX_AGE = /max-age=0\b/;
const SHARED_LIFETIME = /s-maxage=[1-9]/;
const BROWSER_LIFETIME = /(^|[ ,])max-age=[1-9]/;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
});

// A shared-cache lifetime lets the CDN serve expired jobs after the jobs tag
// is revalidated (E5 failed on Vercel previews with "public, max-age=300").
function assertNoSharedCacheLifetime(header: string | null) {
  expect(header).not.toBeNull();
  const value = header ?? "";
  expect(value).toMatch(ZERO_MAX_AGE);
  expect(value).toContain("must-revalidate");
  expect(value).not.toMatch(SHARED_LIFETIME);
  expect(value).not.toMatch(BROWSER_LIFETIME);
}

test("feed.xml does not let the CDN cache an outdated job list", async () => {
  const { GET } = await import("@/app/feed.xml/route");
  const response = await GET();
  expect(response.status).toBe(200);
  assertNoSharedCacheLifetime(response.headers.get("cache-control"));
});

test("feed.json does not let the CDN cache an outdated job list", async () => {
  const { GET } = await import("@/app/feed.json/route");
  const response = await GET();
  expect(response.status).toBe(200);
  assertNoSharedCacheLifetime(response.headers.get("cache-control"));
});
