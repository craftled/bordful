import { expect, test } from "vitest";

import {
  afterFirst,
  afterTrack,
  nextPhase,
  parseSyncState,
  planFetch,
  recordSpend,
  resolveLimits,
  type SyncState,
  sinceFieldFor,
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

test("after the first page, both tracks read changes since it began", () => {
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
    additions: {
      position: { cursor: null, offset: null, phase: "open" },
      seriesStart,
      since,
    },
    kind: "delta",
    limit: 50,
    removals: {
      position: { cursor: null, offset: null, phase: "closed" },
      seriesStart,
      since,
    },
    removalsLimit: 25,
  });
});

test("a track's since moves only after all its phases are read", () => {
  expect(nextPhase("removals", "closed")).toBe("expired");
  expect(nextPhase("removals", "expired")).toBeNull();
  expect(nextPhase("additions", "open")).toBeNull();
  expect(sinceFieldFor("closed")).toBe("updated");
  expect(sinceFieldFor("open")).toBe("first_visible");

  const started = afterFirst(parseSyncState(null, FEED), NOW);
  const plan1 = delta(
    planFetch(started, resolveLimits({}), new Date(NOW.getTime() + HOUR))
  );
  const mid: SyncState = {
    ...started,
    removals: afterTrack(started.removals, plan1.removals, {
      cursor: "c50",
      offset: null,
      phase: "expired",
    }),
  };
  expect(mid.removals.since).toBe(started.removals.since);

  // Stored and read back, the track resumes where it stopped.
  const reread = parseSyncState(JSON.parse(JSON.stringify(mid)), FEED);
  const plan2 = delta(
    planFetch(reread, resolveLimits({}), new Date(NOW.getTime() + 2 * HOUR))
  );
  expect(plan2.removals).toEqual({
    position: { cursor: "c50", offset: null, phase: "expired" },
    seriesStart: plan1.removals.seriesStart,
    since: started.removals.since,
  });
  expect(plan2.additions.since).toBe(started.additions.since);

  expect(afterTrack(reread.removals, plan2.removals, null)).toEqual({
    position: null,
    seriesStart: null,
    since: plan1.removals.seriesStart,
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

test("a new feed id starts over but keeps the day's usage", () => {
  const state = recordSpend(
    afterFirst(parseSyncState(null, FEED), NOW),
    60,
    NOW
  );
  const other = parseSyncState(state, "22222222-2222-4222-8222-222222222222");
  expect(other).toMatchObject({
    additions: { since: null },
    jobsToday: 60,
    removals: { since: null },
  });
});
