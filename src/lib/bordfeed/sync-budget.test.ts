import { expect, test } from "vitest";

import {
  afterDelta,
  afterFirst,
  parseSyncState,
  planFetch,
  recordSpend,
  resolveLimits,
  WATERMARK_OVERLAP_MS,
} from "./sync-budget";

const FEED = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-03T06:00:00.000Z");

test("limits default from config and clamp to 20 to 100 per sync", () => {
  expect(resolveLimits({})).toEqual({ jobsPerDay: 200, jobsPerSync: 50 });
  expect(resolveLimits({ jobsPerDay: 1, jobsPerSync: 5 })).toEqual({
    jobsPerDay: 20,
    jobsPerSync: 20,
  });
  expect(resolveLimits({ jobsPerDay: 1e9, jobsPerSync: 2000 })).toEqual({
    jobsPerDay: 5000,
    jobsPerSync: 100,
  });
  expect(resolveLimits({ jobsPerSync: "80" })).toMatchObject({
    jobsPerSync: 50,
  });
});

test("a fresh feed plans one capped first page", () => {
  const state = parseSyncState(null, FEED);
  expect(planFetch(state, resolveLimits({}), NOW)).toEqual({
    kind: "first",
    limit: 50,
  });
});

test("after the first page, syncs ask only for jobs updated since it began", () => {
  const state = afterFirst(
    recordSpend(parseSyncState(null, FEED), 50, NOW),
    NOW
  );
  const later = new Date(NOW.getTime() + 86_400_000);
  const plan = planFetch(state, resolveLimits({}), later);
  expect(plan).toMatchObject({
    cursor: null,
    kind: "delta",
    limit: 50,
    since: new Date(NOW.getTime() - WATERMARK_OVERLAP_MS).toISOString(),
  });
});

test("a delta series with more pages resumes from the cursor and then advances", () => {
  const started = afterFirst(parseSyncState(null, FEED), NOW);
  const run1 = new Date(NOW.getTime() + 3_600_000);
  const plan1 = planFetch(started, resolveLimits({}), run1);
  if (plan1.kind !== "delta") {
    throw new Error("expected a delta plan");
  }
  const mid = afterDelta(started, plan1, {
    nextCursor: "c50",
    nextOffset: null,
  });
  expect(mid.since).toBe(started.since);

  const run2 = new Date(run1.getTime() + 3_600_000);
  const plan2 = planFetch(mid, resolveLimits({}), run2);
  expect(plan2).toMatchObject({
    cursor: "c50",
    kind: "delta",
    seriesStart: plan1.seriesStart,
    since: started.since,
  });
  if (plan2.kind !== "delta") {
    throw new Error("expected a delta plan");
  }
  const done = afterDelta(mid, plan2, { nextCursor: null, nextOffset: null });
  expect(done).toMatchObject({
    cursor: null,
    pendingSince: null,
    since: plan1.seriesStart,
  });
});

test("the daily cap shrinks the next request and then skips it", () => {
  const limits = resolveLimits({ jobsPerDay: 120, jobsPerSync: 50 });
  let state = afterFirst(parseSyncState(null, FEED), NOW);
  state = recordSpend(state, 100, NOW);
  expect(planFetch(state, limits, NOW)).toMatchObject({ limit: 20 });
  state = recordSpend(state, 20, NOW);
  expect(planFetch(state, limits, NOW)).toEqual({
    kind: "skip",
    reason: "daily_cap",
  });

  const tomorrow = new Date(NOW.getTime() + 86_400_000);
  expect(planFetch(state, limits, tomorrow)).toMatchObject({ limit: 50 });
});

test("a new feed id starts over but keeps the day's usage", () => {
  const state = recordSpend(
    afterFirst(parseSyncState(null, FEED), NOW),
    60,
    NOW
  );
  const other = parseSyncState(state, "22222222-2222-4222-8222-222222222222");
  expect(other).toMatchObject({ jobsToday: 60, since: null });
});
