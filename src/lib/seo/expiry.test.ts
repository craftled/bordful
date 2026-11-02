import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { dropExpired } from "./expiry";

const now = new Date("2026-11-02T12:00:00.000Z");

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

const cachedRows = vi.hoisted(() => ({ rows: [] as unknown[] }));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({
  getPayload: async () => ({
    find: async () => ({ docs: cachedRows.rows }),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

test("feed and sitemap reads drop a job whose validThrough passed after it was cached", async () => {
  const { getFeedJobs, getSitemapJobs } = await import("./queries");
  cachedRows.rows = [
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
