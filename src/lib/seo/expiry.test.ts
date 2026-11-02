import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { dropExpired } from "./expiry";

const cached = vi.hoisted(() => ({
  limits: [] as number[],
  rows: [] as unknown[],
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({
  getPayload: async () => ({
    find: ({ limit }: { limit: number }) => {
      cached.limits.push(limit);
      return Promise.resolve({ docs: cached.rows.slice(0, limit) });
    },
  }),
}));

const now = new Date("2026-11-02T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  cached.limits = [];
});

afterEach(() => {
  vi.useRealTimers();
});

test("dropExpired keeps open-ended and future jobs and drops past ones", () => {
  const jobs = [
    { slug: "open-ended", validThrough: null },
    { slug: "future", validThrough: "2026-11-02T12:00:01.000Z" },
    { slug: "exactly-now", validThrough: "2026-11-02T12:00:00.000Z" },
    { slug: "past", validThrough: "2026-11-01T00:00:00.000Z" },
  ];
  expect(dropExpired(jobs, now).map((job) => job.slug)).toEqual([
    "open-ended",
    "future",
  ]);
});

test("feed and sitemap reads drop a job whose validThrough passed after it was cached", async () => {
  const { getFeedJobs, getSitemapJobs } = await import("./queries");
  cached.rows = [
    {
      id: 1,
      slug: "still-open",
      title: "Still open",
      validThrough: "2026-11-03T00:00:00.000Z",
    },
    {
      id: 2,
      slug: "just-expired",
      title: "Just expired",
      validThrough: "2026-11-02T11:59:00.000Z",
    },
  ];
  expect((await getFeedJobs()).map((job) => job.slug)).toEqual(["still-open"]);
  expect((await getSitemapJobs()).map((job) => job.slug)).toEqual([
    "still-open",
  ]);
});

test("the feed still fills its limit when a cached job has expired", async () => {
  const { getFeedJobs } = await import("./queries");
  cached.rows = [
    { id: 1, slug: "a", title: "A", validThrough: "2026-11-02T11:00:00.000Z" },
    { id: 2, slug: "b", title: "B", validThrough: null },
    { id: 3, slug: "c", title: "C", validThrough: null },
    { id: 4, slug: "d", title: "D", validThrough: null },
  ];
  expect((await getFeedJobs(2)).map((job) => job.slug)).toEqual(["b", "c"]);
  expect(cached.limits).toEqual([4]);
});
