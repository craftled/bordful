import { expect, test } from "vitest";

import {
  afterAdditions,
  afterFirst,
  JOB_CHECKS_PER_SYNC,
  parseSyncState,
  planFetch,
  recordSpend,
  resolveLimits,
  type SyncState,
  WATERMARK_OVERLAP_MS,
} from "./sync-budget";

const FEED = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-03T06:00:00.000Z");
const HOUR = 3_600_000;

function delta(plan: ReturnType<typeof planFetch>) {
  if (plan.kind !== "delta") {
    throw new Error(`expected a delta plan, got ${plan.kind}`);
  }
  return plan;
}

test("limits default from config and clamp to 20 to 100 per sync", () => {
  expect(resolveLimits({})).toEqual({ jobsPerDay: 200, jobsPerSync: 50 });
  expect(resolveLimits({ jobsPerDay: null, jobsPerSync: null })).toEqual({
    jobsPerDay: 200,
    jobsPerSync: 50,
  });
  expect(resolveLimits({ jobsPerDay: 1, jobsPerSync: 5 })).toEqual({
    jobsPerDay: 20,
    jobsPerSync: 20,
  });
  expect(resolveLimits({ jobsPerDay: 1e9, jobsPerSync: 2000 })).toEqual({
    jobsPerDay: 5000,
    jobsPerSync: 100,
  });
});

test("a fresh feed plans one capped first page", () => {
  const state = parseSyncState(null, FEED);
  expect(planFetch(state, resolveLimits({}), NOW)).toEqual({
    kind: "first",
    limit: 50,
  });
});

test("after the first page, a sync checks board jobs and reads new ones", () => {
  const state = afterFirst(
    recordSpend(parseSyncState(null, FEED), 50, NOW),
    NOW
  );
  const later = new Date(NOW.getTime() + 24 * HOUR);
  const since = new Date(NOW.getTime() - WATERMARK_OVERLAP_MS).toISOString();
  const seriesStart = new Date(
    later.getTime() - WATERMARK_OVERLAP_MS
  ).toISOString();
  expect(planFetch(state, resolveLimits({}), later)).toEqual({
    additions: { position: { cursor: null, offset: null }, seriesStart, since },
    checkAfter: null,
    checks: JOB_CHECKS_PER_SYNC,
    kind: "delta",
    limit: 50,
  });
});

test("since moves only after the additions series is read", () => {
  const started = afterFirst(parseSyncState(null, FEED), NOW);
  const plan1 = delta(
    planFetch(started, resolveLimits({}), new Date(NOW.getTime() + HOUR))
  );
  const mid: SyncState = {
    ...started,
    additions: afterAdditions(started.additions, plan1.additions, {
      cursor: "c50",
      offset: null,
    }),
    checkAfter: "job-0042",
    removalHold: {
      after: "job-0042",
      at: NOW.toISOString(),
      confirmations: 2,
      ids: ["job-0043", "job-0044"],
    },
  };
  expect(mid.additions.since).toBe(started.additions.since);

  // Stored and read back, the series and the checks resume where they stopped.
  const reread = parseSyncState(JSON.parse(JSON.stringify(mid)), FEED);
  const plan2 = delta(
    planFetch(reread, resolveLimits({}), new Date(NOW.getTime() + 2 * HOUR))
  );
  expect(plan2.additions).toEqual({
    position: { cursor: "c50", offset: null },
    seriesStart: plan1.additions.seriesStart,
    since: started.additions.since,
  });
  expect(plan2.checkAfter).toBe("job-0042");
  expect(reread.removalHold).toEqual({
    after: "job-0042",
    at: NOW.toISOString(),
    confirmations: 2,
    ids: ["job-0043", "job-0044"],
  });

  expect(afterAdditions(reread.additions, plan2.additions, null)).toEqual({
    position: null,
    seriesStart: null,
    since: plan1.additions.seriesStart,
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

  const tomorrow = new Date(NOW.getTime() + 24 * HOUR);
  expect(planFetch(state, limits, tomorrow)).toMatchObject({ limit: 50 });
});

test("a removal hold written without confirmations reads as zero", () => {
  const state = parseSyncState(
    {
      feedId: FEED,
      removalHold: { after: "job-0042", at: NOW.toISOString() },
    },
    FEED
  );
  expect(state.removalHold).toEqual({
    after: "job-0042",
    at: NOW.toISOString(),
    confirmations: 0,
    ids: [],
  });
});

test("a removal hold without ids reads as an empty list", () => {
  const state = parseSyncState(
    {
      feedId: FEED,
      removalHold: {
        after: "job-0042",
        at: NOW.toISOString(),
        confirmations: 1,
      },
    },
    FEED
  );
  expect(state.removalHold).toEqual({
    after: "job-0042",
    at: NOW.toISOString(),
    confirmations: 1,
    ids: [],
  });
});

test("a new feed id starts over but keeps the day's usage", () => {
  const state = recordSpend(
    afterFirst(parseSyncState(null, FEED), NOW),
    60,
    NOW
  );
  const other = parseSyncState(state, "22222222-2222-4222-8222-222222222222");
  expect(other).toMatchObject({
    additions: { since: null },
    checkAfter: null,
    jobsToday: 60,
    removalHold: null,
  });
});
